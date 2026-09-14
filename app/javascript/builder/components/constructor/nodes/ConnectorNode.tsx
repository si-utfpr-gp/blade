import { memo, useMemo } from "react"
import { Handle, Position, type NodeProps } from "@xyflow/react"
import { useConstructor, type AlgorithmNode } from "../ConstructorProvider"
import { useEditableLabel } from "./useEditableLabel"
import EditableLabel from "./EditableLabel"
import { getConnectorRole, CONNECTOR_ROLE_LABEL } from "./connectorRole"

const handleStyle = {
  background: "hsl(var(--node-connector))",
  width: 6,
  height: 6,
}

const ConnectorNode = memo(
  ({ id, data, selected }: NodeProps<AlgorithmNode>) => {
    const { edges } = useConstructor()
    const { editing, label, setLabel, startEditing, commit, onKeyDown } =
      useEditableLabel(id, data.label ?? "")

    const role = useMemo(() => getConnectorRole(id, edges), [id, edges])

    const borderColor =
      data.hasError || role === "invalid"
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
          position: "relative",
        }}
        onDoubleClick={startEditing}
        title={CONNECTOR_ROLE_LABEL[role]}
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

        <EditableLabel
          editing={editing}
          value={label}
          onChange={setLabel}
          onBlur={commit}
          onKeyDown={onKeyDown}
          inputStyle={{ maxWidth: "30px", fontSize: "0.65rem" }}
          displayClassName="text-[10px] font-bold"
        />
      </div>
    )
  },
)

ConnectorNode.displayName = "ConnectorNode"
export default ConnectorNode
