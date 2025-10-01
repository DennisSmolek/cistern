// this is a wrapper to do the webGPU ao post processing effect
import { WebGPURenderer, PerspectiveCamera, Scene, PostProcessing } from "three/webgpu";
import { pass, mrt, output, normalView, velocity } from 'three/tsl';
import { ao } from 'three/addons/tsl/display/GTAONode.js';

import { traa } from 'three/addons/tsl/display/TRAANode.js';
interface AOParams {
    distanceExponent: number;
    distanceFalloff: number;
    radius: number;
    scale: number;
    thickness: number;
}

/*

viewport, size, resolutionScale, resolution layers, mrt, viewZNode, linearDepthNode, color, normal, velocity, output
toggleTexture, getTexture, getPreviousTExture, scisor, pixelRation

*/

export class AOEffect {

    renderer: WebGPURenderer;
    scene: Scene;
    camera: PerspectiveCamera;

    postprocessing: PostProcessing;



    constructor(renderer: WebGPURenderer, scene: Scene, camera: PerspectiveCamera) {
        this.renderer = renderer;
        this.scene = scene;
        this.camera = camera;
        this.postprocessing = new PostProcessing(this.renderer);

        //parameters;
    }

    setupPasses(scene: Scene, camera: PerspectiveCamera) {
        const scenePass = pass(scene, camera);

        scenePass.setMRT(mrt({
            output: output,
            normal: normalView,
            velocity: velocity,
        }));
        const scenePassColor = scenePass.getTextureNode('output');
        const scenePassNormal = scenePass.getTextureNode('normal');
        const scenePassDepth = scenePass.getTextureNode('depth');
        const scenePassVelocity = scenePass.getTextureNode('velocity');

        // Ao
        const aoPass = ao(scenePassDepth, scenePassNormal, camera);
        aoPass.resolutionScale = 0.5;
        const blendPassAO = aoPass.getTextureNode().mul(scenePassColor);

        // TRAA
        const traaPass = traa(blendPassAO, scenePassDepth, scenePassVelocity, camera);
        this.postprocessing.outputNode = traaPass;
    }
}