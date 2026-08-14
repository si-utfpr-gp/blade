import { Terminal } from "lucide-react";
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
  return (
    <div className="flex h-full flex-col items-center bg-card px-1.5 py-2 border-l border-border">
      <button
        type="button"
        onClick={onToggleCollapsed}
        className="rounded-md p-2 hover:bg-muted transition-colors"
        title="Mostrar depurador"
        aria-label="Mostrar depurador"
      >
        <Terminal className="w-4 h-4 text-primary" />
      </button>
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
