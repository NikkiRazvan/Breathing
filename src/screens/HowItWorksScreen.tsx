import { useAutoFocus } from '../hooks/useAutoFocus'

interface Props {
  onStart: () => void
  focusHeading: boolean
}

/** A small labelled drawing of the box. */
function BoxDiagram() {
  return (
    <svg className="diagram" viewBox="0 0 240 240" role="img" aria-labelledby="diagram-title">
      <title id="diagram-title">
        A square: breathe in along the top, hold down the right side, breathe out along the bottom, hold up the left
        side.
      </title>
      <defs>
        <marker id="arrow" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="5" markerHeight="5" orient="auto">
          <path d="M0 0 L10 5 L0 10 z" fill="currentColor" />
        </marker>
      </defs>
      <g className="diagram-edges" strokeWidth="3" strokeLinecap="round" fill="none">
        <path d="M55 55 H120 M120 55 H185" markerMid="url(#arrow)" />
        <path d="M185 55 V120 M185 120 V185" markerMid="url(#arrow)" />
        <path d="M185 185 H120 M120 185 H55" markerMid="url(#arrow)" />
        <path d="M55 185 V120 M55 120 V55" markerMid="url(#arrow)" />
      </g>
      <circle className="diagram-dot" cx="55" cy="55" r="7" />
      <g className="diagram-labels" textAnchor="middle" fontSize="15">
        <text x="120" y="38">
          1. Breathe in
        </text>
        <text x="120" y="212">
          3. Breathe out
        </text>
        <text transform="translate(212 120) rotate(90)">2. Hold</text>
        <text transform="translate(28 120) rotate(-90)">4. Hold</text>
      </g>
    </svg>
  )
}

export function HowItWorksScreen({ onStart, focusHeading }: Props) {
  const headingRef = useAutoFocus<HTMLHeadingElement>(focusHeading)

  return (
    <article className="screen about">
      <h1 ref={headingRef} tabIndex={-1}>
        How box breathing works
      </h1>
      <p className="lead">
        Box breathing is a simple way to slow down your breathing and calm your mind. You breathe in, hold, breathe
        out and hold again, each for the same count, like tracing the four sides of a square.
      </p>

      <figure className="about-figure">
        <BoxDiagram />
      </figure>

      <h2>The four steps</h2>
      <ol className="steps">
        <li>
          <strong>Breathe in</strong> slowly through your nose for 4 seconds.
        </li>
        <li>
          <strong>Hold</strong> with your lungs full for 4 seconds.
        </li>
        <li>
          <strong>Breathe out</strong> gently for 4 seconds.
        </li>
        <li>
          <strong>Hold</strong> with your lungs empty for 4 seconds.
        </li>
      </ol>
      <p>That is one cycle (16 seconds). Repeat it for a few minutes.</p>

      <h2>Why it can help</h2>
      <ul>
        <li>
          <strong>It slows your breathing down.</strong> Slow, steady breaths can help your body move out of
          “fight or flight” mode and into a more relaxed state.
        </li>
        <li>
          <strong>It gives your mind one simple job.</strong> Counting and following the box leaves less room for
          racing thoughts.
        </li>
        <li>
          <strong>It works anywhere.</strong> Before an exam or presentation, when you can’t sleep, or whenever you
          feel tense, and nobody needs to notice.
        </li>
      </ul>

      <h2>Tips</h2>
      <ul>
        <li>Sit or lie down comfortably and let your shoulders relax.</li>
        <li>Breathe gently. You don’t need to fill your lungs completely.</li>
        <li>If 4 seconds feels too long, lower it in Settings. Being comfortable matters more than the number.</li>
        <li>A few minutes is enough. Three minutes is a good start.</li>
      </ul>

      <h2>Other patterns</h2>
      <p>
        In Settings you can give each phase its own length. For example, the 4-7-8 pattern (in for 4, hold for 7, out
        for 8, no hold at the end) is popular for winding down before sleep.
      </p>

      <aside className="notice">
        If you feel dizzy or light-headed, stop and breathe normally. This app is a relaxation aid, not a medical
        treatment. If you have a heart or lung condition, check with a doctor before practising breath holds.
      </aside>

      <div className="button-row">
        <button type="button" className="btn btn-primary" onClick={onStart}>
          Try it now
        </button>
      </div>
    </article>
  )
}
