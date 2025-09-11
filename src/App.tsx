import { Canvas } from '@react-three/fiber'
import { OrbitControls, Grid } from '@react-three/drei'
import { useControls } from 'leva'
import Scene from './components/Scene'

function App() {
  const { 
    backgroundColor,
    gridSize,
    gridDivisions,
    showGrid
  } = useControls({
    backgroundColor: '#1a1a1a',
    gridSize: { value: 10, min: 5, max: 20 },
    gridDivisions: { value: 10, min: 5, max: 20 },
    showGrid: true
  })

  return (
    <div style={{ width: '100vw', height: '100vh' }}>
      <Canvas
        camera={{ position: [5, 5, 5], fov: 60 }}
        style={{ background: backgroundColor }}
        gl={{ antialias: true }}
      >
        {/* Lighting */}
        <ambientLight intensity={0.6} />
        <directionalLight position={[10, 10, 5]} intensity={1} />
        <pointLight position={[-10, -10, -10]} intensity={0.5} />
        
        {/* Grid */}
        {showGrid && (
          <Grid
            args={[gridSize, gridDivisions]}
            position={[0, -1, 0]}
            rotation={[-Math.PI / 2, 0, 0]}
          />
        )}
        
        {/* Camera Controls */}
        <OrbitControls 
          enablePan={true}
          enableZoom={true}
          enableRotate={true}
          minDistance={3}
          maxDistance={20}
        />
        
        {/* Scene Content */}
        <Scene />
      </Canvas>
    </div>
  )
}

export default App