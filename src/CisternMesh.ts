import { BufferGeometry, Material, Mesh } from "three/webgpu";
import type { CisternGeometry } from "./CisternGeometry";

export class CisternMesh extends Mesh {
    declare geometry: CisternGeometry;
    constructor(geometry: BufferGeometry, material: Material) {
        super(geometry, material);
    }
}
