import { BaseEdge, getSmoothStepPath, type EdgeProps } from "@xyflow/react"
import { selectionCaseIndex } from "../../blocks/blockCapabilities"

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
 * with case arrows turning at the height caseTurnY picks.
 */
export function FlowStepEdge({
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
  const centerY = caseTurnY({ sourceHandleId, sourceX, sourceY, targetX, targetY })
  const [path, labelX, labelY] = getSmoothStepPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
    borderRadius: 0,
    ...(centerY !== undefined ? { centerY } : {}),
  })

  return (
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
      interactionWidth={interactionWidth}
    />
  )
}

// Overrides React Flow's built-in "step", the type every arrow on the canvas
// already uses, so saved diagrams need no change.
export const edgeTypes = { step: FlowStepEdge }
