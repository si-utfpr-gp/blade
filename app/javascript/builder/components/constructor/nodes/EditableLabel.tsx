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
  // Input and output blocks hold long messages: Enter breaks the line and the
  // text wraps instead of running past the block's slanted sides.
  multiline?: boolean
}

// Wide enough for a sentence, narrow enough that the block stays a block.
const MULTILINE_MAX_WIDTH = "22rem"

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
  multiline = false,
}: EditableLabelProps) {
  if (editing && multiline) {
    const lines = value.split("\n")
    const longest = Math.max(...lines.map((line) => line.length))
    return (
      <textarea
        // nodrag and nowheel let a drag select text and the wheel scroll the
        // field, instead of moving the block or zooming the canvas.
        className="node-label-input nodrag nowheel resize-none"
        style={{
          ...inputStyle,
          width: `min(${Math.max(longest, 8) + 2}ch, ${MULTILINE_MAX_WIDTH})`,
        }}
        rows={lines.length}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        onBlur={onBlur}
        onKeyDown={onKeyDown}
        placeholder={placeholder}
        autoFocus
      />
    )
  }

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
    <span
      className={displayClassName}
      style={
        multiline
          ? { whiteSpace: "pre-wrap", overflowWrap: "anywhere", maxWidth: MULTILINE_MAX_WIDTH, ...displayStyle }
          : displayStyle
      }
    >
      {value}
    </span>
  )
}
