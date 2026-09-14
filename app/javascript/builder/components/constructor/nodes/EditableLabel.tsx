import type { CSSProperties, KeyboardEvent } from "react"

interface EditableLabelProps {
  editing: boolean
  value: string
  onChange: (value: string) => void
  onBlur: () => void
  onKeyDown: (e: KeyboardEvent) => void
  inputStyle?: CSSProperties
  displayClassName?: string
  displayStyle?: CSSProperties
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
}: EditableLabelProps) {
  if (editing) {
    return (
      <input
        className="node-label-input"
        style={inputStyle}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onBlur={onBlur}
        onKeyDown={onKeyDown}
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
