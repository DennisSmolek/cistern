import * as THREE from 'three/webgpu';
import * as React from 'react';
import { type ThreeElements, useFrame, useThree, extend } from '@react-three/fiber';
import type { ForwardRefExoticComponent, PropsWithoutRef, RefAttributes } from 'react';
import { SimpleWebGPUProgressiveLightMap } from './progressivelm';
import { ShadowNodeMaterial } from './shadowNodeMaterial';

// extend here so we know it imported
// Named to avoid colliding with three/webgpu's own ShadowNodeMaterial export,
// which ThreeToJSXElements maps to <shadowNodeMaterial>
extend({ CisternShadowMaterial: ShadowNodeMaterial });

declare module '@react-three/fiber' {
    interface ThreeElements {
        cisternShadowMaterial: ThreeElements['meshPhongMaterial'] & {
            blend?: number;
        };
    }
}

export type ForwardRefComponent<P, T> = ForwardRefExoticComponent<
  PropsWithoutRef<P> & RefAttributes<T>
>;

export type AccumulativeShadowsProps = Omit<ThreeElements['group'], 'ref'> & {
  /** How many frames it can render, more yields cleaner results but takes more time, 40 */
  frames?: number;
  /** If frames === Infinity blend controls the refresh ratio, 100 */
  blend?: number;
  /** Can limit the amount of frames rendered if frames === Infinity, usually to get some performance back once a movable scene has settled, Infinity */
  limit?: number;
  /** Scale of the plane,  */
  scale?: number;
  /** Temporal accumulates shadows over time which is more performant but has a visual regression over instant results, false  */
  temporal?: boolean;
  /** Opacity of the plane, 1 */
  opacity?: number;
  /** Discards alpha pixels, 0.65 */
  alphaTest?: number;
  /** Shadow color, black */
  color?: string;
  /** Colorblend, how much colors turn to black, 0 is black, 2 */
  colorBlend?: number;
  /** Buffer resolution, 1024 */
  resolution?: number;
  /** Texture tonemapping */
  toneMapped?: boolean;
};

interface AccumulativeContext {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  lights: Map<any, any>;
  temporal: boolean;
  frames: number;
  blend: number;
  count: number;
  /** Returns the plane geometry onto which the shadow is cast */
  getMesh: () => THREE.Mesh<THREE.PlaneGeometry, THREE.MeshPhongMaterial>;
  /** Resets the buffers, starting from scratch */
  reset: () => void;
  /** Updates the lightmap for a number of frames accumulartively */
  update: (frames?: number) => void;
}

export const accumulativeContext = /* @__PURE__ */ React.createContext<AccumulativeContext>(
  null as unknown as AccumulativeContext,
);

export const AccumulativeShadows: ForwardRefComponent<
  AccumulativeShadowsProps,
  AccumulativeContext
> = /* @__PURE__ */ React.forwardRef(
  (
    {
      children,
      temporal,
      frames = 40,
      limit = Infinity,
      blend = 20,
      scale = 10,
      opacity = 1,
      alphaTest = 0.75,
      color = 'black',
      colorBlend = 2,
      resolution = 1024,
      toneMapped = true,
      ...props
    },
    forwardRef,
  ) => {
    const gl = useThree((state) => state.renderer as unknown as THREE.WebGPURenderer);
    const scene = useThree((state) => state.scene);
    const camera = useThree((state) => state.camera);
    const invalidate = useThree((state) => state.invalidate);
    const gPlane = React.useRef<THREE.Mesh<THREE.PlaneGeometry, THREE.MeshPhongMaterial>>(null!);
    const gLights = React.useRef<THREE.Group>(null!);

    const [plm] = React.useState(() => new SimpleWebGPUProgressiveLightMap(gl, scene, resolution));
    React.useLayoutEffect(() => {
      plm.configure(gPlane.current);
    }, []);

    const api = React.useMemo<AccumulativeContext>(
      () => ({
        lights: new Map(),
        temporal: !!temporal,
        frames: Math.max(2, frames),
        blend: Math.max(2, frames === Infinity ? blend : frames),
        count: 0,
        getMesh: () => gPlane.current,
        reset: () => {
          // Clear buffers, reset opacities, set frame count to 0
          plm.clear();
          const material = gPlane.current.material;
          material.opacity = 0;
          material.alphaTest = 0;
          api.count = 0;
        },
        update: (frames = 1) => {
          // Adapt the opacity-blend ratio to the number of frames
          const material = gPlane.current.material;
          if (!api.temporal) {
            material.opacity = opacity;
            material.alphaTest = alphaTest;
          } else {
            material.opacity = Math.min(opacity, material.opacity + opacity / api.blend);
            material.alphaTest = Math.min(alphaTest, material.alphaTest + alphaTest / api.blend);
          }

          // Switch accumulative lights on
          gLights.current.visible = true;
          // Collect scene lights and meshes
          plm.prepare();

          // Update the lightmap and the accumulative lights
          for (let i = 0; i < frames; i++) {
            api.lights.forEach((light) => light.update());
            plm.update(camera, api.blend);
          }
          // Switch lights off
          gLights.current.visible = false;
          // Restore lights and meshes
          plm.finish();
        },
      }),
      [plm, camera, scene, temporal, frames, blend, opacity, alphaTest],
    );

    React.useLayoutEffect(() => {
      // Reset internals, buffers, ...
      api.reset();
      // Update lightmap
      if (!api.temporal && api.frames !== Infinity) api.update(api.blend);
    });

    // Expose api, allow children to set itself as the main light source
    React.useImperativeHandle(forwardRef, () => api, [api]);

    useFrame(() => {
      if (
        (api.temporal || api.frames === Infinity) &&
        api.count < api.frames &&
        api.count < limit
      ) {
        invalidate();
        api.update();
        api.count++;
      }
    });

    return (
      <group {...props}>
        <group traverse={() => null} ref={gLights}>
          <accumulativeContext.Provider value={api}>{children}</accumulativeContext.Provider>
        </group>
        <mesh receiveShadow ref={gPlane} scale={scale} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry />
          <cisternShadowMaterial
            transparent
            depthWrite={false}
            toneMapped={toneMapped}
            color={color}
            blend={colorBlend}
            map={plm.renderTargets.second!.texture}
          />
        </mesh>
      </group>
    );
  },
);
