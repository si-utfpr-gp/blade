import { Play, RotateCcw, Square, StepForward, Terminal } from "lucide-react";
import { TooltipProvider } from "../ui/tooltip";
import { useSimulator } from "./SimulatorContext";
import SimulatorHeader from "./SimulatorHeader";
import SimulatorControl from "./SimulatorControl";
import SimulatorTabs from "./SimulatorTabs";
import SimulatorTrace from "./SimulatorTrace";
import SimulatorExplain from "./SimulatorExplain";
import SimulatorCode from "./SimulatorCode";
import SimulatorStatusBar from "./SimulatorStatusBar";
import InputDialog from "./InputDialog";

interface ISimulatorPanelProps {
  collapsed?: boolean
  onToggleCollapsed?: () => void
}

export default function SimulatorPanel({ collapsed = false, onToggleCollapsed }: ISimulatorPanelProps) {
  return (
    <TooltipProvider delayDuration={200}>
      {collapsed ? (
        <CollapsedDebuggerRail onToggleCollapsed={onToggleCollapsed} />
      ) : (
        <div className="flex flex-col h-full bg-card border-l border-border">
          <SimulatorHeader onToggleCollapsed={onToggleCollapsed} />
          <SimulatorControl />
          <SimulatorTabs />
          <SimulatorPanelContent />
          <SimulatorStatusBar />
        </div>
      )}
      <InputDialog />
    </TooltipProvider>
  );
}

function CollapsedDebuggerRail({ onToggleCollapsed }: { onToggleCollapsed?: () => void }) {
  const {
    state,
    canStepForward,
    start,
    stepForward,
    runAll,
    stop,
    reset,
    setSpeed,
  } = useSimulator();
  const { isStarted, isRunning, isFinished, speed } = state;

  return (
    <div className="flex h-full flex-col items-center gap-2 bg-card px-1.5 py-2 border-l border-border">
      <button
        type="button"
        onClick={onToggleCollapsed}
        className="rounded-md p-2 hover:bg-muted transition-colors"
        title="Mostrar depurador"
        aria-label="Mostrar depurador"
      >
        <Terminal className="w-4 h-4 text-primary" />
      </button>

      <div className="h-px w-8 bg-border" />

      {!isStarted ? (
        <button
          type="button"
          onClick={start}
          className="rounded-md bg-primary p-2 text-primary-foreground hover:opacity-90 transition-opacity"
          title="Iniciar execução"
          aria-label="Iniciar execução"
        >
          <Play className="w-4 h-4" />
        </button>
      ) : (
        <>
          <button
            type="button"
            onClick={reset}
            className="rounded-md p-2 hover:bg-muted transition-colors"
            title="Reiniciar"
            aria-label="Reiniciar"
          >
            <RotateCcw className="w-4 h-4 text-muted-foreground" />
          </button>

          <button
            type="button"
            onClick={stepForward}
            disabled={!canStepForward}
            className="rounded-md bg-primary p-2 text-primary-foreground hover:opacity-90 transition-opacity disabled:cursor-not-allowed disabled:opacity-30"
            title="Próximo passo"
            aria-label="Próximo passo"
          >
            <StepForward className="w-4 h-4" />
          </button>

          {!isRunning ? (
            <button
              type="button"
              onClick={runAll}
              disabled={isFinished}
              className="rounded-md bg-emerald-600 p-2 text-white hover:bg-emerald-700 transition-colors disabled:cursor-not-allowed disabled:opacity-30"
              title="Executar tudo"
              aria-label="Executar tudo"
            >
              <Play className="w-4 h-4" />
            </button>
          ) : (
            <button
              type="button"
              onClick={stop}
              className="rounded-md bg-destructive p-2 text-destructive-foreground hover:opacity-90 transition-opacity"
              title="Parar"
              aria-label="Parar"
            >
              <Square className="w-4 h-4" />
            </button>
          )}

          <select
            aria-label="Velocidade da execução automática"
            value={speed}
            onChange={(e) => setSpeed(Number(e.target.value))}
            disabled={isFinished}
            className="w-11 rounded-md border border-border bg-muted/40 px-0.5 py-1 text-[10px] text-foreground outline-none disabled:opacity-40"
            title="Velocidade da execução automática"
          >
            <option value={1000}>1x</option>
            <option value={500}>2x</option>
            <option value={333}>3x</option>
          </select>
        </>
      )}
    </div>
  )
}

function SimulatorPanelContent() {
  const { activeTab } = useSimulator();

  return (
    <div className="flex-1 overflow-auto">
      {activeTab === "trace" && <SimulatorTrace />}
      {activeTab === "explain" && <SimulatorExplain />}
      {activeTab === "code" && <SimulatorCode />}
    </div>
  );
}
