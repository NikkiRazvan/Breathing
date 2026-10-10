import { useCallback, useEffect, useRef, useState } from 'react'
import {
  getSessionProgress,
  type BreathingPattern,
  type PhaseId,
  type SessionLength,
  type SessionProgress,
} from '../core/breathing'
import { createStopwatch, getElapsedMs, isRunning, pauseStopwatch, startStopwatch, type Stopwatch } from '../core/clock'

export type SessionStatus = 'idle' | 'running' | 'paused' | 'complete'

interface SessionConfig {
  pattern: BreathingPattern
  length: SessionLength
}

interface Options extends SessionConfig {
  /** Called whenever a new phase begins (including the first one). */
  onPhaseChange?: (phase: PhaseId) => void
  /** Called once when the session reaches its end. */
  onComplete?: () => void
}

export interface BreathingSession {
  status: SessionStatus
  progress: SessionProgress
  start: () => void
  pause: () => void
  resume: () => void
  reset: () => void
  /** Start, pause or resume, depending on the current status (for the Space key). */
  toggle: () => void
}

/**
 * Runs a breathing session.
 *
 * Timing comes from a timestamp-based stopwatch (see core/clock.ts). Once per
 * screen refresh (requestAnimationFrame) we read the elapsed time and let the
 * pure functions in core/breathing.ts work out everything else. Nothing is
 * counted tick by tick, so the timing can't drift.
 */
export function useBreathingSession({ pattern, length, onPhaseChange, onComplete }: Options): BreathingSession {
  const [status, setStatus] = useState<SessionStatus>('idle')
  const [elapsedMs, setElapsedMs] = useState(0)

  // The timing settings are "frozen" when a session starts, so changing the
  // settings mid-session can't make the animation jump. While idle, we simply
  // follow the current settings.
  const [frozenConfig, setFrozenConfig] = useState<SessionConfig | null>(null)
  const config = frozenConfig ?? { pattern, length }

  const stopwatchRef = useRef<Stopwatch>(createStopwatch())
  const lastStepRef = useRef(-1)

  // Keep the latest callbacks in a ref, so the animation loop always calls the
  // current versions (e.g. after the user turns sound off) without restarting.
  const callbacksRef = useRef({ onPhaseChange, onComplete })
  useEffect(() => {
    callbacksRef.current = { onPhaseChange, onComplete }
  })

  // The animation loop. It only runs while the session is running.
  useEffect(() => {
    if (status !== 'running' || frozenConfig === null) return

    let frameId = 0
    const tick = () => {
      const now = performance.now()
      const elapsed = getElapsedMs(stopwatchRef.current, now)
      const progress = getSessionProgress(elapsed, frozenConfig.pattern, frozenConfig.length)

      if (progress.isComplete) {
        stopwatchRef.current = pauseStopwatch(stopwatchRef.current, now)
        setElapsedMs(progress.elapsedMs)
        setStatus('complete')
        callbacksRef.current.onComplete?.()
        return
      }

      // A new phase has started since the last frame.
      if (progress.breathing.stepIndex !== lastStepRef.current) {
        lastStepRef.current = progress.breathing.stepIndex
        callbacksRef.current.onPhaseChange?.(progress.breathing.phase)
      }

      setElapsedMs(elapsed)
      frameId = requestAnimationFrame(tick)
    }

    frameId = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frameId)
  }, [status, frozenConfig])

  const start = useCallback(() => {
    const first = getSessionProgress(0, pattern, length).breathing
    stopwatchRef.current = startStopwatch(createStopwatch(), performance.now())
    lastStepRef.current = first.stepIndex
    setFrozenConfig({ pattern, length })
    setElapsedMs(0)
    setStatus('running')
    // Cue the first phase right away (still inside the click, which also
    // helps browsers that are strict about when sound may play).
    callbacksRef.current.onPhaseChange?.(first.phase)
  }, [pattern, length])

  const pause = useCallback(() => {
    if (!isRunning(stopwatchRef.current)) return
    const now = performance.now()
    stopwatchRef.current = pauseStopwatch(stopwatchRef.current, now)
    setElapsedMs(getElapsedMs(stopwatchRef.current, now))
    setStatus('paused')
  }, [])

  const resume = useCallback(() => {
    if (status !== 'paused') return
    stopwatchRef.current = startStopwatch(stopwatchRef.current, performance.now())
    setStatus('running')
  }, [status])

  const reset = useCallback(() => {
    stopwatchRef.current = createStopwatch()
    lastStepRef.current = -1
    setFrozenConfig(null)
    setElapsedMs(0)
    setStatus('idle')
  }, [])

  const toggle = useCallback(() => {
    if (status === 'running') pause()
    else if (status === 'paused') resume()
    else start()
  }, [status, start, pause, resume])

  return {
    status,
    progress: getSessionProgress(elapsedMs, config.pattern, config.length),
    start,
    pause,
    resume,
    reset,
    toggle,
  }
}
