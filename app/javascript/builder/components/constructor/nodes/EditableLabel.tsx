import type { CSSProperties, KeyboardEvent } from "react"

interface EditableLabelProps {
  editing: boolean
  value: string
  onChange: (value: string) => void
  onBlur: () => void
  onKeyDown: (event: KeyboardEvent) => void
  inputStyle?: CSSProperties
  displayClassName?: string
  displayStyle?: CSSProperties
  placeholder?: string
}

export default function EditableLabel({
  editing,
  value,
  onChange,
  onBlur,
  onKeyDown,
  inputStyle,
  displayClassName,
  displayStyle,
  placeholder,
}: EditableLabelProps) {
  if (editing) {
    return (
      <input
        className="node-label-input"
        style={inputStyle}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        onBlur={onBlur}
        onKeyDown={onKeyDown}
        placeholder={placeholder}
        autoFocus
      />
    )
  }

  return (
    <span className={displayClassName} style={displayStyle}>
      {value}
    </span>
  )
}
