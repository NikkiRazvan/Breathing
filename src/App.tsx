import { useCallback, useEffect, useState } from 'react'
import { NavBar, type Screen } from './components/NavBar'
import { resolveMotion, resolveTheme } from './core/settings'
import { useBreathingSession } from './hooks/useBreathingSession'
import { usePrefersDarkMode, usePrefersReducedMotion } from './hooks/useMediaQuery'
import { useSettings } from './hooks/useSettings'
import { useWakeLock } from './hooks/useWakeLock'
import { BreatheScreen } from './screens/BreatheScreen'
import { CompleteScreen } from './screens/CompleteScreen'
import { HowItWorksScreen } from './screens/HowItWorksScreen'
import { SettingsScreen } from './screens/SettingsScreen'
import { playCompleteChime, playPhaseCue, unlockAudio } from './services/sound'
import { COMPLETE_VIBRATION, PHASE_VIBRATION, vibrate } from './services/vibration'

/** Background colours per theme, for the browser/phone status bar. */
const THEME_COLORS = { light: '#f3f6f5', dark: '#101716' }

/** Is the keyboard event coming from something that handles Space itself? */
function isInteractiveElement(target: EventTarget | null): boolean {
  return (
    target instanceof Element &&
    target.closest('button, a, input, select, textarea, summary, [contenteditable="true"]') !== null
  )
}

export default function App() {
  const [settings, updateSettings] = useSettings()
  const [screen, setScreen] = useState<Screen>('breathe')
  // Only move focus to headings after the user navigates, not on first load.
  const [hasNavigated, setHasNavigated] = useState(false)

  const motion = resolveMotion(settings.motion, usePrefersReducedMotion())
  const theme = resolveTheme(settings.theme, usePrefersDarkMode())

  const session = useBreathingSession({
    pattern: settings.pattern,
    length: settings.sessionLength,
    onPhaseChange: (phase) => {
      if (settings.sound) playPhaseCue(phase)
      if (settings.vibration) vibrate(PHASE_VIBRATION)
    },
    onComplete: () => {
      if (settings.sound) playCompleteChime()
      if (settings.vibration) vibrate(COMPLETE_VIBRATION)
    },
  })
  const { status, toggle, start, pause, reset } = session

  // Keep the screen on while breathing.
  useWakeLock(status === 'running')

  // Start/pause/resume. Sound has to be unlocked inside a click or key press.
  const handleToggle = useCallback(() => {
    if (settings.sound) unlockAudio()
    toggle()
  }, [settings.sound, toggle])

  const handleRestart = useCallback(() => {
    if (settings.sound) unlockAudio()
    start()
  }, [settings.sound, start])

  const navigate = useCallback(
    (next: Screen) => {
      // You can't follow the breathing on another screen, so pause it.
      if (next !== 'breathe') pause()
      setScreen(next)
      setHasNavigated(true)
    },
    [pause],
  )

  // Space bar = start / pause / resume (on the Breathe screen).
  useEffect(() => {
    if (screen !== 'breathe') return
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.code !== 'Space' && event.key !== ' ') return
      if (event.repeat || event.altKey || event.ctrlKey || event.metaKey) return
      // A focused button already reacts to Space by itself.
      if (isInteractiveElement(event.target)) return
      event.preventDefault() // don't scroll the page
      handleToggle()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [screen, handleToggle])

  // Pause automatically when the app is hidden (switching apps, locking the phone).
  useEffect(() => {
    const onVisibilityChange = () => {
      if (document.visibilityState === 'hidden') pause()
    }
    document.addEventListener('visibilitychange', onVisibilityChange)
    return () => document.removeEventListener('visibilitychange', onVisibilityChange)
  }, [pause])

  // Apply theme and motion settings to the page.
  useEffect(() => {
    const root = document.documentElement
    if (settings.theme === 'system') delete root.dataset.theme
    else root.dataset.theme = settings.theme
    root.dataset.motion = motion
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', THEME_COLORS[theme])
  }, [settings.theme, theme, motion])

  return (
    <div className="app">
      <header className="app-header">
        <span className="app-title">Box Breathing</span>
      </header>

      <NavBar current={screen} onNavigate={navigate} />

      <main className="app-main">
        {screen === 'breathe' &&
          (status === 'complete' ? (
            <CompleteScreen
              progress={session.progress}
              onRestart={handleRestart}
              onDone={() => {
                reset()
                setHasNavigated(true) // focus the Breathe screen's heading
              }}
            />
          ) : (
            <BreatheScreen
              session={session}
              settings={settings}
              motion={motion}
              onToggle={handleToggle}
              onSessionLengthChange={(sessionLength) => updateSettings({ sessionLength })}
              focusHeading={hasNavigated}
            />
          ))}
        {screen === 'about' && <HowItWorksScreen onStart={() => navigate('breathe')} focusHeading={hasNavigated} />}
        {screen === 'settings' && (
          <SettingsScreen
            settings={settings}
            onChange={updateSettings}
            sessionActive={status === 'running' || status === 'paused'}
            focusHeading={hasNavigated}
          />
        )}
      </main>
    </div>
  )
}
