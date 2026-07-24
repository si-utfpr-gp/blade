import { TooltipProvider } from "../ui/tooltip";
import { SimulatorProvider, useSimulator } from "./SimulatorContext";
import SimulatorHeader from "./SimulatorHeader";
import SimulatorControl from "./SimulatorControl";
import SimulatorTabs from "./SimulatorTabs";
import SimulatorTrace from "./SimulatorTrace";
import SimulatorExplain from "./SimulatorExplain";
import SimulatorCode from "./SimulatorCode";
import SimulatorStatusBar from "./SimulatorStatusBar";
import type { ISimulatorCallbacks } from "../../interfaces/simulator";

export interface ISimulatorPanelProps {
  callbacks?: ISimulatorCallbacks;
}

export default function SimulatorPanel({ callbacks }: ISimulatorPanelProps) {
  return (
    <SimulatorProvider callbacks={callbacks}>
      <TooltipProvider delayDuration={200}>
      <div className="flex flex-col h-full bg-card border-l border-border">
        <SimulatorHeader />
        <SimulatorControl />
        <SimulatorTabs />
        <SimulatorPanelContent />
        <SimulatorStatusBar />
      </div>
      </TooltipProvider>
    </SimulatorProvider>
  );
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
