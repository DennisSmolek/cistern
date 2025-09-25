import { useEffect, useMemo, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { Backdrop, CameraControls, Sphere } from '@react-three/drei';
import type { Mesh, SpotLight, Group } from 'three/webgpu';
import { Object3D, Vector3, Vector2 } from 'three/webgpu';
import { Cistern, CisternCamera } from '@cistern/r3f';
import { ref, useSnapshot } from 'valtio';
import { controlState } from './control/controlState';
import { CisternMesh } from '@cistern/core';
import { ControlScene } from './control/ControlScene';
import { CisternCameraControls } from '@cistern/camera';
import { useControls } from 'leva';
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
  const { activeConfig, overrideConfig } = useSnapshot(controlState);
  const actualConfig = activeConfig as AdvancedConfig;
  const cisternRef = useRef<CisternMesh | null>(null);
  const spotLightRef = useRef<SpotLight | null>(null);
  const controlsRef = useRef<CisternCameraControls | null>(null);
  const wrappingRef = useRef<Group | null>(null);

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

  // lock/unlock the camera
  const { lockCamera } = useControls({
    lockCamera: false,
  });

  // move the camera to where we want
  useEffect(() => {
    if (!controlsRef.current) return;
    const controls = controlsRef.current as CisternCameraControls;
    controlsRef.current.setLookAt(41, 50, 20, 21, 20, 0);
  }, []);
  useEffect(() => {
    if (!controlsRef.current) return;
    controlsRef.current.setCollision(lockCamera);
  }, [lockCamera]);

  return (
    <>
      <CisternCamera
        makeDefault
        ref={controlsRef}
        cisternPosition={new Vector3(0, 0, 0)}
        config={actualConfig}
      />
      <Lights />
      <group ref={wrappingRef}>
        <Cistern
          castShadow
          receiveShadow
          ref={cisternRef}
          config={activeConfig as AdvancedConfig}
        />
        <mesh position={[41, 5, 0]} visible={false}>
          <boxGeometry args={[40, 10, 40]} />
          <meshStandardMaterial color="blue" />
        </mesh>
        <Suzi position={[41, 5, 0]} scale={10} />
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
      <mesh position={[0, 0.5, 0]} receiveShadow rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[100, 100]} />
        <meshStandardMaterial color="orange" />
      </mesh>

      <ControlScene />
      <AnimatedSphere />
    </>
  );
}
