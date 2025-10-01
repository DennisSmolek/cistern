import React, { useEffect, useMemo, useRef } from 'react';
import type {} from '@react-three/fiber';
import { Mesh, Vector2, Vector3 } from 'three/webgpu';
import { ThreeElements } from '@react-three/fiber';
import { CisternMesh } from './CisternMesh';
import { CisternCamera } from './CisternCamera';
import type { CisternCameraControls } from '@cistern/camera';

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

  // because r3f does "VectorLike we need to get it after the update"
  const cisternPosition = useMemo(() => {
    if (!meshRef.current) return new Vector3(0, 0, 0);
    return meshRef.current.position;
  }, []);

  // memoize the config
  const memoizedConfig = useMemo(() => config, [config]);

  return (
    <>
      <CisternMesh
        ref={ref}
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
