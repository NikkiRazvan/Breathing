import { describe, expect, it } from 'vitest'
import {
  DEFAULT_SETTINGS,
  parseSettings,
  PRESETS,
  resolveMotion,
  resolveTheme,
  sanitizeSettings,
  serializeSettings,
  type Settings,
} from './settings'

describe('loading settings', () => {
  it('uses defaults when nothing is saved', () => {
    expect(parseSettings(null)).toEqual(DEFAULT_SETTINGS)
  })

  it('uses defaults when the saved data is broken', () => {
    expect(parseSettings('{not json')).toEqual(DEFAULT_SETTINGS)
    expect(parseSettings('"a string"')).toEqual(DEFAULT_SETTINGS)
    expect(parseSettings('[1,2,3]')).toEqual(DEFAULT_SETTINGS)
    expect(parseSettings('null')).toEqual(DEFAULT_SETTINGS)
  })

  it('survives a save/load round trip', () => {
    const settings: Settings = {
      pattern: { inhale: 4, holdFull: 7, exhale: 8, holdEmpty: 0 },
      customPhases: true,
      sessionLength: { kind: 'cycles', cycles: 10 },
      sound: false,
      vibration: false,
      theme: 'dark',
      visual: 'box',
      motion: 'minimal',
    }
    expect(parseSettings(serializeSettings(settings))).toEqual(settings)
  })

  it('keeps valid fields and repairs invalid ones', () => {
    const result = sanitizeSettings({ sound: false, theme: 'purple', visual: 42, motion: 'full' })
    expect(result.sound).toBe(false)
    expect(result.theme).toBe(DEFAULT_SETTINGS.theme)
    expect(result.visual).toBe(DEFAULT_SETTINGS.visual)
    expect(result.motion).toBe('full')
  })
})

describe('phase durations', () => {
  it('clamps and rounds seconds in custom mode', () => {
    const result = sanitizeSettings({
      customPhases: true,
      pattern: { inhale: 1, holdFull: 99, exhale: 5.6, holdEmpty: -3 },
    })
    expect(result.pattern).toEqual({ inhale: 2, holdFull: 10, exhale: 6, holdEmpty: 0 })
  })

  it('allows holds of 0 but not inhale/exhale of 0', () => {
    const result = sanitizeSettings({
      customPhases: true,
      pattern: { inhale: 0, holdFull: 0, exhale: 0, holdEmpty: 0 },
    })
    expect(result.pattern).toEqual({ inhale: 2, holdFull: 0, exhale: 2, holdEmpty: 0 })
  })

  it('makes all phases equal when not customising', () => {
    const result = sanitizeSettings({
      customPhases: false,
      pattern: { inhale: 6, holdFull: 7, exhale: 8, holdEmpty: 0 },
    })
    expect(result.pattern).toEqual({ inhale: 6, holdFull: 6, exhale: 6, holdEmpty: 6 })
  })

  it('falls back to defaults for non-numbers', () => {
    const result = sanitizeSettings({
      customPhases: true,
      pattern: { inhale: '5', holdFull: null, exhale: NaN, holdEmpty: Infinity },
    })
    expect(result.pattern).toEqual(DEFAULT_SETTINGS.pattern)
  })

  it('ships presets that are already valid', () => {
    for (const preset of PRESETS) {
      expect(sanitizeSettings({ customPhases: true, pattern: preset.pattern }).pattern).toEqual(preset.pattern)
    }
  })
})

describe('session length', () => {
  it('accepts each kind', () => {
    expect(sanitizeSettings({ sessionLength: { kind: 'cycles', cycles: 20 } }).sessionLength).toEqual({
      kind: 'cycles',
      cycles: 20,
    })
    expect(sanitizeSettings({ sessionLength: { kind: 'minutes', minutes: 10 } }).sessionLength).toEqual({
      kind: 'minutes',
      minutes: 10,
    })
    expect(sanitizeSettings({ sessionLength: { kind: 'unlimited' } }).sessionLength).toEqual({ kind: 'unlimited' })
  })

  it('repairs invalid values', () => {
    expect(sanitizeSettings({ sessionLength: { kind: 'minutes', minutes: 0 } }).sessionLength).toEqual({
      kind: 'minutes',
      minutes: 1,
    })
    expect(sanitizeSettings({ sessionLength: { kind: 'cycles', cycles: 'lots' } }).sessionLength).toEqual({
      kind: 'cycles',
      cycles: 5,
    })
    expect(sanitizeSettings({ sessionLength: { kind: 'forever' } }).sessionLength).toEqual(
      DEFAULT_SETTINGS.sessionLength,
    )
  })
})

describe('resolving "system" choices', () => {
  it('follows the system for motion unless overridden', () => {
    expect(resolveMotion('system', true)).toBe('minimal')
    expect(resolveMotion('system', false)).toBe('full')
    expect(resolveMotion('full', true)).toBe('full')
    expect(resolveMotion('minimal', false)).toBe('minimal')
  })

  it('follows the system for theme unless overridden', () => {
    expect(resolveTheme('system', true)).toBe('dark')
    expect(resolveTheme('system', false)).toBe('light')
    expect(resolveTheme('light', true)).toBe('light')
    expect(resolveTheme('dark', false)).toBe('dark')
  })
})
