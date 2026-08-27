import type { IExecutionStep } from "../../interfaces";

type TraceStep = Pick<IExecutionStep, "nodeType">;

export function mainStepCount(steps: TraceStep[]): number {
  return steps.filter((step) => step.nodeType !== "branch").length;
}

export function displayStepNumber(steps: TraceStep[], index: number): string {
  const mainStep = mainStepCount(steps.slice(0, index + 1));
  return steps[index]?.nodeType === "branch" ? `${mainStep}.1` : String(mainStep);
}
