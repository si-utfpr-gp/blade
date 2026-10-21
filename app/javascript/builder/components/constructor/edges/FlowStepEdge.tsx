import { BaseEdge, getSmoothStepPath, Position, useReactFlow, useStore, type EdgeProps, type ReactFlowState } from "@xyflow/react"
import { selectionCaseIndex } from "../../blocks/blockCapabilities"
import { loopBodyIds, loopReturnLaneX, loopReturnPath } from "./loopReturn"
import { useMediaQuery } from "../../layout/useMediaQuery"

// How wide around its line an arrow takes a tap: a finger needs more room.
const TOUCH_INTERACTION_WIDTH = 32
const POINTER_INTERACTION_WIDTH = 20

const LATERAL_SIDE: Record<string, "left" | "right"> = { "left-in": "left", "right-in": "right" }

/**
 * Where the arrow that closes a loop climbs back, or null for any other
 * arrow. Only an arrow entering a connector from the side can close a loop,
 * and it does when its source is reachable from that connector.
 */
function loopLaneSelector(edge: { id: string; source: string; target: string; targetHandleId?: string | null }) {
  return (state: ReactFlowState): number | null => {
    const side = edge.targetHandleId ? LATERAL_SIDE[edge.targetHandleId] : undefined
    if (!side) return null

    const body = loopBodyIds(edge, state.edges)
    if (body.size === 0) return null

    const rects = [...body].flatMap((id) => {
      const node = state.nodeLookup.get(id)
      if (!node) return []
      const { x, y } = node.internals.positionAbsolute
      return [{ x, y, width: node.measured.width ?? 0, height: node.measured.height ?? 0 }]
    })
    return rects.length > 0 ? loopReturnLaneX(side, rects) : null
  }
}

/**
 * Where a case arrow turns sideways, or undefined to keep the usual midpoint.
 *
 * The cases of a selection leave side by side and all turn in the gap above
 * their targets; at one shared height, neighbours going the same way overlap.
 * The farther an arrow goes, the earlier it turns, so the arrows on each side
 * nest without sharing a segment.
 */
export function caseTurnY({
  sourceHandleId,
  sourceX,
  sourceY,
  targetX,
  targetY,
}: {
  sourceHandleId?: string | null
  sourceX: number
  sourceY: number
  targetX: number
  targetY: number
}): number | undefined {
  if (selectionCaseIndex(sourceHandleId) === null) return undefined
  const gap = targetY - sourceY
  if (gap <= 0) return undefined
  const share = Math.min(0.8, Math.max(0.2, 0.8 - Math.abs(targetX - sourceX) / 1000))
  return sourceY + gap * share
}

/**
 * The canvas's square-cornered arrow, as React Flow's own "step" draws it,
 * with case arrows turning at the height caseTurnY picks and the arrow that
 * closes a loop going around the body instead of through it.
 */
/**
 * The selected arrow's delete button, at its middle. Deleting used to take
 * the Delete key, which a phone does not have. Drawn in the SVG itself, with
 * a hit area a finger can find.
 */
function EdgeDeleteButton({ x, y, onDelete }: { x: number; y: number; onDelete: () => void }) {
  return (
    <g
      role="button"
      aria-label="Apagar seta"
      tabIndex={0}
      transform={`translate(${x} ${y})`}
      // Edges only take clicks on their stroke; the button takes them anywhere.
      style={{ pointerEvents: "all", cursor: "pointer" }}
      className="nodrag nopan"
      onClick={(event) => {
        event.stopPropagation()
        onDelete()
      }}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault()
          onDelete()
        }
      }}
    >
      <circle r={22} fill="transparent" />
      <circle r={13} fill="hsl(var(--card))" stroke="hsl(var(--node-error))" strokeWidth={2} />
      <path
        d="M -4.5 -4.5 L 4.5 4.5 M 4.5 -4.5 L -4.5 4.5"
        stroke="hsl(var(--node-error))"
        strokeWidth={2.2}
        strokeLinecap="round"
      />
    </g>
  )
}

export function FlowStepEdge({
  id,
  selected,
  deletable,
  source,
  target,
  targetHandleId,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  sourceHandleId,
  label,
  labelStyle,
  labelShowBg,
  labelBgStyle,
  labelBgPadding,
  labelBgBorderRadius,
  style,
  markerEnd,
  markerStart,
  interactionWidth,
}: EdgeProps) {
  const { deleteElements } = useReactFlow()
  const coarsePointer = useMediaQuery("(pointer: coarse)")
  const laneX = useStore(loopLaneSelector({ id, source, target, targetHandleId }))
  const centerY = caseTurnY({ sourceHandleId, sourceX, sourceY, targetX, targetY })
  const [path, labelX, labelY] =
    laneX !== null
      ? loopReturnPath({
          sourceX,
          sourceY,
          targetX,
          targetY,
          laneX,
          fromSide: sourcePosition === Position.Left || sourcePosition === Position.Right,
        })
      : getSmoothStepPath({
          sourceX,
          sourceY,
          sourcePosition,
          targetX,
          targetY,
          targetPosition,
          borderRadius: 0,
          ...(centerY !== undefined ? { centerY } : {}),
        })

  const edge = (
    <BaseEdge
      path={path}
      labelX={labelX}
      labelY={labelY}
      label={label}
      labelStyle={labelStyle}
      labelShowBg={labelShowBg}
      labelBgStyle={labelBgStyle}
      labelBgPadding={labelBgPadding}
      labelBgBorderRadius={labelBgBorderRadius}
      style={style}
      markerEnd={markerEnd}
      markerStart={markerStart}
      interactionWidth={
        interactionWidth ?? (coarsePointer ? TOUCH_INTERACTION_WIDTH : POINTER_INTERACTION_WIDTH)
      }
    />
  )
  if (!selected || deletable === false) return edge

  return (
    <>
      {edge}
      <EdgeDeleteButton x={labelX} y={labelY} onDelete={() => deleteElements({ edges: [{ id }] })} />
    </>
  )
}

// Overrides React Flow's built-in "step", the type every arrow on the canvas
// already uses, so saved diagrams need no change.
export const edgeTypes = { step: FlowStepEdge }
