import { memo, useState, useCallback } from "react"
import { Handle, Position, NodeProps } from "@xyflow/react"

interface DecisionData {
  label: string
  hasError?: boolean
  onLabelChange?: (id: string, label: string) => void
}

const DecisionNode = memo(
  ({ id, data, selected }: NodeProps & { data: DecisionData }) => {
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
        : "hsl(var(--node-decision) / 0.4)"

    return (
      <div
        style={{ position: "relative", width: "140px", height: "100px" }}
        onDoubleClick={handleDoubleClick}
      >
        <svg
          width="140"
          height="100"
          viewBox="0 0 140 100"
          style={{ position: "absolute", top: 0, left: 0 }}
        >
          <polygon
            points="70,4 136,50 70,96 4,50"
            fill="white"
            stroke={borderColor}
            strokeWidth="2.5"
          />
          <polygon points="70,4 76,7 76,7 70,4" fill="none" />
        </svg>
        <div
          className="node-base"
          style={{
            position: "absolute",
            inset: 0,
            background: "transparent",
            minWidth: "auto",
            minHeight: "auto",
          }}
        >
          <Handle
            type="target"
            position={Position.Top}
            style={{ background: "hsl(var(--node-decision))", top: "-4px" }}
          />
          {editing ? (
            <input
              className="node-label-input"
              style={{ maxWidth: "80px" }}
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              onBlur={handleBlur}
              onKeyDown={(e) => e.key === "Enter" && handleBlur()}
              autoFocus
            />
          ) : (
            <span
              className="text-xs font-medium text-center leading-tight"
              style={{ maxWidth: "80px" }}
            >
              {label}
            </span>
          )}
          {/* Sim - Right */}
          <Handle
            type="source"
            position={Position.Right}
            id="yes"
            style={{ background: "hsl(var(--node-start))", right: "-4px" }}
          />
          {/* Não - Left */}
          <Handle
            type="source"
            position={Position.Left}
            id="no"
            style={{ background: "hsl(var(--node-end))", left: "-4px" }}
          />
        </div>
      </div>
    )
  },
)

DecisionNode.displayName = "DecisionNode"
export default DecisionNode
