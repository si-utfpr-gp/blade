import { memo, useState, useCallback } from "react"
import { Handle, Position, NodeProps } from "@xyflow/react"

interface SubroutineData {
  label: string
  hasError?: boolean
  onLabelChange?: (id: string, label: string) => void
}

const SubroutineNode = memo(
  ({ id, data, selected }: NodeProps & { data: SubroutineData }) => {
    const [editing, setEditing] = useState(false)
    const [label, setLabel] = useState(data.label)

    const handleDoubleClick = useCallback(() => setEditing(true), [])
    const handleBlur = useCallback(() => {
      setEditing(false)
      data.onLabelChange?.(id, label)
    }, [id, label, data])

    const borderColor = data.hasError
      ? "hsl(var(--node-error))"
      : selected
        ? "hsl(var(--ring))"
        : "hsl(var(--node-subroutine) / 0.4)"

    return (
      <div
        className="node-base"
        style={{
          background: "white",
          color: "hsl(var(--foreground))",
          borderRadius: "4px",
          border: `2.5px solid ${borderColor}`,
          padding: "12px 32px",
          boxShadow: selected
            ? "0 0 0 2px hsl(var(--ring) / 0.3)"
            : "0 2px 8px rgba(0,0,0,0.08)",
          position: "relative",
          minWidth: "160px",
        }}
        onDoubleClick={handleDoubleClick}
      >
        <Handle
          type="target"
          position={Position.Top}
          style={{ background: "hsl(var(--node-subroutine))" }}
        />

        {/* Inner double-border lines */}
        <div
          style={{
            position: "absolute",
            left: "8px",
            top: 0,
            bottom: 0,
            width: "2px",
            background: borderColor,
          }}
        />
        <div
          style={{
            position: "absolute",
            right: "8px",
            top: 0,
            bottom: 0,
            width: "2px",
            background: borderColor,
          }}
        />

        {editing ? (
          <input
            className="node-label-input"
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            onBlur={handleBlur}
            onKeyDown={(e) => e.key === "Enter" && handleBlur()}
            autoFocus
          />
        ) : (
          <span className="text-sm font-medium">{label}</span>
        )}
        <Handle
          type="source"
          position={Position.Bottom}
          style={{ background: "hsl(var(--node-subroutine))" }}
        />
      </div>
    )
  },
)

SubroutineNode.displayName = "SubroutineNode"
export default SubroutineNode
