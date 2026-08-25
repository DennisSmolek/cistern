import type { ForwardRefExoticComponent, PropsWithoutRef, RefAttributes } from 'react';
import * as React from 'react';
import * as THREE from 'three/webgpu';
import { type ThreeElements } from '@react-three/fiber';
import { accumulativeContext } from './AccumulativeShadowsWebGPU';

export type ForwardRefComponent<P, T> = ForwardRefExoticComponent<
  PropsWithoutRef<P> & RefAttributes<T>
>;

export type RandomizedLightProps = Omit<ThreeElements['group'], 'ref'> & {
  /** How many frames it will jiggle the lights, 1.
   *  Frames is context aware, if a provider like AccumulativeShadows exists, frames will be taken from there!  */
  frames?: number;
  /** Light position, [0, 0, 0] */
  position?: [x: number, y: number, z: number];
  /** Radius of the jiggle, higher values make softer light, 5 */
  radius?: number;
  /** Amount of lights, 8 */
  amount?: number;
  /** Light intensity, 1 */
  intensity?: number;
  /** Ambient occlusion, lower values mean less AO, hight more, you can mix AO and directional light, 0.5 */
  ambient?: number;
  /** If the lights cast shadows, this is true by default */
  castShadow?: boolean;
  /** Default shadow bias, 0 */
  bias?: number;
  /** Default map size, 512 */
  mapSize?: number;
  /** Default size of the shadow camera, 10 */
  size?: number;
  /** Default shadow camera near, 0.5 */
  near?: number;
  /** Default shadow camera far, 500 */
  far?: number;
};

interface AccumulativeLightContext {
  /** Jiggles the lights */
  update: () => void;
}

export const RandomizedLight: ForwardRefComponent<RandomizedLightProps, AccumulativeLightContext> =
  /* @__PURE__ */ React.forwardRef(
    (
      {
        castShadow = true,
        bias = 0.001,
        mapSize = 512,
        size = 5,
        near = 0.5,
        far = 500,
        frames: _frames = 1,
        position = [0, 0, 0],
        radius = 1,
        amount = 8,
        intensity = Math.PI,
        ambient = 0.5,
        ...props
      },
      forwardRef,
    ) => {
      const gLights = React.useRef<THREE.Group>(null!);
      const length = new THREE.Vector3(...position).length();
      const parent = React.useContext(accumulativeContext);

      const update = React.useCallback(() => {
        let light: THREE.Object3D | undefined;
        if (gLights.current) {
          for (let l = 0; l < gLights.current.children.length; l++) {
            light = gLights.current.children[l];
            if (Math.random() > ambient) {
              light.position.set(
                position[0] + THREE.MathUtils.randFloatSpread(radius),
                position[1] + THREE.MathUtils.randFloatSpread(radius),
                position[2] + THREE.MathUtils.randFloatSpread(radius),
              );
            } else {
              const lambda = Math.acos(2 * Math.random() - 1) - Math.PI / 2.0;
              const phi = 2 * Math.PI * Math.random();
              light.position.set(
                Math.cos(lambda) * Math.cos(phi) * length,
                Math.abs(Math.cos(lambda) * Math.sin(phi) * length),
                Math.sin(lambda) * length,
              );
            }
          }
        }
      }, [radius, ambient, length, ...position]);

      const api: AccumulativeLightContext = React.useMemo(() => ({ update }), [update]);
      React.useImperativeHandle(forwardRef, () => api, [api]);
      React.useLayoutEffect(() => {
        const group = gLights.current;
        if (parent) parent.lights?.set(group.uuid, api);
        return () => void parent?.lights?.delete(group.uuid);
      }, [parent, api]);

      return (
        <group ref={gLights} {...props}>
          {Array.from({ length: amount }, (_, index) => (
            <directionalLight
              key={index}
              castShadow={castShadow}
              shadow-bias={bias}
              shadow-mapSize={[mapSize, mapSize]}
              intensity={intensity / amount}
            >
              <orthographicCamera
                attach="shadow-camera"
                args={[-size, size, size, -size, near, far]}
              />
            </directionalLight>
          ))}
        </group>
      );
    },
  );
