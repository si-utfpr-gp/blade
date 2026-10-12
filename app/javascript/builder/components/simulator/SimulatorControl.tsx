import { Play, RotateCcw, StepBack, StepForward, Square } from "lucide-react";
import { useSimulator } from "./SimulatorContext";

export default function SimulatorControl() {
  const {
    state,
    canStepBack,
    canStepForward,
    canHistoryForward,
    start,
    stepForward,
    stepBack,
    stepHistoryForward,
    runAll,
    stop,
    reset,
    setSpeed,
  } = useSimulator();
  const { isStarted, isRunning, isFinished, speed } = state;

  return (
    <div className="flex items-center gap-1.5 px-3 py-2 border-b border-border flex-wrap">
      {!isStarted ? (
        <button
          onClick={start}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-primary text-primary-foreground text-xs font-semibold hover:opacity-90 transition-opacity"
        >
          <Play className="w-3.5 h-3.5" />
          Iniciar Execução
        </button>
      ) : (
        <>
          <button
            onClick={reset}
            className="p-1.5 rounded-md hover:bg-muted transition-colors"
            title="Reiniciar"
          >
            <RotateCcw className="w-3.5 h-3.5 text-muted-foreground" />
          </button>
          <button
            onClick={stepBack}
            disabled={!canStepBack}
            className="flex items-center gap-1 px-2 py-1.5 rounded-md border border-border text-xs font-medium hover:bg-muted transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
            title="Passo anterior"
          >
            <StepBack className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={stepHistoryForward}
            disabled={!canHistoryForward}
            className="flex items-center gap-1 px-2 py-1.5 rounded-md border border-border text-xs font-medium hover:bg-muted transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
            title="Próximo no histórico"
          >
            <StepForward className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={stepForward}
            disabled={!canStepForward}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-primary text-primary-foreground text-xs font-semibold hover:opacity-90 transition-opacity disabled:opacity-30 disabled:cursor-not-allowed"
          >
            <StepForward className="w-3.5 h-3.5" />
            Próximo passo
          </button>
          <div className="flex items-center gap-1 rounded-md border border-border bg-muted/30 px-1 py-0.5">
            {!isRunning ? (
              <button
                onClick={runAll}
                disabled={isFinished}
                className="flex items-center gap-1 px-2 py-1 rounded-md bg-emerald-600 text-white text-xs font-medium hover:bg-emerald-700 transition-opacity disabled:opacity-30"
                title="Executar tudo"
              >
                <Play className="w-3 h-3" />
                Auto
              </button>
            ) : (
              <button
                onClick={stop}
                className="flex items-center gap-1 px-2 py-1 rounded-md bg-destructive text-destructive-foreground text-xs font-medium hover:opacity-90 transition-opacity"
                title="Parar"
              >
                <Square className="w-3 h-3" />
                Parar
              </button>
            )}
            <select
              aria-label="Velocidade da execução automática"
              value={speed}
              onChange={(e) => setSpeed(Number(e.target.value))}
              disabled={isFinished}
              className="text-[10px] bg-transparent border-none rounded px-1.5 py-0.5 text-foreground outline-none disabled:opacity-40"
              title="Velocidade da execução automática"
            >
              <option value={1000}>1x</option>
              <option value={500}>2x</option>
              <option value={333}>3x</option>
            </select>
          </div>
        </>
      )}
      <div className="flex-1" />
    </div>
  );
}
