import { useEffect, useRef } from 'react'

/**
 * Moves keyboard focus to an element when it appears (if `enabled`).
 * We use it to focus a screen's heading after navigating, so screen reader
 * users hear where they have arrived.
 */
export function useAutoFocus<T extends HTMLElement>(enabled: boolean) {
  const ref = useRef<T>(null)
  useEffect(() => {
    if (enabled) ref.current?.focus()
  }, [enabled])
  return ref
}
