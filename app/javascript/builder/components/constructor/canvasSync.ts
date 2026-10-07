import type { IExecutionStep } from "../../interfaces/execution"

export function getHighlightedNodeId(
  steps: IExecutionStep[],
  currentStepIndex: number,
): string | null {
  if (currentStepIndex < 0 || currentStepIndex >= steps.length) return null
  return steps[currentStepIndex]?.nodeId ?? null
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
