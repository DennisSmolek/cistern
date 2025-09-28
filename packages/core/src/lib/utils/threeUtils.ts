import { Vector2, Vector3 } from "three/webgpu";

export function arrayToVecs(points: Points) {
    return points.map((point) => new Vector3(...point));
}


/**
     * Converts x, y coordinates and radius to UV coordinates on a circle
     * The circle is mapped to a square UV space where radius=1 creates a 2x2 square
     * @param x - X coordinate
     * @param y - Y coordinate  
     * @param radius - Radius of the circle
     * @returns Vector2 with UV coordinates (0-1 range)
     */
export function circleToUV(x: number, y: number, radius: number): Vector2 {
    // Normalize coordinates to the circle's radius
    const normalizedX = x / radius;
    const normalizedY = y / radius;

    // Convert from [-1, 1] range to [0, 1] UV range
    const u = (normalizedX + 1) * 0.5;
    const v = (normalizedY + 1) * 0.5;

    return new Vector2(u, v);
}

