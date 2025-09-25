import { useSnapshot } from "valtio";
import { controlState } from "./controlState";
import { ControlPoint } from "./ControlPoint";
import { useEffect, useState } from "react";
import * as THREE from "three/webgpu";
import { Line } from "../Line";
import { Vector3 } from "three/webgpu";

export const DotVisualizer = () => {
    const { displayPoints } = useSnapshot(controlState);
    const [localPoints, setLocalPoints] = useState<THREE.Vector3[]>([]);
    // convert simple array points to three Vec3

    // TODO remove all of this
    useEffect(() => {
        // convert vector2 array to vector3 array
        if (!displayPoints) return;

        setLocalPoints(displayPoints as Vector3[]);
    }, [displayPoints]);
    if (localPoints.length)
        return (
            <group>
                {localPoints.map((point, index) => (
                    <ControlPoint key={index} position={point} />
                ))}
                {localPoints.length > 1 && (
                    <Line points={localPoints} color='blue' />
                )}
            </group>
        );
};
