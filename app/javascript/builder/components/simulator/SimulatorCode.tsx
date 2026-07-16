import { useState } from "react";
import { useSimulator } from "./SimulatorContext";

export default function SimulatorCode() {
  const { state } = useSimulator();
  const { jsCode, tsCode } = state;
  const [codeLang, setCodeLang] = useState<"js" | "ts">("js");

  return (
    <div className="flex flex-col h-full">
      <div className="flex border-b border-border bg-muted/20">
        <button
          onClick={() => setCodeLang("js")}
          className={`flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-medium transition-colors ${codeLang === "js" ? "bg-card text-primary border-b-2 border-primary" : "text-muted-foreground hover:text-foreground"}`}
        >
          JavaScript
        </button>
        <button
          onClick={() => setCodeLang("ts")}
          className={`flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-medium transition-colors ${codeLang === "ts" ? "bg-card text-primary border-b-2 border-primary" : "text-muted-foreground hover:text-foreground"}`}
        >
          TypeScript
        </button>
        <div className="flex-1" />
        <button
          onClick={() =>
            navigator.clipboard.writeText(codeLang === "js" ? jsCode : tsCode)
          }
          className="px-3 py-1.5 text-[11px] text-muted-foreground hover:text-foreground"
          title="Copiar código"
        >
          Copiar
        </button>
      </div>
      <pre className="flex-1 overflow-auto p-3 text-[11px] font-mono leading-relaxed bg-foreground/2">
        <code>{codeLang === "js" ? jsCode : tsCode}</code>
      </pre>
    </div>
  );
}
