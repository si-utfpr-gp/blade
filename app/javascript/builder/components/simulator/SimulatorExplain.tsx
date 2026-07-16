import { ArrowRight } from "lucide-react";
import { useSimulator } from "./SimulatorContext";
import { nodeTypeLabel } from "./labels";
import type { ExecutionStep } from "../../interfaces";

export default function SimulatorExplain() {
  const { state } = useSimulator();
  const { steps, currentStepIndex, isStarted, isFinished } = state;

  const currentStep: ExecutionStep | null =
    currentStepIndex >= 0 && currentStepIndex < steps.length
      ? steps[currentStepIndex]
      : null;

  if (!isStarted) {
    return (
      <div className="p-3">
        <p className="text-xs text-muted-foreground text-center py-4">
          Inicie a execução para ver as explicações de cada passo.
        </p>
      </div>
    );
  }

  if (!currentStep) return null;

  return (
    <div className="p-3 space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
          Passo {currentStepIndex + 1} de {steps.length}
        </span>
        <span className="text-[10px] px-2 py-0.5 rounded-full bg-primary/10 text-primary font-semibold">
          {nodeTypeLabel(currentStep.nodeType)}
        </span>
      </div>
      <div className="rounded-lg border border-primary/20 bg-primary/5 p-3">
        <p className="text-xs leading-relaxed text-foreground">
          {currentStep.explanation}
        </p>
      </div>
      {currentStep.changes.length > 0 && (
        <div className="space-y-1">
          <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
            O que mudou:
          </span>
          <div className="space-y-0.5">
            {currentStep.changes.map((change, i) => (
              <div
                key={i}
                className="flex items-center gap-1.5 text-xs font-mono bg-secondary/10 rounded px-2 py-1 text-secondary"
              >
                <ArrowRight className="w-3 h-3 shrink-0" />
                {change}
              </div>
            ))}
          </div>
        </div>
      )}
      {!isFinished && (
        <div className="rounded-md bg-muted/50 px-3 py-2">
          <p className="text-[11px] text-muted-foreground italic">
            {currentStep.nextHint}
          </p>
        </div>
      )}
    </div>
  );
}
