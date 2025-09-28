import React, { useEffect, useRef, useImperativeHandle } from 'react';
import type { Vector3 } from 'three/webgpu';
import type { CisternConfig } from '@cistern/core';
import { CameraControls, CameraControlsProps } from '@react-three/drei';
import { CisternCameraControls } from '@cistern/camera';

interface CisternCameraProps extends CameraControlsProps {
  cisternPosition?: Vector3;
  config?: CisternConfig;
  ref?: React.Ref<CisternCameraControls>;
  collision?: boolean;
}

// we use the custom IMPL with our cistern controls
export const CisternCamera = ({
  cisternPosition,
  config,
  ref,
  collision,
  ...props
}: CisternCameraProps) => {
  // internally we will always have a ref
  const internalRef = useRef<CisternCameraControls>(null);

  // use imperative handle to expose the internal ref to parent components
  useImperativeHandle(ref, () => internalRef.current!, []);

  // update cistern position and config when they change
  useEffect(() => {
    if (internalRef.current && cisternPosition)
      internalRef.current.updateCisternPosition(cisternPosition);
  }, [cisternPosition]);

  useEffect(() => {
    if (internalRef.current && config) internalRef.current.updateConfig(config);
  }, [config]);

  // Collision
  useEffect(() => {
    if (internalRef.current && collision) internalRef.current.setCollision(collision);
  }, [collision]);

  return <CameraControls {...props} impl={CisternCameraControls} ref={internalRef} />;
};
