import { BufferGeometry, Material, Mesh } from "three/webgpu";

export class CisternMesh extends Mesh {
    declare geometry: any;
    constructor(geometry: BufferGeometry, material: Material) {
        super(geometry, material);
    }
}
