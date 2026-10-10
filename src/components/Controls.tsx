import { useRef } from 'react'
import type { SessionStatus } from '../hooks/useBreathingSession'

interface Props {
  status: SessionStatus
  onToggle: () => void
  onReset: () => void
}

const PRIMARY_LABELS: Record<SessionStatus, string> = {
  idle: 'Start',
  running: 'Pause',
  paused: 'Resume',
  complete: 'Start',
}

/** Start / Pause / Resume and Reset buttons. */
export function Controls({ status, onToggle, onReset }: Props) {
  const primaryRef = useRef<HTMLButtonElement>(null)
  const inSession = status === 'running' || status === 'paused'

  const handleReset = () => {
    onReset()
    // The Reset button disappears, so move keyboard focus somewhere sensible.
    primaryRef.current?.focus()
  }

  return (
    <div className="button-row">
      {/* One button whose label changes, so keyboard focus stays on it. */}
      <button ref={primaryRef} type="button" className="btn btn-primary" onClick={onToggle} aria-keyshortcuts="Space">
        {PRIMARY_LABELS[status]}
      </button>
      {inSession && (
        <button type="button" className="btn btn-secondary" onClick={handleReset}>
          Reset
        </button>
      )}
    </div>
  )
}
