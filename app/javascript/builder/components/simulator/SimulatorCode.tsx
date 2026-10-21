import { useMemo, useState, type CSSProperties } from "react";
import { useSimulator } from "./SimulatorContext";
import { highlightCode, type TokenKind } from "./highlightCode";

// Darker cousins of the block colours, so 11px text keeps its contrast on the
// light panel: processes are purple, so are keywords; text is green as the
// start block; numbers take the decision's orange.
const TOKEN_STYLE: Partial<Record<TokenKind, CSSProperties>> = {
  keyword: { color: "hsl(255 60% 45%)", fontWeight: 600 },
  string: { color: "hsl(150 60% 28%)" },
  number: { color: "hsl(28 90% 36%)" },
  comment: { color: "hsl(var(--muted-foreground))", fontStyle: "italic" },
  type: { color: "hsl(195 85% 29%)" },
  builtin: { color: "hsl(225 45% 38%)" },
  function: { color: "hsl(210 85% 40%)" },
};

export function HighlightedCode({ code }: { code: string }) {
  const tokens = useMemo(() => highlightCode(code), [code]);

  return (
    <code>
      {tokens.map((token, index) =>
        token.kind === "plain" ? (
          token.text
        ) : (
          <span key={index} data-token={token.kind} style={TOKEN_STYLE[token.kind]}>
            {token.text}
          </span>
        ),
      )}
    </code>
  );
}

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
        {jsCode || tsCode ? (
          <HighlightedCode code={codeLang === "js" ? jsCode : tsCode} />
        ) : (
          <span className="text-muted-foreground">
            Carregue um diagrama válido (JSON) para gerar o código JavaScript/TypeScript.
          </span>
        )}
      </pre>
    </div>
  );
}
