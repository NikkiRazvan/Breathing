import type { SessionProgress } from '../core/breathing'
import { formatDuration } from '../core/format'
import { useAutoFocus } from '../hooks/useAutoFocus'

interface Props {
  progress: SessionProgress
  onRestart: () => void
  onDone: () => void
}

/** The calm "you're done" screen shown when a session ends. */
export function CompleteScreen({ progress, onRestart, onDone }: Props) {
  // Always focus the heading, so screen readers announce that the session ended.
  const headingRef = useAutoFocus<HTMLHeadingElement>(true)
  const cycles = progress.totalCycles ?? progress.currentCycle

  return (
    <section className="screen complete">
      <div className="complete-badge" aria-hidden="true">
        <svg viewBox="0 0 48 48" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M15 25l6 6 12-14" />
        </svg>
      </div>
      <h1 ref={headingRef} tabIndex={-1}>
        Session complete
      </h1>
      <p className="complete-message">Well done. Take a moment to notice how you feel before you carry on.</p>
      <p className="complete-summary">
        {cycles} {cycles === 1 ? 'cycle' : 'cycles'} · {formatDuration(progress.elapsedMs)}
      </p>
      <div className="button-row">
        <button type="button" className="btn btn-primary" onClick={onRestart}>
          Breathe again
        </button>
        <button type="button" className="btn btn-secondary" onClick={onDone}>
          Done
        </button>
      </div>
    </section>
  )
}
