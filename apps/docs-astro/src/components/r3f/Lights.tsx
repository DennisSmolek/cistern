import { useRef, type RefObject } from 'react';
import { DirectionalLight, Group, SpotLight, PointLight, Object3D } from 'three/webgpu';
import { DirectionalLightHelper, SpotLightHelper, PointLightHelper } from 'three/webgpu';
import { useControls } from 'leva';
import { Environment, useHelper } from '@react-three/drei';

type EnvironmentPreset =
  | 'city'
  | 'sunset'
  | 'warehouse'
  | 'forest'
  | 'apartment'
  | 'park'
  | 'studio'
  | 'dawn'
  | 'lobby'
  | 'night';

export const Lights = () => {
  const lightTarget1Ref = useRef<Group>(null);
  const lightTarget2Ref = useRef<Group>(null);
  const directionalLightRef = useRef<DirectionalLight>(null);
  const spot1Ref = useRef<SpotLight>(null);
  const spot2Ref = useRef<SpotLight>(null);
  const pointRef = useRef<PointLight>(null);

  // Narrow ref types for useHelper's expected RefObject<Object3D>
  const asObject3DRef = <T extends Object3D>(ref: RefObject<T | null>) =>
    ref as unknown as RefObject<Object3D>;

  useHelper(asObject3DRef(directionalLightRef), DirectionalLightHelper);
  useHelper(asObject3DRef(spot1Ref), SpotLightHelper);
  useHelper(asObject3DRef(spot2Ref), SpotLightHelper);
  useHelper(asObject3DRef(pointRef), PointLightHelper);

  const { directPosition, directIntensity } = useControls('Direct Light', {
    directPosition: [100, 10, 5],
    directIntensity: 2,
  });

  // Spot Light 1 controls
  const { spot1Position, spot1Intensity, spot1TargetPosition } = useControls('Spot Light 1', {
    spot1Position: [0, 30, 0],
    spot1Intensity: 1,
    spot1TargetPosition: [0, 0, 0],
  });

  // Spot Light 2 controls
  const { spot2Position, spot2Intensity, spot2TargetPosition } = useControls('Spot Light 2', {
    spot2Position: [20, 20, 20],
    spot2Intensity: 0.8,
    spot2TargetPosition: [0, 0, 0],
  });

  const { pointPosition, pointIntensity } = useControls('Point Light', {
    pointPosition: [-10, -10, -10],
    pointIntensity: 0.5,
  });

  // env controls
  const { envPreset } = useControls('Environment', {
    envPreset: {
      value: 'sunset',
      options: [
        'city',
        'sunset',
        'warehouse',
        'forest',
        'apartment',
        'park',
        'studio',
        'dawn',
        'lobby',
        'night',
      ],
    },
  });

  return (
    <>
      <Environment preset={envPreset as EnvironmentPreset} />
      <ambientLight intensity={0.6} />
      <directionalLight
        ref={directionalLightRef}
        position={directPosition}
        intensity={directIntensity}
        castShadow
      />
      <pointLight ref={pointRef} position={pointPosition} intensity={pointIntensity} castShadow />
      <spotLight
        ref={spot1Ref}
        position={spot1Position}
        target={lightTarget1Ref.current || undefined}
        intensity={spot1Intensity}
        castShadow
      />
      <spotLight
        ref={spot2Ref}
        position={spot2Position}
        target={lightTarget2Ref.current || undefined}
        intensity={spot2Intensity}
        castShadow
      />
      <group ref={lightTarget1Ref} position={spot1TargetPosition} />
      <group ref={lightTarget2Ref} position={spot2TargetPosition} />
    </>
  );
};
