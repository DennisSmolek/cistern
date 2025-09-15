import { useRef, useState } from "react";
import { useFrame } from "@react-three/fiber";
import { Sphere } from "@react-three/drei";
import { useControls } from "leva";
import type { Mesh } from "three";

function AnimatedSphere() {
    const meshRef = useRef<Mesh>(null);

    const { position, color, floatSpeed, floatHeight } = useControls(
        "Floating Sphere",
        {
            position: { value: [0, 2, 0], step: 0.1 },
            color: "#4ecdc4",
            floatSpeed: { value: 2, min: 0, max: 5, step: 0.1 },
            floatHeight: { value: 1, min: 0, max: 3, step: 0.1 },
        }
    );

    useFrame((state) => {
        if (meshRef.current) {
            meshRef.current.position.y =
                position[1] +
                Math.sin(state.clock.elapsedTime * floatSpeed) * floatHeight;
        }
    });

    return (
        <Sphere ref={meshRef} position={position} args={[0.5, 32, 32]}>
            <meshStandardMaterial color={color} />
        </Sphere>
    );
}

export default function Scene() {
    const showObjects = useControls("Scene Controls", {
        showSphere: true,
    });

    return <>{showObjects.showSphere && <AnimatedSphere />}</>;
}
