import { useMemo, useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { Backdrop, Sphere } from '@react-three/drei';
import type { Mesh, Group } from 'three/webgpu';
import { Vector3, Vector2 } from 'three/webgpu';
import { Cistern } from '@cistern/r3f';
import type { CisternConfig } from '@cistern/core';
import { ref, useSnapshot } from 'valtio';
import { controlState } from './control/controlState';
import { sceneRefs } from '../home/homeState';
import { ControlScene } from './control/ControlScene';
import { Suzi } from './Suzi';
import { Lights } from './Lights';
import { useControls } from 'leva';
import { ChangingCistern } from './ChangingCistern';

function AnimatedSphere() {
  const meshRef = useRef<Mesh>(null);

  const position: [number, number, number] = [0, 2, 0];
  const color = '#4ecdc4';
  const floatSpeed = 2;
  const floatHeight = 1;

  useFrame(({ elapsed }) => {
    if (meshRef.current) {
      meshRef.current.position.y =
        position[1] + Math.sin(elapsed * floatSpeed) * floatHeight;
    }
  });

  return (
    <Sphere ref={meshRef} castShadow position={position} args={[0.5, 32, 32]}>
      <meshStandardMaterial color={color} />
    </Sphere>
  );
}

export default function Scene() {
  const { overrideConfig } = useSnapshot(controlState);
  const [pedestalHeight, setPedestalHeight] = useState(0);
  const cisternRef = useRef<Mesh | null>(null);
  const wrappingRef = useRef<Group | null>(null);

  // on init we might have the base config but later its the update config
  const finalConfig: CisternConfig = useMemo(() => {
    return overrideConfig as CisternConfig;
  }, [overrideConfig]);

  const handleConfigChange = (config: CisternConfig) => {
    if (!cisternRef.current) return;
    sceneRefs.cistern = cisternRef.current;
    controlState.activeConfig = config;
    const newHeight = config.pedestal?.height ?? 0;
    if (newHeight !== pedestalHeight) {
      setPedestalHeight(newHeight);
    }
  };

  const handlePointsChange = (points: Vector2[]) => {
    const newVecs = points.map((point: Vector2) => new Vector3(point.x, point.y, 0));
    controlState.displayPoints = ref(newVecs);
  };

  const { suziRotation } = useControls(
    'Suzi',
    {
      suziRotation: {
        label: 'Rotation',
        value: [0, 0, 0],
      },
    },
    { collapsed: true },
  );

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
        <group position-x={pedestalHeight}>
          <group rotation={suziRotation}>
            <Suzi position={[2, 1, 0]} scale={1.5} />
          </group>
          <ChangingCistern position={[-2, 0.27, 0]} />
          <AnimatedSphere />
        </group>
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
    </>
  );
}
