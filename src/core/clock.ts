/**
 * A pausable stopwatch based on timestamps.
 *
 * Instead of counting timer ticks (which drift), we remember:
 *  - how much time was "banked" during earlier runs (accumulatedMs), and
 *  - the timestamp when the current run started (runningSince).
 *
 * Elapsed time is then always: banked time + (now - runningSince).
 *
 * Every function takes `now` as an argument instead of reading the clock
 * itself. In the app we pass `performance.now()`; in tests we pass made-up
 * numbers, so we can test hours of breathing in milliseconds.
 *
 * The stopwatch is immutable: functions return a new object.
 */
export interface Stopwatch {
  /** Time collected during previous runs (before the last pause). */
  readonly accumulatedMs: number
  /** Timestamp when the current run started, or null while paused/stopped. */
  readonly runningSince: number | null
}

export function createStopwatch(): Stopwatch {
  return { accumulatedMs: 0, runningSince: null }
}

export function isRunning(stopwatch: Stopwatch): boolean {
  return stopwatch.runningSince !== null
}

/** Start (or resume) the stopwatch. Does nothing if it is already running. */
export function startStopwatch(stopwatch: Stopwatch, now: number): Stopwatch {
  if (isRunning(stopwatch)) return stopwatch
  return { accumulatedMs: stopwatch.accumulatedMs, runningSince: now }
}

/** Pause the stopwatch, banking the time of the current run. */
export function pauseStopwatch(stopwatch: Stopwatch, now: number): Stopwatch {
  if (!isRunning(stopwatch)) return stopwatch
  return { accumulatedMs: getElapsedMs(stopwatch, now), runningSince: null }
}

/** Total elapsed time in milliseconds at the moment `now`. */
export function getElapsedMs(stopwatch: Stopwatch, now: number): number {
  if (stopwatch.runningSince === null) return stopwatch.accumulatedMs
  // Math.max guards against a clock that appears to go backwards.
  return stopwatch.accumulatedMs + Math.max(0, now - stopwatch.runningSince)
}
