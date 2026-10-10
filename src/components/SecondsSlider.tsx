import { useId } from 'react'

interface Props {
  label: string
  value: number
  min: number
  max: number
  onChange: (value: number) => void
}

/** A labelled slider for choosing a number of seconds. */
export function SecondsSlider({ label, value, min, max, onChange }: Props) {
  const id = useId()
  const valueText = value === 0 ? 'Skip' : `${value} s`
  return (
    <div className="slider-row">
      <div className="slider-header">
        <label htmlFor={id} className="field-label">
          {label}
        </label>
        <output htmlFor={id} className="slider-value">
          {valueText}
        </output>
      </div>
      <input
        id={id}
        type="range"
        min={min}
        max={max}
        step={1}
        value={value}
        aria-valuetext={value === 0 ? 'Skip' : `${value} seconds`}
        onChange={(event) => onChange(Number(event.target.value))}
      />
    </div>
  )
}
