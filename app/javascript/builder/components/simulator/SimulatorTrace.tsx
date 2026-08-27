import { useRef, useEffect } from "react";
import {
  Info,
  HelpCircle,
  Monitor,
  AlertTriangle,
  CheckCircle2,
  Variable as VarIcon,
} from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "../ui/tooltip";
import { useSimulator } from "./SimulatorContext";
import { nodeTypeLabel } from "./labels";
import type { IExecutionStep, IVariable } from "../../interfaces";

function getAllVarNames(steps: IExecutionStep[], upTo: number): string[] {
  const names = new Set<string>();
  for (let i = 0; i <= upTo && i < steps.length; i++) {
    for (const v of steps[i].variables) names.add(v.name);
  }
  return Array.from(names);
}

function wasChanged(step: IExecutionStep, varName: string): boolean {
  const arrayBaseName = varName.replace(/\[\d+\]$/, "");
  const declaration = `Declarada: ${arrayBaseName}`;

  return step.changes.some((change) =>
    change === declaration ||
    change.startsWith(`${declaration}[`) ||
    change.startsWith(`${varName} =`),
  );
}

function formatValue(v: IVariable | undefined): string {
  if (!v) return "";
  if (v.value === null || v.value === undefined) return "null";
  return v.value;
}

export function traceCellDisplay(step: IExecutionStep, varName: string): string | null {
  if (!wasChanged(step, varName)) return null;
  const variable = step.variables.find((sv) => sv.name === varName);
  return variable ? formatValue(variable) : null;
}

export function displayStepNumber(
  steps: Array<Pick<IExecutionStep, "nodeType">>,
  index: number,
): string {
  const mainStep = steps
    .slice(0, index + 1)
    .filter((step) => step.nodeType !== "branch").length;

  return steps[index]?.nodeType === "branch" ? `${mainStep}.1` : String(mainStep);
}

export function traceInstruction(step: IExecutionStep): string {
  const log = step.log.replace(/\.$/, "");
  if (step.nodeType !== "decision") return log;

  const [condition, result] = log.split(" → ");
  return result === undefined
    ? `Condição (${condition})`
    : `Condição (${condition}) → ${result}`;
}

function mainStepCount(steps: IExecutionStep[]): number {
  return steps.filter((step) => step.nodeType !== "branch").length;
}

export default function SimulatorTrace() {
  const { state, goToStep } = useSimulator();
  const {
    steps,
    currentStepIndex,
    outputs,
    isStarted,
    isFinished,
    error,
  } = state;

  const traceEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    traceEndRef.current?.scrollIntoView({
      behavior: "smooth",
      block: "nearest",
    });
  }, [currentStepIndex]);


  const currentStep: IExecutionStep | null =
    currentStepIndex >= 0 && currentStepIndex < steps.length
      ? steps[currentStepIndex]
      : null;

  const visibleVarNames = getAllVarNames(steps, currentStepIndex);
  const currentVars = currentStep?.variables || [];
  const currentStepNumber = currentStep ? displayStepNumber(steps, currentStepIndex) : "—";

  if (!isStarted) {
    return (
      <div className="p-2 space-y-3">
        <div className="text-center py-6 space-y-2">
          <Info className="w-8 h-8 text-primary mx-auto opacity-60" />
          <p className="text-xs text-muted-foreground">
            Clique em <strong>Iniciar Execução</strong> para começar.
          </p>
        </div>
      </div>
    );
  }

  return (
      <div className="p-2 space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
            Histórico — Passo {currentStepNumber}/{mainStepCount(steps)}
          </span>
          <Tooltip>
            <TooltipTrigger asChild>
              <button className="p-0.5 rounded hover:bg-muted">
                <HelpCircle className="w-3.5 h-3.5 text-muted-foreground" />
              </button>
            </TooltipTrigger>
            <TooltipContent side="left" className="max-w-65">
              <p className="text-xs">
                Cada linha mostra o estado das variáveis após a instrução executada.
                Células vazias indicam que a variável não foi alterada naquele passo.
                <em> null</em> significa &quot;declarada, mas sem valor&quot;.
              </p>
            </TooltipContent>
          </Tooltip>
        </div>

        <div className="overflow-x-auto border border-border rounded-lg">
          <table className="w-full text-[11px]">
            <thead>
              <tr className="bg-muted/50">
                <th className="text-left py-1.5 px-2 text-muted-foreground font-semibold border-r border-border sticky left-0 bg-muted/50 z-10">
                  #
                </th>
                <th className="text-left py-1.5 px-2 text-muted-foreground font-semibold border-r border-border">
                  Instrução
                </th>
                {visibleVarNames.map((name) => (
                  <th
                    key={name}
                    className="text-center py-1.5 px-2 text-muted-foreground font-semibold font-mono border-r border-border last:border-r-0"
                  >
                    {name}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {steps.slice(0, currentStepIndex + 1).map((step, i) => {
                const isCurrent = i === currentStepIndex;
                const prevDeclared =
                  i > 0
                    ? new Set(steps[i - 1].variables.map((v) => v.name))
                    : new Set<string>();
                return (
                  <tr
                    key={i}
                    onClick={() => goToStep(i)}
                    className={`border-t border-border/50 transition-colors cursor-pointer ${isCurrent ? "bg-primary/10" : "hover:bg-muted/50"}`}
                  >
                    <td
                      className={`py-1 px-2 font-mono text-center border-r border-border sticky left-0 z-10 ${isCurrent ? "bg-primary/10 font-bold text-primary" : "bg-card text-muted-foreground"}`}
                    >
                          {displayStepNumber(steps, i)}
                    </td>
                    <td className="py-1 px-2 border-r border-border max-w-35">
                      <div className="flex items-center gap-1">
                        <span
                          className={`truncate ${isCurrent ? "font-semibold text-foreground" : "text-muted-foreground"}`}
                        >
                          {traceInstruction(step)}
                        </span>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <button className="p-0.5 rounded hover:bg-muted/50 shrink-0">
                              <HelpCircle className="w-3 h-3 text-muted-foreground/60 hover:text-primary" />
                            </button>
                          </TooltipTrigger>
                          <TooltipContent
                            side="bottom"
                            className="max-w-70"
                          >
                            <p className="text-[11px] font-semibold mb-1">
                              {nodeTypeLabel(step.nodeType)}
                            </p>
                            <p className="text-xs">{step.explanation}</p>
                            {step.changes.length > 0 && (
                              <ul className="mt-1.5 space-y-0.5 border-t pt-1.5">
                                {step.changes.map((c, ci) => (
                                  <li
                                    key={ci}
                                    className="text-[11px] font-mono text-primary"
                                  >
                                    → {c}
                                  </li>
                                ))}
                              </ul>
                            )}
                          </TooltipContent>
                        </Tooltip>
                      </div>
                    </td>
                    {visibleVarNames.map((name) => {
                      const v = step.variables.find((sv) => sv.name === name);
                      const justDeclared = v && !prevDeclared.has(name);
                      const changed = wasChanged(step, name);
                      const display = traceCellDisplay(step, name);

                      return (
                        <td
                          key={name}
                          className={`py-1 px-2 text-center font-mono border-r border-border last:border-r-0 transition-all ${changed && isCurrent ? "bg-accent/15 ring-1 ring-inset ring-accent/40 font-bold text-accent-foreground" : changed ? "bg-secondary/10 font-semibold text-foreground" : justDeclared ? "text-muted-foreground italic" : display !== null ? "text-foreground" : "text-transparent"}`}
                        >
                          {display !== null ? (
                            <span>{display}</span>
                          ) : (
                            <span>·</span>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
              <tr>
                <td colSpan={visibleVarNames.length + 2}>
                  <div ref={traceEndRef} />
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <div>
          <div className="flex items-center justify-between mb-1.5">
            <div className="flex items-center gap-1.5">
              <VarIcon className="w-3.5 h-3.5 text-accent" />
              <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                Estado da Variável
              </span>
            </div>
            {currentVars.length > 0 && (
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-accent/10 text-accent font-semibold">
                {currentVars.length} variáve
                {currentVars.length === 1 ? "l" : "is"}
              </span>
            )}
          </div>
          {currentVars.length === 0 ? (
            <div className="rounded-lg border border-border bg-muted/20 p-3 text-center">
              <p className="text-[11px] text-muted-foreground italic">
                Nenhuma variável declarada ainda. Variáveis são criadas no bloco
                de Memória.
              </p>
            </div>
          ) : (
            <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {currentVars.map((v) => {
                const changed = currentStep
                  ? wasChanged(currentStep, v.name)
                  : false;
                const isNull = v.value === null;
                return (
                  <li
                    key={v.name}
                    className={`rounded-lg border p-2 transition-all ${changed ? "border-accent bg-accent/10 ring-1 ring-accent/30" : "border-border bg-card"}`}
                  >
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <span className="text-xs font-mono font-bold text-foreground truncate">
                        {v.name}
                      </span>
                      <span className="text-[9px] uppercase tracking-wider px-1.5 py-0.5 rounded bg-muted text-muted-foreground font-semibold">
                        {v.type}
                      </span>
                    </div>
                    <div className="flex items-baseline gap-1.5">
                      <span className="text-[9px] text-muted-foreground uppercase tracking-wider">
                        valor
                      </span>
                      <span
                        className={`text-[11px] font-mono ${isNull ? "text-muted-foreground/60 italic" : "text-primary font-semibold"} truncate`}
                      >
                        {isNull ? "null" : v.value}
                      </span>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        <div>
          <div className="flex items-center gap-1.5 mb-1.5">
            <Monitor className="w-3.5 h-3.5 text-primary" />
            <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
              Saída do Algoritmo
            </span>
          </div>
          <div className="bg-slate-950 rounded-lg p-3 min-h-15 font-mono border border-slate-800">
            {outputs.length === 0 ? (
              <p className="text-[11px] text-slate-400 italic">
                Aguardando saída...
              </p>
            ) : (
              <div className="space-y-0.5">
                {outputs.map((out, i) => (
                  <div key={i} className="text-xs text-emerald-100">
                    <span className="text-emerald-400">{">"}</span> <span className="text-emerald-100">{out}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {error && (
          <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-3">
            <p className="flex items-center gap-1.5 text-xs text-destructive font-medium"><AlertTriangle className="w-3.5 h-3.5" /> {error}</p>
          </div>
        )}

        {isFinished && !error && (
          <div className="rounded-lg border border-secondary/30 bg-secondary/5 p-3 text-center">
            <p className="flex items-center justify-center gap-1.5 text-xs text-secondary font-semibold">
              <CheckCircle2 className="w-4 h-4" /> Algoritmo executado com sucesso!
            </p>
            <p className="text-[10px] text-muted-foreground mt-1">
              Total de passos: {steps.length}
              {outputs.length > 0 && ` · Saídas: ${outputs.length}`}
            </p>
          </div>
        )}
      </div>
  );
}
