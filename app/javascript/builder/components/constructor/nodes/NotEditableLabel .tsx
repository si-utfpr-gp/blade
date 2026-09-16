import type { CSSProperties } from "react"

interface NotEditableLabelProps {
  value: string
  inputStyle?: CSSProperties
  displayClassName?: string
  displayStyle?: CSSProperties
  placeholder?: string
}

export default function NotEditableLabel({
  value,
  displayClassName,
  displayStyle,
}: NotEditableLabelProps) {
  return (
    <span className={displayClassName} style={displayStyle}>
      {value}
    </span>
  )
}
