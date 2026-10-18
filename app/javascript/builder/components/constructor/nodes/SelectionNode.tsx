import { memo, useCallback, useMemo } from "react"
import { Handle, Position, type NodeProps } from "@xyflow/react"
import { Plus, X } from "lucide-react"
import { useConstructor, type AlgorithmNode } from "../ConstructorProvider"
import {
  SELECTION_DEFAULT_HANDLE,
  selectionCaseHandle,
} from "../../blocks/blockCapabilities"
import { useEditableLabel } from "./useEditableLabel"
import EditableLabel from "./EditableLabel"

const CASE_WIDTH = 64

/**
 * The escolha/caso block: a diamond holding the expression being compared,
 * one exit per case value along the bottom and the Falso exit on the left.
 */
const SelectionNode = memo(
  ({ id, data, selected }: NodeProps<AlgorithmNode>) => {
    const { updateSelectionCases } = useConstructor()
    const { editing, label, setLabel, startEditing, commit, onKeyDown } =
      useEditableLabel(id, data.label)

    const cases = useMemo(() => data.cases ?? [], [data.cases])
    const unchanged = useMemo(() => cases.map((_, index) => index), [cases])

    const editCase = useCallback(
      (index: number, value: string) =>
        updateSelectionCases(
          id,
          cases.map((current, i) => (i === index ? value : current)),
          unchanged,
        ),
      [id, cases, unchanged, updateSelectionCases],
    )

    const addCase = useCallback(
      () =>
        updateSelectionCases(
          id,
          [...cases, String(cases.length + 1)],
          [...unchanged, null],
        ),
      [id, cases, unchanged, updateSelectionCases],
    )

    const removeCase = useCallback(
      (index: number) =>
        updateSelectionCases(
          id,
          cases.filter((_, i) => i !== index),
          unchanged.filter((i) => i !== index),
        ),
      [id, cases, unchanged, updateSelectionCases],
    )

    const borderColor = data.hasError
      ? "hsl(var(--node-error))"
      : selected
        ? "hsl(var(--ring))"
        : "hsl(var(--node-selection) / 0.4)"

    const width = Math.max(160, (cases.length + 1) * CASE_WIDTH)

    return (
      <div
        style={{
          width: `${width}px`,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: "6px",
        }}
      >
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
              style={{ background: "hsl(var(--node-selection))", top: "-4px" }}
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
              position={Position.Left}
              id={SELECTION_DEFAULT_HANDLE}
              title="Falso"
              style={{ background: "hsl(var(--node-end))", left: "-4px" }}
            />
          </div>
        </div>

        <div style={{ display: "flex", gap: "4px", alignItems: "flex-start" }}>
          {cases.map((value, index) => (
            <div
              key={index}
              style={{
                position: "relative",
                width: `${CASE_WIDTH - 4}px`,
                display: "flex",
                alignItems: "center",
                background: "white",
                border: "1.5px solid hsl(var(--node-selection) / 0.4)",
                borderRadius: "6px",
                padding: "2px 2px 2px 4px",
              }}
            >
              <input
                className="node-label-input nodrag"
                aria-label={`Valor do caso ${index + 1}`}
                value={value}
                onChange={(e) => editCase(index, e.target.value)}
                style={{
                  fontSize: "0.7rem",
                  fontFamily: "var(--font-mono)",
                  width: "100%",
                  minWidth: 0,
                  textAlign: "center",
                }}
              />
              <button
                type="button"
                className="nodrag"
                onClick={() => removeCase(index)}
                title="Remover caso"
                style={{
                  color: "hsl(var(--muted-foreground))",
                  background: "transparent",
                  border: "none",
                  cursor: "pointer",
                  padding: 0,
                  display: "flex",
                }}
              >
                <X className="w-3 h-3" />
              </button>
              <Handle
                type="source"
                position={Position.Bottom}
                id={selectionCaseHandle(index)}
                style={{ background: "hsl(var(--node-selection))" }}
              />
            </div>
          ))}
          <button
            type="button"
            className="nodrag"
            onClick={addCase}
            title="Adicionar caso"
            style={{
              color: "hsl(var(--node-selection))",
              background: "white",
              border: "1.5px dashed hsl(var(--node-selection) / 0.5)",
              borderRadius: "6px",
              cursor: "pointer",
              padding: "4px",
              display: "flex",
            }}
          >
            <Plus className="w-3 h-3" />
          </button>
        </div>
      </div>
    )
  },
)

SelectionNode.displayName = "SelectionNode"
export default SelectionNode
