import React, { useCallback, useEffect, useMemo } from 'react';
import type { JSX } from 'react';
import type {} from '@react-three/fiber';
import { Mesh, Vector2 } from 'three/webgpu';
import type { CisternConfig } from '@cistern/core';
import { CisternGeometry, CisternMaterial, withMat } from '@cistern/core';
import { ThreeElements } from '@react-three/fiber';
import { findMaterialChild } from '../utils';

declare module '@react-three/fiber' {
    interface ThreeElements {
        cisternMaterial: JSX.IntrinsicElements['meshStandardNodeMaterial'];
    }
}

export type CisternMeshProps = Omit<ThreeElements['mesh'], 'ref'> & {
    ref?: React.RefObject<Mesh | null>;
    config?: CisternConfig | Readonly<CisternConfig>;
    children?: React.ReactNode;
    onCisternUpdate?: (params: { config: CisternConfig; points: Vector2[] }) => void;
    onConfigChange?: (config: CisternConfig) => void;
    onPointsChange?: (points: Vector2[]) => void;
};

export const CisternMesh: React.FC<CisternMeshProps> = ({
    ref,
    config,
    onConfigChange,
    onPointsChange,
    onCisternUpdate,
    children,
    ...props
}) => {
    const geometry = useMemo(() => new CisternGeometry(), []);

    const handleUpdate = useCallback(
        ({ config, points }: { config: CisternConfig; points: Vector2[] }) => {
            if (onConfigChange) onConfigChange(config);
            if (onPointsChange) onPointsChange(points);
            if (onCisternUpdate) onCisternUpdate({ config, points });
        },
        [onConfigChange, onPointsChange, onCisternUpdate],
    );

    useEffect(() => {
        if (!geometry) return;
        const { config: newConfig, points } = geometry.updateConfig(config as CisternConfig);
        handleUpdate({ config: newConfig, points });

        withMat(ref, (m) => (m.needsUpdate = true));
    }, [config, geometry, ref, handleUpdate]);

    // see if we have a material in a child
    useEffect(() => {
        const childMaterial = findMaterialChild(children);
        if (!childMaterial && ref?.current) {
            console.log('No material found, adding default cistern material');
            ref.current.material = new CisternMaterial();
        }
    }, [children]);

    return (
        <mesh geometry={geometry} ref={ref} {...props}>
            {children}
        </mesh>
    );
};
