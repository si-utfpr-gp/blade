import { useState } from "react"
import type { Node, Edge } from "@xyflow/react"
import { useSimulator } from "../simulator/SimulatorContext"

const EXAMPLE_JSON = {
  nodes: [
    { id: "n1", type: "startEnd", position: { x: 250, y: 0 }, data: { label: "Início", variant: "start" } },
    { id: "n2", type: "memory", position: { x: 220, y: 80 }, data: { label: "Memória", rows: [{ type: "inteiro", variables: "num1, num2, soma" }] } },
    { id: "n3", type: "input", position: { x: 240, y: 200 }, data: { label: "num1, num2" } },
    { id: "n4", type: "process", position: { x: 230, y: 310 }, data: { label: "soma = num1 + num2" } },
    { id: "n5", type: "output", position: { x: 240, y: 420 }, data: { label: '"A soma é: " + soma' } },
    { id: "n6", type: "startEnd", position: { x: 250, y: 530 }, data: { label: "Fim", variant: "end" } },
  ],
  edges: [
    { id: "e1", source: "n1", target: "n2" },
    { id: "e2", source: "n2", target: "n3" },
    { id: "e3", source: "n3", target: "n4" },
    { id: "e4", source: "n4", target: "n5" },
    { id: "e5", source: "n5", target: "n6" },
  ],
}

export default function JsonHarness() {
  const { loadDiagram } = useSimulator()
  const [json, setJson] = useState("")
  const [status, setStatus] = useState<{ ok: boolean; message: string } | null>(null)

  const handleLoad = () => {
    let parsed: unknown
    try {
      parsed = JSON.parse(json)
    } catch {
      setStatus({ ok: false, message: "JSON inválido: verifique a sintaxe." })
      return
    }
    const data = parsed as { nodes?: Node[]; edges?: Edge[] }
    if (!Array.isArray(data?.nodes)) {
      setStatus({ ok: false, message: "O campo 'nodes' é obrigatório e deve ser um array." })
      return
    }
    const result = loadDiagram(data.nodes, data.edges ?? [])
    if (result.ok) {
      setStatus({ ok: true, message: "Motor carregado. Use o simulador ao lado." })
    } else {
      setStatus({ ok: false, message: result.error })
    }
  }

  const handleClear = () => {
    setJson("")
    setStatus(null)
  }

  const handleExample = () => {
    setJson(JSON.stringify(EXAMPLE_JSON, null, 2))
    setStatus(null)
  }

  return (
    <div className="h-full flex flex-col p-4 bg-card overflow-auto">
      <div className="mb-3">
        <h2 className="text-sm font-semibold text-foreground">Harness — JSON do Diagrama</h2>
        <p className="text-xs text-muted-foreground mt-1">
          Cole aqui o JSON <code>{"{ nodes, edges }"}</code> do módulo de construção para
          validar o módulo de execução (teste de mesa, explicação e código) no simulador ao lado.
        </p>
      </div>

      <label htmlFor="diagram-json" className="text-xs font-medium text-muted-foreground mb-1">
        JSON do diagrama
      </label>
      <textarea
        id="diagram-json"
        value={json}
        onChange={(e) => setJson(e.target.value)}
        placeholder='{ "nodes": [...], "edges": [...] }'
        spellCheck={false}
        className="flex-1 min-h-0 w-full resize-none rounded-lg border border-border bg-muted/10 p-3 text-[11px] font-mono leading-relaxed text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
      />

      <div className="mt-3 flex items-center gap-2">
        <button
          onClick={handleLoad}
          className="rounded-md bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground hover:opacity-90"
        >
          Carregar
        </button>
        <button
          onClick={handleExample}
          className="rounded-md border border-border px-3 py-1.5 text-xs font-medium text-foreground hover:bg-muted"
        >
          Exemplo
        </button>
        <button
          onClick={handleClear}
          className="rounded-md border border-border px-3 py-1.5 text-xs font-medium text-foreground hover:bg-muted"
        >
          Limpar
        </button>
      </div>

      {status && (
        <p
          className={`mt-3 text-xs font-medium ${status.ok ? "text-secondary" : "text-destructive"}`}
        >
          {status.message}
        </p>
      )}
    </div>
  )
}