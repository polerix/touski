// Test helpers only. Deliberately fake, obviously non-secret key.
export const FAKE_KEY = 'sk-ant-TEST0000' + '0'.repeat(40)

export function fakeStorage({ throwOnSet = false } = {}) {
  const m = new Map()
  return {
    getItem: (k) => (m.has(k) ? m.get(k) : null),
    setItem: (k, v) => {
      if (throwOnSet) throw new Error('QuotaExceededError')
      m.set(k, String(v))
    },
    removeItem: (k) => void m.delete(k),
    _dump: () => [...m.values()],
  }
}

export function installStorage(opts) {
  globalThis.sessionStorage = fakeStorage(opts)
  globalThis.localStorage = fakeStorage(opts)
}
