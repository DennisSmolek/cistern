import { View } from '@wuhhh/view-webgpu';
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
                gl={{ antialias: true }}
            >
                {/* <View.Port /> */}

                {/* Camera Controls */}
                <DotVisualizer />

                <Scene />
                <PPDemo />
            </WebGPUCanvas>
            <View
                index={2}
                style={{
                    position: 'absolute',
                    top: '10px',
                    left: '10px',
                    width: '150px',
                    height: '150px',
                    background: 'lightblue',
                    zIndex: 1,
                }}
            ></View>
        </div>
    );
}
