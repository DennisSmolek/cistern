import { useControls } from 'leva';
import Scene from './Scene';
import WebGPUCanvas from './WebGPUCanvas';
import { DotVisualizer } from './control/DotsVisualizer';
import { FSRPipeline } from './postprocessing/FSRPipeline';
import { CameraRig } from '../home/CameraRig';
import { palette } from '../home/palette';

export default function Fiber() {
    const { backgroundColor } = useControls('Scene', {
        backgroundColor: palette.primaryDark,
    });

    return (
        <WebGPUCanvas
            camera={{ position: [4, 2, 9], fov: 60 }}
            style={{
                background: backgroundColor,
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
            }}
            // FSR3 is the anti-aliasing — no MSAA.
            renderer={{ antialias: false }}
        >
            <DotVisualizer />
            <CameraRig />

            <Scene />
            <FSRPipeline />
        </WebGPUCanvas>
    );
}
