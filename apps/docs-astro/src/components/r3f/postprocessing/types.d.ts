// Declare these types globally so they are available everywhere without import/export
import type { Node, PassNode, TextureNode, Scene, PerspectiveCamera, WebGPURenderer, ThreePostProcessing } from "three/webgpu";
import type GTAONode from "three/addons/tsl/display/GTAONode.js";
import type { ShaderNodeObject } from "three/tsl";

declare global {
    type Pass = ShaderNodeObject<PassNode>;
    // A color-producing node can be a pass, a texture node, GTAO node, or any shader node that yields color
    type ColorNode = ShaderNodeObject<TextureNode | Node | GTAONode> | Pass | PassNode | TextureNode;

    type PipelineContext = {
        scene: Scene;
        camera: PerspectiveCamera;
        renderer: WebGPURenderer;
        postprocessing: ThreePostProcessing;
        scenePass: Pass;
        colorIn: ColorNode;
        // handy textures from the scenePass
        textureNodes: StandardScenePassTextureNodes;
        lastPass: ColorNode;
    };

    // Allow builds to return any color-producing node
    type BuildFn<TReturn extends ColorNode = ColorNode> = (ctx: PipelineContext) => TReturn;

    type Registration = {
        id: string;
        priority: number;
        build: BuildFn;
    };

    type PostCtx = {
        register: (r: Registration) => void;
        unregister: (id: string) => void;
        update: (r: Registration) => void;
    };
}