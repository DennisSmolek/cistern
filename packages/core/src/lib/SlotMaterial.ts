// this is a demo of a super basic slot material that just supports color and normal

import { MeshStandardNodeMaterial, Texture, Color, Vector3, Vector2 } from "three/webgpu";

type TextureSet = {
    map?: Texture;
    normalMap?: Texture;
}

type SettingsSet = {
    color?: Color;
    normalScale?: Vector2;
}

// straight replace nodes
type NodeSet = {
    colorNode: Node;
    normalNode: Node;
    positionLocalNode: Node;
}

type SingleSlot = {
    textureSet: TextureSet;
    settingsSet: SettingsSet;
    nodeSet: NodeSet;
}

// make a single slot from a material
const makeSingleSlot = (material: MeshStandardNodeMaterial): SingleSlot => {
    const textureSet = {} as TextureSet;
    const settingsSet = {} as SettingsSet;
    const nodeSet = {} as NodeSet;
    console.log(material);

    const finalSlot = {
        textureSet,
        settingsSet,
        nodeSet,
    } as SingleSlot;

    return finalSlot;
}

/**
 * Slot material
 * 
 *The way this works is we take in a material, make a textureSet and settingsSet for it,
 then at our own draw time we read these values
 theres SO MANY in a standard material Im not sure I want to deal with them so for now its just 
 color, normal, and positionLocal that we can swap.
 */

export class SlotMaterial extends MeshStandardNodeMaterial {

    position: Vector3 = new Vector3();

    constructor() {
        super();
    }

    makeSingleSlot(material: MeshStandardNodeMaterial) {
        return makeSingleSlot(material);
    }
}