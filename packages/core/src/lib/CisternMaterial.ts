// This is a node standard material wrapper with our own helpers

import {
    attribute, Fn, texture, uniform, normalLocal, If, vec4, uv,
    positionLocal, float,
    and
} from "three/tsl";
import { MeshStandardNodeMaterial, Node, Texture, FrontSide, UniformNode, Vector4 } from "three/webgpu";


/* Utility Functions to get our attributes from the geometry */

// Section: the index of the section

export const Section = Fn(() => {
    // Use f32 and keep triangles within a section so values stay constant per face
    return attribute<'float'>('sectionId', 'float');
});


// Section Percentage: the percentage within the section (usefull for UV replacement)
export const SectionPercentage = Fn(() => {
    return attribute<'float'>('sectionPercentage', 'float');
});


// Circular UV: the UV coordinates on the circle (make squares of floor/ceiling)
export const CircularUV = Fn(() => {
    return attribute<'vec2'>('circularUV', 'vec2');
});

// Plain function composing TSL nodes (not Fn-wrapped: three's runtime expects
// Fn args as a single array/object, which @types/three 0.185 no longer models)
export const IsSection = (sectionNumber: number | Node<'float'>) => {
    const section = Section();
    const num = typeof sectionNumber === 'number' ? float(sectionNumber) : sectionNumber;
    // Use a small band to account for any numerical noise; triangles are pruned across sections
    return and(section.greaterThan(num.sub(0.2)), section.lessThan(num.add(0.2)));
};


// check if we are these common sections
export const IsPedestal = Fn(() => {
    // pedestal section is 0
    return IsSection(0);
});

export const IsWall = Fn(() => {
    // wall section is 3
    return IsSection(3);
});

export const IsFloor = Fn(() => {
    // floor is 1
    return IsSection(1);
});

export const IsCeiling = Fn(() => {
    // ceiling is 5
    return IsSection(5);
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

    sectionalNodes: Record<SectionKey, Node> = {
        pedestal: randomColorVec4(),
        floor: randomColorVec4(),
        wall: randomColorVec4(),
        ceiling: randomColorVec4(),
    }


    constructor(options?: { debug?: boolean }) {
        super();
        // save the original color node
        if (this.colorNode) this.originalColorNode = this.colorNode;
        this.side = FrontSide;
        // debug defaults to true FOR NOW so the demo's random section colors
        // keep showing; flipping the default to false is a deliberate
        // decision to be made at publish time.
        if (options?.debug !== false) this.debugColor();
        this.rebuild();
    }

    rebuild() {
        // rebuild the sectional nodes
        this.sectionalNodes = {
            pedestal: this.getSectionNode('pedestal', 'map'),
            floor: this.getSectionNode('floor', 'map'),
            wall: this.getSectionNode('wall', 'map'),
            ceiling: this.getSectionNode('ceiling', 'map'),
        }
        let rootColor = vec4(1, 0, 0, 1);
        //@ts-expect-error tsl
        if (this.map) rootColor = texture(this.map, uv());
        const baseColorNode = Fn(() => {
            const outputColor = rootColor.toVar('outputColor');
            /*
            const sectionNumber = attribute<'float'>('sectionId', 'float');
            If(sectionNumber.equal(0), () => {
                outputColor.assign(vec4(1, 1, 0, 1));
            }).ElseIf(and(sectionNumber.greaterThan(0.8), sectionNumber.lessThan(1.2)), () => {
                outputColor.assign(vec4(0, 1, 0, 1));
            }).ElseIf(and(sectionNumber.greaterThan(1.8), sectionNumber.lessThan(2.2)), () => {
                outputColor.assign(vec4(0, 0, 1, 1));
            }).ElseIf(and(sectionNumber.greaterThan(2.8), sectionNumber.lessThan(3.2)), () => {
                outputColor.assign(vec4(1, 0, 1, 1));
            }).ElseIf(and(sectionNumber.greaterThan(3.8), sectionNumber.lessThan(4.2)), () => {
                outputColor.assign(vec4(1, 1, 1, 1));
            })
                */
            // check if we are in the pedestal section

            If(IsPedestal(), () => {
                outputColor.assign(this.sectionalNodes.pedestal);
            }).ElseIf(IsFloor(), () => {
                outputColor.assign(this.sectionalNodes.floor);
            }).ElseIf(IsWall(), () => {
                outputColor.assign(this.sectionalNodes.wall);
            }).ElseIf(IsCeiling(), () => {
                outputColor.assign(this.sectionalNodes.ceiling);
            })


            return outputColor;
        });
        this.colorNode = baseColorNode();

    }

    debugColor = () => {
        // loop over the uniforms and set useColor to true, then mark this for update
        Object.values(this.uniforms).forEach((uniform) => {
            uniform.useColor.value = true;
        });
        this.needsUpdate = true;
    }

    // todo: This is insanely verbose but shows what is happening
    private getSectionNode(section: SectionKey, variant: SectionVariant): Node {
        // map uniforms/textures for the requested section
        const sectionConfig: SectionConfig = {
            colorTexture: this.textures[section],
            normalTexture: this.normalTextures[section],
            nodes: this.nodeSets[section],
            ...this.uniforms[section]
        }

        if (variant === 'vertex') {
            let overrideVertex: Node = positionLocal;
            if (sectionConfig.useVertexNode.value) overrideVertex = sectionConfig.nodes.vertex;
            return overrideVertex;
        }

        if (variant === 'map') {

            let overrideColor: Node = randomColorVec4();
            if (this.map) overrideColor = texture(this.map, uv());
            if (sectionConfig.useColorNode.value) overrideColor = sectionConfig.nodes.color;
            if (sectionConfig.useColor.value) overrideColor = sectionConfig.color;
            if (sectionConfig.hasMap.value) {
                const outputUv = sectionConfig.useSquaredUV.value ? CircularUV() : uv();
                overrideColor = texture(sectionConfig.colorTexture, outputUv);
            }
            return overrideColor;
        }

        if (variant === 'normal') {
            let overrideNormal: Node = normalLocal;
            if (sectionConfig.useNormalNode.value) overrideNormal = sectionConfig.nodes.normal;
            if (sectionConfig.hasNormalMap.value) {
                const outputUv = sectionConfig.useSquaredUV.value ? CircularUV() : uv();
                overrideNormal = texture(sectionConfig.normalTexture, outputUv);
            }
            return overrideNormal;
        }
        return vec4(1, 1, 0, 1);
    }

}

type NodeSet = {
    vertex: Node;
    color: Node;
    normal: Node;
}

type SectionKey = 'pedestal' | 'floor' | 'wall' | 'ceiling';
type SectionVariant = 'map' | 'normal' | 'vertex';

type BoolUniform = UniformNode<'bool', boolean>;
type ColorUniform = UniformNode<'vec4', Vector4>;

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
        color: uniform(randomColorVec4())
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
