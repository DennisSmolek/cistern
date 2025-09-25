import * as THREE from 'three/webgpu';
import type { ReactThreeFiber } from '@react-three/fiber';
import { shaderMaterial } from '@react-three/drei';

type SoftShadowMaterialProps = {
  map: THREE.Texture;
  color?: ReactThreeFiber.Color;
  alphaTest?: number;
  blend?: number;
};

declare module '@react-three/fiber' {
  interface ThreeElements {
    softShadowMaterial: ThreeElements['shaderMaterial'] & SoftShadowMaterialProps;
  }
}

const version = 180;

export const SoftShadowMaterial = /* @__PURE__ */ shaderMaterial(
  {
    color: /* @__PURE__ */ new THREE.Color(),
    blend: 2.0,
    alphaTest: 0.75,
    opacity: 0,
    map: null,
  },
  `varying vec2 vUv;
     void main() {
       gl_Position = projectionMatrix * viewMatrix * modelMatrix * vec4(position, 1.);
       vUv = uv;
     }`,
  `varying vec2 vUv;
     uniform sampler2D map;
     uniform vec3 color;
     uniform float opacity;
     uniform float alphaTest;
     uniform float blend;
     void main() {
       vec4 sampledDiffuseColor = texture2D(map, vUv);
       gl_FragColor = vec4(color * sampledDiffuseColor.r * blend, max(0.0, (1.0 - (sampledDiffuseColor.r + sampledDiffuseColor.g + sampledDiffuseColor.b) / alphaTest)) * opacity);
       #include <tonemapping_fragment>
       #include <${version >= 154 ? 'colorspace_fragment' : 'encodings_fragment'}>
     }`,
);
