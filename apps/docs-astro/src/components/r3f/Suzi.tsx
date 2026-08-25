import { forwardRef, useEffect, useMemo } from 'react';
import { useGLTF } from '@react-three/drei';
import { Mesh, MeshStandardMaterial } from 'three/webgpu';
import type { ThreeElements } from '@react-three/fiber';



export const Suzi = forwardRef<Mesh, ThreeElements['mesh']>((props, meshRef) => {
  const { nodes, materials } = useGLTF('./models/suzimatholder.glb');

  const { mesh } = useMemo(() => {
    const mesh = nodes.Suzanne as Mesh;
    return {
      material: mesh.material as MeshStandardMaterial,
      mesh: mesh,
      geometry: mesh.geometry,
    };
  }, [nodes]);

  useEffect(() => {
    console.log('Materials', materials);
    //controlState.materials = ref(materials as Record<string, MeshStandardMaterial>);
  }, [materials]);

  return (
    <>
      <primitive ref={meshRef} castShadow receiveShadow object={mesh} {...props} />
    </>
  );
});
