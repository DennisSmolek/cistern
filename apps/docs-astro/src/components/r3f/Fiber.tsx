import { useControls } from 'leva';
import Scene from './Scene';
import WebGPUCanvas from './WebGPUCanvas';
import { DotVisualizer } from './control/DotsVisualizer';
import { PPDemo } from './postprocessing/PPDemo';

export default function Fiber() {
    const { backgroundColor } = useControls({
        backgroundColor: '#1a1a1a',
    });

    return (
        <div style={{ width: '100vw', height: '100vh', position: 'relative' }}>
            <WebGPUCanvas
                camera={{ position: [4, 2, 9], fov: 60 }}
                style={{
                    background: backgroundColor,
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: '100%',
                    zIndex: 10,
                }}
                renderer={{ antialias: true }}
            >
                {/* Camera Controls */}
                <DotVisualizer />

                <Scene />
                <PPDemo />
            </WebGPUCanvas>
        </div>
    );
}
