import { type ReactNode } from "react";
import { Table2, Sparkles, Code2 } from "lucide-react";
import { useSimulator } from "./SimulatorContext";

type Tab = "trace" | "explain" | "code";

const tabs: { id: Tab; label: string; icon: ReactNode }[] = [
  {
    id: "trace",
    label: "Teste de Mesa",
    icon: <Table2 className="w-3.5 h-3.5" />,
  },
  {
    id: "explain",
    label: "Explicação",
    icon: <Sparkles className="w-3.5 h-3.5" />,
  },
  { id: "code", label: "Código", icon: <Code2 className="w-3.5 h-3.5" /> },
];

export default function SimulatorTabs() {
  const { activeTab, setActiveTab } = useSimulator();

  return (
    <div className="flex border-b border-border">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => setActiveTab(tab.id)}
          className={`flex items-center gap-1.5 px-3 py-2 text-xs font-medium transition-colors border-b-2 ${
            activeTab === tab.id
              ? "border-primary text-primary"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          {tab.icon}
          {tab.label}
        </button>
      ))}
    </div>
  );
}
