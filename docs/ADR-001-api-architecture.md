# ADR-001: Separation of LLM Credentials from Static Client

## Status
Accepted. Amended 2026-09-21: bring-your-own-key is now the default path (see Decision 3 and 4).

## Context
Touski was initially implemented with direct browser requests to the Anthropic Messages API (`https://api.anthropic.com/v1/messages`) using `anthropic-dangerous-direct-browser-access: true` and an API key injected at build time via `import.meta.env.VITE_ANTHROPIC_API_KEY`.

Because Touski is deployed statically to GitHub Pages (`https://polerix.github.io/touski/`), any `VITE_*` environment variable present during the Vite build is compiled directly into the client-side JavaScript bundle. This exposes the secret API key to anyone inspecting browser network traffic or viewing page source, enabling unauthorized usage, quota exhaustion, and billing exposure.

GitHub Pages is a static-only web host that does not provide serverless function runtimes or server-side execution environments.

## Decision
1. **Remove Build-Time API Key Embedding**: Completely remove `VITE_ANTHROPIC_API_KEY` from client code and build configurations. Ensure no credentials can be bundled into static assets.
2. **Introduce Server-Side Adapter Interface**: Create `src/api/mealPlannerAdapter.js` to decouple the meal planning UI from the underlying transport. The client delegates meal plan generation to a configured backend endpoint (`VITE_API_ENDPOINT` or `/api/mealplan`).
3. **Bring-your-own-key is the default.** With no backend endpoint configured (the default on GitHub Pages), the UI prompts the visitor for their own Anthropic API key instead of failing. The key is validated for shape, then kept only in the browser and sent only to `api.anthropic.com`.
4. **Key storage: forget by default, opt in to remember.** The key goes in `sessionStorage` (slot `touski_dev_api_key`) and is gone when the tab closes. A "Remember on this device" checkbox, off by default, stores it in `localStorage` instead. "Forget key" clears both. A key that Anthropic rejects with 401/403 is dropped automatically. The key is never logged, never placed in a URL, and never present in the build or in workflow environment. CI fails the deploy if a key-shaped literal reaches `dist/`.
5. **The proxy stays supported.** When `VITE_API_ENDPOINT` is set, requests go to that endpoint, the key box is hidden, and no visitor key is used. Moving to a Worker later needs a build variable, not a rewrite.

## Architectural Options Evaluated

### Option 1: Lightweight Serverless Proxy (Recommended for Cloud Hosting)
- **Implementation**: A single Cloudflare Worker, Vercel Serverless Function, or Netlify Edge Function holding `ANTHROPIC_API_KEY` securely in server-side environment secrets.
- **Pros**: Low latency, zero server maintenance, free tiers available, keeps frontend static.
- **Cons**: Requires hosting frontend or proxy outside standard GitHub Pages domain (or configuring CNAME).

### Option 2: Local Companion Sidecar (Recommended for Local Desktop / Self-Hosted)
- **Implementation**: A lightweight Node.js/Python server (e.g. Express, Hono, or FastAPI) running locally on `localhost:3001` that holds `.env` and serves the `/api/mealplan` route.
- **Pros**: Fully self-contained, no third-party cloud hosting needed.
- **Cons**: Requires running two processes during local use.

### Option 3: Visitor-Supplied Key (Chosen default)
- **Implementation**: A key panel takes the visitor's own key. It is held in `sessionStorage` by default, or `localStorage` if the visitor opts in to remember it.
- **Pros**: Works on static hosting with no backend, and the site owner holds no secret. Each visitor pays for and controls their own usage.
- **Cons**: The key is readable by scripts running on the origin and by anyone with access to the browser profile, so a remembered key is only appropriate on a trusted device. Requires the `anthropic-dangerous-direct-browser-access` header. Visitors need their own Anthropic account.

## Consequences
- **Security**: Production builds contain zero secret credentials.
- **Reliability**: Eliminates runtime rejections from Anthropic's browser safety controls.
- **Maintainability**: Clear separation between UI presentation and LLM orchestration.
