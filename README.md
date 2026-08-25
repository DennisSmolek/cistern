[![Release](https://github.com/DennisSmolek/cistern/actions/workflows/release.yml/badge.svg)](https://github.com/DennisSmolek/cistern/actions/workflows/release.yml)
[![Deploy Docs (Cloudflare Workers)](https://github.com/DennisSmolek/cistern/actions/workflows/deploy-docs.yml/badge.svg)](https://github.com/DennisSmolek/cistern/actions/workflows/deploy-docs.yml)

## Cistern

Cistern is a small toolkit for building **galleries in the round** — cistern-shaped exhibition
spaces — with [three.js](https://threejs.org). It's WebGPU/TSL-first, targeting `three >=0.185.0`:

- **`@cistern/core`** — `CisternGeometry`, a `BufferGeometry` subclass that revolves a profile into
  a gallery mesh with sectional attributes, plus `CisternMaterial`, a TSL/WebGPU material.
- **`@cistern/camera`** — `CisternCameraControls`, a `camera-controls` subclass with cistern-aware
  collision and boundaries.
- **`@cistern/r3f`** — React Three Fiber components (`<Cistern>`, `<CisternMesh>`,
  `<CisternCamera>`) built on top of the two packages above.

Docs and a live WebGPU demo live at **[cistern.studio](https://cistern.studio)**.

## Requirements

- Node >= 22.12
- pnpm >= 11

## Install

```bash
npm i @cistern/core three
```

For the React Three Fiber components:

```bash
npm i @cistern/r3f @cistern/core @react-three/fiber @react-three/drei three react react-dom
```

`@cistern/r3f` supports React Three Fiber `^9.0.0` as well as the `10.0.0-alpha` line (`fiber v10`
alpha is explicitly supported as a peer range).

## Usage

`CisternGeometry` is driven by a config object; `getConfig()` expands a minimal set of dimensions
into the full config:

```ts
import { CisternGeometry, CisternMaterial, getConfig } from '@cistern/core';
import { Mesh } from 'three/webgpu';

const config = getConfig({ radius: 20, height: 10, pedestalRadius: 5, pedestalHeight: 0.25, skylightRadius: 5 });
const geometry = new CisternGeometry([], 36, 0, Math.PI * 2, config);
const mesh = new Mesh(geometry, new CisternMaterial());

scene.add(mesh);
```

With React Three Fiber, `<Cistern>` wraps the geometry, material, and camera rig for you (drop
`useCamera={false}` if you're providing your own camera):

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

Both packages require a WebGPU-capable renderer (`WebGPURenderer` via `three/webgpu`) — the
material is TSL and does not run on the legacy WebGL renderer. See
[Getting Started](https://cistern.studio/guides/getting-started/) for a full walkthrough and the
[API Overview](https://cistern.studio/reference/overview/) for what each package exports.

## Workspace layout

| Path                 | What it is                                                        |
| --------------------- | ------------------------------------------------------------------ |
| `packages/core`       | `@cistern/core` — geometry + material                              |
| `packages/camera`     | `@cistern/camera` — camera controls                                 |
| `packages/r3f`        | `@cistern/r3f` — React Three Fiber components                       |
| `packages/types`      | `@cistern/types` — internal, unpublished shared types               |
| `apps/starter`        | Minimal Vite + React consumer app                                   |
| `apps/docs-astro`     | Astro + Starlight docs site, deployed as cistern.studio             |

## Common scripts (run from repo root)

```bash
pnpm install        # install workspace dependencies
pnpm build           # build all packages (pnpm -r build)
pnpm typecheck        # tsc -b across the workspace
pnpm test             # run tests in every package that defines one
pnpm lint             # eslint, zero warnings allowed
pnpm format           # prettier -w .
pnpm dev              # watch-build core/camera/r3f + run the docs app
pnpm dev:docs          # run apps/docs-astro only
pnpm dev:starter        # run apps/starter only
```

## Release flow (Changesets → npm)

- Make your changes on a branch and add a changeset describing them:

  ```bash
  pnpm changeset
  ```

- Open a PR and merge to `main`. On push to `main`, CI checks for unpublished changesets and, if
  any exist, runs `changeset version` followed by a pnpm-based build + publish of the affected
  `@cistern/*` packages to npm (with provenance).
- Publishing requires an `NPM_TOKEN` secret in the repo.

## Docs deployment

`apps/docs-astro` deploys to Cloudflare Workers via `.github/workflows/deploy-docs.yml`, which only
runs when files under `apps/docs-astro/**` change. See
[`apps/docs-astro/DEPLOYMENT.md`](apps/docs-astro/DEPLOYMENT.md) for details.

## License

MIT
