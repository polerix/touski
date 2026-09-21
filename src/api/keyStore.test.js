import { test, beforeEach } from 'node:test'
import assert from 'node:assert/strict'
import { FAKE_KEY, installStorage } from './testSupport.js'
import { validateKey, saveKey, getApiKey, keyMode, forgetKey, subscribeKey, KEY_SLOT } from './keyStore.js'

beforeEach(() => installStorage())

test('validateKey rejects empty, wrong prefix, short, whitespace and bad characters', () => {
  assert.equal(validateKey('').ok, false)
  assert.equal(validateKey(undefined).ok, false)
  assert.match(validateKey('not-a-key-' + 'x'.repeat(60)).error, /start with sk-ant-/)
  assert.match(validateKey('sk-ant-TEST0000').error, /too short/)
  assert.match(validateKey(FAKE_KEY + ' ' + FAKE_KEY).error, /spaces/)
  assert.match(validateKey(FAKE_KEY.slice(0, 30) + '!!!' + '0'.repeat(20)).error, /not allowed/)
})

test('validateKey accepts a well-formed key and trims surrounding whitespace', () => {
  const r = validateKey(`  ${FAKE_KEY}\n`)
  assert.equal(r.ok, true)
  assert.equal(r.key, FAKE_KEY)
})

test('default save is tab-only: sessionStorage, nothing in localStorage', () => {
  assert.equal(saveKey(FAKE_KEY).ok, true)
  assert.equal(sessionStorage.getItem(KEY_SLOT), FAKE_KEY)
  assert.equal(localStorage.getItem(KEY_SLOT), null)
  assert.equal(keyMode(), 'session')
  assert.equal(getApiKey(), FAKE_KEY)
})

test('remember promotes to localStorage and leaves no session copy', () => {
  saveKey(FAKE_KEY)
  assert.equal(saveKey(FAKE_KEY, { remember: true }).ok, true)
  assert.equal(localStorage.getItem(KEY_SLOT), FAKE_KEY)
  assert.equal(sessionStorage.getItem(KEY_SLOT), null)
  assert.equal(keyMode(), 'device')
})

test('saving again without remember demotes and clears the device copy', () => {
  saveKey(FAKE_KEY, { remember: true })
  saveKey(FAKE_KEY)
  assert.equal(localStorage.getItem(KEY_SLOT), null)
  assert.equal(keyMode(), 'session')
})

test('forgetKey clears both stores', () => {
  saveKey(FAKE_KEY, { remember: true })
  sessionStorage.setItem(KEY_SLOT, FAKE_KEY) // simulate a stray second copy
  forgetKey()
  assert.equal(getApiKey(), null)
  assert.equal(keyMode(), 'none')
  assert.deepEqual([...sessionStorage._dump(), ...localStorage._dump()], [])
})

test('an invalid key is never written', () => {
  assert.equal(saveKey('sk-ant-short').ok, false)
  assert.deepEqual([...sessionStorage._dump(), ...localStorage._dump()], [])
})

test('blocked storage returns an error instead of throwing', () => {
  installStorage({ throwOnSet: true })
  const r = saveKey(FAKE_KEY)
  assert.equal(r.ok, false)
  assert.match(r.error, /blocking storage/)
})

test('missing storage entirely reads as no key', () => {
  delete globalThis.sessionStorage
  delete globalThis.localStorage
  assert.equal(getApiKey(), null)
  assert.equal(keyMode(), 'none')
  assert.equal(saveKey(FAKE_KEY).ok, false)
})

test('subscribers fire on save and forget', () => {
  let n = 0
  const off = subscribeKey(() => n++)
  saveKey(FAKE_KEY)
  forgetKey()
  off()
  saveKey(FAKE_KEY)
  assert.equal(n, 2)
})
