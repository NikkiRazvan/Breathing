import { getSessionCycles, getSessionDurationMs, type BreathingPattern, type SessionLength } from '../core/breathing'
import { formatDuration } from '../core/format'
import { CYCLE_OPTIONS, MINUTE_OPTIONS } from '../core/settings'
import { ChipGroup } from './ChipGroup'

interface Props {
  value: SessionLength
  pattern: BreathingPattern
  onChange: (value: SessionLength) => void
}

type Kind = SessionLength['kind']

const KIND_OPTIONS = [
  { value: 'minutes', label: 'Minutes' },
  { value: 'cycles', label: 'Cycles' },
  { value: 'unlimited', label: 'No limit' },
] as const

const DEFAULTS: Record<Kind, SessionLength> = {
  minutes: { kind: 'minutes', minutes: 3 },
  cycles: { kind: 'cycles', cycles: 5 },
  unlimited: { kind: 'unlimited' },
}

/** Choose how long the session lasts: minutes, cycles, or no limit. */
export function SessionLengthPicker({ value, pattern, onChange }: Props) {
  const cycles = getSessionCycles(value, pattern)
  const durationMs = getSessionDurationMs(value, pattern)

  return (
    <div className="length-picker">
      <ChipGroup<Kind>
        legend="Session length"
        options={KIND_OPTIONS}
        value={value.kind}
        onChange={(kind) => onChange(DEFAULTS[kind])}
      />

      {value.kind === 'minutes' && (
        <ChipGroup
          legend="Minutes"
          hideLegend
          options={MINUTE_OPTIONS.map((minutes) => ({ value: minutes, label: `${minutes} min` }))}
          value={value.minutes}
          onChange={(minutes) => onChange({ kind: 'minutes', minutes })}
        />
      )}
      {value.kind === 'cycles' && (
        <ChipGroup
          legend="Cycles"
          hideLegend
          options={CYCLE_OPTIONS.map((count) => ({ value: count, label: String(count) }))}
          value={value.cycles}
          onChange={(count) => onChange({ kind: 'cycles', cycles: count })}
        />
      )}

      <p className="field-hint length-summary">
        {cycles === null || durationMs === null
          ? 'Breathe for as long as you like, then press Reset.'
          : `${cycles} ${cycles === 1 ? 'cycle' : 'cycles'} · ${formatDuration(durationMs)}`}
      </p>
    </div>
  )
}
