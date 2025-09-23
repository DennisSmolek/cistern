import { useEffect, useMemo, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { CameraControls, Sphere } from '@react-three/drei';
import type { Mesh, SpotLight } from 'three/webgpu';
import { Object3D, Vector3, Vector2 } from 'three/webgpu';
import { Cistern, CisternCamera } from '@cistern/r3f';
import { ref, useSnapshot } from 'valtio';
import { controlState } from './control/controlState';
import { CisternMesh } from '@cistern/core';
import { ControlScene } from './control/ControlScene';
import { CisternCameraControls } from '@cistern/camera';

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
  const { activeConfig, overrideConfig } = useSnapshot(controlState);
  const actualConfig = activeConfig as AdvancedConfig;
  const cisternRef = useRef<CisternMesh | null>(null);
  const spotLightRef = useRef<SpotLight | null>(null);
  const controlsRef = useRef<CisternCameraControls | null>(null);

  const spotlightTarget = useMemo(() => {
    const target = new Object3D();
    target.position.set(25, 1, 2);
    return target;
  }, []);

  useEffect(() => {
    if (!cisternRef.current) return;
    const { points } = cisternRef.current.geometry.updateConfig(overrideConfig || actualConfig);
    const newVecs = points.map((point: Vector2) => new Vector3(point.x, point.y, 0));
    controlState.displayPoints = ref(newVecs);
  }, [actualConfig, overrideConfig]);

  return (
    <>
      <CisternCamera
        makeDefault
        ref={controlsRef}
        cisternPosition={new Vector3(0, 0, 0)}
        config={actualConfig}
      />
      <Cistern ref={cisternRef} config={activeConfig as AdvancedConfig} />
      <ControlScene />
      <AnimatedSphere />
      <spotLight ref={spotLightRef} intensity={1} position={[15, 1, 2]} target={spotlightTarget} />
    </>
  );
}
