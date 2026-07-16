import { Play, RotateCcw, StepBack, StepForward, Square } from "lucide-react"

export interface SimulatorControlProps {
  isStarted?: boolean
  isRunning?: boolean
  isFinished?: boolean
  canStepBack?: boolean
  canStepForward?: boolean
  speed?: number
  onStart?: () => void
  onReset?: () => void
  onStepBack?: () => void
  onStepForward?: () => void
  onRunAll?: () => void
  onStop?: () => void
  onSpeedChange?: (speed: number) => void
}

export default function SimulatorControl({
  isStarted,
  isRunning,
  isFinished,
  canStepBack,
  canStepForward,
  speed = 1000,
  onStart,
  onReset,
  onStepBack,
  onStepForward,
  onRunAll,
  onStop,
  onSpeedChange,
}: SimulatorControlProps) {
  return (
    <div className="flex items-center gap-1.5 px-3 py-2 border-b border-border flex-wrap">
      {!isStarted ? (
        <button
          onClick={onStart}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-primary text-primary-foreground text-xs font-semibold hover:opacity-90 transition-opacity"
        >
          <Play className="w-3.5 h-3.5" />
          Iniciar Execução
        </button>
      ) : (
        <>
          <button onClick={onReset} className="p-1.5 rounded-md hover:bg-muted transition-colors" title="Reiniciar">
            <RotateCcw className="w-3.5 h-3.5 text-muted-foreground" />
          </button>
          <button
            onClick={onStepBack}
            disabled={!canStepBack}
            className="flex items-center gap-1 px-2 py-1.5 rounded-md border border-border text-xs font-medium hover:bg-muted transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
            title="Passo anterior"
          >
            <StepBack className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={onStepForward}
            disabled={!canStepForward}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-primary text-primary-foreground text-xs font-semibold hover:opacity-90 transition-opacity disabled:opacity-30 disabled:cursor-not-allowed"
          >
            <StepForward className="w-3.5 h-3.5" />
            Próximo
          </button>
          {!isRunning ? (
            <button
              onClick={onRunAll}
              disabled={isFinished}
              className="flex items-center gap-1 px-2 py-1.5 rounded-md bg-secondary text-secondary-foreground text-xs font-medium hover:opacity-90 transition-opacity disabled:opacity-30"
              title="Executar tudo"
            >
              <Play className="w-3 h-3" />
            </button>
          ) : (
            <button
              onClick={onStop}
              className="flex items-center gap-1 px-2 py-1.5 rounded-md bg-destructive text-destructive-foreground text-xs font-medium hover:opacity-90 transition-opacity"
              title="Parar"
            >
              <Square className="w-3 h-3" />
            </button>
          )}
        </>
      )}
      <div className="flex-1" />
      <select
        value={speed}
        onChange={(e) => onSpeedChange?.(Number(e.target.value))}
        className="text-[10px] bg-muted border-none rounded px-1.5 py-0.5 text-foreground outline-none"
      >
        <option value={2000}>0.5x</option>
        <option value={1000}>1x</option>
        <option value={500}>2x</option>
        <option value={200}>5x</option>
      </select>
    </div>
  )
}
