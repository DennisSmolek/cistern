import { View } from "@wuhhh/view-webgpu";
import { CameraControls, Grid, PerspectiveCamera } from "@react-three/drei";
import { useControls } from "leva";
import Scene from "./components/Scene";
import WebGPUCanvas from "./components/WebGPUCanvas";

function App() {
    const { backgroundColor, gridSize, gridDivisions, showGrid } = useControls({
        backgroundColor: "#1a1a1a",
        gridSize: { value: 10, min: 5, max: 20 },
        gridDivisions: { value: 10, min: 5, max: 20 },
        showGrid: true,
    });

    return (
        <div style={{ width: "100vw", height: "100vh", position: "relative" }}>
            <WebGPUCanvas
                camera={{ position: [5, 5, 5], fov: 60 }}
                style={{
                    background: backgroundColor,
                    position: "absolute",
                    top: 0,
                    left: 0,
                    width: "100%",
                    height: "100%",
                    zIndex: 10,
                }}
                gl={{ antialias: true }}>
                <View.Port />
                <CameraControls makeDefault />
            </WebGPUCanvas>
            <View
                style={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    width: "100%",
                    height: "100%",
                    zIndex: 1,
                }}>
                {/* Lighting */}
                <ambientLight intensity={0.6} />
                <directionalLight position={[10, 10, 5]} intensity={1} />
                <pointLight position={[-10, -10, -10]} intensity={0.5} />

                {/* Grid */}

                {/* Camera Controls */}

                <Scene />
            </View>
            <View
                index={2}
                style={{
                    position: "absolute",
                    top: "10px",
                    left: "10px",
                    width: "150px",
                    height: "150px",
                    background: "lightblue",
                    zIndex: 1,
                }}>
                <ambientLight intensity={0.4} />
                <directionalLight position={[5, 5, 5]} intensity={1.0} />
                <mesh>
                    <boxGeometry />
                    <meshStandardMaterial color='orange' />
                </mesh>
            </View>
        </div>
    );
}

export default App;
