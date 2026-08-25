---
title: API Overview
description: What each Cistern package exports.
---

Full generated API docs (TypeDoc) are planned but not wired up yet. Until then, here is what each
package actually exports today — read the linked source for details.

## `@cistern/core`

Geometry and material primitives. Peer-depends on `three >=0.185.0`.

- **`CisternGeometry`** — a `BufferGeometry` subclass that revolves a profile into a gallery mesh
  with sectional attributes (segment IDs, section percentages, per-section UVs).
- **`CisternMaterial`** — a TSL/WebGPU `NodeMaterial` for `three/webgpu`; renders per-section debug
  colors when constructed with `{ debug: true }`.
- **`getConfig(baseConfig?)`** — expands a minimal `BaseConfig` (radius, height, pedestal, skylight,
  …) into a full `CisternConfig`.
- **`mergeConfigs(current, patch)`** — deep-merges a partial `CisternConfig` into an existing one.
- **`getConfigFromBase`** — deprecated alias for `getConfig`.
- **`generateRawPoints(config)`** — computes the raw revolution profile points for a config.
- **`mat`, `withMat`** — small helpers for reading/mutating a mesh's material safely.
- **Types** — `CisternConfig`, `BaseConfig`, `Points`, `SinglePoint`, `TrimConfig`, `WallConfig`,
  `CornerConfig`, `PedestalConfig`.

## `@cistern/camera`

Camera controls for navigating a gallery. Peer-depends on `three >=0.185.0` and
`camera-controls ^3.1.0`.

- **`CisternCameraControls`** — a [`camera-controls`](https://github.com/yomotsu/camera-controls)
  subclass with cistern-aware collision detection and boundaries; exposes
  `updateCisternPosition()`, `updateConfig()`, and `setCollision()`.
- **`CollisionHit`** (type) — shape of a collision result reported by the controls.

## `@cistern/r3f`

React Three Fiber bindings. Peer-depends on `@cistern/core`, `react`/`react-dom ^19`, and
`@react-three/fiber ^9.0.0 || >=10.0.0-alpha.4 <11` (fiber v10 alpha is explicitly supported).

- **`<Cistern>`** — the top-level component: a `<CisternMesh>` plus an optional `<CisternCamera>`
  rig, driven by a `config` prop. `CisternProps` is exported for typing.
- **`<CisternMesh>`** — just the mesh + geometry, for when you want to supply your own camera or
  compose it into a larger scene graph.
- **`<CisternCamera>`** — drei `CameraControls` wired to `CisternCameraControls`, kept in sync with
  the gallery's config and world position.

## `@cistern/types`

Internal, unpublished workspace package of ambient/shared TypeScript types used while building the
other packages. Not part of the public API.

## See also

- [Getting Started](/guides/getting-started/) for install + usage snippets.
- [Live WebGPU Example](/examples/webgpu-demo/) to see `<Cistern>` rendered in the browser.
