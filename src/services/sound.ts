/**
 * Soft tones generated with the Web Audio API, so no audio files are needed.
 *
 * Browsers only allow sound after the user has interacted with the page, so
 * `unlockAudio()` must be called from a click/tap/key press (we do it when the
 * user presses Start).
 */
import type { PhaseId } from '../core/breathing'

type AudioContextClass = typeof AudioContext

let context: AudioContext | null = null

function getAudioContextClass(): AudioContextClass | undefined {
  if (typeof window === 'undefined') return undefined
  // Older Safari versions only have the prefixed name.
  return window.AudioContext ?? (window as unknown as { webkitAudioContext?: AudioContextClass }).webkitAudioContext
}

export function isSoundSupported(): boolean {
  return getAudioContextClass() !== undefined
}

/** Create/resume the audio context. Call this inside a user gesture. */
export function unlockAudio(): void {
  const AudioContextClass = getAudioContextClass()
  if (!AudioContextClass) return
  try {
    context ??= new AudioContextClass()
    if (context.state !== 'running') void context.resume().catch(() => {})
  } catch {
    context = null
  }
}

/** Notes of a C major chord: high for breathing in, low for breathing out. */
const PHASE_FREQUENCIES: Record<PhaseId, number> = {
  inhale: 523.25, // C5
  holdFull: 392.0, // G4
  exhale: 329.63, // E4
  holdEmpty: 392.0, // G4
}

interface ToneOptions {
  /** Seconds until the tone has faded out. */
  duration?: number
  /** Peak volume, 0-1. Kept low so it's gentle. */
  volume?: number
  /** Seconds from now before the tone starts. */
  delay?: number
}

function playTone(frequency: number, { duration = 0.9, volume = 0.12, delay = 0 }: ToneOptions = {}): void {
  if (!context) return
  if (context.state === 'suspended') void context.resume().catch(() => {})

  const start = context.currentTime + delay
  const oscillator = context.createOscillator()
  const gain = context.createGain()

  oscillator.type = 'sine' // the softest, purest waveform
  oscillator.frequency.value = frequency

  // Envelope: fade in quickly (no click), then fade out slowly like a bell.
  gain.gain.setValueAtTime(0.0001, start)
  gain.gain.exponentialRampToValueAtTime(volume, start + 0.04)
  gain.gain.exponentialRampToValueAtTime(0.0001, start + duration)

  oscillator.connect(gain).connect(context.destination)
  oscillator.start(start)
  oscillator.stop(start + duration + 0.05)
}

export function playPhaseCue(phase: PhaseId): void {
  playTone(PHASE_FREQUENCIES[phase])
}

/** A gentle rising three-note chime for the end of a session. */
export function playCompleteChime(): void {
  const notes = [523.25, 659.25, 783.99] // C5, E5, G5
  notes.forEach((frequency, i) => playTone(frequency, { duration: 1.8, volume: 0.1, delay: i * 0.28 }))
}
