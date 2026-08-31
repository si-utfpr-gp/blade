import type { IExecutionStep } from "../../interfaces";

type TraceStep = Pick<IExecutionStep, "nodeId" | "nodeType">;

function isInputContinuation(steps: TraceStep[], index: number): boolean {
  if (index === 0 || steps[index]?.nodeType !== "input") return false;

  const previous = steps[index - 1];
  return previous?.nodeType === "input" && previous.nodeId === steps[index]?.nodeId;
}

function isSubstep(steps: TraceStep[], index: number): boolean {
  return steps[index]?.nodeType === "branch" || isInputContinuation(steps, index);
}

export function mainStepCount(steps: TraceStep[]): number {
  return steps.reduce((count, _step, index) => count + (isSubstep(steps, index) ? 0 : 1), 0);
}

export function displayStepNumber(steps: TraceStep[], index: number): string {
  const mainStep = mainStepCount(steps.slice(0, index + 1));
  if (steps[index]?.nodeType === "branch") return `${mainStep}.1`;
  if (!isInputContinuation(steps, index)) return String(mainStep);

  let substep = 0;
  for (let cursor = index; isInputContinuation(steps, cursor); cursor -= 1) substep += 1;
  return `${mainStep}.${substep}`;
}
