/**
 * Browser-side Anthropic API key storage (bring-your-own-key).
 *
 * The key lives only in this browser. By default it goes in sessionStorage and
 * is gone when the tab closes; "remember" promotes it to localStorage. It is
 * never logged, never placed in a URL, and only ever read by the adapter to
 * call api.anthropic.com.
 */

// Same slot the adapter has always read, so existing sessions keep working.
export const KEY_SLOT = 'touski_dev_api_key'

const KEY_PREFIX = 'sk-ant-'
const MIN_KEY_LENGTH = 40
const KEY_CHARS = /^[A-Za-z0-9_-]+$/

const listeners = new Set()

function area(name) {
  // Accessing the storage object itself can throw (blocked cookies, sandboxed frames).
  try {
    return globalThis[name] || null
  } catch {
    return null
  }
}

function read(name) {
  try {
    return area(name)?.getItem(KEY_SLOT) || null
  } catch {
    return null
  }
}

function write(name, value) {
  const store = area(name)
  if (!store) throw new Error('storage unavailable')
  store.setItem(KEY_SLOT, value)
}

function remove(name) {
  try {
    area(name)?.removeItem(KEY_SLOT)
  } catch {
    // nothing to clear if the store is unreachable
  }
}

function notify() {
  listeners.forEach((fn) => fn())
}

/** Shape check only. A well-formed key can still be rejected by Anthropic. */
export function validateKey(raw) {
  const key = typeof raw === 'string' ? raw.trim() : ''
  if (!key) return { ok: false, error: 'Paste your Anthropic API key.' }
  if (/\s/.test(key)) return { ok: false, error: 'The key contains spaces or line breaks. Paste just the key.' }
  if (!key.startsWith(KEY_PREFIX)) {
    return { ok: false, error: `That does not look like an Anthropic key. They start with ${KEY_PREFIX}` }
  }
  if (key.length < MIN_KEY_LENGTH) {
    return { ok: false, error: 'That key is too short. It may have been cut off when copying.' }
  }
  if (!KEY_CHARS.test(key)) {
    return { ok: false, error: 'The key has characters that are not allowed. Copy it again from the console.' }
  }
  return { ok: true, key }
}

/** Where the key currently lives: 'none' | 'session' | 'device'. */
export function keyMode() {
  if (read('sessionStorage')) return 'session'
  if (read('localStorage')) return 'device'
  return 'none'
}

export function getApiKey() {
  return read('sessionStorage') || read('localStorage')
}

/**
 * Validate and store a key. Default is tab-only; `remember` keeps it on this device.
 * Returns { ok: true } or { ok: false, error }. The key is never echoed back.
 */
export function saveKey(raw, { remember = false } = {}) {
  const checked = validateKey(raw)
  if (!checked.ok) return checked

  const target = remember ? 'localStorage' : 'sessionStorage'
  const other = remember ? 'sessionStorage' : 'localStorage'
  try {
    write(target, checked.key)
  } catch {
    return { ok: false, error: 'This browser is blocking storage, so the key cannot be kept. Check your privacy settings.' }
  }
  // Never leave a second copy behind in the store the user did not choose.
  remove(other)
  notify()
  return { ok: true }
}

/** Clear the key from both stores. */
export function forgetKey() {
  remove('sessionStorage')
  remove('localStorage')
  notify()
}

/** For useSyncExternalStore. Also reacts to changes made in other tabs. */
export function subscribeKey(fn) {
  listeners.add(fn)
  const onStorage = (e) => {
    if (e.key === null || e.key === KEY_SLOT) fn()
  }
  if (typeof window !== 'undefined') window.addEventListener('storage', onStorage)
  return () => {
    listeners.delete(fn)
    if (typeof window !== 'undefined') window.removeEventListener('storage', onStorage)
  }
}
