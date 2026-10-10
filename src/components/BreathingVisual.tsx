import type { ReactNode } from 'react'
import type { BreathingState } from '../core/breathing'
import type { ResolvedMotion, VisualStyle } from '../core/settings'
import { boxDotPosition, circleScale, lungFullness } from '../core/visual'
import type { SessionStatus } from '../hooks/useBreathingSession'
import './BreathingVisual.css'

interface Props {
  state: BreathingState
  status: SessionStatus
  visual: VisualStyle
  motion: ResolvedMotion
  /** Shown in the middle of the visual (the countdown). */
  children?: ReactNode
}

// SVG coordinates: the drawing is 100 x 100 units and scales to any size.
const BOX_START = 8
const BOX_SIZE = 84
const CENTER = 50

// The four sides, in phase order: top, right, bottom, left.
const EDGES = [
  { x1: BOX_START, y1: BOX_START, x2: BOX_START + BOX_SIZE, y2: BOX_START },
  { x1: BOX_START + BOX_SIZE, y1: BOX_START, x2: BOX_START + BOX_SIZE, y2: BOX_START + BOX_SIZE },
  { x1: BOX_START + BOX_SIZE, y1: BOX_START + BOX_SIZE, x2: BOX_START, y2: BOX_START + BOX_SIZE },
  { x1: BOX_START, y1: BOX_START + BOX_SIZE, x2: BOX_START, y2: BOX_START },
]

/** In minimal motion mode the circle keeps this size and only changes brightness. */
const MINIMAL_CIRCLE_SCALE = 0.8

export function BreathingVisual({ state, status, visual, motion, children }: Props) {
  const showBox = visual !== 'circle'
  const showCircle = visual !== 'box'
  const minimal = motion === 'minimal'
  const started = status !== 'idle'

  const dot = boxDotPosition(state.phaseIndex, state.phaseProgress)
  const fullness = lungFullness(state.phase, state.phaseProgress)
  const scale = minimal ? MINIMAL_CIRCLE_SCALE : circleScale(state.phase, state.phaseProgress)
  // Brighter when the lungs are full. In minimal mode this is the main cue.
  const circleOpacity = minimal ? 0.18 + 0.6 * fullness : 0.3 + 0.25 * fullness
  // The circle fits inside the box when both are shown.
  const circleRadius = showBox ? 36 : 46

  return (
    <div className={`visual visual--${motion}`} data-status={status}>
      <svg className="visual-svg" viewBox="0 0 100 100" aria-hidden="true" focusable="false">
        {showCircle && (
          <circle
            className="visual-circle"
            cx={0}
            cy={0}
            r={circleRadius}
            transform={`translate(${CENTER} ${CENTER}) scale(${scale})`}
            opacity={circleOpacity}
          />
        )}
        {showBox && (
          <g>
            {EDGES.map((edge, index) => (
              <line
                key={index}
                className={started && index === state.phaseIndex ? 'visual-edge is-active' : 'visual-edge'}
                {...edge}
              />
            ))}
            {!minimal && (
              <circle
                className="visual-dot"
                cx={BOX_START + BOX_SIZE * dot.x}
                cy={BOX_START + BOX_SIZE * dot.y}
                r={3.2}
              />
            )}
          </g>
        )}
      </svg>
      <div className="visual-center">{children}</div>
    </div>
  )
}
