# Handoff: cistern.studio homepage (hero + shell)

## Overview
A landing/dev page for **cistern.studio**. It is the homepage of `apps/docs-astro` — the
existing full-viewport R3F scene stays, and this design adds the page shell around it:
floating overlay header, hero text lockup, CTA cluster, install line, minimal footer strip,
and a collapsed leva panel top-right. Docs are a separate page (Starlight); the header/CTA
links out to them, nothing on this page expands in place.

## About the design files
The files in this bundle are **design references created in HTML** — a prototype showing
intended look and behavior, not production code to copy. Recreate them in the target
codebase's environment: **Astro + React (`apps/docs-astro`)**, using its existing patterns.

Specifically:
- The DOM shell (header, hero, CTAs, footer) belongs in `src/pages/index.astro` or a new
  `src/components/home/` set, layered over the existing `<Fiber client:only="react" />`.
- **Do not port `cistern-scene.js`.** It is a throwaway vanilla-three mock built only so
  the layout could be judged against a moving scene. The real scene already exists:
  `components/r3f/Fiber.tsx` → `Scene.tsx` (`<Cistern>`, `<Suzi>`, `<ChangingCistern>`,
  `<Lights>`, `<ControlScene>`). Keep it. The design's only asks of the scene are framing
  and z-order (see *Scene integration*).
- Repo conventions apply: pnpm only, `three/webgpu` + `three/tsl` imports only, strict TS,
  changeset only if `packages/*` change (a docs-app-only change needs none).

## Fidelity
**High-fidelity** for the shell: final layout, spacing, type and hex values are given below and
should be matched. The 3D content behind it is **not** part of the spec — the mock's room,
pedestal and blob stand in for the real `<Cistern>` and `<Suzi>`.

Two things are explicitly unresolved and should not be treated as final:
1. **Accent color** — `#4fd6a8` in the file; the author has been trying `#7f9fe8`. Implement it
   as one CSS custom property (`--accent`) so it is a one-line change.
2. **Leva panel contents** — the panel in the mock is a static picture of leva with guessed
   folder names. The real one is the actual leva panel from `Fiber.tsx` / `Scene.tsx`;
   only its position and collapsed-by-default state are being specified.

## Screens / views

### 1. Desktop home (design id `1a`, authored at 1440×840)
Single viewport. Canvas is full-bleed and fills the window; every other element is absolutely
positioned over it. The page does not scroll.

**Stacking order (bottom → top)**
1. WebGPU canvas — `position: fixed; inset: 0`
2. Scrim — `position:absolute; inset:0; pointer-events:none;`
   `background: linear-gradient(100deg, rgba(11,10,9,0.94) 0%, rgba(11,10,9,0.70) 34%, rgba(11,10,9,0) 62%)`
3. Header, hero lockup, footer
4. Leva panel (leva's own root; keep it above the scrim)

**Header** — `height: 76px`, `padding: 0 40px`, flex, `justify-content: space-between`,
`align-items:center`, transparent (no bar, no blur).
- Left: mark + wordmark, `gap: 11px`.
  - Mark: 18×18 circle, `border: 1.5px solid var(--accent)`, containing a centered 7×7 circle,
    `border: 1.5px solid rgba(79,214,168,0.6)` (accent at 60%). Two concentric rings = the cistern.
  - Wordmark: Archivo 15px/600, `letter-spacing:-0.01em`. "cistern" at `#f2ede6`,
    ".studio" at `rgba(242,237,230,0.42)`.
- Right: nav, `gap: 28px`, IBM Plex Mono 12.5px, `letter-spacing:0.04em`,
  color `rgba(242,237,230,0.7)`, hover `#f2ede6`.
  Items: **Docs** → `/guides/getting-started/`, **Changelog**, **GitHub** →
  `https://github.com/DennisSmolek/cistern`.
  Then a version chip: `padding:5px 10px`, `border:1px solid rgba(242,237,230,0.16)`,
  `radius:4px`, 11.5px, text `v0.1.0` in `rgba(242,237,230,0.55)` + `wip` in accent.
  Wire the version to the published `@cistern/core` version rather than hard-coding it.

**Hero lockup** — absolutely positioned `left: 40px; top: 196px; width: 560px`,
flex column, `gap: 26px`.
- Eyebrow: IBM Plex Mono 12px, `letter-spacing:0.16em`, uppercase, accent.
  Copy: "Three.js geometry · mid-renovation"
- H1: Archivo 78px / `line-height:0.94` / 600, `letter-spacing:-0.035em`.
  "cistern" `#f2ede6` + ".studio" `rgba(242,237,230,0.38)`.
- Paragraph: Archivo 19px / 1.55, `rgba(242,237,230,0.72)`, `max-width:480px`, `text-wrap:pretty`.
  Copy: "Pass it a few params and it hands back a round geometry that already knows about panel
  materials and where its UVs went. The renderer is a work in progress. The geometry isn't."
- CTA block: flex column, `gap:14px`, `margin-top:6px`.
  - **Install pill** (row 1), `width: fit-content`, `border:1px solid rgba(79,214,168,0.45)`,
    `radius:5px`, `overflow:hidden`, `background:rgba(79,214,168,0.07)`.
    Text: IBM Plex Mono 15px, `padding:13px 18px`, `white-space:nowrap`; `$` in accent,
    command in `#f2ede6`. **COPY** button: full-height, `border-left:1px solid rgba(79,214,168,0.3)`,
    `background:rgba(79,214,168,0.10)`, accent text, Mono 12px, `letter-spacing:0.08em`,
    `padding:14px 15px`; hover `background:rgba(79,214,168,0.22)`.
    Command string in the mock is the author's verbatim `npm i cistern`. **Flag before shipping:**
    README's real install is `npm i @cistern/core three`, and the repo is pnpm-only. Confirm with
    the author which string ships.
    On click: copy to clipboard, swap label to `COPIED` for ~1.4s, then revert.
  - **Button row** (row 2), flex, `gap:12px`, all `radius:5px`, all 15px:
    - Primary "Edit live ↗" — `background: var(--accent)`, text `#0b0a09`, 600,
      `padding:13px 22px`; hover `#7fe6c2` (accent lightened). Points at the StackBlitz/CodeSandbox
      of `apps/starter` — URL still needed from the author.
    - Secondary "GitHub ↗" — transparent, `border:1px solid rgba(242,237,230,0.2)`, text `#f2ede6`,
      500, `padding:13px 22px`; hover `border-color: rgba(242,237,230,0.45)`.
    - Tertiary "Docs" — no border, `rgba(242,237,230,0.55)`, 500, `padding:13px 6px`;
      hover `#f2ede6`. → `/guides/getting-started/`.
    The `↗` glyph is Mono 13px, `gap:9px` from the label.

**Footer strip** — `height:56px`, `padding:0 40px`, flex, `space-between`,
`border-top:1px solid rgba(242,237,230,0.08)`,
`background: linear-gradient(rgba(11,10,9,0), rgba(11,10,9,0.7))`,
Mono 12px, `rgba(242,237,230,0.42)`.
Left: "MIT · three.js r169 · drag to orbit" — replace `r169` with the real three peer version and
drop "drag to orbit" if the camera isn't user-orbitable on the homepage.
Right: "built by smolek.dev", the link in accent → `https://smolek.dev`.

**Leva** — top-right, `top: 92px` (clears the header), `right: 32px`, width ~288px,
collapsed by default, above the scrim. Configure via leva's `<Leva collapsed titleBar={{position}} />`
rather than reproducing the mock's static markup.

### 2. Mobile home (design id `1c`, authored at 390×844)
Same content, stacked; canvas is no longer full-bleed.
- Canvas occupies the **top 46%** of the viewport, with a bottom-up fade over it:
  `linear-gradient(to top, rgba(11,10,9,0.95) 0%, rgba(11,10,9,0) 45%)`.
- Header 64px, `padding: 0 20px`. Mark 15px, wordmark 14px. Nav collapses to a two-line
  hamburger (two 20×1.5px bars, `gap:4px`, `rgba(242,237,230,0.7)`) — menu contents not designed;
  a simple sheet with Docs / Changelog / GitHub is fine.
- Content pane fills the remaining 54%: `padding: 26px 20px 0`, flex column, `gap: 20px`.
  - Eyebrow Mono 10.5px, `letter-spacing:0.16em`, uppercase, accent: "Parametric round geometry"
  - H1 46px / 0.9 / 600, `letter-spacing:-0.04em`, "cistern" and ".studio" on separate lines.
  - Paragraph 15.5px / 1.55, `rgba(242,237,230,0.7)`: "A few params in, a cylinder out — panel
    materials and sane UVs included. Renderer still under scaffolding."
  - Install pill: full width, `space-between`, same colors as desktop, text 14px.
  - Buttons: primary full-width `height:50px`; below it GitHub and Docs side by side,
    `flex:1` each, `gap:10px`, `height:50px`. All ≥44px tall.
  - Footer row pinned to the bottom of the pane (`flex:1` spacer above), `height:52px`,
    `border-top:1px solid rgba(242,237,230,0.08)`, Mono 11px: "MIT · v0.1.0" / "by smolek.dev".
- Leva: hide below 768px.

**Breakpoint:** switch at 768px. Between 768 and ~1100 keep the desktop structure but reduce
H1 to ~56px and the lockup width to ~440px.

## Scene integration
What the shell needs from the existing R3F scene:
- The canvas must sit under the DOM and stay interactive where the DOM does not cover it —
  the scrim is `pointer-events:none`; only the header/hero/footer elements capture pointer events.
- **Left third is reserved for text.** The mock composes the pedestal and its objects right of
  center; the real camera in `Fiber.tsx` (`position: [4, 2, 9], fov: 60`) currently centers them.
  Offset the camera target (or the group) so the cistern/Suzi read in the right ~55% of the frame
  on desktop, and re-center on mobile where the canvas is its own band.
- Background: `#141210` behind the scene, page background `#0b0a09`. `backgroundColor` is
  already a leva control in `Fiber.tsx` — set its default to `#141210`.
- Mobile canvas is 46vh, not 100vh — the camera framing should adapt on resize.
- The homepage scene is decorative. If WebGPU is unavailable, the shell must still render
  legibly over a flat `#141210` background; add a static fallback rather than an error.

## Interactions & behavior
- COPY button: clipboard write + 1.4s "COPIED" label swap. No toast.
- All hover transitions: `120ms ease` on `background`, `border-color`, `color`.
- Nav/footer links: no underline; color shift only.
- Focus: visible ring on every link and button — `outline: 2px solid var(--accent);
  outline-offset: 2px`. Not in the mock; required.
- `prefers-reduced-motion`: stop scene auto-rotation and pointer parallax.
- Nothing on this page navigates in place. Docs and Changelog are full page loads.

## State management
Almost none. Component-local only:
- `copied: boolean` for the install pill.
- `menuOpen: boolean` on mobile.
- Version string for the chip — read at build time in the Astro frontmatter from the published
  `@cistern/core` version rather than held in client state.
Scene state stays where it already lives (leva + the valtio `controlState`).

## Design tokens
```
--bg-page      #0b0a09
--bg-canvas    #141210
--ink          #f2ede6
--ink-72       rgba(242,237,230,0.72)   body copy
--ink-55       rgba(242,237,230,0.55)   tertiary
--ink-42       rgba(242,237,230,0.42)   ".studio", footer
--ink-38       rgba(242,237,230,0.38)   ".studio" in H1
--rule         rgba(242,237,230,0.08)   hairlines
--border       rgba(242,237,230,0.20)   secondary button
--border-hi    rgba(242,237,230,0.45)   its hover
--accent       #4fd6a8                  (candidate: #7f9fe8)
--accent-hi    #7fe6c2                  primary hover
--accent-08    rgba(79,214,168,0.07)    install pill fill
--accent-45    rgba(79,214,168,0.45)    install pill border

radius   3px chips · 4px version chip · 5px buttons + install pill · 26px mobile frame
spacing  6 · 9 · 11 · 12 · 14 · 20 · 26 · 28 · 40 px
```

**Type**
| Role | Family | Size / line-height / weight | Tracking |
| --- | --- | --- | --- |
| H1 desktop | Archivo | 78 / 0.94 / 600 | -0.035em |
| H1 mobile | Archivo | 46 / 0.90 / 600 | -0.040em |
| Lead | Archivo | 19 / 1.55 / 400 | — |
| Lead mobile | Archivo | 15.5 / 1.55 / 400 | — |
| Wordmark | Archivo | 15 / — / 600 | -0.01em |
| Buttons | Archivo | 15 / — / 500–600 | — |
| Eyebrow | IBM Plex Mono | 12 / — / 400 | 0.16em, uppercase |
| Nav | IBM Plex Mono | 12.5 / — / 400 | 0.04em |
| Install line | IBM Plex Mono | 15 / — / 400 | — |
| Footer / chip | IBM Plex Mono | 11–12 / — / 400 | — |

Archivo 400/500/600/700 and IBM Plex Mono 400/500, currently loaded from Google Fonts.
Self-host in `apps/docs-astro` (Fontsource or local `@font-face`) — Starlight already ships fonts
and the homepage should not block on a third-party request.

## Assets
None. The logo mark is two CSS circles; the `↗` is a text glyph. No images, no icon set.
Consider replacing `↗` with an inline SVG for consistent alignment across fonts.

## Open questions for the author
1. Accent: `#4fd6a8` or `#7f9fe8`?
2. Install string: `npm i cistern` (as written) or `npm i @cistern/core three` (as in the README)?
3. "Edit live" destination URL.
4. Does Changelog exist yet, or should it drop out of the nav for now?
5. Is the homepage camera user-orbitable? Affects the footer's "drag to orbit".

## Files in this bundle
| File | What it is |
| --- | --- |
| `Cistern Landing.dc.html` | The design. Contains `1a` (desktop, chosen), `1b` (an alternate lockup, not chosen), `1c` (mobile, chosen). |
| `cistern-scene.js` | Throwaway vanilla-three mock behind the frames. **Reference only — do not port.** |
| `support.js` | Runtime for the design file. Not part of the design. |

Open `Cistern Landing.dc.html` in a browser to see the live prototype.
