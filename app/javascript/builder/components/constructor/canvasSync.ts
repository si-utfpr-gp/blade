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
