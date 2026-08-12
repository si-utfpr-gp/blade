import { PanelRightClose, Terminal } from "lucide-react";
import { useSimulator } from "./SimulatorContext";

interface ISimulatorHeaderProps {
  onToggleCollapsed?: () => void
}

export default function SimulatorHeader({ onToggleCollapsed }: ISimulatorHeaderProps) {
  const { state } = useSimulator();
  const { isRunning, isFinished, isStarted } = state;

  return (
    <div className="flex items-center justify-between px-3 py-2 border-b border-border bg-muted/30">
      <button
        type="button"
        onClick={onToggleCollapsed}
        className="flex items-center gap-2 rounded-md -ml-1 px-1 py-0.5 hover:bg-muted transition-colors"
        title="Ocultar depurador"
        aria-label="Ocultar depurador"
      >
        <Terminal className="w-4 h-4 text-primary" />
        <span className="text-xs font-semibold text-foreground">Depurador</span>
        {onToggleCollapsed && <PanelRightClose className="w-3.5 h-3.5 text-muted-foreground" />}
      </button>
      <span
        className={`flex items-center gap-1 text-[10px] ${isRunning ? "text-secondary" : isFinished ? "text-muted-foreground" : isStarted ? "text-accent" : "text-primary"}`}
      >
        <span
          className={`w-1.5 h-1.5 rounded-full ${isRunning ? "bg-secondary animate-pulse" : isFinished ? "bg-muted-foreground" : isStarted ? "bg-accent" : "bg-primary"}`}
        />
        {isRunning
          ? "Executando..."
          : isFinished
            ? "Finalizado"
            : isStarted
              ? "Pausado"
              : "Pronto"}
      </span>
    </div>
  );
}
