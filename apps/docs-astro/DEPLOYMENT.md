# Cistern Docs Deployment (Cloudflare Workers)

This app (`apps/docs-astro`) is a static Astro + Starlight site. We deploy it to Cloudflare Workers Static Assets using Wrangler.

- Cloudflare guide referenced: [Astro on Cloudflare Workers](https://developers.cloudflare.com/workers/framework-guides/web-apps/astro/)

## Prerequisites

- Cloudflare Account and a target domain connected to your account
- A Cloudflare API Token with `Account:Workers Scripts` (Edit) and `Account:Workers KV` (Read) permissions is recommended
- Your Cloudflare Account ID

## Repository configuration (one-time)

1. Wrangler config lives at `apps/docs-astro/wrangler.toml` and is set up for static assets (no SSR).
2. Add GitHub secrets in your repository settings:
    - `CF_API_TOKEN`: Cloudflare API Token
    - `CF_ACCOUNT_ID`: Cloudflare Account ID
3. The GitHub Actions workflow `.github/workflows/deploy-docs.yml` builds the monorepo, then deploys the docs app.

## CI/CD deployment

- On push to `main` that touches docs or packages, the workflow will:
    1. Install monorepo deps via pnpm
    2. Build workspace packages
    3. Build `apps/docs-astro` (static SSG output to `dist/`)
    4. Deploy using Wrangler with the config in `apps/docs-astro/wrangler.toml`

To trigger manually: Actions → "Deploy Docs (Cloudflare Workers)" → Run workflow.

## Local preview and deploy

From repo root:

```bash
pnpm install
pnpm -w -r run build
cd apps/docs-astro
pnpm run dev           # local dev server
pnpm run build         # build to ./dist
pnpm run deploy        # build + deploy via Wrangler
```

The `deploy` script uses `npx wrangler@latest deploy`, which will prompt to log in if needed. For CI, environment variables `CLOUDFLARE_API_TOKEN` and `CLOUDFLARE_ACCOUNT_ID` are provided via GitHub Secrets.

## Custom domain routing

You can bind a custom domain either via the Cloudflare Dashboard after first deploy, or define routes in `wrangler.toml` (commented example inside). Using dashboard is typically simpler.

## SSR vs SSG

This project currently ships as a static site (SSG). If you later require on-demand rendering (SSR):

1. Add the adapter: `pnpm --filter apps/docs-astro astro add cloudflare`
2. Wrangler will need `main = "./dist/_worker.js/index.js"` and `compatibility_flags = ["nodejs_compat"]`
3. Follow the SSR section in the Cloudflare guide linked above.
