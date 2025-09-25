import { forwardRef } from 'react';
import { useGLTF } from '@react-three/drei';
import { Mesh } from 'three/webgpu';
import { MaterialXLoader } from 'three/addons/loaders/MaterialXLoader.js';
import type { ThreeElements } from '@react-three/fiber';

export const Suzi = forwardRef<Mesh, ThreeElements['mesh']>((props, ref) => {
  const { nodes } = useGLTF('./models/suzi.glb');
  return (
    <>
      <mesh ref={ref} castShadow receiveShadow geometry={(nodes.mesh as Mesh).geometry} {...props}>
        <meshStandardMaterial color="#9d4b4b" />
      </mesh>
    </>
  );
});
