import * as THREE from 'three/webgpu';
import {
  Canvas,
  extend,
  type ThreeToJSXElements,
  type CanvasProps,
  useFrame,
} from '@react-three/fiber';
import React from 'react';

declare module '@react-three/fiber' {
  interface ThreeElements extends ThreeToJSXElements<typeof THREE> {
    // brand to keep the interface non-empty for linters/TS
    __webgpuBrand?: never;
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
extend(THREE as any);

/**
 *
 * WebGPUCanvas is a React component that wraps the R3F Canvas,
 * initializing it with a THREE.WebGPURenderer for WebGPU support.
 */

type WebGPUCanvasProps = CanvasProps;

const WebGPUCanvas: React.FC<WebGPUCanvasProps> = ({ children, ...rest }) => (
  <Canvas
    shadows
    {...rest}
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    gl={async (props: any) => {
      // Create a new WebGPURenderer and initialize it
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const renderer = new THREE.WebGPURenderer(props as any);
      await renderer.init();
      return renderer;
    }}
  >
    {children}
    <RendererHelper />
  </Canvas>
);

export default WebGPUCanvas;

// to help the weird renderer issues
const RendererHelper = () => {
  useFrame(({ gl, scene, camera }) => {
    gl.render(scene, camera);
  }, 1);

  return null;
};
