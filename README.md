# 🍲 touski — Model 3000

> *"Tout ce qui reste"* — Québécois for "all that remains"

A weekly meal planner that thinks like a Canadian home chef. Give it your pantry, it gives you a full week of meals — lunches, suppers, touski leftover plans, and a shopping list for what's missing.

Built with the aesthetics of a 1970s Hamilton Beach food processor: beige body, dark brown panel, orange liquid-glass buttons, brushed steel carousel.

![touski screenshot](./public/screenshot.png)

---

## Features

- **Pantry-first planning** — paste items or upload your MyPantryTracker CSV export
- **Touski logic** — leftovers are planned intentionally, never wasted
- **No carb repeats** — never pasta two nights in a row
- **Vegetable reminders** — every supper calls out the veg
- **Weekend specials** — Saturday + Sunday get more ambitious meals
- **Shopping list** — only what you actually need to buy
- **Household scaling** — 2 or 3 people (Sophie coming home toggle 🙂)
- **Liquid glass UI** — SVG `feDisplacementMap` lensing on all controls

---

## Setup

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

Open [http://localhost:5173](http://localhost:5173)

---

## Your API key

Touski runs entirely in your browser and has no server. To plan a week it calls Claude with **your own Anthropic API key**, which you paste into the key box the first time you open the app. Get a key at [console.anthropic.com](https://console.anthropic.com).

- **The key stays in your browser.** It is sent only to `api.anthropic.com`, in the request that plans your week. It is never sent to GitHub, never stored in this repository, and never built into the site's code.
- **By default it is forgotten.** The key is held for the current tab only and disappears when you close the tab.
- **Remember on this device** (unchecked by default) keeps the key in this browser's local storage so you do not have to paste it again. Only use it on a device you trust.
- **Forget key** clears it from both places at any time.
- Keys are checked for shape when you enter them (they start with `sk-ant-`). Anthropic checks the key itself when you plan a week; if it is rejected, Touski drops it and asks again.
- Anyone with access to your browser profile can read a remembered key. Set a spend limit on the key in the Anthropic console.

There is no `.env` file and nothing to configure at build time. Do not put a key in `VITE_*` variables: Vite compiles them into the public JavaScript.

### Optional: backend proxy

If you would rather not paste a key into a browser, set `VITE_API_ENDPOINT` at build time to a server you run (a Cloudflare Worker, for example) that holds the key and accepts `{ pantryItems, household, cookingStyle, weekStart }`. When it is set, Touski hides the key box and sends requests there instead. See [ADR-001](docs/ADR-001-api-architecture.md).

---

## Usage

1. Click **"Load my pantry"** to use the built-in sample inventory, or paste your own items (one per line), or upload a CSV exported from MyPantryTracker
2. Set your household size and cooking style
3. Pick the week start date (defaults to current Monday)
4. Press the orange button
5. Scroll the brushed-steel carousel to see all 7 days
6. Check the shopping list for what to grab at the store

### MyPantryTracker CSV export

Export from [app.mypantrytracker.com](https://app.mypantrytracker.com) → Reports → Excel/CSV. The app reads the `name` column automatically.

---

## Customizing your pantry defaults

Edit `src/samplePantry.js` to replace the built-in sample with your own permanent pantry staples.

---

## Build for production

```bash
npm run build
```

Output is in `/dist`. It contains no credentials: each visitor supplies their own key in the browser (see [Your API key](#your-api-key)). CI fails the deploy if a key-shaped string reaches `dist/`.

```bash
npm test
```

Runs the key-handling and API-call tests (no network, fake keys only).

---

## Stack

- [React 18](https://react.dev) + [Vite](https://vite.dev)
- [Anthropic Claude API](https://docs.anthropic.com) — `claude-sonnet-5`
- Pure CSS liquid glass (SVG `feDisplacementMap` + `backdrop-filter`)
- Playfair Display · Barlow Condensed · JetBrains Mono

---

## Roadmap

- [ ] Persistent meal plan history (localStorage)
- [ ] Export week plan as PDF
- [ ] Direct MyPantryTracker API sync (when available)
- [ ] Recipe detail expansion (ingredients + steps)
- [ ] Nutritional awareness mode

---

*Made with ❤️ in Moncton, NB*


## Deployment & Repository Status
{}

