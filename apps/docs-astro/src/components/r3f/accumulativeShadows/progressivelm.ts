// Based on "Progressive Light Map Accumulator", by [zalo](https://github.com/zalo/)
// found in the threejs examples for profressive shadowMaps
/*
Important notes:
Because we dump to a plane we dont need Zalos more complex version, so
Paul's original strips that logic.
also as a react component some of the logic/flow from the original class was
brought into a r3f style flow


*/

// This is only webGPU so I'll direct import here
import * as THREE from 'three/webgpu';
type Color4Like = THREE.Color & { a: number };
import { vec4, uv, sub, float, mix, output, uniform, vec2, texture } from 'three/tsl';

const textureParams = {
    type: THREE.HalfFloatType,
    magFilter: THREE.NearestFilter,
    minFilter: THREE.NearestFilter,
};

function isLight(object: unknown): object is THREE.Light {
    return (object as THREE.Light).isLight;
}

function isGeometry(object: unknown): object is THREE.Mesh {
    return !!(object as THREE.Mesh).geometry;
}

export class SimpleWebGPUProgressiveLightMap {
    renderer: THREE.WebGPURenderer;
    res: number;
    scene: THREE.Scene;
    object: THREE.Mesh | null;
    buffer1Active = false;
    clearColor = new THREE.Color();
    clearAlpha = 0;
    lights: { object: THREE.Light; intensity: number }[] = [];
    meshes: { object: THREE.Mesh; material: THREE.Material | THREE.Material[] }[] = [];

    // render targets
    renderTargets: { first?: THREE.RenderTarget; second?: THREE.RenderTarget } = {}

    materials = {
        discard: new THREE.MeshBasicMaterial(),
        uv: new THREE.MeshPhongNodeMaterial(),
    }

    uniforms = {
        opacity: uniform(0),
        averagingWindow: uniform(100),
        previousShadowMap: texture()

    }

    constructor(renderer: THREE.WebGPURenderer, scene: THREE.Scene, res: number = 1024) {
        this.renderer = renderer;
        this.res = res;
        this.scene = scene;
        this.object = null;
        // Create the Progressive LightMap Texture

        this.renderTargets.first = new THREE.RenderTarget(this.res, this.res, textureParams);
        this.renderTargets.second = new THREE.RenderTarget(this.res, this.res, textureParams);

        // initialize the texture
        this.uniforms.previousShadowMap = texture(this.renderTargets.first.texture);
        this.setupMaterials();
    }

    private setupMaterials() {
        // basic discard material
        this.materials.discard.colorNode = vec4(0, 0, 0, 0);
        // uv material
        const uvNode = uv(1).flipY();
        this.materials.uv.vertexNode = vec4(sub(uvNode, vec2(0.5)).mul(2), 1, 1);
        this.materials.uv.outputNode = vec4(
            mix(this.uniforms.previousShadowMap.sample(uv(1)), output, float(1).div(this.uniforms.averagingWindow)),
        );
    }

    clear() {
        // WebGPU typings expect a Color4 target; use a structural alias to avoid importing private types
        this.renderer.getClearColor(this.clearColor as unknown as Color4Like);
        this.clearAlpha = this.renderer.getClearAlpha();
        const originalRenderTarget = this.renderer.getRenderTarget();
        this.renderer.setClearColor('black', 1);
        this.renderer.setRenderTarget(this.renderTargets.first!);
        this.renderer.clear();
        this.renderer.setRenderTarget(this.renderTargets.second!);
        this.renderer.clear();
        this.renderer.setRenderTarget(originalRenderTarget);
        this.renderer.setClearColor(this.clearColor, this.clearAlpha);

        this.lights = [];
        this.meshes = [];
        this.scene.traverse((object) => {
            if (isGeometry(object)) {
                this.meshes.push({ object, material: object.material });
            } else if (isLight(object)) {
                this.lights.push({ object, intensity: object.intensity });
            }
        });
    }

    prepare() {
        this.lights.forEach((light) => (light.object.intensity = 0));
        this.meshes.forEach((mesh) => (mesh.object.material = this.materials.discard));
    }

    finish() {
        this.lights.forEach((light) => (light.object.intensity = light.intensity));
        this.meshes.forEach((mesh) => (mesh.object.material = mesh.material));
    }

    configure(object: THREE.Mesh) {
        this.object = object;
    }

    update(camera: THREE.Camera, blendWindow = 100) {
        if (!this.object) return;
        // Set each object's material to the UV Unwrapped Surface Mapping Version
        // This is the magic. We keep our regular camera but move things to UV space
        this.uniforms.averagingWindow.value = blendWindow;
        this.object.material = this.materials.uv;
        // Ping-pong two surface buffers for reading/writing
        const activeMap = this.buffer1Active ? this.renderTargets.first! : this.renderTargets.second!;
        const inactiveMap = this.buffer1Active ? this.renderTargets.second! : this.renderTargets.first!;
        // Render the object's surface maps
        const oldBg = this.scene.background;
        this.scene.background = null;
        const originalRenderTarget = this.renderer.getRenderTarget();
        this.renderer.setRenderTarget(activeMap);
        this.uniforms.previousShadowMap.value = inactiveMap.texture;
        this.buffer1Active = !this.buffer1Active;
        this.renderer.render(this.scene, camera);
        this.renderer.setRenderTarget(originalRenderTarget);
        this.scene.background = oldBg;
    }
}
