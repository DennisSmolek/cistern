import { View } from '@wuhhh/view-webgpu';
import { CameraControls } from '@react-three/drei';
import { useControls } from 'leva';
import Scene from './components/Scene';
import WebGPUCanvas from './components/WebGPUCanvas';
import { DotVisualizer } from './components/control/DotsVisualizer';
import { CisternCamera } from '@cistern/r3f';

function App() {
  const { backgroundColor } = useControls({
    backgroundColor: '#1a1a1a',
  });

  return (
    <div style={{ width: '100vw', height: '100vh', position: 'relative' }}>
      <WebGPUCanvas
        camera={{ position: [5, 5, 5], fov: 60 }}
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
        <View.Port />
      </WebGPUCanvas>
      <View
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          zIndex: 100,
        }}
      >
        {/* Lighting */}
        <ambientLight intensity={0.6} />
        <directionalLight position={[10, 10, 5]} intensity={1} />
        <pointLight position={[-10, -10, -10]} intensity={0.5} />

        {/* Grid */}

        {/* Camera Controls */}
        <DotVisualizer />

        <Scene />
      </View>
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
      >
        <ambientLight intensity={0.4} />
        <directionalLight position={[5, 5, 5]} intensity={1.0} />
      </View>
    </div>
  );
}

export default App;
