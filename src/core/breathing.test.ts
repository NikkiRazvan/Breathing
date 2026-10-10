import { describe, expect, it } from 'vitest'
import {
  cycleDurationMs,
  describePattern,
  getBreathingState,
  getSessionCycles,
  getSessionDurationMs,
  getSessionProgress,
  type BreathingPattern,
  type PhaseId,
} from './breathing'
import { createStopwatch, getElapsedMs, pauseStopwatch, startStopwatch } from './clock'

const BOX: BreathingPattern = { inhale: 4, holdFull: 4, exhale: 4, holdEmpty: 4 }
const FOUR_SEVEN_EIGHT: BreathingPattern = { inhale: 4, holdFull: 7, exhale: 8, holdEmpty: 0 }

describe('pattern helpers', () => {
  it('computes the cycle length', () => {
    expect(cycleDurationMs(BOX)).toBe(16_000)
    expect(cycleDurationMs(FOUR_SEVEN_EIGHT)).toBe(19_000)
  })

  it('describes a pattern', () => {
    expect(describePattern(BOX)).toBe('4-4-4-4')
    expect(describePattern(FOUR_SEVEN_EIGHT)).toBe('4-7-8-0')
  })
})

describe('getBreathingState', () => {
  it('starts with inhale at the very beginning', () => {
    const s = getBreathingState(0, BOX)
    expect(s).toMatchObject({
      phase: 'inhale',
      phaseIndex: 0,
      phaseProgress: 0,
      secondsLeft: 4,
      cycleIndex: 0,
      cycleProgress: 0,
      stepIndex: 0,
    })
  })

  it('goes through the four phases in order', () => {
    const phaseAt = (ms: number) => getBreathingState(ms, BOX).phase
    expect(phaseAt(0)).toBe('inhale')
    expect(phaseAt(4000)).toBe('holdFull')
    expect(phaseAt(8000)).toBe('exhale')
    expect(phaseAt(12_000)).toBe('holdEmpty')
    expect(phaseAt(16_000)).toBe('inhale')
  })

  it('switches phase exactly on the boundary, not before', () => {
    expect(getBreathingState(3999.999, BOX).phase).toBe('inhale')
    expect(getBreathingState(4000, BOX).phase).toBe('holdFull')
  })

  it('counts down 4, 3, 2, 1 within a phase', () => {
    const countdown = [0, 999, 1000, 1999, 2000, 2999, 3000, 3999].map(
      (ms) => getBreathingState(ms, BOX).secondsLeft,
    )
    expect(countdown).toEqual([4, 4, 3, 3, 2, 2, 1, 1])
  })

  it('reports progress through the phase and the cycle', () => {
    const s = getBreathingState(6000, BOX) // halfway through "hold full"
    expect(s.phase).toBe('holdFull')
    expect(s.phaseElapsedMs).toBe(2000)
    expect(s.phaseProgress).toBeCloseTo(0.5)
    expect(s.cycleProgress).toBeCloseTo(6000 / 16_000)
  })

  it('counts cycles', () => {
    expect(getBreathingState(15_999, BOX).cycleIndex).toBe(0)
    expect(getBreathingState(16_000, BOX).cycleIndex).toBe(1)
    expect(getBreathingState(16_000 * 7 + 500, BOX).cycleIndex).toBe(7)
  })

  it('stays exact after a long time (no drift)', () => {
    const oneHour = 60 * 60 * 1000 // exactly 225 cycles of 16 s
    const s = getBreathingState(oneHour, BOX)
    expect(s.cycleIndex).toBe(225)
    expect(s.phase).toBe('inhale')
    expect(s.phaseElapsedMs).toBe(0)

    const later = getBreathingState(oneHour + 9500, BOX)
    expect(later.phase).toBe('exhale')
    expect(later.phaseElapsedMs).toBeCloseTo(1500, 6)
  })

  it('handles fractional timestamps right at a cycle boundary', () => {
    const justBefore = getBreathingState(3 * 16_000 - 1e-9, BOX)
    expect(justBefore.phase).toBe('holdEmpty')
    expect(justBefore.secondsLeft).toBeGreaterThanOrEqual(0)
    const s = getBreathingState(0.1 + 0.2 + 3 * 16_000 - 0.3, BOX)
    expect(['holdEmpty', 'inhale']).toContain(s.phase)
    expect(s.phaseProgress).toBeGreaterThanOrEqual(0)
    expect(s.phaseProgress).toBeLessThanOrEqual(1)
  })

  it('treats negative time as the start', () => {
    expect(getBreathingState(-500, BOX)).toMatchObject({ phase: 'inhale', phaseElapsedMs: 0 })
  })

  it('supports different lengths per phase (4-7-8)', () => {
    const phaseAt = (ms: number) => getBreathingState(ms, FOUR_SEVEN_EIGHT)
    expect(phaseAt(3999).phase).toBe('inhale')
    expect(phaseAt(4000)).toMatchObject({ phase: 'holdFull', secondsLeft: 7 })
    expect(phaseAt(11_000)).toMatchObject({ phase: 'exhale', secondsLeft: 8 })
    expect(phaseAt(18_999)).toMatchObject({ phase: 'exhale', secondsLeft: 1 })
    expect(phaseAt(19_000)).toMatchObject({ phase: 'inhale', cycleIndex: 1 })
  })

  it('skips phases that last 0 seconds', () => {
    const seen = new Set<PhaseId>()
    for (let ms = 0; ms < 19_000 * 2; ms += 10) {
      seen.add(getBreathingState(ms, FOUR_SEVEN_EIGHT).phase)
    }
    expect(seen).toEqual(new Set(['inhale', 'holdFull', 'exhale']))
  })

  it('changes stepIndex once per phase, always upwards', () => {
    let changes = 0
    let previous = getBreathingState(0, BOX).stepIndex
    for (let ms = 0; ms < 16_000 * 3; ms += 7) {
      const step = getBreathingState(ms, BOX).stepIndex
      expect(step).toBeGreaterThanOrEqual(previous)
      if (step !== previous) changes++
      previous = step
    }
    // 3 cycles x 4 phases, minus the first phase which we start in.
    expect(changes).toBe(3 * 4 - 1)
  })

  it('rejects a cycle with no length', () => {
    expect(() => getBreathingState(0, { inhale: 0, holdFull: 0, exhale: 0, holdEmpty: 0 })).toThrow(
      RangeError,
    )
  })
})

describe('sessions', () => {
  it('uses the chosen number of cycles', () => {
    expect(getSessionCycles({ kind: 'cycles', cycles: 5 }, BOX)).toBe(5)
    expect(getSessionDurationMs({ kind: 'cycles', cycles: 5 }, BOX)).toBe(80_000)
  })

  it('rounds minute-based sessions up to whole cycles', () => {
    const cycles = (minutes: number, pattern = BOX) => getSessionCycles({ kind: 'minutes', minutes }, pattern)
    expect(cycles(1)).toBe(4) // 60 s / 16 s = 3.75 -> 4
    expect(cycles(3)).toBe(12) // 11.25 -> 12
    expect(cycles(4)).toBe(15) // exactly 15
    expect(cycles(5)).toBe(19)
    expect(cycles(10)).toBe(38)
    expect(cycles(1, FOUR_SEVEN_EIGHT)).toBe(4) // 60 / 19 = 3.16 -> 4
  })

  it('has no end when unlimited', () => {
    expect(getSessionCycles({ kind: 'unlimited' }, BOX)).toBeNull()
    expect(getSessionDurationMs({ kind: 'unlimited' }, BOX)).toBeNull()
    const p = getSessionProgress(10 * 60 * 60 * 1000, BOX, { kind: 'unlimited' })
    expect(p.isComplete).toBe(false)
    expect(p.currentCycle).toBe(2251)
  })

  it('reports progress and completion', () => {
    const length = { kind: 'cycles', cycles: 2 } as const
    const start = getSessionProgress(0, BOX, length)
    expect(start).toMatchObject({ currentCycle: 1, totalCycles: 2, totalDurationMs: 32_000, isComplete: false })

    const second = getSessionProgress(20_000, BOX, length)
    expect(second).toMatchObject({ currentCycle: 2, isComplete: false })

    const almost = getSessionProgress(31_999, BOX, length)
    expect(almost.isComplete).toBe(false)

    const done = getSessionProgress(32_000, BOX, length)
    expect(done).toMatchObject({ isComplete: true, elapsedMs: 32_000, currentCycle: 2 })

    const overshoot = getSessionProgress(40_000, BOX, length)
    expect(overshoot).toMatchObject({ isComplete: true, elapsedMs: 32_000, currentCycle: 2 })
  })
})

describe('stopwatch + breathing together', () => {
  it('pausing mid-phase and resuming continues from the same point', () => {
    let sw = startStopwatch(createStopwatch(), 1000)
    sw = pauseStopwatch(sw, 1000 + 5500) // 5.5 s in: 1.5 s into "hold full"
    const atPause = getBreathingState(getElapsedMs(sw, 50_000), BOX)
    expect(atPause).toMatchObject({ phase: 'holdFull', phaseElapsedMs: 1500, secondsLeft: 3 })

    sw = startStopwatch(sw, 90_000) // resume much later
    const justAfter = getBreathingState(getElapsedMs(sw, 90_000), BOX)
    expect(justAfter).toEqual(atPause)

    const later = getBreathingState(getElapsedMs(sw, 92_500), BOX) // +2.5 s -> exhale starts
    expect(later).toMatchObject({ phase: 'exhale', phaseElapsedMs: 0 })
  })

  it('is unaffected by irregular frame timing', () => {
    // Simulate an animation loop whose frames arrive at uneven, sometimes very
    // late times (like a busy phone). Because we use timestamps, the phase at
    // a given real time is always right.
    const sw = startStopwatch(createStopwatch(), 0)
    let now = 0
    let frame = 0
    while (now < 5 * 16_000) {
      now += frame % 50 === 0 ? 700 : 16.7 + (frame % 3) * 4 // some frames are very late
      frame++
      const expectedPhase = ['inhale', 'holdFull', 'exhale', 'holdEmpty'][Math.floor((now % 16_000) / 4000)]
      expect(getBreathingState(getElapsedMs(sw, now), BOX).phase).toBe(expectedPhase)
    }
  })
})
