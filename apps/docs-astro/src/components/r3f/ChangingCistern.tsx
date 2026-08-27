// this is a little animated Cistern that sits on the pedestal
// ideally we will animate through config changes

import { CisternMesh } from '@cistern/r3f';
import { getConfig, CisternMaterial } from '@cistern/core';
import { extend } from '@react-three/fiber';

extend({ CisternMaterial });
import type { ThreeElements } from '@react-three/fiber';
import { useRef, useMemo } from 'react';
import { useControls } from 'leva';
import type { Mesh } from 'three/webgpu';
import { palette } from '../home/palette';

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

  //* Isolation toggles — the two meshes are coincident, so being able to kill
  //* one is the only way to tell whose shading is misbehaving.
  const { solid, wireframe } = useControls(
    'Changing Cistern',
    {
      solid: { label: 'Solid mesh', value: true },
      wireframe: { label: 'Wireframe', value: true },
    },
    { collapsed: true },
  );

  return (
    <group scale={scale} position={position} rotation={rotation} {...props} ref={ref}>
      <CisternMesh ref={meshRef} config={config} visible={solid}>
        <meshStandardMaterial color={palette.complementSoft} />
      </CisternMesh>
      {/* Coincident with the solid shell above, so it needs a depth bias, or
          the depth test picks a winner per pixel and the lines show whatever
          the shell is doing. polygonOffset biases depth only, not position.
          Opaque + unlit on purpose: `transparent` never blends in the MRT pass
          anyway (mrt() defaults every attachment to NoBlending), and a lit
          black line still carries dielectric specular that aliases at 1px. */}
      <CisternMesh ref={wireFrameRef} config={config} visible={wireframe}>
        <meshBasicMaterial
          color="black"
          wireframe
          polygonOffset
          polygonOffsetFactor={-2}
          polygonOffsetUnits={-4}
        />
      </CisternMesh>
    </group>
  );
};

export default ChangingCistern;
