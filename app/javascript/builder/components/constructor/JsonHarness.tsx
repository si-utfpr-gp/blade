import { useState } from "react"
import type { Node, Edge } from "@xyflow/react"
import type { IRawSubroutineDefinition } from "../../parser/types"
import { DIAGRAM_EXAMPLE_CATEGORIES, DIAGRAM_EXAMPLES, type IDiagramExample } from "../../interfaces/diagramExamples"
import { useSimulator } from "../simulator/SimulatorContext"

export default function JsonHarness() {
  const { loadDiagram } = useSimulator()
  const [json, setJson] = useState("")
  const [status, setStatus] = useState<{ ok: boolean; message: string } | null>(null)
  const [isExampleMenuOpen, setIsExampleMenuOpen] = useState(false)

  const handleLoad = () => {
    let parsed: unknown
    try {
      parsed = JSON.parse(json)
    } catch {
      setStatus({ ok: false, message: "JSON inválido: verifique a sintaxe." })
      return
    }
    const data = parsed as { nodes?: Node[]; edges?: Edge[]; subroutines?: IRawSubroutineDefinition[] }
    if (!Array.isArray(data?.nodes)) {
      setStatus({ ok: false, message: "O campo 'nodes' é obrigatório e deve ser um array." })
      return
    }
    const result = loadDiagram(data.nodes, data.edges ?? [], { subroutines: data.subroutines })
    if (result.ok) {
      setStatus({ ok: true, message: "Diagrama carregado. Código JS/TS gerado. Use o simulador ao lado para executar." })
    } else {
      setStatus({ ok: false, message: result.error })
    }
  }

  const handleClear = () => {
    setJson("")
    setStatus(null)
  }

  const handleSelectExample = (example: IDiagramExample) => {
    setJson(JSON.stringify(example.diagram, null, 2))
    setStatus(null)
    setIsExampleMenuOpen(false)
  }

  return (
    <div className="h-full flex flex-col p-4 bg-card overflow-auto">
      <div className="mb-3">
        <h2 className="text-sm font-semibold text-foreground">Harness — JSON do Diagrama</h2>
        <p className="text-xs text-muted-foreground mt-1">
          Cole aqui o JSON <code>{"{ nodes, edges, subroutines? }"}</code> do módulo de construção para
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
        placeholder='{ "nodes": [...], "edges": [...], "subroutines": [...] }'
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
        <div className="relative">
          <button
            onClick={() => setIsExampleMenuOpen((isOpen) => !isOpen)}
            aria-expanded={isExampleMenuOpen}
            aria-controls="diagram-examples"
            className="rounded-md border border-border px-3 py-1.5 text-xs font-medium text-foreground hover:bg-muted"
          >
            Exemplo
          </button>

          {isExampleMenuOpen && (
            <ul
              id="diagram-examples"
              aria-label="Exercícios disponíveis"
              className="absolute bottom-full left-0 z-10 mb-2 max-h-80 w-80 overflow-y-auto rounded-lg border border-border bg-card p-1 shadow-lg"
            >
              {DIAGRAM_EXAMPLE_CATEGORIES.map((category) => {
                const examples = DIAGRAM_EXAMPLES.filter((example) => example.category === category)
                if (examples.length === 0) return null

                return (
                  <li key={category} className="py-1">
                    <h3 className="px-2 py-1 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                      {category}
                    </h3>
                    <ul>
                      {examples.map((example) => (
                        <li key={example.id}>
                          <button
                            aria-label={example.title}
                            onClick={() => handleSelectExample(example)}
                            className="w-full rounded-md px-2 py-1.5 text-left text-xs text-foreground hover:bg-muted"
                          >
                            <span className="block font-medium">{example.title}</span>
                            <span className="block text-[11px] text-muted-foreground">{example.description}</span>
                          </button>
                        </li>
                      ))}
                    </ul>
                  </li>
                )
              })}
            </ul>
          )}
        </div>
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
