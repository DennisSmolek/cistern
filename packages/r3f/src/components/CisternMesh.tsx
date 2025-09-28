import React, { useCallback, useEffect, useMemo } from 'react';
import type { JSX } from 'react';
import type {} from '@react-three/fiber';
import {
  FrontSide,
  Mesh,
  MeshStandardMaterial,
  MeshStandardNodeMaterial,
  Vector2,
} from 'three/webgpu';
import type { CisternConfig } from '@cistern/core';
import { CisternGeometry } from '@cistern/core';
import { extend, ThreeElements } from '@react-three/fiber';
import { CisternMaterial } from '@cistern/core';

extend({ CisternMaterial });

declare module '@react-three/fiber' {
  interface ThreeElements {
    cisternMaterial: JSX.IntrinsicElements['meshStandardNodeMaterial'];
  }
}

export type CisternMeshProps = Omit<ThreeElements['mesh'], 'ref'> & {
  ref?: React.RefObject<Mesh | null>;
  config?: CisternConfig | Readonly<CisternConfig>;
  onUpdate?: (params: { config: CisternConfig; points: Vector2[] }) => void;
  onConfigChange?: (config: CisternConfig) => void;
  onPointsChange?: (points: Vector2[]) => void;
};

export const CisternMesh: React.FC<CisternMeshProps> = ({
  ref,
  config,
  onConfigChange,
  onPointsChange,
  onUpdate,
  ...props
}) => {
  const geometry = useMemo(() => new CisternGeometry(), []);

  const handleUpdate = useCallback(
    ({ config, points }: { config: CisternConfig; points: Vector2[] }) => {
      if (onConfigChange) onConfigChange(config);
      if (onPointsChange) onPointsChange(points);
      if (onUpdate) onUpdate({ config, points });
    },
    [onConfigChange, onPointsChange, onUpdate],
  );

  useEffect(() => {
    if (!geometry) return;
    const { config: newConfig, points } = geometry.updateConfig(config as CisternConfig);
    handleUpdate({ config: newConfig, points });
    if (!ref?.current) return;
    const material = ref.current.material as MeshStandardNodeMaterial;
    if (!material) return;
    material.needsUpdate = true;
    // lets see if we can get output nodes
    console.log('material', material);
  }, [config, geometry, ref, handleUpdate]);

  return (
    <mesh geometry={geometry} ref={ref} {...props}>
      <cisternMaterial color="pink" />
    </mesh>
  );
};
