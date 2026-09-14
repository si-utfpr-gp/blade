import { memo, useState, useCallback } from "react"
import { Handle, Position, NodeProps } from "@xyflow/react"

interface ConnectorData {
  label: string
  hasError?: boolean
  onLabelChange?: (id: string, label: string) => void
}

const handleStyle = {
  background: "hsl(var(--node-connector))",
  width: 6,
  height: 6,
}

const ConnectorNode = memo(
  ({ id, data, selected }: NodeProps & { data: ConnectorData }) => {
    const [editing, setEditing] = useState(false)
    const [label, setLabel] = useState(data.label ?? "")

    const handleDoubleClick = useCallback(() => setEditing(true), [])
    const handleBlur = useCallback(() => {
      setEditing(false)
      data.onLabelChange?.(id, label)
    }, [id, label, data])

    const borderColor = data.hasError
      ? "hsl(var(--node-error))"
      : selected
        ? "hsl(var(--ring))"
        : "hsl(var(--node-connector) / 0.4)"

    return (
      <div
        className="node-base"
        style={{
          background: "white",
          color: "hsl(var(--foreground))",
          border: `2.5px solid ${borderColor}`,
          borderRadius: "50%",
          width: "48px",
          height: "48px",
          minWidth: "auto",
          minHeight: "auto",
          padding: 0,
          boxShadow: selected
            ? "0 0 0 2px hsl(var(--ring) / 0.3)"
            : "0 2px 8px rgba(0,0,0,0.08)",
        }}
        onDoubleClick={handleDoubleClick}
      >
        {/* Top — target + source */}
        <Handle
          type="target"
          id="top-in"
          position={Position.Top}
          style={handleStyle}
        />
        {/* Bottom — target + source */}
        <Handle
          type="target"
          id="bottom-in"
          position={Position.Bottom}
          style={handleStyle}
        />
        {/* Left — target + source */}
        <Handle
          type="target"
          id="left-in"
          position={Position.Left}
          style={handleStyle}
        />
        {/* Right — target + source */}
        <Handle
          type="target"
          id="right-in"
          position={Position.Right}
          style={handleStyle}
        />

        {editing ? (
          <input
            className="node-label-input"
            style={{ maxWidth: "30px", fontSize: "0.65rem" }}
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            onBlur={handleBlur}
            onKeyDown={(e) => e.key === "Enter" && handleBlur()}
            placeholder=""
            autoFocus
          />
        ) : label ? (
          <span className="text-[10px] font-bold">{label}</span>
        ) : null}
      </div>
    )
  },
)

ConnectorNode.displayName = "ConnectorNode"
export default ConnectorNode
