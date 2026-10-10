import { describePattern, PHASE_LABELS, type BreathingPattern, type BreathingState } from '../core/breathing'
import type { SessionStatus } from '../hooks/useBreathingSession'
import './PhaseDisplay.css'

interface Props {
  status: SessionStatus
  state: BreathingState
  pattern: BreathingPattern
}

/** The big "Breathe in" / "Hold" / "Breathe out" text. */
export function PhaseDisplay({ status, state, pattern }: Props) {
  const phaseLabel = PHASE_LABELS[state.phase]

  let label = phaseLabel
  let detail = ' ' // a non-breaking space keeps the line height stable
  if (status === 'idle') {
    label = 'Ready when you are'
    detail = `Pattern ${describePattern(pattern)}`
  } else if (status === 'paused') {
    label = 'Paused'
    detail = `${phaseLabel} · ${state.secondsLeft}s left`
  }

  // Screen readers announce this text whenever it changes: once per phase,
  // not every second (that would be very noisy).
  const announcement = status === 'running' ? phaseLabel : status === 'paused' ? 'Paused' : ''

  return (
    <div className="phase">
      <p className="phase-label">{label}</p>
      <p className="phase-detail">{detail}</p>
      <p className="visually-hidden" aria-live="polite" aria-atomic="true">
        {announcement}
      </p>
    </div>
  )
}

/** The number in the middle of the visual. */
export function Countdown({ status, secondsLeft }: { status: SessionStatus; secondsLeft: number }) {
  if (status === 'idle') return null
  return (
    <span className={status === 'paused' ? 'countdown is-paused' : 'countdown'} aria-hidden="true">
      {secondsLeft}
    </span>
  )
}
