/**
 * Pure maths for the animations. Kept here (not in a component) so it can be
 * unit tested.
 */
import type { PhaseId } from './breathing'

export interface Point {
  x: number
  y: number
}

/**
 * The corners of a unit square (0..1), in the order the dot visits them.
 * Inhale runs along the top edge, hold along the right, exhale along the
 * bottom, and the second hold up the left edge.
 */
const CORNERS: readonly Point[] = [
  { x: 0, y: 0 }, // top-left
  { x: 1, y: 0 }, // top-right
  { x: 1, y: 1 }, // bottom-right
  { x: 0, y: 1 }, // bottom-left
]

/**
 * Where the dot is on a unit square, given the phase (0-3) and how far
 * through that phase we are (0-1). The dot moves at a steady speed so it
 * matches the countdown.
 */
export function boxDotPosition(phaseIndex: number, phaseProgress: number): Point {
  const from = CORNERS[phaseIndex % 4]
  const to = CORNERS[(phaseIndex + 1) % 4]
  const t = clamp01(phaseProgress)
  return {
    x: from.x + (to.x - from.x) * t,
    y: from.y + (to.y - from.y) * t,
  }
}

/** Smallest and largest size of the breathing circle (as a scale factor). */
export const CIRCLE_MIN_SCALE = 0.45
export const CIRCLE_MAX_SCALE = 1

/** Gentle "slow - fast - slow" curve, so breathing in/out feels natural. */
export function easeInOutSine(t: number): number {
  return (1 - Math.cos(Math.PI * clamp01(t))) / 2
}

/**
 * How full the lungs are, from 0 (empty) to 1 (full).
 * Grows during inhale, stays full during the first hold, shrinks during
 * exhale and stays empty during the second hold.
 */
export function lungFullness(phase: PhaseId, phaseProgress: number): number {
  switch (phase) {
    case 'inhale':
      return easeInOutSine(phaseProgress)
    case 'holdFull':
      return 1
    case 'exhale':
      return 1 - easeInOutSine(phaseProgress)
    case 'holdEmpty':
      return 0
  }
}

/** Scale factor for the expanding circle. */
export function circleScale(phase: PhaseId, phaseProgress: number): number {
  return CIRCLE_MIN_SCALE + (CIRCLE_MAX_SCALE - CIRCLE_MIN_SCALE) * lungFullness(phase, phaseProgress)
}

function clamp01(value: number): number {
  return Math.min(1, Math.max(0, value))
}
