import { PanelRightClose, Terminal } from "lucide-react";
import { useSimulator } from "./SimulatorContext";

interface ISimulatorHeaderProps {
  onToggleCollapsed?: () => void
}

export default function SimulatorHeader({ onToggleCollapsed }: ISimulatorHeaderProps) {
  const { state } = useSimulator();
  const { isRunning, isFinished, isStarted, awaitingInput } = state;
  const status = getDebuggerStatus({ isRunning, isFinished, isStarted, awaitingInput });

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
      <span className={`flex items-center gap-1 text-[10px] font-medium ${status.textClass}`}>
        <span className={`w-1.5 h-1.5 rounded-full ${status.dotClass}`} />
        {status.label}
      </span>
    </div>
  );
}

function getDebuggerStatus({
  isRunning,
  isFinished,
  isStarted,
  awaitingInput,
}: {
  isRunning: boolean
  isFinished: boolean
  isStarted: boolean
  awaitingInput: boolean
}) {
  if (isFinished) {
    return {
      label: "Concluído",
      textClass: "text-emerald-700",
      dotClass: "bg-emerald-500",
    }
  }

  if (awaitingInput) {
    return {
      label: "Aguardando entrada",
      textClass: "text-amber-700",
      dotClass: "bg-amber-500 animate-pulse",
    }
  }

  if (isRunning) {
    return {
      label: "Executando",
      textClass: "text-emerald-700",
      dotClass: "bg-emerald-500 animate-pulse",
    }
  }

  if (isStarted) {
    return {
      label: "Pausado",
      textClass: "text-slate-600",
      dotClass: "bg-slate-400",
    }
  }

  return {
    label: "Pronto",
    textClass: "text-primary",
    dotClass: "bg-primary",
  }
}
