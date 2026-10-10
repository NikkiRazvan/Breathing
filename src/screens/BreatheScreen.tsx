import type { SessionLength } from '../core/breathing'
import type { ResolvedMotion, Settings } from '../core/settings'
import { BreathingVisual } from '../components/BreathingVisual'
import { Controls } from '../components/Controls'
import { Countdown, PhaseDisplay } from '../components/PhaseDisplay'
import { SessionLengthPicker } from '../components/SessionLengthPicker'
import { SessionStats } from '../components/SessionStats'
import { useAutoFocus } from '../hooks/useAutoFocus'
import type { BreathingSession } from '../hooks/useBreathingSession'

interface Props {
  session: BreathingSession
  settings: Settings
  motion: ResolvedMotion
  onToggle: () => void
  onSessionLengthChange: (length: SessionLength) => void
  focusHeading: boolean
}

export function BreatheScreen({ session, settings, motion, onToggle, onSessionLengthChange, focusHeading }: Props) {
  const { status, progress } = session
  const headingRef = useAutoFocus<HTMLHeadingElement>(focusHeading)

  return (
    <section className="screen breathe">
      <h1 ref={headingRef} tabIndex={-1} className="visually-hidden">
        Box breathing
      </h1>

      <BreathingVisual state={progress.breathing} status={status} visual={settings.visual} motion={motion}>
        <Countdown status={status} secondsLeft={progress.breathing.secondsLeft} />
      </BreathingVisual>

      <PhaseDisplay status={status} state={progress.breathing} pattern={settings.pattern} />
      {/* Before starting, the session length picker shows this information instead. */}
      {status !== 'idle' && <SessionStats progress={progress} />}
      <Controls status={status} onToggle={onToggle} onReset={session.reset} />

      {status === 'idle' && (
        <SessionLengthPicker value={settings.sessionLength} pattern={settings.pattern} onChange={onSessionLengthChange} />
      )}

      <p className="keyboard-hint">
        Press <kbd>Space</kbd> to start or pause
      </p>
    </section>
  )
}
