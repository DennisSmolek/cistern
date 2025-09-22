// extends camera control collision with own implementation
// og example: https://github.com/yomotsu/camera-controls/blob/dev/examples/collision-custom.html

import CameraControls from "camera-controls";
import { Camera, PerspectiveCamera, Vector3, Matrix4 } from "three/webgpu";

const _ORIGIN = new Vector3(0, 0, 0);
const _v3A = new Vector3();
const _v3B = new Vector3();
const _rotationMatrix = new Matrix4();

export class CisternCameraControls extends CameraControls {

    activeConfig?: AdvancedConfig;
    cisternPosition?: Vector3;

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

    constructor(camera: Camera, domElement: HTMLElement) {

        super(camera as PerspectiveCamera, domElement);
        this.updateConfig();

    }
    updateCisternPosition(position: Vector3) {
        this.cisternPosition = position;
    }

    updateConfig(config?: AdvancedConfig) {
        // this lets us link the ref and call without declaring the link back
        if (config) this.activeConfig = config;
        if (!this.activeConfig) this.activeConfig = {};
    }

    _collisionTest() {

        let distance = Infinity;
        if (!this.cisternPosition || !this.activeConfig) return distance;


        const direction = _v3A.setFromSpherical(this._spherical).divideScalar(this._spherical.radius);
        _rotationMatrix.lookAt(_ORIGIN, direction, this._camera.up);

        // Loop over the corners in the near plane
        for (let i = 0; i < 4; i++) {

            const nearPlaneCorner = _v3B.copy(this._nearPlaneCorners[i]);
            nearPlaneCorner.applyMatrix4(_rotationMatrix);

            //const origin = _v3C.addVectors(this._target, nearPlaneCorner);

            // first test the y value distance from the max and min height
            if (nearPlaneCorner.y > this.maxHeight) {
                distance = Math.min(distance, this.maxHeight - nearPlaneCorner.y);
            } else if (nearPlaneCorner.y < this.minHeight) {
                distance = Math.min(distance, this.minHeight - nearPlaneCorner.y);
            } else {
                // test the distance from the radius
                distance = Math.min(distance, circleDistance(nearPlaneCorner, this.cisternPosition, this.maxRadius));
            }
        }

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