import { useId } from 'react'

export interface ChipOption<T extends string | number> {
  value: T
  label: string
}

interface Props<T extends string | number> {
  legend: string
  /** Hide the legend visually (screen readers still read it). */
  hideLegend?: boolean
  options: readonly ChipOption<T>[]
  value: T | null
  onChange: (value: T) => void
}

/**
 * A row of pill-shaped choices. Under the hood these are real radio buttons,
 * so arrow keys, screen readers and forms all work as expected.
 */
export function ChipGroup<T extends string | number>({ legend, hideLegend, options, value, onChange }: Props<T>) {
  const name = useId()
  return (
    <fieldset className="chip-group">
      <legend className={hideLegend ? 'visually-hidden' : 'field-label'}>{legend}</legend>
      <div className="chip-row">
        {options.map((option) => (
          <label key={option.value} className="chip">
            <input
              type="radio"
              name={name}
              value={option.value}
              checked={option.value === value}
              onChange={() => onChange(option.value)}
            />
            <span>{option.label}</span>
          </label>
        ))}
      </div>
    </fieldset>
  )
}
