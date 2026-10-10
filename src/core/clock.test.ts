import { describe, expect, it } from 'vitest'
import { createStopwatch, getElapsedMs, isRunning, pauseStopwatch, startStopwatch } from './clock'

describe('stopwatch', () => {
  it('starts at zero and not running', () => {
    const sw = createStopwatch()
    expect(isRunning(sw)).toBe(false)
    expect(getElapsedMs(sw, 12345)).toBe(0)
  })

  it('measures time since it was started', () => {
    const sw = startStopwatch(createStopwatch(), 1000)
    expect(isRunning(sw)).toBe(true)
    expect(getElapsedMs(sw, 1000)).toBe(0)
    expect(getElapsedMs(sw, 3500)).toBe(2500)
  })

  it('freezes while paused', () => {
    let sw = startStopwatch(createStopwatch(), 0)
    sw = pauseStopwatch(sw, 5000)
    expect(isRunning(sw)).toBe(false)
    expect(getElapsedMs(sw, 5000)).toBe(5000)
    expect(getElapsedMs(sw, 999_999)).toBe(5000)
  })

  it('resumes exactly where it was paused', () => {
    let sw = startStopwatch(createStopwatch(), 0)
    sw = pauseStopwatch(sw, 5000.25) // paused after 5000.25 ms
    sw = startStopwatch(sw, 60_000) // a long break...
    expect(getElapsedMs(sw, 60_000)).toBe(5000.25) // ...is not counted
    expect(getElapsedMs(sw, 61_000)).toBe(6000.25)
  })

  it('does not drift over many pause/resume cycles with irregular timing', () => {
    let sw = createStopwatch()
    let now = 0
    let expectedRunning = 0
    for (let i = 0; i < 1000; i++) {
      sw = startStopwatch(sw, now)
      const run = 137 + (i % 7) * 13.37 // irregular run lengths
      now += run
      expectedRunning += run
      sw = pauseStopwatch(sw, now)
      now += 50 + (i % 5) * 101.1 // irregular pauses (not counted)
    }
    expect(getElapsedMs(sw, now)).toBeCloseTo(expectedRunning, 6)
  })

  it('ignores start while running and pause while paused', () => {
    const running = startStopwatch(createStopwatch(), 100)
    expect(startStopwatch(running, 500)).toBe(running)
    const paused = pauseStopwatch(running, 300)
    expect(pauseStopwatch(paused, 900)).toBe(paused)
    expect(getElapsedMs(paused, 900)).toBe(200)
  })

  it('never returns negative time if the clock seems to go backwards', () => {
    const sw = startStopwatch(createStopwatch(), 1000)
    expect(getElapsedMs(sw, 900)).toBe(0)
  })
})
