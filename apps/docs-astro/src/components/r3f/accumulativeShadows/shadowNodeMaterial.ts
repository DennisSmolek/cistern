import * as THREE from 'three/webgpu';
import { texture, uniform, sub, max, vec4, uv } from 'three/tsl';

export class ShadowNodeMaterial extends THREE.MeshPhongNodeMaterial {

    shadowUniforms = {
        color: uniform(new THREE.Color()),
        opacity: uniform(1),
        alphaTest: uniform(0),
        blend: uniform(0),
        map: texture(),
    }

    set map(value: THREE.Texture) {
        this.shadowUniforms.map.value = value;
    }

    set color(value: THREE.Color) {
        this.shadowUniforms.color.value = value;
    }

    set opacity(value: number) {
        this.shadowUniforms.opacity.value = value;
    }

    set blend(value: number) {
        this.shadowUniforms.blend.value = value;
    }

    get blend(): number {
        return this.shadowUniforms.blend.value as number;
    }

    set alphaTest(value: number) {
        this.shadowUniforms.alphaTest.value = value;
    }

    constructor() {
        super();
        console.log('Made node material')

        // setup material
        const sampledDiffuseColor = this.shadowUniforms.map.sample(uv());
        this.colorNode = vec4(this.shadowUniforms.color.mul(sampledDiffuseColor.r).mul(this.shadowUniforms.blend), max(0.0, sub(1.0, sampledDiffuseColor.r.add(sampledDiffuseColor.g).add(sampledDiffuseColor.b).div(this.shadowUniforms.alphaTest))).mul(this.shadowUniforms.opacity))
    }
}
