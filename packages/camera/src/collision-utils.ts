/** These are utils I was trying to use instead of raycasting, the math isnt right
 * and the raycaster worked better. I may eventually come back to this.
*/
import { Vector3 } from "three/webgpu";

/**
 * Calculates the distance from a point to the edge of a circle in 2D space.
 * Ignores the Y component to work in a horizontal plane.
 * 
 * @param point - The point to measure distance from
 * @param origin - The center of the circle
 * @param radius - The radius of the circle
 * @returns Positive value if point is inside circle, negative if outside
 */
export const circleDistance = (point: Vector3, origin: Vector3, radius: number) => {
    // Create 2D vectors ignoring Y (up) component
    const point2D = new Vector3(point.x, 0, point.z);
    const origin2D = new Vector3(origin.x, 0, origin.z);

    // Calculate distance from point to circle center in 2D plane
    const distanceFromCenter = point2D.distanceTo(origin2D);

    // Return distance from point to circle edge
    // Positive = inside circle, Negative = outside circle
    return radius - distanceFromCenter;
}

/**
 * Finds where a line from origin through point intersects with a horizontal plane at targetHeight
 * @param origin - Starting point of the line
 * @param point - Point that defines the line direction
 * @param targetHeight - Height of the horizontal plane
 * @returns The intersection point, or null if the line never intersects the plane
 */
export const linePlaneIntersection = (origin: Vector3, point: Vector3, targetHeight: number): Vector3 | null => {
    // Calculate direction vector from origin to point
    const direction = point.clone().sub(origin);

    // If direction.y is 0, the line is horizontal and will never intersect a horizontal plane
    if (Math.abs(direction.y) < 0.0001) return null;


    // Calculate the parameter t for when the line hits the target height
    // origin.y + t * direction.y = targetHeight
    // t = (targetHeight - origin.y) / direction.y
    const t = (targetHeight - origin.y) / direction.y;

    // If t is negative, the intersection is behind the origin
    if (t < 0) return null;

    // Calculate the intersection point
    return origin.clone().add(direction.multiplyScalar(t));
}

// so we don't have to create a new vector every time
const _distancePointVector = new Vector3();
const _circleIntersectionVector = new Vector3();
const _circleCenterVector = new Vector3();

/**
 * Finds the distance from origin to where a line intersects with a horizontal plane
 * @param origin - Starting point of the line
 * @param point - Point that defines the line direction
 * @param targetHeight - Height of the horizontal plane
 * @returns The distance from origin to intersection, or null if no intersection
 */
export const linePlaneDistance = (origin: Vector3, point: Vector3, targetHeight: number): number | null => {
    // Calculate direction vector from origin to point
    const direction = _distancePointVector.copy(point).sub(origin);

    // If direction.y is 0, the line is horizontal and will never intersect a horizontal plane
    if (Math.abs(direction.y) < 0.0001) return null;


    // Calculate the parameter t for when the line hits the target height
    const t = (targetHeight - origin.y) / direction.y;

    // If t is negative, the intersection is behind the origin
    if (t < 0) return null;

    // Return the distance from origin to intersection point
    return direction.length() * t;
}

/**
 * Finds the distance from line origin to where a line intersects with a circle edge
 * @param lineOrigin - Starting point of the line (e.g., camera position)
 * @param point - Point that defines the line direction
 * @param circleCenter - Center of the circle
 * @param radius - Radius of the circle
 * @returns The distance from line origin to circle edge intersection, or null if no intersection
 */
export const lineCircleDistance = (lineOrigin: Vector3, point: Vector3, circleCenter: Vector3, radius: number): number | null => {
    // Create 2D vectors ignoring Y component
    const lineOrigin2D = _circleIntersectionVector.set(lineOrigin.x, 0, lineOrigin.z);
    const point2D = _distancePointVector.set(point.x, 0, point.z);
    const circleCenter2D = _circleCenterVector.set(circleCenter.x, 0, circleCenter.z);

    // Calculate direction vector from line origin to point
    const direction2D = point2D.clone().sub(lineOrigin2D);

    // If the line has no direction, return null
    if (direction2D.length() < 0.0001) return null;

    // Calculate vector from line origin to circle center
    const toCircleCenter = circleCenter2D.clone().sub(lineOrigin2D);

    // Normalize direction for projection calculation
    const directionNormalized = direction2D.clone().normalize();

    // Project circle center onto the line direction
    const projectionLength = toCircleCenter.dot(directionNormalized);

    // Calculate perpendicular distance from circle center to the line
    const perpendicularDistance = Math.sqrt(toCircleCenter.lengthSq() - projectionLength * projectionLength);

    // If perpendicular distance > radius, line doesn't intersect circle
    if (perpendicularDistance > radius) return null;

    // Calculate distance along line to circle edge (closest intersection)
    const halfChord = Math.sqrt(radius * radius - perpendicularDistance * perpendicularDistance);
    const intersectionDistance = projectionLength - halfChord;

    // If intersection is behind the line origin, return null
    if (intersectionDistance < 0) return null;

    // Return distance from line origin to circle edge
    return intersectionDistance;
}
