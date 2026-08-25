import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Vector3 } from 'three/webgpu';
import { useSnapshot } from 'valtio';
import { homeState } from './homeState';

//* Frames the scene for the homepage shell: the hero reserves the left third
//* of the viewport for text, so the camera looks left of the pedestal and the
//* cistern reads in the right ~55% of the frame. Edit mode pulls out and
//* re-centers; the mobile band (aspect < 1) centers too.

interface Framing {
    pos: Vector3;
    target: Vector3;
}

const HERO: Framing = { pos: new Vector3(4, 2, 9), target: new Vector3(-2.6, 2.2, 1.2) };
const EDIT: Framing = { pos: new Vector3(7, 4.5, 13), target: new Vector3(0, 2, 0) };
const MOBILE: Framing = { pos: new Vector3(4, 2.5, 11), target: new Vector3(0, 2, 0) };

export const CameraRig = () => {
    const { editMode, reducedMotion } = useSnapshot(homeState);
    const currentTarget = useRef(new Vector3().copy(HERO.target));

    useFrame((state) => {
        const { camera, size, delta } = state;
        const framing = editMode ? EDIT : size.width / size.height < 1 ? MOBILE : HERO;

        if (reducedMotion) {
            camera.position.copy(framing.pos);
            currentTarget.current.copy(framing.target);
        } else {
            // Exponential ease — framerate-independent damping.
            const t = 1 - Math.exp(-3 * delta);
            camera.position.lerp(framing.pos, t);
            currentTarget.current.lerp(framing.target, t);
        }
        camera.lookAt(currentTarget.current);
    });

    return null;
};
