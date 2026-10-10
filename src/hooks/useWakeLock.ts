import { useEffect } from 'react'

/**
 * Keeps the screen from turning off while `active` is true, using the
 * Screen Wake Lock API (where supported). The browser drops the lock when the
 * page is hidden, so we ask again when it becomes visible.
 */
export function useWakeLock(active: boolean): void {
  useEffect(() => {
    if (!active || !('wakeLock' in navigator)) return

    let sentinel: WakeLockSentinel | null = null
    let cancelled = false

    const request = async () => {
      if (document.visibilityState !== 'visible') return
      try {
        const lock = await navigator.wakeLock.request('screen')
        if (cancelled) {
          void lock.release()
        } else {
          sentinel = lock
        }
      } catch {
        // Can fail e.g. in battery saver mode. Not critical, so we ignore it.
      }
    }

    const onVisibilityChange = () => {
      if (document.visibilityState === 'visible' && (sentinel === null || sentinel.released)) {
        void request()
      }
    }

    void request()
    document.addEventListener('visibilitychange', onVisibilityChange)

    return () => {
      cancelled = true
      document.removeEventListener('visibilitychange', onVisibilityChange)
      void sentinel?.release().catch(() => {})
    }
  }, [active])
}
