// * Scene Pass ==============================
import { useImperativeHandle, useMemo, useState } from 'react';
import { normalView, pass, velocity, mrt, type ShaderNodeObject, output } from 'three/tsl';
import { usePostprocessing } from '../Postprocessing';
import type {
    PassNode,
    TextureNode,
    Scene,
    PerspectiveCamera,
    Node as ThreeNode,
    PropertyNode,
    VarNode,
} from 'three/webgpu';

type Vel = typeof velocity;

interface NodeRef {
    pass: ShaderNodeObject<PassNode>;
    textureNodes: StandardScenePassTextureNodes;
}
interface ScenePassProps {
    ref: React.RefObject<NodeRef>;
    overridable?: boolean;
    [key: string]: unknown;
}

export interface StandardScenePassTextureNodes {
    output: ShaderNodeObject<TextureNode>;
    normal?: ShaderNodeObject<TextureNode>;
    depth: ShaderNodeObject<TextureNode>;
    velocity?: ShaderNodeObject<TextureNode>;
    previousOutput: ShaderNodeObject<ThreeNode>; // this has to be a bug
}

export const ScenePass = ({ ref, overridable: _overridable = false, ..._rest }: ScenePassProps) => {
    const {
        scene,
        camera,
        renderer: _renderer,
        postprocessing: _postprocessing,
    } = usePostprocessing();
    const { scenePass, sceneTextureNodes: _sceneTextureNodes } = useMemo(
        () => generateScenePass(scene, camera),
        [scene, camera],
    );
    const [textureNodes, _setTextureNodes] = useState<StandardScenePassTextureNodes>(
        {} as StandardScenePassTextureNodes,
    );

    useImperativeHandle(ref, () => ({
        pass: scenePass,
        textureNodes: textureNodes,
    }));
    return <></>;
};

// this is a util to generate a scene pass from set params

interface GenerateScenePassOptions {
    normal?: boolean;
    velocity?: boolean;
}

type MRTNodes = {
    output: ShaderNodeObject<PropertyNode>;
    normal?: ShaderNodeObject<VarNode>;
    velocity?: Vel;
};

export function generateScenePass(
    scene: Scene,
    camera: PerspectiveCamera,
    options: GenerateScenePassOptions = { normal: true, velocity: false },
) {
    const scenePass = pass(scene, camera) as ShaderNodeObject<PassNode>;

    // determine if we need MRT, and if so, which nodes
    // if there is no options or all of the values are false we dont even need MRT
    if (options && Object.values(options).some((value) => value === true)) {
        const mrtNodes: MRTNodes = {
            output: output,
        };
        if (options.normal) mrtNodes.normal = normalView;
        if (options.velocity) mrtNodes.velocity = velocity;

        scenePass.setMRT(mrt(mrtNodes));
    }
    const sceneTextureNodes = {
        output: scenePass.getTextureNode('output'),
        depth: scenePass.getTextureNode('depth'),
        previousOutput: scenePass.getPreviousTextureNode('output'),
    } as StandardScenePassTextureNodes;

    if (options.normal) sceneTextureNodes.normal = scenePass.getTextureNode('normal');
    if (options.velocity) sceneTextureNodes.velocity = scenePass.getTextureNode('velocity');

    return { scenePass, sceneTextureNodes };
}
