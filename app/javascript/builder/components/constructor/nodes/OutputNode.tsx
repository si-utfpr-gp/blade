import { memo } from "react"
import { Handle, Position, type NodeProps } from "@xyflow/react"
import type { AlgorithmNode } from "../ConstructorProvider"
import { useEditableLabel } from "./useEditableLabel"
import EditableLabel from "./EditableLabel"

const OutputNode = memo(({ id, data, selected }: NodeProps<AlgorithmNode>) => {
  const { editing, label, setLabel, startEditing, commit, onKeyDown } =
    useEditableLabel(id, data.label)

  const borderColor = data.hasError
    ? "hsl(var(--node-error))"
    : selected
      ? "hsl(var(--ring))"
      : "transparent"

  return (
    <div style={{ position: "relative" }}>
      <svg
        width="20"
        height="16"
        viewBox="0 0 20 16"
        aria-hidden="true"
        style={{
          position: "absolute",
          right: "-2px",
          top: "80%",
          transform: "translateY(-50%)",
          pointerEvents: "none",
        }}
      >
        <path
          d="M2 8 L16 8 M11 3 L17 8 L11 13"
          fill="none"
          stroke="hsl(var(--node-output))"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>

      <div
        className="node-base"
        style={{
          background: "hsl(var(--node-output) / 0.12)",
          color: "hsl(var(--foreground))",
          border: `2.5px solid ${borderColor}`,
          padding: "12px 36px",
          clipPath: "polygon(12% 0%, 100% 0%, 88% 100%, 0% 100%)",
          boxShadow: "none",
          minWidth: "160px",
          position: "relative",
        }}
        onDoubleClick={startEditing}
      >
        <Handle
          type="target"
          position={Position.Top}
          style={{ background: "hsl(var(--node-output))" }}
        />

        <EditableLabel
          editing={editing}
          value={label}
          onChange={setLabel}
          onBlur={commit}
          onKeyDown={onKeyDown}
          displayClassName="text-sm font-medium"
        />

        <Handle
          type="source"
          position={Position.Bottom}
          style={{ background: "hsl(var(--node-output))" }}
        />
      </div>
    </div>
  )
})

OutputNode.displayName = "OutputNode"
export default OutputNode
