---
title: Getting Started
description: Install Cistern and render your first gallery-in-the-round mesh.
---

Cistern is a small toolkit for building "galleries in the round" with three.js: profile-revolution
geometry, a TSL/WebGPU material, cistern-aware camera controls, and React Three Fiber components.
This guide gets a `<Cistern>` on screen in a few lines.

## Requirements

- [three.js](https://threejs.org) `>=0.185.0`
- A **WebGPU-capable renderer**. `@cistern/core`'s `CisternMaterial` is written in TSL and targets
  `WebGPURenderer` (via `three/webgpu`) — it does not run on the legacy WebGL renderer.
- For the React components: React 19 and `@react-three/fiber` `^9.0.0` or the `10.0.0-alpha` line.

## Install

```bash
npm i @cistern/core three
```

To use the React Three Fiber components instead of raw three.js, install `@cistern/r3f` alongside
Fiber and drei:

```bash
npm i @cistern/r3f @cistern/core @react-three/fiber @react-three/drei three react react-dom
```

## Plain three.js

`CisternGeometry` is a `BufferGeometry` subclass driven by a config object. `getConfig()` expands a
minimal set of dimensions into the full config the geometry understands:

```ts
import { CisternGeometry, CisternMaterial, getConfig } from '@cistern/core';
import { Mesh } from 'three/webgpu';

const config = getConfig({
  radius: 20,
  height: 10,
  pedestalRadius: 5,
  pedestalHeight: 0.25,
  skylightRadius: 5,
});

const geometry = new CisternGeometry([], 36, 0, Math.PI * 2, config);
const material = new CisternMaterial();
const mesh = new Mesh(geometry, material);

scene.add(mesh);
```

## React Three Fiber

`<Cistern>` wraps the geometry, material, and camera rig into one component. It needs a WebGPU
canvas — pass a `renderer` prop that boots `WebGPURenderer` (Fiber v10 does this natively; on v9
you provide the async `gl` factory yourself):

```tsx
import { Canvas } from '@react-three/fiber';
import { Cistern } from '@cistern/r3f';

export function GalleryScene() {
  return (
    <Canvas camera={{ position: [6, 6, 6], fov: 60 }} renderer={{ antialias: true }}>
      <ambientLight intensity={0.6} />
      <directionalLight position={[10, 10, 5]} intensity={1} />
      <Cistern config={{ root: { radius: 6, height: 4 } }} />
    </Canvas>
  );
}
```

`<Cistern>` renders a `<CisternMesh>` plus a `<CisternCamera>` (drei `CameraControls` backed by
`@cistern/camera`'s `CisternCameraControls`) by default — pass `useCamera={false}` if you're
providing your own camera rig.

## Next steps

- See it running live: [WebGPU Example](/examples/webgpu-demo/).
- Skim what each package exports: [API Overview](/reference/overview/).
