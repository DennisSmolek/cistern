import React, { useEffect, useRef } from 'react';
import type { Vector3 } from 'three/webgpu';
import type { AdvancedConfig } from '@cistern/core';
import { CameraControls, CameraControlsProps } from '@react-three/drei';
import { CisternCameraControls } from '@cistern/camera';

interface CisternCameraProps extends CameraControlsProps {
  cisternPosition?: Vector3;
  config?: AdvancedConfig;
  ref?: React.Ref<CisternCameraControls>;
}

// we use the custom IMPL with our cistern controls
export const CisternCamera = ({ cisternPosition, config, ref, ...props }: CisternCameraProps) => {
  // internally we will always have a ref
  const internalRef = useRef<CisternCameraControls>(null);

  // connect the external ref to the internal ref
  useEffect(() => {
    if (!ref) return;
    if (typeof ref === 'function') ref(internalRef.current);
    else ref.current = internalRef.current;
  }, [ref]);

  // update cistern position and config when they change
  useEffect(() => {
    if (internalRef.current && cisternPosition)
      internalRef.current.updateCisternPosition(cisternPosition);
  }, [cisternPosition]);

  useEffect(() => {
    if (internalRef.current && config) internalRef.current.updateConfig(config);
  }, [config]);

  return <CameraControls {...props} impl={CisternCameraControls} ref={internalRef} />;
};
