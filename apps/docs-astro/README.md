# Cistern Docs (`apps/docs-astro`)

The [cistern.studio](https://cistern.studio) site: an Astro + Starlight docs site whose `/` route
is a full-viewport WebGPU React Three Fiber demo scene, with narrative docs and API reference under
`/docs/`, `/guides/`, `/examples/`, and `/reference/`.

## Commands (run from this directory, or via `pnpm --filter apps-docs-astro <script>` from the repo root)

```bash
pnpm dev        # local dev server at localhost:4321
pnpm build       # build the static site to ./dist
pnpm preview      # preview the production build locally
pnpm astro check   # typecheck Astro/MDX content and components
```

From the repo root you can also use `pnpm dev:docs` to start this app.

## Deployment

Deploys to **Cloudflare Workers** (static assets) via Wrangler, wired up in
[`.github/workflows/deploy-docs.yml`](../../.github/workflows/deploy-docs.yml) — that workflow is
path-filtered to only run when files under `apps/docs-astro/**` (or the workflow file itself)
change, and it deploys using this app's `wrangler.toml`. Binding the custom domain
(`cistern.studio`) is done once in the Cloudflare dashboard, not in code.

Full setup, secrets, and manual-deploy instructions live in
[`DEPLOYMENT.md`](./DEPLOYMENT.md) — read that rather than this file for anything deployment
related.
