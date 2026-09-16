import { memo } from "react"
import { Handle, Position, type NodeProps } from "@xyflow/react"
import type { AlgorithmNode } from "../ConstructorProvider"
import { useEditableLabel } from "./useEditableLabel"
import EditableLabel from "./EditableLabel"

const handleStyle = {
  background: "hsl(var(--node-connector))",
  width: 8,
  height: 8,
}

const ConnectorNode = memo(
  ({ id, data, selected }: NodeProps<AlgorithmNode>) => {
    const { editing, label, setLabel, startEditing, commit, onKeyDown } =
      useEditableLabel(id, data.label ?? "")

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
        onDoubleClick={startEditing}
      >
        <Handle
          type="target"
          id="top-in"
          position={Position.Top}
          style={handleStyle}
        />
        <Handle
          type="target"
          id="left-in"
          position={Position.Left}
          style={handleStyle}
        />
        <Handle
          type="target"
          id="right-in"
          position={Position.Right}
          style={handleStyle}
        />
        <Handle
          type="source"
          id="bottom-out"
          position={Position.Bottom}
          style={handleStyle}
        />

        {(editing || label) && (
          <EditableLabel
            editing={editing}
            value={label}
            onChange={setLabel}
            onBlur={commit}
            onKeyDown={onKeyDown}
            inputStyle={{ maxWidth: "30px", fontSize: "0.65rem" }}
            displayClassName="text-[10px] font-bold"
          />
        )}
      </div>
    )
  },
)

ConnectorNode.displayName = "ConnectorNode"
export default ConnectorNode
