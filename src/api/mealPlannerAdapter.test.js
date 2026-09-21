import { test, beforeEach, afterEach } from 'node:test'
import assert from 'node:assert/strict'
import { FAKE_KEY, installStorage } from './testSupport.js'
import { saveKey } from './keyStore.js'
import { generateMealPlan, ApiKeyError } from './mealPlannerAdapter.js'

const args = { pantryItems: ['rice'], household: '2', cookingStyle: 'casual', weekStart: '2026-09-21' }
const realFetch = globalThis.fetch
let calls

beforeEach(() => {
  installStorage()
  calls = []
})
afterEach(() => {
  globalThis.fetch = realFetch
})

function stubFetch(status, body) {
  globalThis.fetch = async (url, init) => {
    calls.push({ url, init })
    return { ok: status < 400, status, json: async () => body }
  }
}

test('with no key it throws NO_KEY and makes no network call', async () => {
  stubFetch(200, {})
  await assert.rejects(generateMealPlan(args), (e) => e instanceof ApiKeyError && e.code === 'NO_KEY')
  assert.equal(calls.length, 0)
})

test('with a key it calls only api.anthropic.com, key in x-api-key, model claude-sonnet-5', async () => {
  saveKey(FAKE_KEY)
  stubFetch(200, { content: [{ text: '{"days":[],"shopping_list":[],"chef_notes":"ok"}' }] })
  const plan = await generateMealPlan(args)
  assert.equal(plan.chef_notes, 'ok')
  assert.equal(calls.length, 1)
  const { url, init } = calls[0]
  assert.equal(url, 'https://api.anthropic.com/v1/messages')
  assert.equal(init.headers['x-api-key'], FAKE_KEY)
  assert.equal(JSON.parse(init.body).model, 'claude-sonnet-5')
  assert.ok(!url.includes(FAKE_KEY), 'key must never appear in the URL')
  assert.ok(!init.body.includes(FAKE_KEY), 'key must never appear in the request body')
})

test('a 401 becomes INVALID_KEY with a fixed message that does not echo the key', async () => {
  saveKey(FAKE_KEY)
  stubFetch(401, { error: { message: 'invalid x-api-key' } })
  await assert.rejects(generateMealPlan(args), (e) => {
    return e instanceof ApiKeyError && e.code === 'INVALID_KEY' && !e.message.includes(FAKE_KEY)
  })
})

test('other API failures stay ordinary errors', async () => {
  saveKey(FAKE_KEY)
  stubFetch(529, { error: { message: 'Overloaded' } })
  await assert.rejects(generateMealPlan(args), (e) => !(e instanceof ApiKeyError) && /Overloaded/.test(e.message))
})
