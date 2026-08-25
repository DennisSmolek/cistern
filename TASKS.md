# Cistern — Unified Task List

Status ledger for the finish-line audit + **@react-three/fiber 10.0.0-alpha.4**
migration (full plan: repo repair → tests → three 0.185 → fiber v10 → type
architecture/npm publishing → toolchain modernization → docs basics).
**Claude Code is now the sole driver** of the `[CODE]` phases below. The
homescreen redesign (`[DESIGN]`) is deferred to a future Claude Design
session — this file is the shared status ledger between the two.

- Tick a box the moment the work lands, not when it's planned.
- Task IDs are stable — reference them in commits (`chore(deps): D-04`) and in
  Claude Design so both lanes point at the same item.
- Baseline captured **2026-08-25** against `main` @ `000e7c6`, working tree clean.

Legend: `[CODE]` repo work (Claude Code) · `[DESIGN]` Claude Design ·
`[DEC]` needs Dennis to decide · `[BLOCKED]` hard prerequisite listed

---

## ⚠️ Read this before starting

Constraints verified against the npm registry and the official r3f v10
migration guide. They fix the execution order and cap two versions.

1. **fiber 10.0.0-alpha.4 is a prerelease — pin it exactly everywhere.**
   `^10.0.0` does **not** match a prerelease. It forces `three >=0.185.0` and
   caps `react >=19.0 <19.3` — that's why D-01's react target stops at 19.2.8.
2. **TypeScript 7 is not reachable yet.** `latest` is 7.0.2, but
   `typescript-eslint@8.68` declares `typescript >=4.8.4 <6.1.0`. **Target
   TypeScript 6.0.3**, track TS 7 as T-01. (`typedoc`'s `5.0.x…6.0.x` ceiling
   is moot for now — `typedoc` is being removed from devDeps in Phase 0 and
   re-added when API docs are scheduled, see Deferred.)
3. **Node 22.12+ is the gate.** `astro@7` requires `node >=22.12.0`,
   `vite@8` requires `^20.19 || >=22.12`, `@changesets/cli@3` requires
   `^22.11 || ^24 || >=26`. Local is v22.23.2 ✅ but **both CI workflows pin
   Node 20** ❌. Nothing in Phase 5 can go green until Phase 0 fixes this.
4. **Astro and Starlight move in lockstep.** `@astrojs/starlight@0.41.8` peers
   `astro ^7.0.2`. Bump in the same commit.
5. **`@vitejs/plugin-react@6` peers `vite ^8`.** Vite and the React plugin bump together.
6. **`@wuhhh/view-webgpu` peer-pins fiber `^9.3`** — it is being **removed**,
   not bumped (see D-06 / Phase 3), because it only renders a dead debug box.

---

## Phase 0 — Repo foundation repair + toolchain gate

Blocks everything else. No dependency version changes here except Node/pnpm itself.

### 0a. Toolchain gate (do first)

- [x] **G-01** [CODE] Bump `engines.node` from `>=20.11.0` to `>=22.12.0` in root `package.json`
- [x] **G-02** [CODE] Bump CI Node to 22 in **both** workflows:
      `.github/workflows/release.yml` (`node-version: 20`) and
      `.github/workflows/deploy-docs.yml` (`env.NODE_VERSION: "20"`)
- [x] **G-03** [CODE] Bump `packageManager` `pnpm@10.17.0` → `pnpm@11.23.0`, `engines.pnpm` → `>=11.0.0`,
      and the pinned `version: 10.17.0` in `release.yml`
- [x] **G-04** [CODE] Upgrade `pnpm/action-setup@v3` → `@v4` in `release.yml` (deploy-docs is already v4)
- [x] **G-05** [CODE] Verify `pnpm install && pnpm build && pnpm lint` green on the new toolchain before touching deps

### 0b. Type-graph & script repair

- [x] **G-06** [CODE] `tsconfig.json`: replace dead project references (`apps/studio`,
      `apps/examples`, `apps/docs`) with the real graph — `packages/core`,
      `packages/camera`, `packages/r3f`, `apps/starter` (docs-astro is checked by
      `astro check`, not root `tsc -b`)
- [x] **G-07** [CODE] `packages/r3f/tsconfig.json`: set `"composite": true`
      (required to be a `tsc -b` reference target)
- [x] **R-01** [CODE] Root `package.json` scripts reference apps that **don't exist**
      (`@cistern/studio`, `@cistern/docs`, `@cistern/examples` → `dev:studio`,
      `dev:docs`, `docs:api`, `docs:build`, `docs:preview`, `dev:examples`).
      Delete the dead ones; add `"dev:docs": "pnpm --filter apps-docs-astro dev"`
      and `"typecheck": "tsc -b"`
- [x] **R-02** [CODE] `pnpm dev` filters `@cistern/studio`-era packages plus
      `apps-docs-astro` — reconcile with R-01
- [x] **R-03** [CODE] Remove `vitepress` **and** `typedoc` from root
      devDependencies (VitePress app is gone; `typedoc.json` outputs to a
      deleted dir). Delete `typedoc.json`. Re-add `typedoc` when API docs are
      scheduled (see Deferred)

### 0c. Housekeeping

- [x] **R-08** [CODE] Create `CLAUDE.md`: monorepo map, commands, TSL/WebGPU-first
      import rule (`three/webgpu` / `three/tsl` / `three/addons` only — never
      `three/examples/jsm` or `three/src`), and (post-Phase-4 truth) "domain
      types are exported from `@cistern/core`; `packages/types` is ambient-only"
      *(decision made by the approved plan — no longer a [DEC])*
- [x] **R-07** [CODE] Close Dependabot PRs #4 and #6 (`dependabot/npm_and_yarn/astro-5.15.9`,
      `dependabot/npm_and_yarn/vite-7.1.11`) as superseded by Phase 5's Astro/Vite
      bumps; disable/pause Dependabot until this migration lands (re-enabled
      properly in Phase 5, see R-09)

**Verify:** `pnpm install` → `pnpm -r build` → `pnpm typecheck` exits 0 (baseline
gate) → `pnpm dev:docs`, confirm the cistern scene renders (Chrome, WebGPU) and
screenshot it as the visual reference for every later phase.

**Risk:** `tsc -b` may surface latent errors never before compiled as a graph —
fix them, don't loosen tsconfig.

---

## Phase 1 — Baseline tests (before any dependency bump)

- [x] **TE-01** [CODE] Add vitest to `packages/core` (`"test": "vitest run"`);
      root `"test": "pnpm -r --if-present test"`
- [x] **TE-02** [CODE] `packages/core/src/lib/__tests__/config.test.ts` —
      `getConfig`/merge behavior shapes
- [x] **TE-03** [CODE] `packages/core/src/lib/__tests__/geometry.test.ts` —
      `generateRawPoints` point counts/section IDs for the default config;
      `new CisternGeometry(config)` position-attribute count > 0, finite
      bounding sphere. **Snapshot the point output** — this locks in the
      "blur glitch" duplicate-point hacks before three 0.185 touches anything
- [x] **TE-04** [CODE] Add a test step to `.github/workflows/release.yml`

**Verify:** `pnpm test` green on the current (three 0.180) baseline.

---

## Phase 2 — three 0.185 bump (still fiber 9) — own commit

- [x] **D-14** [CODE] `three` `^0.180.0` → `^0.185.1` and `@types/three`
      `^0.180.0` → `^0.185.4`
- [x] **D-15** [BLOCKED by D-14] [CODE] Update the `three` **peerDependency
      range** in `@cistern/core`, `@cistern/camera`, `@cistern/r3f` (all
      currently `^0.180.0`) → `>=0.185.0`. This is a consumer-visible change
      *(the changeset for this ships together with the fiber-v10 peer bump —
      see note below and P-09)*
- [x] **D-21** [BLOCKED by D-14] [CODE] Normalize import hazards:
      `TRAAPass.tsx` `three/examples/jsm/tsl/display/TRAANode.js` →
      `three/addons/tsl/display/TRAANode.js` (dual-module-instance hazard);
      `AOPass.tsx` `three/src/nodes/core/UniformNode.js` → `uniform` from `three/tsl`
- [x] **D-22** [BLOCKED by D-14] [CODE] Re-evaluate the hand-written TSL type
      patches `packages/types/three-tsl-layout.d.ts` / `three-tsl-fn.d.ts`
      ("remove once upstream updated"): drop the `/// <reference>` lines in
      `packages/core/src/globals.d.ts`, run `tsc -b`; delete the patches if
      0.185 types cover `Fn` layouts, else keep and note why
- [x] **D-23** [BLOCKED by D-14] [CODE] Fix TSL/node API churn surfaced by the
      compiler in `CisternMaterial.ts`, `shadowNodeMaterial.ts`,
      `progressivelm.ts`, and the postprocessing passes (three r181–r185
      migration notes)
- [x] **D-17** [BLOCKED by D-14, D-21..D-23] [CODE] Smoke-test the WebGPU path:
      install/build/typecheck/test green; visual pass vs the Phase 0 screenshot
      (geometry, accumulative shadows, AO/TRAA postprocessing); zero WebGPU
      validation errors in console. Commit standalone (`chore: three 0.185`) —
      clean bisect point

> **D-16** (write a changeset for the three peer-range bump) is **merged into
> P-09** — Phase 4 ships one 0.2.0 changeset covering the three peer bump, the
> fiber v10 peer, exported types, and metadata fixes together, so we don't
> publish an interim peer-only version.

**Risk:** TSL churn across 5 minors is the plan's biggest unknown; isolated
here on purpose.

---

## Phase 3 — @react-three/fiber 10.0.0-alpha.4

- [x] **F-01** [CODE] Versions: `apps/docs-astro/package.json` fiber → exact
      `10.0.0-alpha.4`; **remove `@wuhhh/view-webgpu`**.
      `packages/r3f/package.json`: devDep fiber exact `10.0.0-alpha.4`, peer
      fiber `^9.0.0 || >=10.0.0-alpha.4 <11`, peer react/react-dom →
      `^19.0.0` (drop 18), drei devDep → `^10.7.8`
- [x] **H-12** [CODE] *(done early here, not in the design lane)* `Fiber.tsx`:
      delete the `View` import, the dead `<View index={2}>` block, and the
      commented `<View.Port />` — removes the stray lightblue box from the
      live homepage
- [x] **F-02** [CODE] `WebGPUCanvas.tsx`: replace the async `gl` factory with
      v10's `renderer` prop (first-class WebGPU auto-init). Stay on the root
      `'@react-three/fiber'` entrypoint (not `/webgpu`) — the `ThreeElements`
      augmentation in `packages/types/r3f.d.ts` targets that module specifier
- [x] **F-03** [CODE] `WebGPUCanvas.tsx`: delete the `RendererHelper` dummy
      `useFrame(cb, 1)` entirely (dead render-takeover)
- [x] **F-04** [CODE] `WebGPUCanvas.tsx`: keep `extend(THREE)` + the
      `ThreeToJSXElements` module augmentation only if `astro check` still
      needs them under v10; remove if the catalogue/types are provided
- [x] **F-05** [CODE] Check callers (`Fiber.tsx`, `ExampleEmbed.tsx`) passing
      `gl={{ antialias: true }}` (currently silently discarded) — pass through
      `renderer={{...}}` properly
- [x] **F-06** [CODE] `Postprocessing.tsx`: `useFrame(() => postprocessing.render(), 1)`
      → `{ phase: 'render' }`; `gl` → `renderer` (drop `as unknown as
      WebGPURenderer` casts if v10 types it). Do **not** rewrite the pipeline
      onto v10 `usePostProcessing` — optional follow-up only (see Deferred)
- [x] **F-07** [CODE] `Scene.tsx`: `state.clock.elapsedTime` → `elapsed` from
      the frame callback arg
- [x] **F-08** [CODE] `AccumulativeShadowsWebGPU.tsx`: `state.gl` →
      `state.renderer`; audit its `useFrame`/`invalidate` usage
- [x] **F-09** [CODE] `packages/r3f/src/utils.ts`: verify `findMaterialChild`'s
      `typeof type === 'string'` intrinsic assumption still holds in v10
      (silent-failure risk: `CisternMesh` could overwrite user materials).
      While in `Cistern.tsx`, fix the `cisternPosition` `useMemo` that reads
      `meshRef.current` on first render (always `(0,0,0)`)
- [x] **F-10** [CODE] Runtime-verify drei surface: `CameraControls impl=
      {CisternCameraControls}` (`CisternCamera.tsx`), `Environment`,
      `useHelper`, `Backdrop`, `Sphere`, `useGLTF`. Fallback if drei's
      CameraControls breaks under v10: wire `CisternCameraControls` manually
      (drei is a thin wrapper there)
- [x] **F-11** [CODE] Verify: install (expect only drei peer warnings),
      `pnpm -r build`, `pnpm typecheck`, `astro check`, `pnpm test`; full
      visual pass vs the Phase 0 screenshot (animation timing, orbit controls,
      shadow convergence, postprocessing); clear **all** v10 deprecation
      warnings from console rather than suppressing; `pnpm --filter
      apps-docs-astro build`

**Risks:** alpha-quality fiber — pin exact everywhere so pnpm can't float;
confirm `{ phase: 'render' }` actually replaces the default loop the way
`priority > 0` did (risk of double-render or no render).

---

## Phase 4 — Type architecture + npm publishing (0.2.0)

### 4a. Types: ambient globals → exported modules

- [x] **P-01** [CODE] Create `packages/core/src/types.ts`: move everything from
      `packages/types/core.d.ts` verbatim with `export` added (`SinglePoint`,
      `Points`, `TrimConfig`, `BaseConfig`, `WallConfig`, `CornerConfig`,
      `PedestalConfig`, `CisternConfig`)
- [x] **P-02** [BLOCKED by P-01] [CODE] `packages/core/src/index.ts`: replace
      the `export type X = globalThis.X` lines with `export * from './types'`;
      drop the `@cistern/types` reference
- [x] **P-03** [BLOCKED by P-02] [CODE] Add explicit imports in all former
      consumers of the globals — core (`CisternGeometry.ts`, `config.ts`,
      `pointGeneration.ts`, `utils/*`, `defaults.ts`, `CisternMaterial.ts`),
      camera (`cistern-controls.ts` imports from `@cistern/core`; move
      `CollisionHit` from `packages/types/camera.d.ts` into an exported camera
      type), r3f (`Cistern.tsx`, `CisternMesh.tsx`, `CisternCamera.tsx`),
      docs-astro (`Scene.tsx`, `control/controlState.ts`)
- [x] **P-04** [BLOCKED by P-03] [CODE] Shrink `packages/types` to genuinely
      ambient content only: keep `r3f.d.ts` (ThreeElements augmentations),
      `vendor.d.ts`, surviving `three-tsl-*` patches; delete `core.d.ts` /
      `camera.d.ts`; prune `"types": ["@cistern/types"]` from tsconfigs that no
      longer need it. **Published `dist/index.d.ts` must reference no globals.**
- [x] **P-05** [CODE] Publish-blocker fix: gate `CisternMaterial`'s forced
      `debugColor()` behind an opt-in `debug` option so 0.2.0 doesn't ship
      random section colors (small change only — full slot-system work stays
      in the dedicated materials phase, see Deferred)
- [x] **P-06** [BLOCKED by P-04] [CODE] Verify: `pnpm -r build`, then inspect
      `packages/*/dist/index.d.ts` — grep for `globalThis.` and unresolved
      names (must be zero). Tarball test: `pnpm pack` each package, `npm init
      -y && npm i <tarball> three typescript` in a scratch dir, typecheck a
      5-line consumer importing `CisternGeometry` + `CisternConfig` —
      reproduces the exact published-0.1.0 failure mode and proves it's fixed

### 4b. Publishing

- [x] **P-07** [CODE] Fix `workspace:*` rewriting: change root
      `release:publish` to `pnpm publish -r --access public --no-git-checks`
      after `changeset version` (pnpm rewrites `workspace:*`; npm doesn't —
      that's how 0.1.0 broke). Update `release.yml` accordingly. Make
      `@cistern/core` a real dep (or properly-versioned peer) of `@cistern/r3f`
      instead of `workspace:*` in peerDependencies. Dry-run with `pnpm publish
      -r --dry-run` / tarball inspection
- [x] **P-08** [CODE] Add `repository`, `description`, `license`, `keywords` to
      the three publishable `package.json`s (needed for provenance + npm page)
- [x] **P-09** [BLOCKED by D-15, F-01, P-06] [CODE] One changeset: minor →
      **0.2.0** for core/camera/r3f (new peers: three ≥0.185, fiber
      9-or-10-alpha; exported types; fixed metadata). *(Subsumes D-16.)*
      Confirm `NPM_TOKEN`/`GH_PAT` secrets are still valid; merge Version PR;
      CI publishes with provenance
- [ ] **P-10** [BLOCKED by P-09] [CODE] After 0.2.0 is live: `npm deprecate`
      all three 0.1.0s with "use >=0.2.0" messages

---

## Phase 5 — Toolchain & dependency modernization

Isolated from the r3f migration on purpose — do after Phase 3 is visually
verified and Phase 4's 0.2.0 has published (keep changesets 2's known
behavior for that first publish). Each major gets its own commit + build
verification. Versions verified against npm 2026-08-25.

### 5a. Safe bumps (one commit)

- [x] **D-01** [CODE] react + react-dom `^19.1.1` → `^19.2.8` (root types,
      docs-astro, starter). **Capped:** fiber v10 requires `react >=19.0
      <19.3` — do not bump higher until fiber's peer range moves
- [x] **D-02** [CODE] `@types/react` `^19.1.13` → `^19.2.18`, `@types/react-dom`
      `^19.1.9` → `^19.2.5`
- [x] **D-04** [CODE] `typescript-eslint` + `@typescript-eslint/{parser,eslint-plugin}`
      `^8.44.0` → `^8.68.0`
- [x] **D-05** [CODE] `prettier` `^3.6.2` → `^3.9.6`, `tsup` `^8.5.0` →
      `^8.5.1` ~~, `typedoc` `^0.28.13` → `^0.28.20`~~ *(typedoc removed in
      Phase 0, R-03 — skip until re-added)*
- [x] **D-06** [CODE] `camera-controls` `^3.1.0` → `^3.1.2`, `leva` `^0.10.0` →
      `^0.10.1`, `valtio` `^2.1.7` → `^2.3.2` ~~, `@wuhhh/view-webgpu`
      `^0.1.0` → `^0.1.1`~~ — **`@wuhhh/view-webgpu` is superseded: removed
      entirely in Phase 3 (F-01), not bumped. It peer-pins fiber `^9.3` and
      only rendered a dead debug box.**

> **D-03** (`@react-three/fiber` `^9.3.0` → `^9.7.0`, `@react-three/drei`
> `^10.7.6` → `^10.7.8`) is **superseded** by the fiber 10.0.0-alpha.4
> migration in Phase 3 (F-01). Not done.

### 5b. Majors — each its own commit + build verification

- [x] **D-07** [BLOCKED by Phase 0] [CODE] **Vite 7 → 8** (`^7.1.7` → `^8.2.2`)
      in root + `apps/starter`, together with `@vitejs/plugin-react` `^5.0.3`
      → `^6.1.0`. ⚠️ plugin-react@6 adds peers: `oxc-transform-react`,
      `@rolldown/plugin-babel`, `babel-plugin-react-compiler` — confirm
      whether pnpm auto-installs or they need adding
- [ ] **D-08** [BLOCKED by D-07] [CODE] **Astro 5 → 7** (`^5.6.1` → `^7.2.6`) —
      two majors, read both migration guides. Bump **in the same commit** as
      `@astrojs/starlight` `^0.36.0` → `^0.41.8` and `@astrojs/react` `^4.3.1`
      → `^6.0.4`
- [ ] **D-09** [BLOCKED by D-08] [CODE] Verify `astro.config.mjs` still valid —
      content collections, `content.config.ts`, and the Starlight
      `sidebar`/`social` config all changed shape across 5→7
- [ ] **D-13** [BLOCKED by D-08] [CODE] `sharp` `^0.34.2` → `^0.35.3` in
      docs-astro (Astro image pipeline; check the Cloudflare Workers build
      still resolves the right binary)
- [ ] **D-10** [CODE] **ESLint 9 → 10** (`eslint` `^9.36.0` → `^10.9.1`,
      `@eslint/js` → `^10.0.1`) plus `eslint-plugin-react-hooks` `^5.2.0` →
      `^7.1.1` (two majors — the flat-config `recommended` export was
      restructured), `eslint-plugin-react-refresh` `^0.4.20` → `^0.5.4`,
      `eslint-plugin-tsdoc` `^0.4.0` → `^0.5.2`. Rework `eslint.config.js` as needed
- [ ] **D-11** [CODE] **TypeScript 5.9.2 → 6.0.3** across root + all 4
      packages + starter. ⛔ Do **not** go to 7.0.2 — see constraint 2 above.
      Re-run `pnpm build` (tsup `--dts`) after
- [ ] **D-12** [BLOCKED by Phase 0 (Node 22)] [CODE] **Changesets 2 → 3**
      (`@changesets/cli` `^2.27.9` → `^3.0.1`) — needs Node ≥22.11, gated on
      Phase 0. Verify `changeset version` / `changeset publish` still behave
      and `.changeset/config.json` is valid
- [ ] **R-09** [BLOCKED by D-07..D-12] [CODE] Re-enable Dependabot with a
      proper `dependabot.yml` (weekly, pnpm-aware) — its 100% failure streak
      should resolve once the workspace installs cleanly

**Verify:** per-major, `pnpm install && pnpm -r build && pnpm typecheck &&
pnpm lint && pnpm test` green before the next bump; then `astro check`,
`astro dev` visual pass vs the Phase 0 screenshot, `astro build` + `astro
preview`, starter build.

---

## Phase 6 — Docs/site basics (content-light; redesign deferred)

- [ ] **R-04** [CODE] Rewrite `README.md` for the real workspace (remove all
      VitePress-era content, ~60% of the file)
- [ ] **R-06** [CODE] Fix live 404s: `index.mdx` hero actions → real slugs.
      `/docs/` landing (`src/content/docs/index.mdx`) is still Starlight
      boilerplate ("Congrats on setting up a new Starlight project!", Houston
      image, template cards) — replace with real Cistern content
- [ ] **R-10** [CODE] Minimal boilerplate purge: one real "Getting Started"
      guide (install `@cistern/core`/`@cistern/r3f@0.2.0`, minimal
      `<Cistern>` snippet); delete or stub-honestly the template
      examples/reference pages
- [ ] **R-05** [CODE] Fix the Starlight `social` link in `astro.config.mjs` —
      it points at `github.com/withastro/starlight`, not
      `DennisSmolek/cistern`
- [ ] **R-11** [CODE] Replace the unmodified Starlight starter
      `apps/docs-astro/README.md`
- [ ] **D-20** [CODE] Confirm the Cloudflare Workers docs deploy succeeds on
      the new toolchain

**Verify:** click every nav/hero link in `astro preview`; deploy and
spot-check cistern.studio.

---

## Overall verification gate

Final "done" bar for the whole code lane:

- [ ] **D-18** Fresh clone → `pnpm install && pnpm -r build && pnpm typecheck
      && pnpm test` all green
- [ ] **D-19** `pnpm dev:docs` renders the scene identically to the Phase 0
      screenshot, camera controls work, leva panel live, zero console
      deprecation warnings
- [ ] `npm i @cistern/core @cistern/camera @cistern/r3f` (0.2.0) works in a
      clean external project and typechecks (repeat of P-06's tarball test
      against the real published packages)
- [ ] cistern.studio deploys from CI with no 404s in the nav (ties to D-20, R-06)

---

## Lane 2 — Homescreen redesign [DEFERRED — future Claude Design session]

Current state of `apps/docs-astro/src/pages/index.astro`: 13 lines, a full-bleed
`<Fiber />` R3F canvas at 100vw/100vh with a leva control panel and a floating
150px lightblue `<View>` box. No nav, no wordmark, no copy, no CTA, no mobile story.
Background is hardcoded `#1a1a1a`.

Kept verbatim as the spec for this future phase. **Note: H-12 (remove the
`<View>` debug box) is done early, in Phase 3 of the code lane** — see above.
Everything else here is untouched and still pending.

### 2a. Design [DESIGN — Claude Design]

- [ ] **H-01** [DEC] Decide what `/` **is**: marketing landing page with the 3D scene as
      hero, or a full-screen live demo with minimal chrome overlaid?
- [ ] **H-02** Visual identity — wordmark/logo, type scale, palette. Anchor off the
      existing `#1a1a1a` or replace it
- [ ] **H-03** Hero composition: canvas treatment, headline, tagline
      (README's is "Geometry toolkit for round galleries"), primary/secondary CTAs
- [ ] **H-04** Nav overlay: Docs · Examples · GitHub · npm. Decide light-on-canvas vs solid bar
- [ ] **H-05** Below-fold sections if H-01 says landing page — features, install snippet,
      package list (`@cistern/core`, `/camera`, `/r3f`)
- [ ] **H-06** Mobile + responsive layout, incl. what replaces the canvas on small screens
- [ ] **H-07** WebGPU fallback state — what a non-WebGPU browser sees. Currently: nothing
- [ ] **H-08** Loading state for the canvas (it's `client:only="react"`, so first paint is empty)
- [ ] **H-09** Export handoff spec (tokens, spacing, states) for Lane 2b

### 2b. Implementation [CODE — blocked by H-09]

- [ ] **H-10** Rebuild `src/pages/index.astro` from the handoff spec
- [ ] **H-11** Hide the leva panel in production builds (currently always visible on `/`)
- [x] **H-12** ~~Remove or repurpose the floating lightblue `<View index={2}>` debug box in `Fiber.tsx`~~
      — done early, Phase 3 (F-01) of the code lane (see checklist above)
- [ ] **H-13** Move the hardcoded `backgroundColor: '#1a1a1a'` into a shared design token
- [ ] **H-14** Implement the WebGPU fallback + canvas loading state (H-07, H-08)
- [ ] **H-15** Accessibility pass — focus order over the canvas, contrast on overlay text,
      `prefers-reduced-motion` for the animated scene
- [ ] **H-16** Lighthouse / bundle check — the canvas must not block first paint

---

## Deferred / future phases (recorded, not scheduled)

- **Materials / slot-system phase** (dedicated, after the updates land): wire
  all 8 section slots (soffit/skylight/corners missing), finish or delete the
  `SlotMaterial.ts` stub and the empty `MaterialData.rebuild()`, full
  debug-mode design (successor to P-05's opt-in `debug` flag). Coordinates
  with Lane 2 design work via this file.
- **Camera collider cleanup**: real cistern collider in `generateCollider()`
  (currently a placeholder cylinder; real impl commented out); delete dead
  `collision-utils.ts`; fix the HMR collider-loss bug.
- **Postprocessing rewrite** onto v10 `usePostProcessing` — optional follow-up
  to F-06, not required for the v10 migration to land.
- **TypeDoc API docs wired into Starlight** — re-add `typedoc` devDep (removed
  in R-03) once scheduled.
- **T-01** **TypeScript 7.0.2** — blocked on `typescript-eslint` raising its
  `<6.1.0` ceiling (and `typedoc`, once it's back, adding 7.x support).
  Recheck both peer ranges before attempting.
- **T-02** Re-audit for new latests once Phase 5 lands — several of these move weekly.
- **T-03** Triage the 13 outstanding `TODO`s across the codebase.

---

## Version reference (captured 2026-08-25)

### Toolchain
| | Current | Target | Note |
|---|---|---|---|
| Node (engines) | >=20.11.0 | **>=22.12.0** | forced by astro 7 |
| Node (CI, both workflows) | 20 | **22** | |
| pnpm | 10.17.0 | 11.23.0 | major |

### Root devDependencies
| Package | Current | Target | Note |
|---|---|---|---|
| @changesets/cli | ^2.27.9 | ^3.0.1 | major, **gated on Node 22** (Phase 0) |
| @eslint/js | ^9.36.0 | ^10.0.1 | major |
| @types/react | ^19.1.13 | ^19.2.18 | minor |
| @types/react-dom | ^19.1.9 | ^19.2.5 | minor |
| @types/three | ^0.180.0 | ^0.185.4 | breaking |
| @typescript-eslint/* | ^8.44.0 | ^8.68.0 | minor |
| @vitejs/plugin-react | ^5.0.3 | ^6.1.0 | major, needs vite 8 |
| eslint | ^9.36.0 | ^10.9.1 | major |
| eslint-plugin-react-hooks | ^5.2.0 | ^7.1.1 | two majors |
| eslint-plugin-react-refresh | ^0.4.20 | ^0.5.4 | breaking |
| eslint-plugin-tsdoc | ^0.4.0 | ^0.5.2 | breaking |
| prettier | ^3.6.2 | ^3.9.6 | minor |
| tsup | ^8.5.0 | ^8.5.1 | patch |
| typedoc | ^0.28.13 | **remove** | Phase 0 (R-03); re-add when API docs scheduled |
| typescript | ^5.9.2 | **^6.0.3** | ⛔ not 7.0.2 |
| typescript-eslint | ^8.44.0 | ^8.68.0 | minor |
| vite | ^7.1.7 | ^8.2.2 | major |
| vitepress | ^1.6.4 | **remove** | no VitePress app |

### apps/docs-astro
| Package | Current | Target | Note |
|---|---|---|---|
| astro | ^5.6.1 | ^7.2.6 | two majors |
| @astrojs/starlight | ^0.36.0 | ^0.41.8 | peers astro ^7.0.2 |
| @astrojs/react | ^4.3.1 | ^6.0.4 | two majors |
| three | ^0.180.0 | ^0.185.1 | breaking, forced by fiber v10 |
| @react-three/fiber | ^9.3.0 | **10.0.0-alpha.4 (exact pin)** | prerelease — `^10.0.0` won't match |
| @react-three/drei | ^10.7.6 | ^10.7.8 | peer-pins fiber ^9, works w/ warnings |
| react / react-dom | ^19.1.1 | ^19.2.8 | ⛔ capped `<19.3` by fiber v10 peer |
| camera-controls | ^3.1.0 | ^3.1.2 | patch |
| leva | ^0.10.0 | ^0.10.1 | patch |
| valtio | ^2.1.7 | ^2.3.2 | minor |
| sharp | ^0.34.2 | ^0.35.3 | breaking |
| @wuhhh/view-webgpu | ^0.1.0 | **REMOVE** | peer-pins fiber ^9.3; only rendered a dead debug box |

### packages/{core,camera,r3f} peerDependencies
| Package | Current | Target | Note |
|---|---|---|---|
| three | ^0.180.0 | **>=0.185.0** | changeset required (P-09) |
| camera-controls | ^3.1.0 | ^3.1.2 | camera only |
| @react-three/drei | ^10.7.6 | ^10.7.8 | r3f only |
| @react-three/fiber | ^9.0.0 | **^9.0.0 \|\| >=10.0.0-alpha.4 <11** | r3f only — supports v9 and the v10 alpha (F-01) |
| react / react-dom | — | **^19.0.0** | r3f only — drop 18 support (F-01) |
