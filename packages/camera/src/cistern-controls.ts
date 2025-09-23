// extends camera control collision with own implementation
// og example: https://github.com/yomotsu/camera-controls/blob/dev/examples/collision-custom.html

import CameraControls from "camera-controls";
import { Camera, PerspectiveCamera, Vector3, Matrix4, Raycaster, CylinderGeometry, MeshBasicMaterial, Mesh, Object3D, DoubleSide, Box3 } from "three/webgpu";
import { CisternGeometry, CisternMesh } from "@cistern/core";

const _ORIGIN = new Vector3(0, 0, 0);
const _v3A = new Vector3();
const _v3B = new Vector3();
const _v3C = new Vector3();
const _rotationMatrix = new Matrix4();
const _raycaster = new Raycaster();

export class CisternCameraControls extends CameraControls {

    activeConfig?: AdvancedConfig;
    cisternPosition?: Vector3;
    usesExternalCollider = false;

    get maxHeight() {
        // get from the topHeight of the activeConfig
        return this.activeConfig?.root?.topHeight || 0;
    }

    get minHeight() {
        // get from the bottomHeight of the activeConfig
        return this.activeConfig?.root?.bottomHeight || 0;
    }

    get maxRadius() {
        // max of the top or bottom radius of the activeConfig
        return Math.max(this.activeConfig?.root?.topRadius || 0, this.activeConfig?.root?.bottomRadius || 0);
    }
    get minRadius() {
        // min of the top or bottom radius of the activeConfig
        return Math.min(this.activeConfig?.root?.topRadius || 0, this.activeConfig?.root?.bottomRadius || 0);
    }

    get primaryCollider() {
        return this.colliderMeshes[0] as CisternMesh;
    }

    constructor(camera: Camera, domElement: HTMLElement) {

        super(camera as PerspectiveCamera, domElement);
        this.updateConfig();
        console.log('cisterncontrols constructor');

    }
    updateCisternPosition(position: Vector3) {
        this.cisternPosition = position;
    }

    updateConfig(config?: AdvancedConfig) {
        // this lets us link the ref and call without declaring the link back
        if (config) this.activeConfig = config;
        if (!this.activeConfig) this.activeConfig = {};
        // if we already have a collider mesh, update it
        if (this.colliderMeshes.length > 0) this.primaryCollider.geometry.updateConfig(this.activeConfig);
        this.updateBoundary();
    }
    // generate a boundry from the primary collider to stop the target leaving its bounds
    updateBoundary() {
        if (!this.primaryCollider) return;
        // generate a new box3
        const newBox = new Box3();
        newBox.setFromObject(this.primaryCollider);
        const boxSize = new Vector3();
        const boxCenter = new Vector3();
        newBox.getSize(boxSize);
        newBox.getCenter(boxCenter);
        // make new box slightly shrunk (90% of original size)
        boxSize.multiplyScalar(0.9);
        const scaledBox = new Box3().setFromCenterAndSize(boxCenter, boxSize);
        this.setBoundary(scaledBox);
    }

    generateCollider() {
        if (!this.activeConfig || !this.cisternPosition) return;
        // make a a generic cistern
        //const geometry = new CisternGeometry();
        // geometry.updateConfig(this.activeConfig);
        const radius = this.minRadius;
        const height = this.maxHeight - this.minHeight;
        const geometry = new CylinderGeometry(radius, radius, height, 36);
        const material = new MeshBasicMaterial({ color: 0x00ff00 });
        material.side = DoubleSide;
        const mesh = new Mesh(geometry, material);
        mesh.position.copy(this.cisternPosition);
        mesh.position.y += height / 2;
        mesh.position.y += 1;
        mesh.updateMatrixWorld();
        this.colliderMeshes.push(mesh);
        this.updateBoundary();
    }

    setCisternMesh(mesh: CisternMesh) {
        this.usesExternalCollider = true;
        this.colliderMeshes = [mesh];
        mesh.updateMatrixWorld();
        this.activeConfig = mesh.geometry.config;
        this.cisternPosition = mesh.position;
        this.updateBoundary();
    }

    _collisionTest() {
        /*
        The original uses the target origin casts a ray through the corner and if it hits anything
        it reduces it's spherical size to that distance.
        Our base distance will be the minRadius first

        */
        // if we dont have a collider mesh, generate one
        if (this.colliderMeshes.length === 0) this.generateCollider();

        let distance = Infinity;
        if (!this.cisternPosition || !this.activeConfig) return distance;


        const direction = _v3A.setFromSpherical(this._spherical).divideScalar(this._spherical.radius);
        _rotationMatrix.lookAt(_ORIGIN, direction, this._camera.up);

        // force to be minRadius first
        distance = this.minRadius;


        // Loop over the corners in the near plane
        for (let i = 0; i < 4; i++) {

            const nearPlaneCorner = _v3B.copy(this._nearPlaneCorners[i]);
            nearPlaneCorner.applyMatrix4(_rotationMatrix);

            // is this the actual corner position? is the original relative

            const origin = _v3C.addVectors(this._target, nearPlaneCorner);
            _raycaster.set(origin, direction);
            _raycaster.far = 1000;
            //console.log('raycaster', _raycaster);

            const intersects = _raycaster.intersectObjects(this.colliderMeshes);
            //console.log('intersects', intersects);

            if (intersects.length !== 0) {
                // console.log('intersects distance', intersects[0].distance);

                distance = intersects[0].distance;

            }



        }

        //console.log('Final Distance:', distance);

        return distance;

    }

}

const circleDistance = (point: Vector3, origin: Vector3, radius: number) => {
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
const linePlaneIntersection = (origin: Vector3, point: Vector3, targetHeight: number): Vector3 | null => {
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
const linePlaneDistance = (origin: Vector3, point: Vector3, targetHeight: number): number | null => {
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
const lineCircleDistance = (lineOrigin: Vector3, point: Vector3, circleCenter: Vector3, radius: number): number | null => {
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

