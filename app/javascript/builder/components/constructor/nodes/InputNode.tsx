import { memo, useState, useCallback, useEffect } from "react"
import { Handle, Position, NodeProps } from "@xyflow/react"

interface InputData {
  label: string
  hasError?: boolean
  onLabelChange?: (id: string, label: string) => void
}

const InputNode = memo(({ id, data }: NodeProps & { data: InputData }) => {
  const [editing, setEditing] = useState(false)
  const [label, setLabel] = useState(data.label)

  useEffect(() => {
    setLabel(data.label)
  }, [data.label])

  const handleDoubleClick = useCallback(() => setEditing(true), [])
  const handleBlur = useCallback(() => {
    setEditing(false)
    data.onLabelChange?.(id, label)
  }, [id, label, data])

  const borderColor = data.hasError ? "hsl(var(--node-error))" : "transparent"

  return (
    <div
      className="node-base"
      style={{
        background: "hsl(var(--node-input) / 0.12)",
        color: "hsl(var(--foreground))",
        border: `2.5px solid ${borderColor}`,
        padding: "12px 36px",
        clipPath: "polygon(12% 0%, 100% 0%, 88% 100%, 0% 100%)",
        boxShadow: "none",
        minWidth: "160px",
        position: "relative",
      }}
      onDoubleClick={handleDoubleClick}
    >
      <Handle
        type="target"
        position={Position.Top}
        style={{ background: "hsl(var(--node-input))" }}
      />

      {/* Arrow pointing into the node (left side) */}
      <svg
        width="20"
        height="16"
        viewBox="0 0 20 16"
        style={{
          position: "absolute",
          left: "10px",
          top: "50%",
          transform: "translateY(-50%)",
        }}
      >
        <path
          d="M2 8 L16 8 M11 3 L17 8 L11 13"
          fill="none"
          stroke="hsl(var(--node-input))"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>

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
        style={{ background: "hsl(var(--node-input))" }}
      />
    </div>
  )
})

InputNode.displayName = "InputNode"
export default InputNode
