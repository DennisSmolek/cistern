---
"@cistern/core": minor
"@cistern/camera": minor
"@cistern/r3f": minor
---

Modernize the stack and fix the published packages.

- three peer range is now `>=0.185.0` (was `^0.180.0`); code migrated to the
  r185 TSL/WebGPU APIs.
- `@cistern/r3f` supports React Three Fiber v10 (`^9.0.0 || >=10.0.0-alpha.4 <11`)
  and requires React 19.
- Domain types (`CisternConfig`, `BaseConfig`, `Points`, …) are now real module
  exports from `@cistern/core` — the published type declarations previously
  referenced ambient globals that never shipped, breaking external TypeScript
  consumers. `@cistern/camera` exports `CollisionHit`.
- Fixed package metadata and internal dependency ranges: `@cistern/camera` and
  `@cistern/r3f` 0.1.0 were published with unresolvable `workspace:*` ranges and
  could not be installed at all; releases are now published with pnpm so
  workspace ranges resolve to real versions.
- `CisternMaterial` accepts `{ debug?: boolean }` to opt out of the forced
  random section colors.
- `<Cistern>` now reports its real mesh position to the camera rig (was always
  `(0,0,0)`).
