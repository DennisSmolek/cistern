// extends camera control collision with own implementation
// og example: https://github.com/yomotsu/camera-controls/blob/dev/examples/collision-custom.html

import CameraControls from "camera-controls";
import { Camera, PerspectiveCamera, Vector3, Matrix4, Raycaster, CylinderGeometry, MeshBasicMaterial, Mesh, DoubleSide, Box3 } from "three/webgpu";
import { CisternMesh } from "@cistern/core";

const _ORIGIN = new Vector3(0, 0, 0);
const _v3A = new Vector3();
const _v3B = new Vector3();
const _v3C = new Vector3();
const _rotationMatrix = new Matrix4();
const _raycaster = new Raycaster();

/**
 * Extended camera controls with collision detection specifically designed for cistern geometries.
 * Provides boundary constraints and collision detection based on cistern configuration.
 */
export class CisternCameraControls extends CameraControls {

    /**
     * The active configuration for the cistern geometry.
     * Contains dimensions and parameters for collision detection.
     */
    activeConfig?: AdvancedConfig;
    /**
     * The world position of the cistern mesh.
     * Used for positioning collision geometry and boundary calculations.
     */
    cisternPosition?: Vector3;
    /**
     * Whether the controls are using an external collider mesh.
     * When true, collision detection uses the provided CisternMesh instead of generating one.
     */
    usesExternalCollider = false;
    /**
     * Whether collision detection is currently active.
     * When false, camera movement is not constrained by collision detection.
     */
    colissionActive = true;

    private colliderGenerated = false;

    /**
     * Gets the maximum height of the cistern from the active configuration.
     * @returns The top height of the cistern root configuration, or 0 if not set.
     */
    get maxHeight() {
        // get from the topHeight of the activeConfig
        return this.activeConfig?.root?.topHeight || 0;
    }

    /**
     * Gets the minimum height of the cistern from the active configuration.
     * @returns The bottom height of the cistern root configuration, or 0 if not set.
     */
    get minHeight() {
        // get from the bottomHeight of the activeConfig
        return this.activeConfig?.root?.bottomHeight || 0;
    }

    /**
     * Gets the maximum radius of the cistern from the active configuration.
     * @returns The larger of the top or bottom radius, or 0 if neither is set.
     */
    get maxRadius() {
        // max of the top or bottom radius of the activeConfig
        return Math.max(this.activeConfig?.root?.topRadius || 0, this.activeConfig?.root?.bottomRadius || 0);
    }
    /**
     * Gets the minimum radius of the cistern from the active configuration.
     * @returns The smaller of the top or bottom radius, or 0 if neither is set.
     */
    get minRadius() {
        // min of the top or bottom radius of the activeConfig
        return Math.min(this.activeConfig?.root?.topRadius || 0, this.activeConfig?.root?.bottomRadius || 0);
    }

    /**
     * Gets the primary collider mesh used for collision detection.
     * @returns The first collider mesh cast as a CisternMesh, or undefined if none exists.
     */
    get primaryCollider() {
        return this.colliderMeshes[0] as CisternMesh;
    }

    /**
     * Creates a new instance of CisternCameraControls.
     * 
     * @param camera - The camera to control (typically a PerspectiveCamera)
     * @param domElement - The DOM element to attach event listeners to
     */
    constructor(camera: Camera, domElement: HTMLElement) {
        super(camera as PerspectiveCamera, domElement);
        this.updateConfig();
    }
    /**
     * Updates the position of the cistern in world space.
     * This position is used for collision detection and boundary calculations.
     * 
     * @param position - The new world position of the cistern
     */
    updateCisternPosition(position: Vector3) {
        this.cisternPosition = position;
    }

    /**
     * Updates the active configuration for the cistern.
     * If a collider mesh already exists, its geometry will be updated with the new config.
     * The boundary will be recalculated after the update.
     * 
     * @param config - Optional new configuration to apply. If not provided, uses existing activeConfig
     */
    updateConfig(config?: AdvancedConfig) {
        // this lets us link the ref and call without declaring the link back
        if (config) this.activeConfig = config;
        if (!this.activeConfig) this.activeConfig = {};
        // if we already have a collider mesh, update it
        // debug:
        if (this.colliderMeshes.length > 0 && this.primaryCollider) this.primaryCollider.geometry.updateConfig(this.activeConfig);
        else if (this.colliderGenerated) console.log('colliders go missing in HMR', this.primaryCollider)

        this.updateBoundary();
    }
    /**
     * Generates a boundary from the primary collider to constrain camera target movement.
     * Creates a Box3 boundary that is 90% of the collider's size to prevent the target
     * from leaving the cistern bounds.
     */
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

    /**
     * Generates a simple cylindrical collider mesh for collision detection.
     * Creates a basic cylinder geometry based on the cistern's minimum radius and height.
     * The collider is positioned at the cistern position and added to the colliderMeshes array.
     */
    generateCollider() {
        if (!this.activeConfig || !this.cisternPosition) return;
        this.colliderGenerated = true;
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

    /**
     * Sets an external CisternMesh as the collider for collision detection.
     * This enables using a pre-existing cistern mesh instead of generating a simple cylinder.
     * 
     * @param mesh - The CisternMesh to use as the collision geometry
     */
    setCisternMesh(mesh: CisternMesh) {
        this.usesExternalCollider = true;
        this.colliderMeshes = [mesh];
        mesh.updateMatrixWorld();
        this.activeConfig = mesh.geometry.config;
        this.cisternPosition = mesh.position;
        this.updateBoundary();
    }

    /**
     * Enables or disables collision detection.
     * When collision is disabled, the camera can move freely without constraints.
     * 
     * @param active - Whether to enable collision detection. Defaults to false if not provided.
     */
    setCollision(active?: boolean) {
        this.colissionActive = active || false;
    }

    /**
     * Performs collision testing using raycasting from camera corners.
     * Casts rays from the camera's near plane corners through the target to detect
     * intersections with collider meshes. Returns the minimum distance to prevent
     * camera from penetrating the cistern geometry.
     * 
     * @returns The minimum distance to maintain from the cistern surface, or Infinity if no collision
     */
    _collisionTest() {
        /*
        The original uses the target origin casts a ray through the corner and if it hits anything
        it reduces it's spherical size to that distance.
        */
        let distance = Infinity;
        if (!this.cisternPosition || !this.activeConfig || !this.colissionActive) return distance;

        // if we dont have a collider mesh, generate one
        if (this.colliderMeshes.length === 0) this.generateCollider();

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

            const intersects = _raycaster.intersectObjects(this.colliderMeshes);

            if (intersects.length !== 0) {
                distance = intersects[0].distance;
            }
        }

        return distance;
    }
}
