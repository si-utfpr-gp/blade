import { memo, useCallback, useMemo, useState, type FocusEvent } from "react"
import { Handle, Position, type NodeProps } from "@xyflow/react"
import { Plus, Trash2 } from "lucide-react"
import { useConstructor, type AlgorithmNode } from "../ConstructorProvider"
import {
  SELECTION_DEFAULT_HANDLE,
  selectionCaseHandle,
} from "../../blocks/blockCapabilities"
import { useEditableLabel } from "./useEditableLabel"
import EditableLabel from "./EditableLabel"

// Horizontal room per exit; the layout of the examples spreads the arrows by
// the same step.
const CASE_WIDTH = 64
const DIAMOND_WIDTH = 140
const DIAMOND_HEIGHT = 100
// From the diamond's bottom tip down to the exits: a trunk, the bar the cases
// hang from, and a stub per case carrying its value.
const TRUNK = 10
const STUB = 30

/**
 * The escolha/caso block: a diamond holding the expression being compared,
 * the Falso exit on its left and one exit per case hanging from its bottom
 * tip, with the case's value written once on the exit.
 *
 * Editing stays out of the way until asked for: hovering a value (or tapping
 * it, on a phone) opens a small box to edit or remove that case, and the "+"
 * to add one shows while the block is hovered or selected.
 */
const SelectionNode = memo(
  ({ id, data, selected }: NodeProps<AlgorithmNode>) => {
    const { updateSelectionCases } = useConstructor()
    const { editing, label, setLabel, startEditing, commit, onKeyDown } =
      useEditableLabel(id, data.label)
    const [hovered, setHovered] = useState(false)
    const [openCase, setOpenCase] = useState<number | null>(null)

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
      (index: number) => {
        setOpenCase(null)
        updateSelectionCases(
          id,
          cases.filter((_, i) => i !== index),
          unchanged.filter((i) => i !== index),
        )
      },
      [id, cases, unchanged, updateSelectionCases],
    )

    // Leaving a case closes its box, unless the student is typing in it.
    const closeUnlessFocused = (event: { currentTarget: HTMLElement }) => {
      if (!event.currentTarget.contains(document.activeElement)) setOpenCase(null)
    }
    const closeOnBlur = (event: FocusEvent<HTMLElement>) => {
      if (!event.currentTarget.contains(event.relatedTarget as Node | null)) {
        setOpenCase(null)
      }
    }

    const borderColor = data.hasError
      ? "hsl(var(--node-error))"
      : selected
        ? "hsl(var(--ring))"
        : "hsl(var(--node-selection) / 0.4)"
    const lineColor = "hsl(var(--node-selection) / 0.6)"

    // Room for one more slot, where the "+" appears.
    const width = Math.max(160, (cases.length + 1) * CASE_WIDTH)
    const center = width / 2
    const caseX = (index: number) =>
      center + (index - (cases.length - 1) / 2) * CASE_WIDTH
    const showAdd = hovered || selected

    return (
      <div
        data-testid="selection-block"
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        style={{ width: `${width}px`, position: "relative" }}
      >
        <div
          style={{
            position: "relative",
            width: `${DIAMOND_WIDTH}px`,
            height: `${DIAMOND_HEIGHT}px`,
            margin: "0 auto",
          }}
          onDoubleClick={startEditing}
        >
          <svg
            width={DIAMOND_WIDTH}
            height={DIAMOND_HEIGHT}
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

        {/* The exits, drawn from the diamond's tip so the cases read as part
            of the block rather than loose boxes under it. */}
        <div style={{ position: "relative", height: `${TRUNK + STUB}px`, marginTop: "-4px" }}>
          <svg
            width={width}
            height={TRUNK + STUB}
            style={{ position: "absolute", top: 0, left: 0, overflow: "visible" }}
            aria-hidden="true"
          >
            {cases.length > 0 && (
              <>
                <line x1={center} y1={0} x2={center} y2={TRUNK} stroke={lineColor} strokeWidth="2" />
                <line
                  x1={Math.min(caseX(0), center)}
                  y1={TRUNK}
                  x2={Math.max(caseX(cases.length - 1), center)}
                  y2={TRUNK}
                  stroke={lineColor}
                  strokeWidth="2"
                />
              </>
            )}
            {cases.map((_, index) => (
              <line
                key={index}
                x1={caseX(index)}
                y1={TRUNK}
                x2={caseX(index)}
                y2={TRUNK + STUB}
                stroke={lineColor}
                strokeWidth="2"
              />
            ))}
          </svg>

          {cases.map((value, index) => (
            <div
              key={index}
              data-testid={`case-${index}`}
              onMouseEnter={() => setOpenCase(index)}
              onMouseLeave={closeUnlessFocused}
              onBlur={closeOnBlur}
              style={{
                position: "absolute",
                left: `${caseX(index)}px`,
                top: 0,
                height: `${TRUNK + STUB}px`,
                transform: "translateX(-50%)",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
              }}
            >
              <button
                type="button"
                className="nodrag"
                aria-label={`Caso ${index + 1}: ${value}`}
                aria-expanded={openCase === index}
                onClick={() => setOpenCase(index)}
                style={{
                  marginTop: `${TRUNK + 6}px`,
                  padding: "0 4px",
                  maxWidth: `${CASE_WIDTH - 8}px`,
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                  fontSize: "0.7rem",
                  fontFamily: "var(--font-mono)",
                  lineHeight: "1rem",
                  color: "hsl(var(--foreground))",
                  background: "white",
                  border: "none",
                  borderRadius: "4px",
                  cursor: "pointer",
                }}
              >
                {value || "?"}
              </button>

              <Handle
                type="source"
                position={Position.Bottom}
                id={selectionCaseHandle(index)}
                style={{ background: "hsl(var(--node-selection))" }}
              />

              {openCase === index && (
                <div
                  className="nodrag"
                  style={{
                    position: "absolute",
                    top: `${TRUNK + STUB + 10}px`,
                    zIndex: 10,
                    display: "flex",
                    alignItems: "center",
                    gap: "4px",
                    padding: "4px",
                    background: "white",
                    border: "1.5px solid hsl(var(--node-selection) / 0.5)",
                    borderRadius: "8px",
                    boxShadow: "0 4px 12px rgb(15 23 42 / 0.12)",
                  }}
                >
                  <input
                    className="node-label-input nodrag"
                    aria-label={`Valor do caso ${index + 1}`}
                    value={value}
                    onChange={(e) => editCase(index, e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === "Escape") setOpenCase(null)
                    }}
                    style={{
                      width: "56px",
                      fontSize: "0.75rem",
                      fontFamily: "var(--font-mono)",
                      textAlign: "center",
                    }}
                  />
                  <button
                    type="button"
                    className="nodrag"
                    onClick={() => removeCase(index)}
                    title="Remover caso"
                    style={{
                      color: "hsl(var(--destructive))",
                      background: "transparent",
                      border: "none",
                      cursor: "pointer",
                      padding: "2px",
                      display: "flex",
                    }}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
            </div>
          ))}

          {showAdd && (
            <button
              type="button"
              className="nodrag"
              onClick={addCase}
              title="Adicionar caso"
              style={{
                position: "absolute",
                left: `${caseX(cases.length)}px`,
                top: `${TRUNK + 4}px`,
                transform: "translateX(-50%)",
                color: "hsl(var(--node-selection))",
                background: "white",
                border: "1.5px dashed hsl(var(--node-selection) / 0.5)",
                borderRadius: "6px",
                cursor: "pointer",
                padding: "2px",
                display: "flex",
              }}
            >
              <Plus className="w-3 h-3" />
            </button>
          )}
        </div>
      </div>
    )
  },
)

SelectionNode.displayName = "SelectionNode"
export default SelectionNode
