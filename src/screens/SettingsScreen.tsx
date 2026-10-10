import { cycleDurationMs, describePattern, PHASES, type PhaseId } from '../core/breathing'
import {
  PHASE_LIMITS,
  patternsEqual,
  PRESETS,
  UNIFORM_LIMITS,
  uniformPattern,
  type MotionSetting,
  type Settings,
  type ThemeSetting,
  type VisualStyle,
} from '../core/settings'
import { ChipGroup } from '../components/ChipGroup'
import { SecondsSlider } from '../components/SecondsSlider'
import { Switch } from '../components/Switch'
import { useAutoFocus } from '../hooks/useAutoFocus'
import { playPhaseCue, unlockAudio } from '../services/sound'
import { isVibrationSupported, PHASE_VIBRATION, vibrate } from '../services/vibration'

interface Props {
  settings: Settings
  onChange: (changes: Partial<Settings>) => void
  /** True while a session is running or paused. */
  sessionActive: boolean
  focusHeading: boolean
}

const PHASE_SETTING_LABELS: Record<PhaseId, string> = {
  inhale: 'Breathe in',
  holdFull: 'Hold (lungs full)',
  exhale: 'Breathe out',
  holdEmpty: 'Hold (lungs empty)',
}

const THEME_OPTIONS: { value: ThemeSetting; label: string }[] = [
  { value: 'system', label: 'System' },
  { value: 'light', label: 'Light' },
  { value: 'dark', label: 'Dark' },
]

const VISUAL_OPTIONS: { value: VisualStyle; label: string }[] = [
  { value: 'both', label: 'Box + circle' },
  { value: 'box', label: 'Box' },
  { value: 'circle', label: 'Circle' },
]

const MOTION_OPTIONS: { value: MotionSetting; label: string }[] = [
  { value: 'system', label: 'Follow system' },
  { value: 'full', label: 'Full' },
  { value: 'minimal', label: 'Minimal' },
]

export function SettingsScreen({ settings, onChange, sessionActive, focusHeading }: Props) {
  const headingRef = useAutoFocus<HTMLHeadingElement>(focusHeading)
  const { pattern, customPhases } = settings
  const vibrationSupported = isVibrationSupported()

  const handleSoundChange = (on: boolean) => {
    onChange({ sound: on })
    if (on) {
      unlockAudio()
      playPhaseCue('inhale') // a sample, so you know what it sounds like
    }
  }

  const handleVibrationChange = (on: boolean) => {
    onChange({ vibration: on })
    if (on) vibrate(PHASE_VIBRATION)
  }

  return (
    <section className="screen settings">
      <h1 ref={headingRef} tabIndex={-1}>
        Settings
      </h1>

      {sessionActive && <p className="notice">Timing changes apply to your next session.</p>}

      <section className="card" aria-labelledby="pattern-heading">
        <h2 id="pattern-heading">Breathing pattern</h2>

        <div className="preset-row">
          {PRESETS.map((preset) => (
            <button
              key={preset.id}
              type="button"
              className="preset"
              aria-pressed={patternsEqual(preset.pattern, pattern)}
              onClick={() =>
                onChange({
                  pattern: preset.pattern,
                  // Presets with unequal phases need "each phase separately".
                  customPhases: !patternsEqual(preset.pattern, uniformPattern(preset.pattern.inhale)),
                })
              }
            >
              <span className="preset-name">{preset.name}</span>
              <span className="preset-description">{preset.description}</span>
            </button>
          ))}
        </div>

        <Switch
          label="Set each phase separately"
          description="For patterns like 4-7-8. Holds can be set to 0 to skip them."
          checked={customPhases}
          onChange={(on) => onChange({ customPhases: on })}
        />

        {customPhases ? (
          PHASES.map((phase) => (
            <SecondsSlider
              key={phase}
              label={PHASE_SETTING_LABELS[phase]}
              value={pattern[phase]}
              min={PHASE_LIMITS[phase].min}
              max={PHASE_LIMITS[phase].max}
              onChange={(seconds) => onChange({ pattern: { ...pattern, [phase]: seconds } })}
            />
          ))
        ) : (
          <SecondsSlider
            label="Seconds per phase"
            value={pattern.inhale}
            min={UNIFORM_LIMITS.min}
            max={UNIFORM_LIMITS.max}
            onChange={(seconds) => onChange({ pattern: uniformPattern(seconds) })}
          />
        )}

        <p className="field-hint">
          Pattern {describePattern(pattern)} · one cycle takes {cycleDurationMs(pattern) / 1000} seconds
        </p>
      </section>

      <section className="card" aria-labelledby="cues-heading">
        <h2 id="cues-heading">Cues</h2>
        <Switch
          label="Sound"
          description="A soft tone at each phase change"
          checked={settings.sound}
          onChange={handleSoundChange}
        />
        <Switch
          label="Vibration"
          description={
            vibrationSupported ? 'A short buzz at each phase change' : 'Not supported on this device or browser'
          }
          checked={vibrationSupported && settings.vibration}
          disabled={!vibrationSupported}
          onChange={handleVibrationChange}
        />
      </section>

      <section className="card" aria-labelledby="appearance-heading">
        <h2 id="appearance-heading">Appearance</h2>
        <ChipGroup legend="Theme" options={THEME_OPTIONS} value={settings.theme} onChange={(theme) => onChange({ theme })} />
        <ChipGroup
          legend="Visual"
          options={VISUAL_OPTIONS}
          value={settings.visual}
          onChange={(visual) => onChange({ visual })}
        />
        <ChipGroup
          legend="Motion"
          options={MOTION_OPTIONS}
          value={settings.motion}
          onChange={(motion) => onChange({ motion })}
        />
        <p className="field-hint">
          Minimal motion keeps everything still: the box edges and circle gently fade instead of moving. “Follow
          system” uses your device’s reduce-motion setting.
        </p>
      </section>

      <p className="field-hint settings-footer">Settings are saved on this device.</p>
    </section>
  )
}
