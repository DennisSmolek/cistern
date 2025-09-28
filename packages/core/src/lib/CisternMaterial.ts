// This is a node standard material wrapper with our own helpers

import {
    attribute, equal, Fn, texture, uniform, normalLocal, If, vec4, uv, select,
    positionLocal, float, color,
    ShaderNodeObject
} from "three/tsl";
import { MeshStandardNodeMaterial, Node, Texture, FrontSide, UniformNode, Color } from "three/webgpu";


/* Utility Functions to get our attributes from the geometry */

// Section: the index of the section

export const Section = Fn(() => {
    return attribute('sectionId', 'f32');
});


// Section Percentage: the percentage within the section (usefull for UV replacement)
export const SectionPercentage = Fn(() => {
    return attribute('sectionPercentage', 'f32');
});


// Circular UV: the UV coordinates on the circle (make squares of floor/ceiling)
export const CircularUV = Fn(() => {
    return attribute('circularUV', 'vec2');
});

export const IsSection = Fn(([sectionNumber]: [FnArg]) => {
    const section = Section();
    return equal(section, float(sectionNumber));
});


// check if we are these common sections
export const IsPedestal = Fn(() => {
    // pedestal section is 0
    return IsSection([0]);
});

export const IsWall = Fn(() => {
    // wall section is 3
    return IsSection([3]);
});

export const IsFloor = Fn(() => {
    // floor is 1
    return IsSection([1]);
});

export const IsCeiling = Fn(() => {
    // ceiling is 5
    return IsSection([5]);
});

/* Default Nodes (We expect these to be replaced but if not we need to inject something) */



// texture wrapper class because im not sure you can pass booleans
/* Final Material */

export class CisternMaterial extends MeshStandardNodeMaterial {

    textures = {
        pedestal: new Texture(),
        wall: new Texture(),
        floor: new Texture(),
        ceiling: new Texture()
    }

    normalTextures = {
        pedestal: new Texture(),
        wall: new Texture(),
        floor: new Texture(),
        ceiling: new Texture()
    }


    uniforms = {
        pedestal: getBlankUniforms('pedestal'),
        floor: getBlankUniforms('floor'),
        wall: getBlankUniforms('wall'),
        ceiling: getBlankUniforms('ceiling'),
    }

    originalColorNode?: Node;

    nodeSets = {
        pedestal: getBlankeNodeSet(),
        floor: getBlankeNodeSet(),
        wall: getBlankeNodeSet(),
        ceiling: getBlankeNodeSet(),
    }


    constructor() {
        super();
        // save the original color node
        if (this.colorNode) this.originalColorNode = this.colorNode;
        this.side = FrontSide;
        this.debugColor();
        this.rebuild();
    }

    rebuild() {
        const baseColorNode = Fn(() => {
            // this conditional runs in the builder not the shader
            const outputColor = vec4(1, 0, 0, 1).toVar('outputColor');
            if (this.map) outputColor.assign(texture(this.map, uv()));

            // check if we are in the pedestal section
            If(IsPedestal(), () => {
                outputColor.assign(this.getSectionNode('pedestal', 'map', outputColor));
            }).ElseIf(IsFloor(), () => {
                outputColor.assign(this.getSectionNode('floor', 'map', outputColor));
            }).ElseIf(IsWall(), () => {
                outputColor.assign(this.getSectionNode('wall', 'map', outputColor));
            }).ElseIf(IsCeiling(), () => {
                outputColor.assign(this.getSectionNode('ceiling', 'map', outputColor));
            })

            return outputColor;
        });
        this.colorNode = baseColorNode();

    }

    debugColor = () => {
        // loop over the uniforms and set useColor to true, then mark this for update
        Object.values(this.uniforms).forEach((uniform) => {
            uniform.useColor.value = true;
            console.log('uniform', uniform);
        });
        this.needsUpdate = true;
    }

    // todo: This is insanely verbose but shows what is happening
    private getSectionNode(section: SectionKey, variant: SectionVariant, fallbackColor?: Node) {
        // map uniforms/textures for the requested section
        const sectionConfig: SectionConfig = {
            colorTexture: this.textures[section],
            normalTexture: this.normalTextures[section],
            nodes: this.nodeSets[section],
            ...this.uniforms[section]
        }

        if (variant === 'vertex') {
            return select(sectionConfig.useVertexNode, positionLocal, sectionConfig.nodes.vertex);
        }

        if (variant === 'map') {
            // TODO Learn if we can use structs here
            const sectionColor = sectionConfig.color;
            const sectionColorNode = sectionConfig.nodes.color;
            const sectionColorTexture = sectionConfig.colorTexture;
            console.log('sectionColor', sectionColor);
            const colorFn = Fn(([sectionColor, sectionColorNode, sectionColorTexture, fallbackColor]: [Node, Node, Node, Node]) => {
                // by default we assign the fallback color
                const colorOutput = vec4(0.3, 0.7, 0.2, 1).toVar('colorOutput');
                colorOutput.assign(fallbackColor);

                If(sectionConfig.useColor, () => {
                    colorOutput.assign(sectionColor);
                });
                If(sectionConfig.useColorNode, () => {
                    colorOutput.assign(sectionColorNode);
                    //colorOutput.assign(vec4(1, 0.5, 0, 1)); // orange (RGB: 1, 0.5, 0)
                }).ElseIf(sectionConfig.hasMap, () => {
                    const outputUv = sectionConfig.useSquaredUV ? select(sectionConfig.useSquaredUV, CircularUV(), uv()) : uv();
                    const sampled = texture(sectionConfig.colorTexture, outputUv);
                    colorOutput.assign(sampled);
                });

                return colorOutput;
            });
            return colorFn(fallbackColor);
        }

        // variant === 'normal'
        const normalFn = Fn(() => {
            const normalOutput = normalLocal.toVar('normalOutput');
            If(sectionConfig.useNormalNode, () => {
                normalOutput.assign(sectionConfig.nodes.normal);
            }).ElseIf(sectionConfig.hasNormalMap, () => {
                const outputUv = sectionConfig.useSquaredUV ? select(sectionConfig.useSquaredUV, CircularUV(), uv()) : uv();
                const sampled = texture(sectionConfig.normalTexture, outputUv);
                // sample normal map; consumer may convert/tune as needed
                normalOutput.assign(sampled.xyz);
            });
            return normalOutput;
        });
        return normalFn();
    }

}

type NodeSet = {
    vertex: Node;
    color: Node;
    normal: Node;
}

type SectionKey = 'pedestal' | 'floor' | 'wall' | 'ceiling';
type SectionVariant = 'map' | 'normal' | 'vertex';

type BoolUniform = ShaderNodeObject<UniformNode<boolean>>;
type ColorUniform = ShaderNodeObject<UniformNode<Node>>;

type SectionUniforms = {
    useColor: BoolUniform;
    useColorNode: BoolUniform;
    hasMap: BoolUniform;
    useSquaredUV: BoolUniform;
    useNormalNode: BoolUniform;
    hasNormalMap: BoolUniform;
    useVertexNode: BoolUniform;
    color: ColorUniform;
}

type SectionConfig = SectionUniforms & {
    colorTexture: Texture;
    normalTexture: Texture;
    nodes: NodeSet;
}
function getBlankUniforms(name?: string): SectionUniforms {
    const newUniforms = {
        useColor: uniform(false),
        useColorNode: uniform(false),
        hasMap: uniform(false),
        useSquaredUV: uniform(false),
        useNormalNode: uniform(false),
        useVertexNode: uniform(false),
        hasNormalMap: uniform(false),
        color: uniform(color(randomColorVec4()))
    }
    // if we have a name, set the name
    if (name) {
        newUniforms.useColor.name = name + 'UseColor';
        newUniforms.useColorNode.name = name + 'UseColorNode';
        newUniforms.hasMap.name = name + 'HasMap';
        newUniforms.useSquaredUV.name = name + 'UseSquaredUV';
        newUniforms.useNormalNode.name = name + 'UseNormalNode';
        newUniforms.hasNormalMap.name = name + 'HasNormalMap';
        newUniforms.useVertexNode.name = name + 'UseVertexNode';
        newUniforms.color.name = name + 'Color';
    }
    return newUniforms;
}

function getBlankeNodeSet() {
    return {
        vertex: positionLocal,
        color: randomColorVec4(),
        normal: normalLocal,
    }
}

/**
 * Returns a vec4 with random RGB values and alpha set to 1.
 * Each channel is in the range [0, 1].
 */
function randomColorVec4() {
    // Math.random() returns [0,1), so we use it for each channel
    return vec4(Math.random(), Math.random(), Math.random(), 1);
}
