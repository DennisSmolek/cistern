// this is a little animated Cistern that sits on the pedestal
// ideally we will animate through config changes

import { CisternMesh } from '@cistern/r3f';
import { getConfig, CisternMaterial } from '@cistern/core';
import { extend } from '@react-three/fiber';

extend({ CisternMaterial });
import type { ThreeElements } from '@react-three/fiber';
import { useRef, useMemo } from 'react';
import type { Mesh } from 'three/webgpu';

//* ChangingCistern: Passes standard mesh props to Cistern
export const ChangingCistern = ({
  scale = 0.1,
  position,
  rotation,
  ref,
  ...props
}: ThreeElements['group']) => {
  const meshRef = useRef<Mesh>(null);
  const wireFrameRef = useRef<Mesh>(null);

  // right now just a single config
  const config = useMemo(() => getConfig(), []);

  return (
    <group scale={scale} position={position} rotation={rotation} {...props} ref={ref}>
      <CisternMesh ref={meshRef} config={config}>
        <meshStandardMaterial color="pink" />
      </CisternMesh>
      <CisternMesh {...props} ref={wireFrameRef} config={config}>
        <meshStandardMaterial color="black" wireframe transparent opacity={0.5} />
      </CisternMesh>
    </group>
  );
};

export default ChangingCistern;
