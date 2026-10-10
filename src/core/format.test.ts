import { describe, expect, it } from 'vitest'
import { formatDuration } from './format'

describe('formatDuration', () => {
  it('formats minutes and seconds', () => {
    expect(formatDuration(0)).toBe('0:00')
    expect(formatDuration(5999)).toBe('0:05') // whole seconds only, rounded down
    expect(formatDuration(65_000)).toBe('1:05')
    expect(formatDuration(10 * 60_000)).toBe('10:00')
  })

  it('adds hours when needed', () => {
    expect(formatDuration(60 * 60_000)).toBe('1:00:00')
    expect(formatDuration(62 * 60_000 + 5000)).toBe('1:02:05')
  })

  it('never shows negative time', () => {
    expect(formatDuration(-1000)).toBe('0:00')
  })
})
