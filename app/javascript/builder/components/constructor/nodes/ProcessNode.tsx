import { memo } from "react"
import { Handle, Position, type NodeProps } from "@xyflow/react"
import type { AlgorithmNode } from "../ConstructorProvider"
import { useEditableLabel } from "./useEditableLabel"
import EditableLabel from "./EditableLabel"

const ProcessNode = memo(({ id, data, selected }: NodeProps<AlgorithmNode>) => {
  const { editing, label, setLabel, startEditing, commit, onKeyDown } =
    useEditableLabel(id, data.label)

  const borderColor = data.hasError
    ? "hsl(var(--node-error))"
    : selected
      ? "hsl(var(--ring))"
      : "hsl(var(--node-process) / 0.3)"

  return (
    <div
      className="node-base"
      style={{
        background: "white",
        color: "hsl(var(--foreground))",
        borderRadius: "8px",
        border: `2.5px solid ${borderColor}`,
        padding: "12px 24px",
        boxShadow: selected
          ? "0 0 0 2px hsl(var(--ring) / 0.3)"
          : "0 2px 8px rgba(0,0,0,0.08)",
        borderLeft: "5px solid hsl(var(--node-process))",
      }}
      onDoubleClick={startEditing}
    >
      <Handle
        type="target"
        position={Position.Top}
        style={{ background: "hsl(var(--node-process))" }}
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
        style={{ background: "hsl(var(--node-process))" }}
      />
    </div>
  )
})

ProcessNode.displayName = "ProcessNode"
export default ProcessNode
