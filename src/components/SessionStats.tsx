import type { SessionProgress } from '../core/breathing'
import { formatDuration } from '../core/format'
import './SessionStats.css'

/** Cycle counter and elapsed time. */
export function SessionStats({ progress }: { progress: SessionProgress }) {
  const { currentCycle, totalCycles, elapsedMs, totalDurationMs } = progress

  return (
    <dl className="stats">
      <div className="stats-item">
        <dt>Cycle</dt>
        <dd>
          {currentCycle}
          {totalCycles !== null && <span className="stats-total"> of {totalCycles}</span>}
        </dd>
      </div>
      <div className="stats-item">
        <dt>Time</dt>
        <dd>
          {formatDuration(elapsedMs)}
          {totalDurationMs !== null && <span className="stats-total"> / {formatDuration(totalDurationMs)}</span>}
        </dd>
      </div>
    </dl>
  )
}
