# 🍲 touski — Model 3000

> *"Tout ce qui reste"* — Québécois for "all that remains"

A weekly meal planner that thinks like a Canadian home chef. Give it your pantry, it gives you a full week of meals — lunches, suppers, touski leftover plans, and a shopping list for what's missing.

Built with the aesthetics of a 1970s Hamilton Beach food processor: beige body, dark brown panel, orange buttons, brushed steel carousel.

Live: [polerix.github.io/touski](https://polerix.github.io/touski/) (landing page, press LAUNCH) or straight to the app at [polerix.github.io/touski/app.html](https://polerix.github.io/touski/app.html).

---

## Features

- **Pantry-first planning** — paste items or upload your MyPantryTracker CSV export
- **Touski logic** — leftovers are planned intentionally, never wasted
- **No carb repeats** — never pasta two nights in a row
- **Vegetable reminders** — every supper calls out the veg
- **Weekend specials** — Saturday + Sunday get more ambitious meals
- **Shopping list** — only what you actually need to buy
- **Household scaling** — 2 or 3 people (Sophie coming home toggle 🙂)
- **Bring your own key** — no server, no account; your Anthropic key stays in your browser

---

## Setup

You need Node 20 or newer (what CI uses) and npm. You do not need an API key to install, run or build.

### 1. Clone

```bash
git clone https://github.com/polerix/touski.git
cd touski
```

### 2. Install

```bash
npm install
```

### 3. Run

```bash
npm run dev
```

The site is served under `/touski/` (see `base` in `vite.config.js`), so open:

- [http://localhost:5173/touski/](http://localhost:5173/touski/) — the landing page
- [http://localhost:5173/touski/app.html](http://localhost:5173/touski/app.html) — the app

The first time you plan a week, the app asks for your API key. See below.

---

## Your API key

Touski is a static site with no backend. To plan a week it calls Claude straight from your browser using **your own Anthropic API key**. Get one at [console.anthropic.com](https://console.anthropic.com).

### How it behaves

- **Entry.** On first open you get a key box. The field is masked; Show / Hide reveals it. Paste the key and press **Use key** (or Enter). Pressing the orange button with no key just brings you back to this box.
- **Checked at entry.** The key must start with `sk-ant-`, be at least 40 characters, use only letters, digits, `-` and `_`, and contain no spaces. If it fails you get a message and nothing is stored. This is a shape check only; Anthropic validates the key the first time you use it.
- **Forgotten by default.** The key goes in `sessionStorage`: it survives a reload and is gone when the tab closes.
- **Remember on this device.** Unchecked by default. Tick it before pressing Use key and the key goes in `localStorage` instead, so you do not paste it again. It stays until you forget it. Only do this on a device you trust.
- **Forget key.** Once a key is set, the key box turns into a status line ("held for this tab only" or "remembered on this device") with a **Forget key** button. It clears both stores.
- **Rejected keys.** If Anthropic answers 401 or 403, Touski deletes the key from both stores and shows the key box again with a message.

Both stores use the slot `touski_dev_api_key`.

### Where the key goes

Only into the `x-api-key` header of the request to `https://api.anthropic.com/v1/messages`, sent together with `anthropic-dangerous-direct-browser-access: true`, the header Anthropic requires for browser calls. It is never sent to GitHub, never logged, never put in a URL, and never stored in this repository.

There is no key at build time. Do not put one in a `.env` file or a `VITE_*` variable: Vite compiles `VITE_*` values into the public JavaScript. CI fails the deploy if `sk-ant-` followed by 20 or more key characters, or `VITE_ANTHROPIC`, shows up in `dist/`.

### One caveat

Browser storage is scoped to the origin (scheme, host and port), not the path. Every site hosted under `polerix.github.io` shares one origin, so JavaScript running on any other site of mine there can read a remembered key. It can also read the session copy if you open that site in the same tab. If you use Remember, create a dedicated key with a low monthly spend limit in the Anthropic console, and delete it if you stop using the app. The proper fix is the proxy below, where the key never reaches a browser.

---

## Optional: backend proxy

Set `VITE_API_ENDPOINT` at build time and Touski stops using visitor keys entirely. The key box is hidden, no key is read from storage (a stored one is ignored), and each plan is a `POST` of JSON to that URL with only a `Content-Type` header, no credentials. Your server holds the Anthropic key.

Take this route if you ever want other people using it on your credits.

**Request body**

```json
{ "pantryItems": ["..."], "household": "2", "cookingStyle": "casual", "weekStart": "2026-09-21" }
```

`household` is `"2"` or `"3"`, `cookingStyle` is `casual`, `adventurous` or `quick`, `weekStart` is `YYYY-MM-DD`. `pantryItems` is the full list, not capped.

**Response.** JSON, either the plan itself or `{ "plan": { ... } }`:

```json
{
  "days": [{ "day": "Monday", "lunch": { "name": "", "desc": "" }, "supper": { "name": "", "desc": "" }, "touski": "" }],
  "shopping_list": [{ "item": "", "category": "produce|dairy|meat|pantry|other", "reason": "" }],
  "chef_notes": ""
}
```

On failure return a non-2xx status with `{ "error": "message" }`. `error` must be a string; it is shown as-is.

**The proxy has to bring its own prompt.** The client sends only the inputs above. The system prompt, model and token limit live in `generateWithDirectKey` in `src/api/mealPlannerAdapter.js` and are not sent to a proxy, so copy them to the server.

**Wiring it up**

- Locally: put `VITE_API_ENDPOINT=https://your-proxy.example/plan` in `.env.local` (gitignored), then `npm run dev`.
- On GitHub Pages: `deploy.yml` does not pass it today. Add a repository **variable** (not a secret; the URL ships in the JavaScript anyway) and add `env: VITE_API_ENDPOINT: ${{ vars.VITE_API_ENDPOINT }}` to the Build Project step.
- The proxy must answer CORS preflight and allow `https://polerix.github.io`.

Because the URL is public, an unprotected proxy is an open tap on your account. Restrict it to that origin, rate-limit it, and set a spend cap on the key. A Cloudflare Worker is a good fit. See [ADR-001](docs/ADR-001-api-architecture.md) for the reasoning.

---

## Usage

1. Enter your API key when asked (first time only, or every tab if you left Remember off)
2. Click **"Load my pantry"** to use the built-in sample inventory, or paste your own items (one per line), or upload a CSV exported from MyPantryTracker
3. Set your household size and cooking style
4. Pick the week start date (defaults to current Monday)
5. Press the orange **Plan My Week** button
6. Scroll the brushed-steel carousel to see all 7 days
7. Check the shopping list for what to grab at the store

With your own key, only the first 80 pantry items are sent to Claude.

### MyPantryTracker CSV export

Export from [app.mypantrytracker.com](https://app.mypantrytracker.com) → Reports → Excel/CSV. The app reads the `name` column automatically, and refuses a file that has no `name` column.

---

## Customizing

- **Pantry defaults.** Edit `src/samplePantry.js` to replace the built-in sample with your own permanent pantry staples.
- **Household and rules.** The household names (Paul-Éric, Charlo, Sophie) and the meal-planning rules are hardcoded. The labels are in `src/components/ControlPanel.jsx`; the prompt, model (`claude-sonnet-5`) and `max_tokens` (2200) are in `src/api/mealPlannerAdapter.js`.

---

## Build, test, deploy

```bash
npm run build     # output in dist/: index.html (landing) and app.html (the app)
npm run preview   # serves dist/ at http://localhost:4173/touski/
npm test          # key-handling and API-call tests: no network, fake keys only
```

`dist/` contains no credentials. Each visitor supplies their own key in the browser (see [Your API key](#your-api-key)).

Every push to `master` runs `.github/workflows/deploy.yml`: tests, build, the credential check on `dist/`, then deploy to GitHub Pages. If the check finds a key-shaped string, nothing is published.

---

## Stack

- [React 18](https://react.dev) + [Vite 5](https://vite.dev)
- [Anthropic Claude API](https://docs.anthropic.com) (Messages API, called from the browser) — `claude-sonnet-5`
- Plain CSS in `src/styles/touski.css`
- Playfair Display · Barlow Condensed · JetBrains Mono, loaded from Google Fonts
- `src/components/LiquidGlassFilters.jsx` defines SVG lens filters (`feDisplacementMap`), but no CSS references them at the moment, so the effect is not applied

---

## Roadmap

- [ ] Persistent meal plan history (localStorage)
- [ ] Export week plan as PDF
- [ ] Direct MyPantryTracker API sync (when available)
- [ ] Recipe detail expansion (ingredients + steps)
- [ ] Nutritional awareness mode

---

*Made with ❤️ in Moncton, NB*
