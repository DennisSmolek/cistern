import React, { useCallback, useEffect, useMemo } from 'react';
import type {} from '@react-three/fiber';
import { FrontSide, Mesh, MeshStandardMaterial, Vector2 } from 'three/webgpu';
import type { AdvancedConfig } from '@cistern/core';
import { CisternGeometry } from '@cistern/core';
import { ThreeElements } from '@react-three/fiber';

export type CisternMeshProps = Omit<ThreeElements['mesh'], 'ref'> & {
  ref?: React.RefObject<Mesh | null>;
  config?: AdvancedConfig | Readonly<AdvancedConfig>;
  onUpdate?: (params: { config: AdvancedConfig; points: Vector2[] }) => void;
  onConfigChange?: (config: AdvancedConfig) => void;
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
    ({ config, points }: { config: AdvancedConfig; points: Vector2[] }) => {
      if (onConfigChange) onConfigChange(config);
      if (onPointsChange) onPointsChange(points);
      if (onUpdate) onUpdate({ config, points });
    },
    [onConfigChange, onPointsChange, onUpdate],
  );

  useEffect(() => {
    if (!geometry) return;
    const { config: newConfig, points } = geometry.updateConfig(config as AdvancedConfig);
    handleUpdate({ config: newConfig, points });
    if (ref?.current) (ref.current.material as MeshStandardMaterial).needsUpdate = true;
  }, [config, geometry, ref, handleUpdate]);

  return (
    <mesh geometry={geometry} ref={ref} {...props}>
      <meshStandardMaterial color="pink" side={FrontSide} />
    </mesh>
  );
};
