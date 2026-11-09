import { useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import { Check, Copy, X } from "lucide-react";
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

const COPY_FEEDBACK_MS = 2000;

/**
 * Copies the code and shows it worked: the icon pops into a check and the
 * button flashes green for a moment. Without a sign, students kept pressing
 * it. A browser that refuses the clipboard gets a plain "não deu" instead.
 */
function CopyButton({ text }: { text: string }) {
  const [status, setStatus] = useState<"idle" | "copied" | "failed">("idle");
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => () => {
    if (timer.current) clearTimeout(timer.current);
  }, []);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setStatus("copied");
    } catch {
      setStatus("failed");
    }
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setStatus("idle"), COPY_FEEDBACK_MS);
  };

  const copied = status === "copied";
  const Icon = copied ? Check : status === "failed" ? X : Copy;

  return (
    <>
      <button
        type="button"
        onClick={handleCopy}
        aria-label={copied ? "Código copiado" : "Copiar código"}
        title="Copiar código"
        className={`mr-1.5 flex items-center gap-1 rounded px-2 py-0.5 text-[11px] font-medium transition-colors duration-300 ${
          copied
            ? "copy-flash bg-[hsl(var(--node-start)/0.1)] text-[hsl(150_60%_28%)]"
            : status === "failed"
              ? "text-[hsl(var(--node-error))]"
              : "text-muted-foreground hover:text-foreground"
        }`}
      >
        {/* The key remounts the icon, so the pop plays on every change. */}
        <Icon key={status} className={`h-3 w-3 ${status === "idle" ? "" : "copy-pop"}`} aria-hidden="true" />
        {copied ? "Copiado!" : status === "failed" ? "Não deu para copiar" : "Copiar"}
      </button>
      <span role="status" className="sr-only">
        {copied ? "Código copiado" : ""}
      </span>
    </>
  );
}

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
        <CopyButton text={codeLang === "js" ? jsCode : tsCode} />
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
