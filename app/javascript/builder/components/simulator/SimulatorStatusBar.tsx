export interface SimulatorStatusBarProps {
  steps: unknown[]
  currentStepIndex: number
  isStarted?: boolean
  outputs: string[]
}

export default function SimulatorStatusBar({ steps, currentStepIndex, isStarted, outputs }: SimulatorStatusBarProps) {
  return (
    <div className="flex items-center justify-between px-3 py-1.5 border-t border-border bg-muted/20 text-[10px]">
      <span className="text-muted-foreground">
        {isStarted ? `Passo ${currentStepIndex + 1} de ${steps.length}` : "Aguardando início"}
      </span>
      {outputs.length > 0 && (
        <span className="text-muted-foreground">{outputs.length} saída(s)</span>
      )}
    </div>
  )
}
