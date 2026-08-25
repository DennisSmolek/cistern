import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Vector3, type PerspectiveCamera } from 'three/webgpu';
import { useSnapshot } from 'valtio';
import { homeState } from './homeState';
import { controlState } from '../r3f/control/controlState';

//* Homepage camera: sits as low as it can (just above pedestal height) and
//* frames the pedestal to FIT the viewport — distance is computed from the
//* live pedestal radius + fov + aspect every frame, so it adapts to window
//* size and to leva edits. Desktop hero shifts the subject into the right
//* ~half of the frame (the left third is reserved for text); the mobile band
//* and edit mode center it. Edit mode pulls up/out and, once the transition
//* lands, hands the camera to CisternCameraControls so the scene is orbitable.

const SUBJECT = new Vector3(0, 1.4, 0);
// Approach direction (matches the original [4, 2, 9] framing) + its camera-left.
const DIR = new Vector3(0.406, 0, 0.914);
const CAM_LEFT = new Vector3(-0.914, 0, 0.406);

interface ControlsLike {
    enabled: boolean;
    setLookAt: (
        px: number, py: number, pz: number,
        tx: number, ty: number, tz: number,
        transition?: boolean,
    ) => unknown;
}

export const CameraRig = () => {
    const { editMode, reducedMotion } = useSnapshot(homeState);
    const currentTarget = useRef(new Vector3().copy(SUBJECT));
    const desiredPos = useRef(new Vector3());
    const desiredTarget = useRef(new Vector3());
    const lastMode = useRef<'hero' | 'edit'>('hero');
    // Once true (edit mode, transition landed) the user orbits; we stop writing.
    const released = useRef(false);

    useFrame((state) => {
        const { size, delta } = state;
        const camera = state.camera as PerspectiveCamera;
        const controls = state.controls as unknown as ControlsLike | null;

        const mode = editMode ? 'edit' : 'hero';
        if (mode !== lastMode.current) {
            lastMode.current = mode;
            released.current = false;
        }
        if (released.current) return;

        const aspect = size.width / Math.max(1, size.height);
        const mobile = aspect < 1;

        //* Fit: pedestal radius (live from leva) + a margin must fit the frame.
        const radius = (controlState.activeConfig.pedestal?.radius ?? 5) + 1.2;
        const vFov = (camera.fov * Math.PI) / 180;
        const tanV = Math.tan(vFov / 2);
        const tanH = tanV * aspect;
        // Width fraction the pedestal may occupy.
        const frac = editMode ? 0.72 : mobile ? 0.85 : 0.52;
        const contentHalfHeight = editMode ? 3 : 2.3;
        const dist = Math.max(radius / (tanH * frac), contentHalfHeight / tanV, 5);

        const camY = editMode ? 3.5 : mobile ? 1.4 : 1.0;
        const targetY = editMode ? 1.5 : 1.7;

        // Desktop hero: shift the lookAt left so the subject reads right of center.
        const shift = editMode || mobile ? 0 : dist * tanH * 0.42;

        desiredTarget.current.copy(SUBJECT).setY(targetY).addScaledVector(CAM_LEFT, shift);
        desiredPos.current.copy(SUBJECT).addScaledVector(DIR, dist).setY(camY);

        if (reducedMotion) {
            camera.position.copy(desiredPos.current);
            currentTarget.current.copy(desiredTarget.current);
        } else {
            // Exponential ease — framerate-independent damping.
            const t = 1 - Math.exp(-3 * delta);
            camera.position.lerp(desiredPos.current, t);
            currentTarget.current.lerp(desiredTarget.current, t);
        }
        camera.lookAt(currentTarget.current);

        if (editMode) {
            const arrived =
                reducedMotion || camera.position.distanceTo(desiredPos.current) < 0.05;
            if (arrived && controls) {
                // Sync the controls to the pose we landed on, then let the user orbit.
                controls.setLookAt(
                    camera.position.x, camera.position.y, camera.position.z,
                    currentTarget.current.x, currentTarget.current.y, currentTarget.current.z,
                    false,
                );
                controls.enabled = true;
                released.current = true;
            }
        } else if (controls?.enabled) {
            controls.enabled = false;
        }
    });

    return null;
};
