import { memo, useState, useCallback } from "react"
import { Handle, Position, NodeProps } from "@xyflow/react"

interface StartEndData {
  label: string
  variant: "start" | "end"
  hasError?: boolean
  onLabelChange?: (id: string, label: string) => void
}

const StartEndNode = memo(
  ({ id, data, selected }: NodeProps & { data: StartEndData }) => {
    const [editing, setEditing] = useState(false)
    const [label, setLabel] = useState(data.label)
    const isStart = data.variant === "start"
    const hasError = data.hasError

    const handleDoubleClick = useCallback(() => setEditing(true), [])
    const handleBlur = useCallback(() => {
      setEditing(false)
      data.onLabelChange?.(id, label)
    }, [id, label, data])

    const bgColor = isStart ? "hsl(var(--node-start))" : "hsl(var(--node-end))"
    const borderColor = hasError
      ? "hsl(var(--node-error))"
      : selected
        ? "hsl(var(--ring))"
        : "transparent"

    return (
      <div
        className="node-base"
        style={{
          background: bgColor,
          color: "white",
          borderRadius: "50px",
          border: `3px solid ${borderColor}`,
          padding: "8px 28px",
          boxShadow: selected
            ? "0 0 0 2px hsl(var(--ring) / 0.3)"
            : "0 2px 8px rgba(0,0,0,0.1)",
        }}
        onDoubleClick={handleDoubleClick}
      >
        {!isStart && (
          <Handle
            type="target"
            position={Position.Top}
            style={{ background: "hsl(var(--foreground))" }}
          />
        )}
        {editing ? (
          <input
            className="node-label-input"
            style={{ color: "white" }}
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            onBlur={handleBlur}
            onKeyDown={(e) => e.key === "Enter" && handleBlur()}
            autoFocus
          />
        ) : (
          <span className="text-sm font-semibold">{label}</span>
        )}
        {isStart && (
          <Handle
            type="source"
            position={Position.Bottom}
            style={{ background: "hsl(var(--foreground))" }}
          />
        )}
      </div>
    )
  },
)

StartEndNode.displayName = "StartEndNode"
export default StartEndNode
