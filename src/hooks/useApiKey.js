import { useSyncExternalStore } from 'react'
import { keyMode, subscribeKey } from '../api/keyStore'

/** Current key location: 'none' | 'session' | 'device'. Re-renders when it changes. */
export function useApiKey() {
  return useSyncExternalStore(subscribeKey, keyMode)
}
