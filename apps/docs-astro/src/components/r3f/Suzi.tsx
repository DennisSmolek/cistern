import { forwardRef, useEffect, useMemo } from 'react';
import { useGLTF } from '@react-three/drei';
import {
  Mesh,
  MeshNormalNodeMaterial,
  MeshPhysicalNodeMaterial,
  MeshStandardNodeMaterial,
  type Material,
  type MeshStandardMaterial,
} from 'three/webgpu';
import type { ThreeElements } from '@react-three/fiber';
import { useControls } from 'leva';
import { palette } from '../home/palette';

type SuziMaterial = 'clay' | 'chrome' | 'glass' | 'normals' | 'original';

export const Suzi = forwardRef<Mesh, ThreeElements['mesh']>((props, meshRef) => {
  const { nodes } = useGLTF('./models/suzimatholder.glb');

  const { mesh, original } = useMemo(() => {
    const mesh = nodes.Suzanne as Mesh;
    return {
      mesh,
      original: mesh.material as MeshStandardMaterial,
    };
  }, [nodes]);

  const { material } = useControls('Suzi', {
    material: {
      label: 'Material',
      value: 'clay' as SuziMaterial,
      options: {
        Clay: 'clay',
        Chrome: 'chrome',
        Glass: 'glass',
        Normals: 'normals',
        'Original (GLB)': 'original',
      },
    },
  });

  const overrides = useMemo<Record<Exclude<SuziMaterial, 'original'>, Material>>(
    () => ({
      // Complementary clay ties Suzi into the load palette.
      clay: new MeshStandardNodeMaterial({
        color: palette.complement,
        roughness: 0.9,
        metalness: 0,
      }),
      chrome: new MeshStandardNodeMaterial({
        color: 0xffffff,
        metalness: 1,
        roughness: 0.08,
      }),
      glass: new MeshPhysicalNodeMaterial({
        color: 0xffffff,
        transmission: 1,
        roughness: 0.12,
        thickness: 1.4,
        ior: 1.45,
      }),
      normals: new MeshNormalNodeMaterial(),
    }),
    [],
  );

  useEffect(() => {
    mesh.material = material === 'original' ? original : overrides[material as Exclude<SuziMaterial, 'original'>];
  }, [material, mesh, original, overrides]);

  return (
    <>
      <primitive ref={meshRef} castShadow receiveShadow object={mesh} {...props} />
    </>
  );
});
