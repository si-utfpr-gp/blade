import { Terminal } from "lucide-react";
import { useSimulator } from "./SimulatorContext";

export default function SimulatorHeader() {
  const { state } = useSimulator();
  const { isRunning, isFinished, isStarted } = state;

  return (
    <div className="flex items-center justify-between px-3 py-2 border-b border-border bg-muted/30">
      <div className="flex items-center gap-2">
        <Terminal className="w-4 h-4 text-primary" />
        <span className="text-xs font-semibold text-foreground">Depurador</span>
      </div>
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
