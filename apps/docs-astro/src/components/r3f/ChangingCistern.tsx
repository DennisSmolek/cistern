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
import { CisternFrame } from './CisternFrame';

//* ChangingCistern: Passes standard mesh props to Cistern
export const ChangingCistern = ({
  scale = 0.1,
  position,
  rotation,
  ref,
  ...props
}: ThreeElements['group']) => {
  const meshRef = useRef<Mesh>(null);

  // right now just a single config
  const config = useMemo(() => getConfig(), []);

  //* Isolation toggles + frame density, so the shell and the lines can be
  //* judged (and tuned) independently under the temporal upscaler.
  const { solid, frame, meridians, rings, linewidth, lineColor } = useControls(
    'Changing Cistern',
    {
      solid: { label: 'Solid mesh', value: true },
      frame: { label: 'Frame lines', value: true },
      meridians: { label: 'Meridians', value: 8, min: 0, max: 32, step: 1 },
      // 3 = widest point + top + bottom; raise it for section boundaries.
      rings: { label: 'Rings', value: 3, min: 0, max: 8, step: 1 },
      linewidth: { label: 'Line width (px)', value: 2, min: 1, max: 6, step: 0.5 },
      lineColor: { label: 'Line color', value: palette.frameLine },
    },
    { collapsed: true },
  );

  return (
    <group scale={scale} position={position} rotation={rotation} {...props} ref={ref}>
      <CisternMesh ref={meshRef} config={config} visible={solid}>
        <meshStandardMaterial color={palette.complementSoft} />
      </CisternMesh>
      {/* Sparse fat-line frame rather than `wireframe: true` — see CisternFrame
          for why the full lattice can't survive a 1/2-res temporal upscale.
          Sits proud of the shell by construction (it traces the profile), so
          it needs no depth bias. */}
      {frame && (
        <CisternFrame
          config={config}
          meridians={meridians}
          rings={rings}
          linewidth={linewidth}
          color={lineColor}
        />
      )}
    </group>
  );
};

export default ChangingCistern;
