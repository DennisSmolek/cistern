import { useRef, type RefObject } from 'react';
import {
  DirectionalLight,
  Group,
  SpotLight,
  PointLight,
  Object3D,
  AmbientLight,
} from 'three/webgpu';
import { DirectionalLightHelper, SpotLightHelper, PointLightHelper } from 'three/webgpu';
import { useControls, folder } from 'leva';
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
  const ambientLightRef = useRef<AmbientLight>(null);

  // Narrow ref types for useHelper's expected RefObject<Object3D>
  const asObject3DRef = <T extends Object3D>(ref: RefObject<T | null>) =>
    ref as unknown as RefObject<Object3D>;

  useHelper(asObject3DRef(directionalLightRef), DirectionalLightHelper);
  useHelper(asObject3DRef(spot1Ref), SpotLightHelper);
  useHelper(asObject3DRef(spot2Ref), SpotLightHelper);
  useHelper(asObject3DRef(pointRef), PointLightHelper);

  const {
    directPosition,
    directIntensity,
    pointPosition,
    pointIntensity,
    pointColor,
    pointDistance,
    pointDecay,
    pointCastsShadow,
    spot1Position,
    spot1Intensity,
    spot1Color,
    spot1Penumbra,
    spot1Distance,
    spot1Angle,
    spot1Decay,
    spot1CastsShadow,
    spot1TargetPosition,
    spot2Position,
    spot2Intensity,
    spot2Color,
    spot2Penumbra,
    spot2Distance,
    spot2Angle,
    spot2Decay,
    spot2CastsShadow,
    spot2TargetPosition,
    ambientIntensity,
    ambientColor,
  } = useControls(
    'Lights',
    {
      ambientLight: folder(
        {
          ambientIntensity: {
            label: 'Intensity',
            value: 1,
            step: 0.1,
            min: 0,
            max: 10,
          },
          ambientColor: {
            label: 'Color',
            value: '#ffffff',
          },
        },
        { collapsed: true },
      ),
      directLight: folder(
        {
          directPosition: [5, 8, 5],
          directIntensity: {
            label: 'Intensity',
            value: 2,
            step: 0.1,
            min: 0,
            max: 40,
          },
        },
        { collapsed: true },
      ),
      spot1Light: folder(
        {
          spot1Position: {
            label: 'Position',
            value: [0, 10, 0],
          },
          spot1Intensity: {
            label: 'Intensity',
            value: 1,
            step: 0.1,
            min: 0,
            max: 1500,
          },
          spot1Color: {
            label: 'Color',
            value: '#ff0000',
          },
          spot1Distance: {
            label: 'Distance',
            value: 0,
            min: 0,
            max: 100,
          },
          spot1Angle: {
            label: 'Angle',
            value: 0.5,
            min: 0,
            max: 1,
          },
          spot1Decay: {
            label: 'Decay',
            value: 2,
            min: 0,
            max: 10,
          },
          spot1Penumbra: {
            label: 'Penumbra',
            value: 0.5,
            min: 0,
            max: 1,
          },
          spot1TargetPosition: {
            label: 'Target',
            value: [0, 0, 0],
          },

          spot1CastsShadow: {
            label: 'Casts Shadow',
            value: true,
          },
        },
        { collapsed: true },
      ),
      spot2Light: folder(
        {
          spot2Position: {
            label: 'Position',
            value: [10, 10, 10],
          },
          spot2Intensity: {
            label: 'Intensity',
            value: 0.8,
            min: 0,
            max: 1000,
          },
          spot2Color: {
            label: 'Color',
            value: '#0000ff',
          },
          spot2Penumbra: {
            label: 'Penumbra',
            value: 0.5,
            min: 0,
            max: 1,
          },
          spot2Distance: {
            label: 'Distance',
            value: 0,
            min: 0,
            max: 100,
          },
          spot2Angle: {
            label: 'Angle',
            value: 0.5,
            min: 0,
            max: 1,
          },
          spot2Decay: {
            label: 'Decay',
            value: 2,
            min: 0,
            max: 10,
          },
          spot2CastsShadow: {
            label: 'Casts Shadow',
            value: true,
          },
          spot2TargetPosition: {
            label: 'Target',
            value: [0, 0, 0],
          },
        },
        { collapsed: true },
      ),
      pointLight: folder(
        {
          pointPosition: {
            label: 'Position',
            value: [-10, -10, -10],
          },
          pointIntensity: {
            label: 'Intensity',
            value: 0.5,
            min: 0,
            max: 1000,
          },
          pointColor: {
            label: 'Color',
            value: '#00ff00',
          },
          pointDistance: {
            label: 'Distance',
            value: 0,
            min: 0,
            max: 100,
          },
          pointDecay: {
            label: 'Decay',
            value: 2,
            min: 0,
            max: 10,
          },
          pointCastsShadow: true,
        },
        { collapsed: true },
      ),
    },
    { collapsed: true },
  );

  // env controls
  const { envPreset, envIntensity, envRotation } = useControls({
    envPreset: {
      label: 'Environment',
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
    envIntensity: {
      label: 'Intensity',
      value: 1,
      step: 0.1,
      min: 0,
      max: 4,
    },
    envRotation: {
      label: 'Rotation',
      value: [0, 0, 0],
    },
  });

  return (
    <>
      <Environment
        preset={envPreset as EnvironmentPreset}
        environmentIntensity={envIntensity}
        environmentRotation={envRotation}
      />
      <ambientLight intensity={ambientIntensity} color={ambientColor} ref={ambientLightRef} />
      <directionalLight
        ref={directionalLightRef}
        position={directPosition}
        intensity={directIntensity}
        castShadow
      />
      <pointLight
        ref={pointRef}
        position={pointPosition}
        color={pointColor}
        distance={pointDistance}
        decay={pointDecay}
        intensity={pointIntensity}
        castShadow={pointCastsShadow}
      />
      <spotLight
        ref={spot1Ref}
        position={spot1Position}
        target={lightTarget1Ref.current || undefined}
        intensity={spot1Intensity}
        color={spot1Color}
        distance={spot1Distance}
        angle={spot1Angle}
        decay={spot1Decay}
        penumbra={spot1Penumbra}
        castShadow={spot1CastsShadow}
      />
      <spotLight
        ref={spot2Ref}
        position={spot2Position}
        target={lightTarget2Ref.current || undefined}
        intensity={spot2Intensity}
        color={spot2Color}
        distance={spot2Distance}
        angle={spot2Angle}
        decay={spot2Decay}
        penumbra={spot2Penumbra}
        castShadow={spot2CastsShadow}
      />
      <group ref={lightTarget1Ref} position={spot1TargetPosition} />
      <group ref={lightTarget2Ref} position={spot2TargetPosition} />
    </>
  );
};
