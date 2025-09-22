import { Vector3 } from "three/webgpu";
import type { Points } from "./types";

export function arrayToVecs(points: Points) {
    return points.map((point) => new Vector3(...point));
}
