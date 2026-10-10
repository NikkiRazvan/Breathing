/**
 * Short vibrations using the Vibration API.
 * Supported on most Android browsers; not on iPhone/iPad (Safari ignores it).
 */

export function isVibrationSupported(): boolean {
  return typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function'
}

export function vibrate(pattern: number | number[]): void {
  if (!isVibrationSupported()) return
  try {
    navigator.vibrate(pattern)
  } catch {
    // Some browsers throw if vibration is blocked; it's only a nice-to-have.
  }
}

export const PHASE_VIBRATION = 60
export const COMPLETE_VIBRATION = [80, 120, 80]
