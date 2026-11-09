import { memo } from "react"
import { Handle, Position, type NodeProps } from "@xyflow/react"
import type { AlgorithmNode } from "../ConstructorProvider"
import { useEditableLabel } from "./useEditableLabel"
import EditableLabel from "./EditableLabel"

const DecisionNode = memo(
  ({ id, data, selected }: NodeProps<AlgorithmNode>) => {
    const { editing, label, setLabel, startEditing, commit, onKeyDown } =
      useEditableLabel(id, data.label)

    const borderColor = data.hasError
      ? "hsl(var(--node-error))"
      : selected
        ? "hsl(var(--ring))"
        : "hsl(var(--node-decision) / 0.4)"

    return (
      <div
        style={{ position: "relative", width: "140px", height: "100px" }}
        onDoubleClick={startEditing}
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

          <EditableLabel
            editing={editing}
            value={label}
            onChange={setLabel}
            onBlur={commit}
            onKeyDown={onKeyDown}
            inputStyle={{ maxWidth: "80px" }}
            displayClassName="text-xs font-medium text-center leading-tight"
            displayStyle={{ maxWidth: "80px" }}
          />

          <Handle
            type="source"
            position={Position.Right}
            id="yes"
            style={{ background: "hsl(var(--node-start))", right: "-4px" }}
          />
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
