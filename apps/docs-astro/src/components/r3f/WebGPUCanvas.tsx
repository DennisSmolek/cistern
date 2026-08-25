import { Canvas, type CanvasProps } from '@react-three/fiber';
import React from 'react';

/**
 * WebGPUCanvas wraps the R3F v10 Canvas with WebGPU enabled.
 *
 * Fiber v10 initializes a WebGPURenderer itself when the `renderer` prop is
 * used (the v9-era async `gl` factory bootstrap is gone), and it registers and
 * types the whole three/webgpu namespace natively — no extend()/ThreeElements
 * augmentation needed here anymore.
 */

export type WebGPUCanvasProps = CanvasProps;

const WebGPUCanvas: React.FC<WebGPUCanvasProps> = ({ children, renderer, ...rest }) => (
    <Canvas shadows renderer={renderer ?? { antialias: true }} {...rest}>
        {children}
    </Canvas>
);

export default WebGPUCanvas;
