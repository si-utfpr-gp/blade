import { memo, useCallback } from "react"
import { Handle, Position, type NodeProps } from "@xyflow/react"
import { Plus, Trash2 } from "lucide-react"
import { useConstructor, type AlgorithmNode } from "../ConstructorProvider"

interface MemoryRow {
  type: string
  variables: string
}

const DATA_TYPES = ["inteiro", "real", "caractere", "booleano", "texto"]

const MemoryNode = memo(({ id, data, selected }: NodeProps<AlgorithmNode>) => {
  const { updateNodeData } = useConstructor()

  const rows: MemoryRow[] = (data.rows as MemoryRow[])?.length
    ? (data.rows as MemoryRow[])
    : [{ type: "inteiro", variables: "" }]

  const hasError = data.hasError as boolean | undefined
  const borderColor = hasError
    ? "hsl(var(--node-error))"
    : selected
      ? "hsl(var(--ring))"
      : "hsl(var(--node-memory) / 0.55)"

  const internalLineColor = "hsl(var(--node-memory) / 0.85)"

  const updateRows = useCallback(
    (newRows: MemoryRow[]) => updateNodeData(id, { rows: newRows }),
    [id, updateNodeData],
  )

  const addRow = useCallback(
    () => updateRows([...rows, { type: "inteiro", variables: "" }]),
    [rows, updateRows],
  )

  const removeRow = useCallback(
    (index: number) => {
      if (rows.length > 1) updateRows(rows.filter((_, i) => i !== index))
    },
    [rows, updateRows],
  )

  const updateRowType = useCallback(
    (index: number, type: string) =>
      updateRows(rows.map((r, i) => (i === index ? { ...r, type } : r))),
    [rows, updateRows],
  )

  const updateRowVars = useCallback(
    (index: number, variables: string) =>
      updateRows(rows.map((r, i) => (i === index ? { ...r, variables } : r))),
    [rows, updateRows],
  )

  return (
    <div
      style={{
        background: "hsl(var(--card))",
        border: `2.5px solid ${borderColor}`,
        borderRadius: "10px",
        minWidth: "210px",
        position: "relative",
        overflow: "hidden",
        boxShadow: selected
          ? "0 0 0 3px hsl(var(--ring) / 0.25), 0 6px 16px hsl(var(--node-memory) / 0.18)"
          : "0 4px 12px hsl(var(--node-memory) / 0.18)",
        fontFamily: "var(--font-body)",
        transition: "box-shadow 150ms ease, border-color 150ms ease",
      }}
    >
      <Handle
        type="target"
        position={Position.Top}
        style={{ background: "hsl(var(--node-memory))" }}
      />

      <div
        aria-hidden="true"
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          height: "14px",
          background: "hsl(var(--node-memory) / 0.18)",
          pointerEvents: "none",
        }}
      />
      <div
        aria-hidden="true"
        style={{
          position: "absolute",
          top: 0,
          bottom: 0,
          left: 0,
          width: "22px",
          background: "hsl(var(--node-memory) / 0.18)",
          pointerEvents: "none",
        }}
      />
      <div
        aria-hidden="true"
        style={{
          position: "absolute",
          top: "14px",
          left: 0,
          right: 0,
          height: "1.5px",
          background: internalLineColor,
          pointerEvents: "none",
        }}
      />
      <div
        aria-hidden="true"
        style={{
          position: "absolute",
          top: 0,
          bottom: 0,
          left: "22px",
          width: "1.5px",
          background: internalLineColor,
          pointerEvents: "none",
        }}
      />

      <div style={{ padding: "22px 14px 12px 32px" }}>
        {rows.map((row, i) => (
          <div
            key={i}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "6px",
              marginBottom: i < rows.length - 1 ? "6px" : 0,
              paddingBottom: i < rows.length - 1 ? "6px" : 0,
              borderBottom:
                i < rows.length - 1
                  ? "1px dashed hsl(var(--node-memory) / 0.25)"
                  : "none",
            }}
          >
            <select
              value={row.type}
              onChange={(e) => updateRowType(i, e.target.value)}
              style={{
                fontSize: "0.7rem",
                fontWeight: 600,
                color: "hsl(var(--node-memory))",
                background: "hsl(var(--node-memory) / 0.12)",
                border: "1px solid hsl(var(--node-memory) / 0.25)",
                borderRadius: "6px",
                padding: "3px 6px",
                cursor: "pointer",
                outline: "none",
                fontFamily: "var(--font-mono)",
              }}
            >
              {DATA_TYPES.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
            <input
              className="node-label-input"
              style={{
                fontSize: "0.75rem",
                textAlign: "left",
                fontFamily: "var(--font-mono)",
                flex: 1,
                minWidth: "70px",
                color: "hsl(var(--foreground))",
              }}
              placeholder="var1, var2"
              value={row.variables}
              onChange={(e) => updateRowVars(i, e.target.value)}
            />
            {rows.length > 1 && (
              <button
                onClick={() => removeRow(i)}
                style={{
                  color: "hsl(var(--muted-foreground))",
                  cursor: "pointer",
                  padding: "2px",
                  background: "transparent",
                  border: "none",
                  borderRadius: "4px",
                  display: "flex",
                }}
                title="Remover linha"
              >
                <Trash2 className="w-3 h-3" />
              </button>
            )}
          </div>
        ))}
        <button
          onClick={addRow}
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "4px",
            width: "100%",
            marginTop: "8px",
            fontSize: "0.7rem",
            fontWeight: 500,
            color: "hsl(var(--node-memory))",
            cursor: "pointer",
            backgroundColor: "hsl(var(--node-memory) / 0.06)",
            border: "1px dashed hsl(var(--node-memory) / 0.4)",
            borderRadius: "6px",
            padding: "4px 6px",
            transition: "background 120ms ease",
          }}
        >
          <Plus className="w-3 h-3" /> Linha
        </button>
      </div>

      <Handle
        type="source"
        position={Position.Bottom}
        style={{ background: "hsl(var(--node-memory))" }}
      />
    </div>
  )
})

MemoryNode.displayName = "MemoryNode"
export default MemoryNode
