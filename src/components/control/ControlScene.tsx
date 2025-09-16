import { useSnapshot } from "valtio";
import { controlState } from "./controlState";
import { ControlPoint } from "./ControlPoint";
import { useCallback, useEffect, useState } from "react";
import * as THREE from "three/webgpu";
import { Line } from "../Line";

export const ControlScene = () => {
    const { points } = useSnapshot(controlState);
    const [localPoints, setLocalPoints] = useState<THREE.Vector3[]>([]);
    // convert simple array points to three Vec3
    const arrayToVecs = useCallback((points: readonly [number, number][]) => {
        return points.map((point) => new THREE.Vector3(...point));
    }, []);
    useEffect(() => {
        const vecs = arrayToVecs(points as readonly [number, number][]);
        console.log("vecs", vecs);
        setLocalPoints(vecs);
    }, [points, arrayToVecs]);

    // make changes to the config

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
