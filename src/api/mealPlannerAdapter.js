/**
 * Meal Planner Adapter Interface
 *
 * Provides transport abstraction for meal plan generation.
 * Prevents embedding sensitive API keys in client-side production bundles.
 * See docs/ADR-001-api-architecture.md for deployment architecture options.
 */

export async function generateMealPlan({ pantryItems, household, cookingStyle, weekStart }) {
  const apiEndpoint = import.meta.env.VITE_API_ENDPOINT

  // Option 1: Backend proxy endpoint configured (preferred for production/self-hosted)
  if (apiEndpoint) {
    const resp = await fetch(apiEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        pantryItems,
        household,
        cookingStyle,
        weekStart,
      }),
    })

    if (!resp.ok) {
      const err = await resp.json().catch(() => ({}))
      throw new Error(err.error || `Proxy error ${resp.status}`)
    }

    const data = await resp.json()
    return data.plan || data
  }

  // Option 2: Ephemeral developer key in sessionStorage (for local developer sandbox only)
  const devSessionKey = typeof window !== 'undefined' ? window.sessionStorage.getItem('touski_dev_api_key') : null
  if (devSessionKey) {
    return generateWithDirectKey({
      apiKey: devSessionKey,
      pantryItems,
      household,
      cookingStyle,
      weekStart,
    })
  }

  // Fallback: Inform user that backend proxy is required
  throw new Error(
    'Backend API endpoint not configured. Touski is a static client application that requires a server-side proxy to protect API credentials. See docs/ADR-001-api-architecture.md for configuration instructions.'
  )
}

/**
 * Direct Anthropic call used exclusively with ephemeral session keys for local testing.
 */
async function generateWithDirectKey({ apiKey, pantryItems, household, cookingStyle, weekStart }) {
  const styleDesc = {
    casual: 'casual Québécois/Canadian home cooking with comfort food favourites',
    adventurous: 'adventurous multicultural cooking mixing Asian, French-Canadian and international dishes',
    quick: 'quick 30-minute weeknights with more elaborate weekend cooking',
  }[cookingStyle] || 'casual Québécois/Canadian home cooking'

  const householdDesc =
    household === '2'
      ? 'two adult men, Paul-Éric and his son Charlo — meals for 2 with intentionally planned leftovers (called "Touski", short for "tout ce qui reste" — Québécois for "all that remains")'
      : 'three adults — Paul-Éric, his son Charlo, and Sophie (recently returned) — slightly larger portions with less leftover planning needed'

  const systemPrompt = `You are touski, an expert home chef meal planner. Think like a real Canadian home cook, not a recipe blogger.

HOUSEHOLD: ${householdDesc}
COOKING STYLE: ${styleDesc}

RULES (strict):
1. Every supper must include a STARCH (rice/pasta/potato/bread), a PROTEIN, and a VEGETABLE. Always name the vegetable — the user forgets them.
2. Never repeat the same starch base on consecutive supper days (no pasta Monday AND Tuesday).
3. touski PLANNING: If a supper produces leftovers, name what they become for the next day's lunch. Plan this intentionally.
4. Weekday lunches: simple — sandwiches, canned soup, ramen, touski leftovers. Dagwood sandwich = 2-3 lunches from one big prep.
5. Weekday suppers: 30-45 min max. Friday supper can be slightly special.
6. Saturday + Sunday suppers: more elaborate, worth the effort — roast, curry, fondue, slow cook, etc.
7. Use pantry items creatively. Note when fresh produce or proteins are needed.
8. French-Canadian items (pain de viande, Bovril, Bistro express, etc.) are entirely normal — embrace them.

PANTRY AVAILABLE: ${pantryItems.slice(0, 80).join(', ')}

Respond ONLY with a valid JSON object, no markdown, no explanation:
{
  "days": [
    {
      "day": "Monday",
      "lunch": { "name": "...", "desc": "brief 1-line description" },
      "supper": { "name": "...", "desc": "mention the starch, protein, and vegetable" },
      "touski": "what the leftovers become tomorrow, or null"
    }
  ],
  "shopping_list": [
    { "item": "...", "category": "produce|dairy|meat|pantry|other", "reason": "which meal needs it" }
  ],
  "chef_notes": "1-2 sentence practical tip for the week"
}`

  const resp = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      'anthropic-dangerous-direct-browser-access': 'true',
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 2200,
      system: systemPrompt,
      messages: [
        {
          role: 'user',
          content: `Plan my week starting ${weekStart}. Make it feel genuinely home-cooked and practical.`,
        },
      ],
    }),
  })

  if (!resp.ok) {
    const err = await resp.json().catch(() => ({}))
    throw new Error(err.error?.message || `API error ${resp.status}`)
  }

  const data = await resp.json()
  const raw = data.content?.map((b) => b.text || '').join('').trim()
  const clean = raw.replace(/```json|```/g, '').trim()
  return JSON.parse(clean)
}
