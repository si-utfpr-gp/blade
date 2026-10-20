import type { IExecutionStep } from "../../interfaces/execution"

export function getHighlightedNodeId(
  steps: IExecutionStep[],
  currentStepIndex: number,
): string | null {
  if (currentStepIndex < 0 || currentStepIndex >= steps.length) return null
  return steps[currentStepIndex]?.nodeId ?? null
}

// Share of the screen the debugger sheet covers on a phone; WorkspaceLayout
// draws it with h-[55dvh].
export const MOBILE_SHEET_SHARE = 0.55

/**
 * How far below the block the camera aims when following the run, in flow
 * units. On a phone the open debugger covers the lower part of the screen, so
 * aiming half a sheet lower puts the block in the middle of what is left.
 */
export function followOffsetY({
  isDesktop,
  sheetOpen,
  viewportHeight,
  zoom,
}: {
  isDesktop: boolean
  sheetOpen: boolean
  viewportHeight: number
  zoom: number
}): number {
  if (isDesktop || !sheetOpen) return 0
  return (viewportHeight * MOBILE_SHEET_SHARE) / 2 / zoom
}

/**
 * What the canvas lets the student do. A running simulation freezes the
 * diagram; a bundled example can be rearranged to read it better, but its
 * content stays as shipped, so nothing is added, removed or rewired.
 */
export function canvasPermissions({
  running,
  isExample,
}: {
  running: boolean
  isExample: boolean
}): { canMove: boolean; canEdit: boolean } {
  return { canMove: !running, canEdit: !running && !isExample }
}

export function isCanvasLocked(
  isStarted: boolean,
  isFinished: boolean,
): boolean {
  return isStarted && !isFinished
}

export interface CanvasRect {
  left: number
  top: number
}

const DROP_HALF_SIZE: Record<string, { x: number; y: number }> = {
  startEnd: { x: 85, y: 28 },
  memory: { x: 110, y: 45 },
  input: { x: 85, y: 28 },
  output: { x: 85, y: 28 },
  process: { x: 85, y: 28 },
  decision: { x: 70, y: 50 },
  subroutine: { x: 85, y: 28 },
  connector: { x: 24, y: 24 },
}

export function centerDropPosition(
  position: { x: number; y: number },
  blockType: string,
): { x: number; y: number } {
  const offset = DROP_HALF_SIZE[blockType] ?? { x: 80, y: 25 }
  return { x: position.x - offset.x, y: position.y - offset.y }
}

export function getContextMenuPosition(
  clientX: number,
  clientY: number,
  rect: CanvasRect,
): { x: number; y: number } {
  return { x: clientX - rect.left, y: clientY - rect.top }
}
