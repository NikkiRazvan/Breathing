/**
 * Pure breathing logic: given how much time has passed, work out which phase
 * we are in, how far through it we are, and how many cycles are done.
 *
 * Nothing in this file reads the clock or touches the screen, which makes it
 * easy to unit test.
 */

export type PhaseId = 'inhale' | 'holdFull' | 'exhale' | 'holdEmpty'

/** The order of the four phases in one cycle (top, right, bottom, left of the box). */
export const PHASES: readonly PhaseId[] = ['inhale', 'holdFull', 'exhale', 'holdEmpty']

export const PHASE_LABELS: Record<PhaseId, string> = {
  inhale: 'Breathe in',
  holdFull: 'Hold',
  exhale: 'Breathe out',
  holdEmpty: 'Hold',
}

/** Seconds for each phase. A hold may be 0, which means "skip this phase". */
export type BreathingPattern = Record<PhaseId, number>

export type SessionLength =
  | { kind: 'cycles'; cycles: number }
  | { kind: 'minutes'; minutes: number }
  | { kind: 'unlimited' }

export interface BreathingState {
  phase: PhaseId
  /** Position of the phase in PHASES (0 = inhale ... 3 = hold empty). */
  phaseIndex: number
  /** Milliseconds spent in the current phase so far. */
  phaseElapsedMs: number
  phaseDurationMs: number
  /** 0 at the start of the phase, approaching 1 at its end. */
  phaseProgress: number
  /** Whole seconds left in this phase, for the countdown (4, 3, 2, 1). */
  secondsLeft: number
  /** Zero-based index of the cycle we are in. Also = number of finished cycles. */
  cycleIndex: number
  /** 0 at the start of a cycle, approaching 1 at its end. */
  cycleProgress: number
  /**
   * A number that goes up by at least one every time a new phase begins.
   * Comparing it between two moments tells us whether the phase changed.
   */
  stepIndex: number
}

export function phaseDurationMs(pattern: BreathingPattern, phase: PhaseId): number {
  return pattern[phase] * 1000
}

export function cycleDurationMs(pattern: BreathingPattern): number {
  return PHASES.reduce((total, phase) => total + phaseDurationMs(pattern, phase), 0)
}

/** "4-4-4-4", "4-7-8-0" and so on. */
export function describePattern(pattern: BreathingPattern): string {
  return PHASES.map((phase) => pattern[phase]).join('-')
}

/** Work out the breathing state after `elapsedMs` milliseconds. */
export function getBreathingState(elapsedMs: number, pattern: BreathingPattern): BreathingState {
  const cycleMs = cycleDurationMs(pattern)
  if (!(cycleMs > 0)) {
    throw new RangeError('A breathing cycle must be longer than 0 seconds')
  }

  const elapsed = Math.max(0, elapsedMs)
  let cycleIndex = Math.floor(elapsed / cycleMs)
  let timeInCycle = elapsed - cycleIndex * cycleMs
  // Floating-point rounding can push us a hair outside [0, cycleMs) exactly
  // at a cycle boundary. Both cases mean "the start of a cycle".
  if (timeInCycle >= cycleMs) {
    cycleIndex += 1
    timeInCycle = 0
  } else if (timeInCycle < 0) {
    timeInCycle = 0
  }

  // Walk through the phases until we find the one that contains `timeInCycle`.
  // Phases with a duration of 0 are skipped automatically, because no time
  // can fall inside them.
  let phaseStart = 0
  let phaseIndex = 0
  for (let i = 0; i < PHASES.length; i++) {
    const duration = phaseDurationMs(pattern, PHASES[i])
    if (timeInCycle < phaseStart + duration) {
      phaseIndex = i
      break
    }
    phaseStart += duration
  }

  const phase = PHASES[phaseIndex]
  const durationMs = phaseDurationMs(pattern, phase)
  const phaseElapsedMs = timeInCycle - phaseStart

  return {
    phase,
    phaseIndex,
    phaseElapsedMs,
    phaseDurationMs: durationMs,
    phaseProgress: durationMs > 0 ? phaseElapsedMs / durationMs : 0,
    secondsLeft: Math.ceil((durationMs - phaseElapsedMs) / 1000),
    cycleIndex,
    cycleProgress: timeInCycle / cycleMs,
    stepIndex: cycleIndex * PHASES.length + phaseIndex,
  }
}

/**
 * How many cycles a session has, or null for "no limit".
 *
 * Minute-based sessions are rounded UP to whole cycles, so a session never
 * stops in the middle of a breath (and is never shorter than chosen).
 */
export function getSessionCycles(length: SessionLength, pattern: BreathingPattern): number | null {
  switch (length.kind) {
    case 'cycles':
      return length.cycles
    case 'minutes':
      return Math.max(1, Math.ceil((length.minutes * 60_000) / cycleDurationMs(pattern)))
    case 'unlimited':
      return null
  }
}

/** Total session duration in milliseconds, or null for "no limit". */
export function getSessionDurationMs(length: SessionLength, pattern: BreathingPattern): number | null {
  const cycles = getSessionCycles(length, pattern)
  return cycles === null ? null : cycles * cycleDurationMs(pattern)
}

export interface SessionProgress {
  breathing: BreathingState
  /** Elapsed time, capped at the session duration. */
  elapsedMs: number
  totalCycles: number | null
  totalDurationMs: number | null
  /** The cycle number to show the user, starting at 1. */
  currentCycle: number
  isComplete: boolean
}

/** Breathing state plus session information (cycle x of y, finished or not). */
export function getSessionProgress(
  elapsedMs: number,
  pattern: BreathingPattern,
  length: SessionLength,
): SessionProgress {
  const totalCycles = getSessionCycles(length, pattern)
  const totalDurationMs = getSessionDurationMs(length, pattern)
  const isComplete = totalDurationMs !== null && elapsedMs >= totalDurationMs
  const cappedElapsed = isComplete ? totalDurationMs : Math.max(0, elapsedMs)
  const breathing = getBreathingState(cappedElapsed, pattern)
  const cycleNumber = breathing.cycleIndex + 1

  return {
    breathing,
    elapsedMs: cappedElapsed,
    totalCycles,
    totalDurationMs,
    currentCycle: totalCycles === null ? cycleNumber : Math.min(cycleNumber, totalCycles),
    isComplete,
  }
}
