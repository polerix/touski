# ADR-001: Separation of LLM Credentials from Static Client

## Status
Accepted

## Context
Touski was initially implemented with direct browser requests to the Anthropic Messages API (`https://api.anthropic.com/v1/messages`) using `anthropic-dangerous-direct-browser-access: true` and an API key injected at build time via `import.meta.env.VITE_ANTHROPIC_API_KEY`.

Because Touski is deployed statically to GitHub Pages (`https://polerix.github.io/touski/`), any `VITE_*` environment variable present during the Vite build is compiled directly into the client-side JavaScript bundle. This exposes the secret API key to anyone inspecting browser network traffic or viewing page source, enabling unauthorized usage, quota exhaustion, and billing exposure.

GitHub Pages is a static-only web host that does not provide serverless function runtimes or server-side execution environments.

## Decision
1. **Remove Build-Time API Key Embedding**: Completely remove `VITE_ANTHROPIC_API_KEY` from client code and build configurations. Ensure no credentials can be bundled into static assets.
2. **Introduce Server-Side Adapter Interface**: Create `src/api/mealPlannerAdapter.js` to decouple the meal planning UI from the underlying transport. The client delegates meal plan generation to a configured backend endpoint (`VITE_API_ENDPOINT` or `/api/mealplan`).
3. **Graceful Degraded State**: When no backend endpoint is configured (such as on default static GitHub Pages deployments), the UI displays a helpful configuration notice instead of failing cryptographically or leaking credentials.
4. **Local Development Key Storage**: For offline development or local testing without a backend, developers can supply an ephemeral session key (stored only in `sessionStorage` or provided via dialog), which is never committed to Git or baked into production bundles.

## Architectural Options Evaluated

### Option 1: Lightweight Serverless Proxy (Recommended for Cloud Hosting)
- **Implementation**: A single Cloudflare Worker, Vercel Serverless Function, or Netlify Edge Function holding `ANTHROPIC_API_KEY` securely in server-side environment secrets.
- **Pros**: Low latency, zero server maintenance, free tiers available, keeps frontend static.
- **Cons**: Requires hosting frontend or proxy outside standard GitHub Pages domain (or configuring CNAME).

### Option 2: Local Companion Sidecar (Recommended for Local Desktop / Self-Hosted)
- **Implementation**: A lightweight Node.js/Python server (e.g. Express, Hono, or FastAPI) running locally on `localhost:3001` that holds `.env` and serves the `/api/mealplan` route.
- **Pros**: Fully self-contained, no third-party cloud hosting needed.
- **Cons**: Requires running two processes during local use.

### Option 3: User-Supplied Ephemeral Key (Direct Local Dev)
- **Implementation**: Allow the developer to input an API key into a local settings modal saved only in browser `sessionStorage`.
- **Pros**: Works directly in browser without backend setup.
- **Cons**: Key is exposed in the browser's own memory (acceptable only for personal local development).

## Consequences
- **Security**: Production builds contain zero secret credentials.
- **Reliability**: Eliminates runtime rejections from Anthropic's browser safety controls.
- **Maintainability**: Clear separation between UI presentation and LLM orchestration.
