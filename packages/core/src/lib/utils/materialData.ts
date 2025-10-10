
import { MeshBasicMaterial, MeshStandardNodeMaterial, Node, NodeMaterial, Texture } from "three/webgpu";


// data that triggers an update in a material
export const refreshUniforms = [
    'alphaMap',
    'alphaTest',
    'anisotropy',
    'anisotropyMap',
    'anisotropyRotation',
    'aoMap',
    'aoMapIntensity',
    'attenuationColor',
    'attenuationDistance',
    'bumpMap',
    'clearcoat',
    'clearcoatMap',
    'clearcoatNormalMap',
    'clearcoatNormalScale',
    'clearcoatRoughness',
    'color',
    'dispersion',
    'displacementMap',
    'emissive',
    'emissiveIntensity',
    'emissiveMap',
    'envMap',
    'envMapIntensity',
    'gradientMap',
    'ior',
    'iridescence',
    'iridescenceIOR',
    'iridescenceMap',
    'iridescenceThicknessMap',
    'lightMap',
    'lightMapIntensity',
    'map',
    'matcap',
    'metalness',
    'metalnessMap',
    'normalMap',
    'normalScale',
    'opacity',
    'roughness',
    'roughnessMap',
    'sheen',
    'sheenColor',
    'sheenColorMap',
    'sheenRoughnessMap',
    'shininess',
    'specular',
    'specularColor',
    'specularColorMap',
    'specularIntensity',
    'specularIntensityMap',
    'specularMap',
    'thickness',
    'transmission',
    'transmissionMap'
];


type TypicalMaterial = MeshBasicMaterial | MeshStandardNodeMaterial | NodeMaterial;

export class MaterialData {

    maps: Record<string, Texture> = {};

    constructor(material: TypicalMaterial) {
        this.material = material;
    }

    material: TypicalMaterial;

    originalColorNode?: Node;

    rebuild() {
    }
}