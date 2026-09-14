import { memo } from "react"
import { Handle, Position, type NodeProps } from "@xyflow/react"
import type { AlgorithmNode } from "../ConstructorProvider"
import { useEditableLabel } from "./useEditableLabel"
import EditableLabel from "./EditableLabel"

const StartEndNode = memo(
  ({ id, data, selected }: NodeProps<AlgorithmNode>) => {
    const { editing, label, setLabel, startEditing, commit, onKeyDown } =
      useEditableLabel(id, data.label)
    const isStart = data.variant !== "end"

    const bgColor = isStart ? "hsl(var(--node-start))" : "hsl(var(--node-end))"
    const borderColor = data.hasError
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
        onDoubleClick={startEditing}
      >
        {!isStart && (
          <Handle
            type="target"
            position={Position.Top}
            style={{ background: "hsl(var(--foreground))" }}
          />
        )}

        <EditableLabel
          editing={editing}
          value={label}
          onChange={setLabel}
          onBlur={commit}
          onKeyDown={onKeyDown}
          inputStyle={{ color: "white" }}
          displayClassName="text-sm font-semibold"
        />

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
