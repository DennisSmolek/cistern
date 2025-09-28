import { useEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Backdrop, Sphere } from '@react-three/drei';
import type { Mesh, Group } from 'three/webgpu';
import { Vector3, Vector2 } from 'three/webgpu';
import { Cistern } from '@cistern/r3f';
import { ref, useSnapshot } from 'valtio';
import { controlState } from './control/controlState';
import { ControlScene } from './control/ControlScene';
import { Suzi } from './Suzi';
import { Lights } from './Lights';

function AnimatedSphere() {
  const meshRef = useRef<Mesh>(null);

  const position: [number, number, number] = [0, 2, 0];
  const color = '#4ecdc4';
  const floatSpeed = 2;
  const floatHeight = 1;

  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.position.y =
        position[1] + Math.sin(state.clock.elapsedTime * floatSpeed) * floatHeight;
    }
  });

  return (
    <Sphere ref={meshRef} position={position} args={[0.5, 32, 32]}>
      <meshStandardMaterial color={color} />
    </Sphere>
  );
}

export default function Scene() {
  const { overrideConfig } = useSnapshot(controlState);
  const cisternRef = useRef<Mesh | null>(null);
  const wrappingRef = useRef<Group | null>(null);

  // on init we might have the base config but later its the update config
  const finalConfig: AdvancedConfig = useMemo(() => {
    return overrideConfig as AdvancedConfig;
  }, [overrideConfig]);

  const handleConfigChange = (config: AdvancedConfig) => {
    if (!cisternRef.current) return;
    controlState.activeConfig = config;
  };

  const handlePointsChange = (points: Vector2[]) => {
    const newVecs = points.map((point: Vector2) => new Vector3(point.x, point.y, 0));
    controlState.displayPoints = ref(newVecs);
  };

  return (
    <>
      <Lights />
      <group ref={wrappingRef}>
        <Cistern
          receiveShadow
          ref={cisternRef}
          config={finalConfig}
          onConfigChange={handleConfigChange}
          onPointsChange={handlePointsChange}
        />
        <mesh position={[41, 5, 0]} visible={false}>
          <boxGeometry args={[40, 10, 40]} />
          <meshStandardMaterial color="blue" />
        </mesh>
        <Suzi position={[0, 5, 0]} scale={2} />
      </group>
      <Backdrop
        receiveShadow
        floor={5}
        segments={100}
        position={[0, -0.25, -150]}
        scale={[1800, 100, 100]}
      >
        <meshStandardMaterial color="blue" />
      </Backdrop>

      <ControlScene />
      <AnimatedSphere />
    </>
  );
}
