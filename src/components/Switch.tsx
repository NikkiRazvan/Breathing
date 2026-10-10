import { useId } from 'react'

interface Props {
  label: string
  description?: string
  checked: boolean
  disabled?: boolean
  onChange: (checked: boolean) => void
}

/** An on/off toggle (a checkbox styled as a switch). */
export function Switch({ label, description, checked, disabled, onChange }: Props) {
  const id = useId()
  const descriptionId = `${id}-description`
  return (
    <div className="switch-row">
      <label htmlFor={id} className="switch-text">
        <span className="field-label">{label}</span>
        {description && (
          <span id={descriptionId} className="field-hint">
            {description}
          </span>
        )}
      </label>
      <input
        id={id}
        type="checkbox"
        role="switch"
        className="switch"
        checked={checked}
        disabled={disabled}
        aria-describedby={description ? descriptionId : undefined}
        onChange={(event) => onChange(event.target.checked)}
      />
    </div>
  )
}
