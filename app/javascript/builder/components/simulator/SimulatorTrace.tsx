import { useState, useCallback, useRef, useEffect } from "react"
import { Info, HelpCircle, Edit3, Check, X, Table2, Sparkles, Code2, Monitor, Variable as VarIcon } from "lucide-react"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "../ui/tooltip"
import type { ExecutionStep, Variable } from "../../interfaces"

function getAllVarNames(steps: ExecutionStep[], upTo: number): string[] {
  const names = new Set<string>()
  for (let i = 0; i <= upTo && i < steps.length; i++) {
    for (const v of steps[i].variables) names.add(v.name)
  }
  return Array.from(names)
}

function wasChanged(step: ExecutionStep, varName: string): boolean {
  return step.changes.some((c) => c.includes(varName))
}

function formatValue(v: Variable | undefined): string {
  if (!v) return ""
  if (v.value === null || v.value === undefined) return "null"
  return v.value
}

function nodeTypeLabel(t: string): string {
  switch (t) {
    case "startEnd": return "Início/Fim"
    case "memory": return "Memória"
    case "input": return "Entrada"
    case "output": return "Saída"
    case "process": return "Processo"
    case "decision": return "Decisão"
    case "connector": return "Conector"
    case "subroutine": return "Sub-rotina"
    default: return t
  }
}

export interface SimulatorTraceProps {
  steps: ExecutionStep[]
  currentStepIndex: number
  outputs: string[]
  isStarted?: boolean
  isRunning?: boolean
  isFinished?: boolean
  error: string | null
  onVariableEdit?: (stepIndex: number, varName: string, newValue: string) => void
}

export default function SimulatorTrace({
  steps,
  currentStepIndex,
  outputs,
  isStarted,
  isRunning,
  isFinished,
  error,
  onVariableEdit,
}: SimulatorTraceProps) {
  const [editingVar, setEditingVar] = useState<{ step: number; name: string } | null>(null)
  const [editValue, setEditValue] = useState("")
  const traceEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    traceEndRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" })
  }, [currentStepIndex])

  const startEdit = useCallback((stepIdx: number, varName: string, currentValue: string) => {
    setEditingVar({ step: stepIdx, name: varName })
    setEditValue(currentValue)
  }, [])

  const confirmEdit = useCallback(() => {
    if (editingVar && onVariableEdit) {
      onVariableEdit(editingVar.step, editingVar.name, editValue)
    }
    setEditingVar(null)
  }, [editingVar, editValue, onVariableEdit])

  const currentStep: ExecutionStep | null =
    currentStepIndex >= 0 && currentStepIndex < steps.length ? steps[currentStepIndex] : null

  const visibleVarNames = getAllVarNames(steps, currentStepIndex)
  const currentVars = currentStep?.variables || []

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
    )
  }

  return (
    <TooltipProvider delayDuration={200}>
      <div className="p-2 space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
            Histórico — Passo {currentStepIndex + 1}/{steps.length}
          </span>
          <Tooltip>
            <TooltipTrigger asChild>
              <button className="p-0.5 rounded hover:bg-muted">
                <HelpCircle className="w-3.5 h-3.5 text-muted-foreground" />
              </button>
            </TooltipTrigger>
            <TooltipContent side="left" className="max-w-[260px]">
              <p className="text-xs">
                Cada linha mostra uma instrução executada. Apenas as variáveis
                <strong> alteradas naquele passo</strong> aparecem preenchidas.
                Células vazias significam "valor inalterado".
                <em> null</em> significa "declarada, mas sem valor".
              </p>
            </TooltipContent>
          </Tooltip>
        </div>

        <div className="overflow-x-auto border border-border rounded-lg">
          <table className="w-full text-[11px]">
            <thead>
              <tr className="bg-muted/50">
                <th className="text-left py-1.5 px-2 text-muted-foreground font-semibold border-r border-border sticky left-0 bg-muted/50 z-10">#</th>
                <th className="text-left py-1.5 px-2 text-muted-foreground font-semibold border-r border-border">Instrução</th>
                {visibleVarNames.map((name) => (
                  <th key={name} className="text-center py-1.5 px-2 text-muted-foreground font-semibold font-mono border-r border-border last:border-r-0">{name}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {steps.slice(0, currentStepIndex + 1).map((step, i) => {
                const isCurrent = i === currentStepIndex
                const prevDeclared = i > 0
                  ? new Set(steps[i - 1].variables.map((v) => v.name))
                  : new Set<string>()
                return (
                  <tr key={i} className={`border-t border-border/50 transition-colors ${isCurrent ? "bg-primary/10" : "hover:bg-muted/30"}`}>
                    <td className={`py-1 px-2 font-mono text-center border-r border-border sticky left-0 z-10 ${isCurrent ? "bg-primary/10 font-bold text-primary" : "bg-card text-muted-foreground"}`}>{i + 1}</td>
                    <td className="py-1 px-2 border-r border-border max-w-[140px]">
                      <div className="flex items-center gap-1">
                        <span className={`truncate ${isCurrent ? "font-semibold text-foreground" : "text-muted-foreground"}`}>{step.log.replace(/\.$/, "")}</span>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <button className="p-0.5 rounded hover:bg-muted/50 flex-shrink-0">
                              <HelpCircle className="w-3 h-3 text-muted-foreground/60 hover:text-primary" />
                            </button>
                          </TooltipTrigger>
                          <TooltipContent side="bottom" className="max-w-[280px]">
                            <p className="text-[11px] font-semibold mb-1">{nodeTypeLabel(step.nodeType)}</p>
                            <p className="text-xs">{step.explanation}</p>
                            {step.changes.length > 0 && (
                              <ul className="mt-1.5 space-y-0.5 border-t pt-1.5">
                                {step.changes.map((c, ci) => (
                                  <li key={ci} className="text-[11px] font-mono text-primary">→ {c}</li>
                                ))}
                              </ul>
                            )}
                          </TooltipContent>
                        </Tooltip>
                      </div>
                    </td>
                    {visibleVarNames.map((name) => {
                      const v = step.variables.find((sv) => sv.name === name)
                      const justDeclared = v && !prevDeclared.has(name)
                      const changed = wasChanged(step, name)
                      const isEditing = editingVar?.step === i && editingVar?.name === name
                      const showValue = changed || justDeclared

                      return (
                        <td key={name} className={`py-1 px-2 text-center font-mono border-r border-border last:border-r-0 transition-all ${changed && isCurrent ? "bg-accent/15 ring-1 ring-inset ring-accent/40 font-bold text-accent-foreground" : changed ? "bg-secondary/10 font-semibold text-foreground" : justDeclared ? "text-muted-foreground italic" : "text-transparent"}`}>
                          {isEditing ? (
                            <div className="flex items-center gap-0.5 justify-center">
                              <input value={editValue} onChange={(e) => setEditValue(e.target.value)} className="w-14 px-1 py-0.5 text-[10px] rounded border border-primary bg-background font-mono focus:outline-none text-center" autoFocus onKeyDown={(e) => { if (e.key === "Enter") confirmEdit(); if (e.key === "Escape") setEditingVar(null) }} />
                              <button onClick={confirmEdit} className="text-secondary"><Check className="w-2.5 h-2.5" /></button>
                              <button onClick={() => setEditingVar(null)} className="text-destructive"><X className="w-2.5 h-2.5" /></button>
                            </div>
                          ) : showValue && v ? (
                            <div className="flex items-center justify-center gap-0.5 group">
                              <span>{formatValue(v)}</span>
                              {isCurrent && !isRunning && onVariableEdit && (
                                <button onClick={() => startEdit(i, name, v.value ?? "")} className="opacity-0 group-hover:opacity-100 p-0.5 rounded hover:bg-muted transition-all">
                                  <Edit3 className="w-2.5 h-2.5 text-muted-foreground" />
                                </button>
                              )}
                            </div>
                          ) : (
                            <span>·</span>
                          )}
                        </td>
                      )
                    })}
                  </tr>
                )
              })}
              <tr><td colSpan={visibleVarNames.length + 2}><div ref={traceEndRef} /></td></tr>
            </tbody>
          </table>
        </div>

        <div>
          <div className="flex items-center justify-between mb-1.5">
            <div className="flex items-center gap-1.5">
              <VarIcon className="w-3.5 h-3.5 text-accent" />
              <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Estado da Variável</span>
            </div>
            {currentVars.length > 0 && (
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-accent/10 text-accent font-semibold">
                {currentVars.length} variáve{currentVars.length === 1 ? "l" : "is"}
              </span>
            )}
          </div>
          {currentVars.length === 0 ? (
            <div className="rounded-lg border border-border bg-muted/20 p-3 text-center">
              <p className="text-[11px] text-muted-foreground italic">Nenhuma variável declarada ainda. Variáveis são criadas no bloco de Memória.</p>
            </div>
          ) : (
            <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {currentVars.map((v) => {
                const changed = currentStep ? wasChanged(currentStep, v.name) : false
                const isNull = v.value === null
                return (
                  <li key={v.name} className={`rounded-lg border p-2 transition-all ${changed ? "border-accent bg-accent/10 ring-1 ring-accent/30" : "border-border bg-card"}`}>
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <span className="text-xs font-mono font-bold text-foreground truncate">{v.name}</span>
                      <span className="text-[9px] uppercase tracking-wider px-1.5 py-0.5 rounded bg-muted text-muted-foreground font-semibold">{v.type}</span>
                    </div>
                    <div className="flex items-baseline gap-1.5">
                      <span className="text-[9px] text-muted-foreground uppercase tracking-wider">valor</span>
                      <span className={`text-[11px] font-mono ${isNull ? "text-muted-foreground/60 italic" : "text-primary font-semibold"} truncate`}>{isNull ? "null" : v.value}</span>
                    </div>
                  </li>
                )
              })}
            </ul>
          )}
        </div>

        <div>
          <div className="flex items-center gap-1.5 mb-1.5">
            <Monitor className="w-3.5 h-3.5 text-primary" />
            <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Saída do Algoritmo</span>
          </div>
          <div className="bg-foreground/95 rounded-lg p-3 min-h-[60px] font-mono">
            {outputs.length === 0 ? (
              <p className="text-[11px] text-muted/50 italic">Aguardando saída...</p>
            ) : (
              <div className="space-y-0.5">
                {outputs.map((out, i) => (
                  <div key={i} className="text-xs text-secondary-foreground">
                    <span className="text-secondary">{">"}</span> {out}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {error && (
          <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-3">
            <p className="text-xs text-destructive font-medium">⚠️ {error}</p>
          </div>
        )}

        {isFinished && !error && (
          <div className="rounded-lg border border-secondary/30 bg-secondary/5 p-3 text-center">
            <p className="text-xs text-secondary font-semibold">✅ Algoritmo executado com sucesso!</p>
            <p className="text-[10px] text-muted-foreground mt-1">
              Total de passos: {steps.length}
              {outputs.length > 0 && ` · Saídas: ${outputs.length}`}
            </p>
          </div>
        )}
      </div>
    </TooltipProvider>
  )
}
