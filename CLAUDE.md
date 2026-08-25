# CLAUDE.md

Guidance for Claude Code sessions working in this repo.

## What Cistern is

Cistern is a geometry toolkit for round galleries — building "galleries in
the round" with React Three Fiber. It ships small, focused packages for
generating cylindrical/round gallery geometry, materials, and camera
controls, plus React wrappers for R3F consumers.

## Monorepo map

- `packages/core` — `CisternGeometry` + a TSL-based `CisternMaterial`. No
  React/R3F dependency.
- `packages/camera` — `CisternCameraControls`, extending `camera-controls`.
- `packages/r3f` — React/R3F wrapper components around `core` and `camera`.
- `packages/types` — private, ambient-only `.d.ts` package (not published).
- `apps/starter` — minimal consumer app; smoke test that the published
  packages work together.
- `apps/docs-astro` — Astro/Starlight docs site. Also the live cistern.studio
  homepage. Deployed to Cloudflare Workers.

## Commands

```bash
pnpm install       # install deps (pnpm-only, see below)
pnpm -r build      # build all packages
pnpm typecheck     # tsc -b — project-references build across the workspace
pnpm dev:docs      # run apps/docs-astro locally
pnpm dev:starter   # run apps/starter locally
```

## Conventions

- **pnpm only.** Never use npm or yarn in this repo — an npm publish once
  broke released packages. `packageManager` is pinned; let corepack handle it.
- **TSL/WebGPU-first imports.** Only import from `three/webgpu`,
  `three/tsl`, and `three/addons`. Never import from `three/examples/jsm`
  or `three/src` — those paths are legacy/internal and not supported here.
- **Changesets required** for any change to `packages/*` that ships
  (`core`, `camera`, `r3f`). Run `pnpm changeset` before merging. Publishing
  happens via CI (`release.yml`) using pnpm, which rewrites `workspace:*`
  ranges to real versions — don't hand-edit version ranges for that.
- **Don't loosen TypeScript strictness.** `tsconfig.base.json` is strict;
  fix root causes rather than adding `any`/`ts-ignore` or disabling checks.

## Task ledger

Root `TASKS.md` is the shared task ledger for in-flight work. Tick a box
the moment work lands (not when it's planned), and reference the task ID
(e.g. `G-01`, `D-14`, `R-03`) in the commit that lands it.
