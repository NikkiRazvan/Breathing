/**
 * App settings: their types, defaults, and safe loading.
 *
 * Settings are stored in localStorage as JSON. Anything we read back could be
 * old, edited by hand, or broken, so `sanitizeSettings` checks every field and
 * falls back to the default for anything invalid.
 */
import { PHASES, type BreathingPattern, type PhaseId, type SessionLength } from './breathing'

export type ThemeSetting = 'system' | 'light' | 'dark'
export type VisualStyle = 'both' | 'box' | 'circle'
export type MotionSetting = 'system' | 'full' | 'minimal'
export type ResolvedMotion = 'full' | 'minimal'

export interface Settings {
  pattern: BreathingPattern
  /** false = one value for all four phases; true = each phase set separately. */
  customPhases: boolean
  sessionLength: SessionLength
  sound: boolean
  vibration: boolean
  theme: ThemeSetting
  visual: VisualStyle
  motion: MotionSetting
}

export const STORAGE_KEY = 'box-breathing:settings:v1'

/** Allowed seconds per phase. Holds may be 0 (skipped), e.g. for 4-7-8. */
export const PHASE_LIMITS: Record<PhaseId, { min: number; max: number }> = {
  inhale: { min: 2, max: 10 },
  holdFull: { min: 0, max: 10 },
  exhale: { min: 2, max: 10 },
  holdEmpty: { min: 0, max: 10 },
}

/** Allowed seconds when all phases share one value. */
export const UNIFORM_LIMITS = { min: 2, max: 10 }

export const SESSION_LIMITS = {
  cycles: { min: 1, max: 100 },
  minutes: { min: 1, max: 60 },
}

export const CYCLE_OPTIONS = [3, 5, 10, 20] as const
export const MINUTE_OPTIONS = [1, 3, 5, 10] as const

export interface Preset {
  id: string
  name: string
  description: string
  pattern: BreathingPattern
}

export const PRESETS: readonly Preset[] = [
  {
    id: 'box',
    name: 'Box breathing',
    description: 'Four equal phases of 4 seconds.',
    pattern: uniformPattern(4),
  },
  {
    id: '4-7-8',
    name: '4-7-8 relaxing breath',
    description: 'In for 4, hold for 7, out for 8. No hold when empty.',
    pattern: { inhale: 4, holdFull: 7, exhale: 8, holdEmpty: 0 },
  },
]

export const DEFAULT_SETTINGS: Settings = {
  pattern: uniformPattern(4),
  customPhases: false,
  sessionLength: { kind: 'minutes', minutes: 3 },
  sound: true,
  vibration: true,
  theme: 'system',
  visual: 'both',
  motion: 'system',
}

/** A pattern where every phase lasts `seconds`. */
export function uniformPattern(seconds: number): BreathingPattern {
  return { inhale: seconds, holdFull: seconds, exhale: seconds, holdEmpty: seconds }
}

export function patternsEqual(a: BreathingPattern, b: BreathingPattern): boolean {
  return PHASES.every((phase) => a[phase] === b[phase])
}

/** Turn "system" into the actual motion level, using the OS preference. */
export function resolveMotion(setting: MotionSetting, systemPrefersReduced: boolean): ResolvedMotion {
  if (setting === 'system') return systemPrefersReduced ? 'minimal' : 'full'
  return setting
}

/** Turn "system" into the actual theme, using the OS preference. */
export function resolveTheme(setting: ThemeSetting, systemPrefersDark: boolean): 'light' | 'dark' {
  if (setting === 'system') return systemPrefersDark ? 'dark' : 'light'
  return setting
}

/** Check a value read from storage and repair anything invalid. */
export function sanitizeSettings(raw: unknown): Settings {
  const input = isObject(raw) ? raw : {}
  const customPhases = typeof input.customPhases === 'boolean' ? input.customPhases : DEFAULT_SETTINGS.customPhases

  return {
    pattern: sanitizePattern(input.pattern, customPhases),
    customPhases,
    sessionLength: sanitizeSessionLength(input.sessionLength),
    sound: typeof input.sound === 'boolean' ? input.sound : DEFAULT_SETTINGS.sound,
    vibration: typeof input.vibration === 'boolean' ? input.vibration : DEFAULT_SETTINGS.vibration,
    theme: oneOf(input.theme, ['system', 'light', 'dark'], DEFAULT_SETTINGS.theme),
    visual: oneOf(input.visual, ['both', 'box', 'circle'], DEFAULT_SETTINGS.visual),
    motion: oneOf(input.motion, ['system', 'full', 'minimal'], DEFAULT_SETTINGS.motion),
  }
}

/** Parse the JSON string from localStorage. Never throws. */
export function parseSettings(json: string | null): Settings {
  if (json === null) return DEFAULT_SETTINGS
  try {
    return sanitizeSettings(JSON.parse(json))
  } catch {
    return DEFAULT_SETTINGS
  }
}

export function serializeSettings(settings: Settings): string {
  return JSON.stringify(settings)
}

function sanitizePattern(raw: unknown, customPhases: boolean): BreathingPattern {
  const input = isObject(raw) ? raw : {}
  if (!customPhases) {
    // All phases share one value; use the inhale value as "the" value.
    const seconds = clampInt(input.inhale, UNIFORM_LIMITS.min, UNIFORM_LIMITS.max, DEFAULT_SETTINGS.pattern.inhale)
    return uniformPattern(seconds)
  }
  const pattern = {} as BreathingPattern
  for (const phase of PHASES) {
    const { min, max } = PHASE_LIMITS[phase]
    pattern[phase] = clampInt(input[phase], min, max, DEFAULT_SETTINGS.pattern[phase])
  }
  return pattern
}

function sanitizeSessionLength(raw: unknown): SessionLength {
  if (!isObject(raw)) return DEFAULT_SETTINGS.sessionLength
  switch (raw.kind) {
    case 'cycles': {
      const { min, max } = SESSION_LIMITS.cycles
      return { kind: 'cycles', cycles: clampInt(raw.cycles, min, max, CYCLE_OPTIONS[1]) }
    }
    case 'minutes': {
      const { min, max } = SESSION_LIMITS.minutes
      return { kind: 'minutes', minutes: clampInt(raw.minutes, min, max, MINUTE_OPTIONS[1]) }
    }
    case 'unlimited':
      return { kind: 'unlimited' }
    default:
      return DEFAULT_SETTINGS.sessionLength
  }
}

/** Round to a whole number and keep it within [min, max]. Non-numbers get the fallback. */
function clampInt(value: unknown, min: number, max: number, fallback: number): number {
  if (typeof value !== 'number' || !Number.isFinite(value)) return fallback
  return Math.min(max, Math.max(min, Math.round(value)))
}

function oneOf<T extends string>(value: unknown, allowed: readonly T[], fallback: T): T {
  return allowed.includes(value as T) ? (value as T) : fallback
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}
