import { describe, expect, it } from 'vitest'
import { boxDotPosition, CIRCLE_MAX_SCALE, CIRCLE_MIN_SCALE, circleScale, easeInOutSine, lungFullness } from './visual'

describe('boxDotPosition', () => {
  it('travels top, right, bottom, then left', () => {
    expect(boxDotPosition(0, 0)).toEqual({ x: 0, y: 0 }) // start: top-left
    expect(boxDotPosition(0, 0.5)).toEqual({ x: 0.5, y: 0 }) // inhale: along the top
    expect(boxDotPosition(1, 0.5)).toEqual({ x: 1, y: 0.5 }) // hold: down the right
    expect(boxDotPosition(2, 0.5)).toEqual({ x: 0.5, y: 1 }) // exhale: along the bottom
    expect(boxDotPosition(3, 0.5)).toEqual({ x: 0, y: 0.5 }) // hold: up the left
  })

  it('ends each side where the next one starts', () => {
    for (let phase = 0; phase < 4; phase++) {
      expect(boxDotPosition(phase, 1)).toEqual(boxDotPosition((phase + 1) % 4, 0))
    }
  })

  it('clamps progress outside 0-1', () => {
    expect(boxDotPosition(0, -1)).toEqual({ x: 0, y: 0 })
    expect(boxDotPosition(0, 2)).toEqual({ x: 1, y: 0 })
  })
})

describe('circle animation', () => {
  it('eases smoothly from 0 to 1', () => {
    expect(easeInOutSine(0)).toBe(0)
    expect(easeInOutSine(0.5)).toBeCloseTo(0.5)
    expect(easeInOutSine(1)).toBe(1)
  })

  it('fills on inhale, stays full, empties on exhale, stays empty', () => {
    expect(lungFullness('inhale', 0)).toBe(0)
    expect(lungFullness('inhale', 1)).toBe(1)
    expect(lungFullness('holdFull', 0.3)).toBe(1)
    expect(lungFullness('exhale', 0)).toBe(1)
    expect(lungFullness('exhale', 1)).toBe(0)
    expect(lungFullness('holdEmpty', 0.7)).toBe(0)
  })

  it('grows steadily during inhale', () => {
    let previous = circleScale('inhale', 0)
    for (let p = 0.05; p <= 1; p += 0.05) {
      const scale = circleScale('inhale', p)
      expect(scale).toBeGreaterThan(previous)
      previous = scale
    }
  })

  it('stays between the minimum and maximum size', () => {
    expect(circleScale('holdEmpty', 0)).toBe(CIRCLE_MIN_SCALE)
    expect(circleScale('holdFull', 0)).toBe(CIRCLE_MAX_SCALE)
    expect(circleScale('exhale', 0.5)).toBeCloseTo((CIRCLE_MIN_SCALE + CIRCLE_MAX_SCALE) / 2)
  })
})
