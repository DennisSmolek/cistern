import { useEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { Sphere } from "@react-three/drei";
import { useControls } from "leva";
import type { Mesh, SpotLight } from "three/webgpu";
import { Object3D, Vector3 } from "three/webgpu";
import { Cistern } from "./Cistern";
import { ref, useSnapshot } from "valtio";
import { controlState } from "./control/controlState";
import type { AdvancedConfig } from "../pointGeneration/types";
import { CisternMesh } from "../CisternMesh";
import { ControlScene } from "./control/ControlScene";

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
    const { activeConfig, overrideConfig } = useSnapshot(controlState);
    const actualConfig = activeConfig as AdvancedConfig;
    const cisternRef = useRef<CisternMesh | null>(null);
    const spotLightRef = useRef<SpotLight | null>(null);
    const showObjects = useControls("Scene Controls", {
        showSphere: true,
    });
    const spotlightTargetRef = useRef<Object3D | null>(null);
    useEffect(() => {
        if (spotLightRef.current) {
            spotLightRef.current.position.set(15, 1, 2);
            spotLightRef.current.rotation.set(0, 0, 0);
        }
    }, []);

    const spotlightTarget = useMemo(() => {
        const target = new Object3D();
        target.position.set(25, 1, 2);
        return target;
    }, []);

    // get the points a moment after a config change
    useEffect(() => {
        if (!cisternRef.current) return;
        const { points } = cisternRef.current.geometry.updateConfig(
            overrideConfig || actualConfig
        );
        const newVecs = points.map((point) => new Vector3(point.x, point.y, 0));
        console.log("points before setting", points);
        controlState.displayPoints = ref(newVecs);
    }, [actualConfig, overrideConfig]);

    return (
        <>
            <Cistern ref={cisternRef} config={actualConfig} />
            <ControlScene />
            {showObjects.showSphere && <AnimatedSphere />}
            <spotLight
                ref={spotLightRef}
                intensity={1}
                position={[15, 1, 2]}
                target={spotlightTarget}
            />
        </>
    );
}
