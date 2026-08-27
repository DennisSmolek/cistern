import { useEffect, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { MathUtils, Vector3, type PerspectiveCamera } from 'three/webgpu';
import { useSnapshot } from 'valtio';
import { CisternCamera } from '@cistern/r3f';
import { homeState } from './homeState';
import { controlState } from '../r3f/control/controlState';

//* Homepage camera: sits as low as it can (just above pedestal height) and
//* frames the pedestal to FIT the viewport — distance is computed from the
//* live pedestal radius + fov + aspect every frame, so it adapts to window
//* size and to leva edits. Desktop hero shifts the subject into the right
//* ~half of the frame (the left third is reserved for text); the mobile band
//* and edit mode center it.
//*
//* Hero mode also parallaxes off the cursor: a few degrees of yaw and a small
//* lift, heavily damped, so the scene feels alive without ever leaving the
//* composed framing. Edit mode pulls up/out and, once the transition lands,
//* hands the camera to CisternCameraControls for full orbit/dolly/truck.

const SUBJECT = new Vector3(0, 1.4, 0);
// Approach direction (matches the original [4, 2, 9] framing) + its camera-left.
const DIR = new Vector3(0.406, 0, 0.914);
const CAM_LEFT = new Vector3(-0.914, 0, 0.406);
const UP = new Vector3(0, 1, 0);

//* Parallax envelope, at full cursor deflection (screen edge).
const PARALLAX_YAW = 0.1; // radians of orbit (~5.7°)
const PARALLAX_LIFT = 0.5; // world units of camera height
const PARALLAX_TILT = 0.18; // world units the lookAt counter-shifts
// Idle breathing, so an untouched (or touch-only) page still drifts.
const IDLE_YAW = 0.022;
const IDLE_PERIOD = 14; // seconds

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
    const dir = useRef(new Vector3());
    const lastMode = useRef<'hero' | 'edit'>('hero');
    // Once true (edit mode, transition landed) the user orbits; we stop writing.
    const released = useRef(false);
    //* Cursor in -1..1 page space, and its damped follower. Listening on the
    //* window rather than via r3f pointer events because the hero copy sits
    //* over the canvas and would otherwise swallow the moves.
    const pointer = useRef({ x: 0, y: 0 });
    const smoothed = useRef({ x: 0, y: 0 });

    useEffect(() => {
        const onMove = (e: PointerEvent) => {
            pointer.current.x = (e.clientX / window.innerWidth) * 2 - 1;
            pointer.current.y = (e.clientY / window.innerHeight) * 2 - 1;
        };
        const onLeave = () => {
            pointer.current.x = 0;
            pointer.current.y = 0;
        };
        window.addEventListener('pointermove', onMove, { passive: true });
        window.addEventListener('pointerout', onLeave);
        return () => {
            window.removeEventListener('pointermove', onMove);
            window.removeEventListener('pointerout', onLeave);
        };
    }, []);

    useFrame((state) => {
        const { size, delta, elapsed } = state;
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

        //* Cursor parallax — hero only, and only while the page is animating.
        let yaw = 0;
        let lift = 0;
        let tilt = 0;
        if (!editMode && !reducedMotion) {
            // Damp the cursor itself so a flicked mouse doesn't snap the frame.
            const p = 1 - Math.exp(-2.4 * delta);
            smoothed.current.x = MathUtils.lerp(smoothed.current.x, pointer.current.x, p);
            smoothed.current.y = MathUtils.lerp(smoothed.current.y, pointer.current.y, p);
            yaw =
                smoothed.current.x * PARALLAX_YAW +
                Math.sin((elapsed / IDLE_PERIOD) * Math.PI * 2) * IDLE_YAW;
            lift = -smoothed.current.y * PARALLAX_LIFT;
            tilt = smoothed.current.x * PARALLAX_TILT;
        }

        // Desktop hero: shift the lookAt left so the subject reads right of center.
        const shift = editMode || mobile ? 0 : dist * tanH * 0.42;

        desiredTarget.current
            .copy(SUBJECT)
            .setY(targetY + lift * 0.25)
            .addScaledVector(CAM_LEFT, shift + tilt);
        dir.current.copy(DIR).applyAxisAngle(UP, yaw);
        desiredPos.current
            .copy(SUBJECT)
            .addScaledVector(dir.current, dist)
            .setY(camY + lift);

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
                released.current = true;
            }
        }
    });

    return (
        //* Mounted always so `state.controls` exists for the handoff above;
        //* `enabled` gates whether it listens for input. Its own useFrame runs
        //* at priority -1, ahead of the rig, so the rig wins while framing.
        <CisternCamera
            makeDefault
            enabled={editMode}
            minDistance={3}
            maxDistance={60}
            maxPolarAngle={Math.PI * 0.495}
            smoothTime={0.18}
        />
    );
};
