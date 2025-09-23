import { Vector3 } from "three/webgpu";

export function arrayToVecs(points: Points) {
    return points.map((point) => new Vector3(...point));
}
