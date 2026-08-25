import React, { useEffect, useMemo, useRef, useState } from 'react';
import type {} from '@react-three/fiber';
import { Mesh, Vector2, Vector3 } from 'three/webgpu';
import { ThreeElements } from '@react-three/fiber';
import { CisternMesh } from './CisternMesh';
import { CisternCamera } from './CisternCamera';
import type { CisternCameraControls } from '@cistern/camera';
import type { CisternConfig } from '@cistern/core';

export type CisternProps = Omit<ThreeElements['mesh'], 'ref'> & {
  ref?: React.RefObject<Mesh | null>;
  config?: CisternConfig | Readonly<CisternConfig>;
  onCisternUpdate?: (params: { config: CisternConfig; points: Vector2[] }) => void;
  onConfigChange?: (config: CisternConfig) => void;
  onPointsChange?: (points: Vector2[]) => void;
  useCamera?: boolean;
  children?: React.ReactNode;
};

export const Cistern: React.FC<CisternProps> = ({
  ref,
  config,
  onConfigChange,
  onPointsChange,
  onCisternUpdate,
  useCamera = true,
  children,
  ...props
}) => {
  const controlsRef = useRef<CisternCameraControls | null>(null);
  const meshRef = useRef<Mesh | null>(null);

  // move the camera to where we want
  useEffect(() => {
    if (!controlsRef.current) return;
    console.log('controlsRef.current', controlsRef.current);
    // const controls = controlsRef.current as CisternCameraControls;
    //controlsRef.current.setLookAt(41, 50, 20, 21, 20, 0);
  }, []);

  // forward the mesh to the caller's ref while keeping our own
  useEffect(() => {
    if (ref) ref.current = meshRef.current;
  });

  // because r3f does "VectorLike we need to get it after the update":
  // read the live position vector once the mesh exists (three mutates it in
  // place, so the reference stays current)
  const [cisternPosition, setCisternPosition] = useState(() => new Vector3(0, 0, 0));
  useEffect(() => {
    if (meshRef.current) setCisternPosition(meshRef.current.position);
  }, []);

  // memoize the config
  const memoizedConfig = useMemo(() => config, [config]);

  return (
    <>
      <CisternMesh
        ref={meshRef}
        {...props}
        config={memoizedConfig}
        onConfigChange={onConfigChange}
        onPointsChange={onPointsChange}
        onCisternUpdate={onCisternUpdate}
      >
        {children}
      </CisternMesh>
      {useCamera && (
        <CisternCamera
          makeDefault
          ref={controlsRef}
          cisternPosition={cisternPosition}
          config={memoizedConfig}
        />
      )}
    </>
  );
};
