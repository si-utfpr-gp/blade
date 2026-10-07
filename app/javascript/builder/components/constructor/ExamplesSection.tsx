import { useState } from "react"
import { BookOpen, ChevronRight } from "lucide-react"
import { useConstructor } from "./ConstructorProvider"
import { useSimulator } from "../simulator/SimulatorContext"
import {
  DIAGRAM_EXAMPLES,
  type IDiagramExample,
} from "../../interfaces/diagramExamples"
import { layoutExampleDiagram } from "./layoutExampleDiagram"

const CATEGORY_COLOR: Record<string, string> = {
  "Entrada e saída": "var(--node-input)",
  Condicionais: "var(--node-decision)",
  "Repetições": "var(--node-memory)",
  Vetores: "var(--node-connector)",
}

function categoryStyle(category: string) {
  const token = CATEGORY_COLOR[category]
  if (!token) return undefined
  return {
    background: `hsl(${token} / 0.1)`,
    color: `hsl(${token})`,
    borderColor: `hsl(${token} / 0.25)`,
  }
}

export function ExamplesSection() {
  const { loadCanvasNodes } = useConstructor()
  const { reset } = useSimulator()
  const [selectedId, setSelectedId] = useState<string | null>(null)

  const examples = DIAGRAM_EXAMPLES.filter(
    (example) => !example.diagram.subroutines?.length,
  )

  const handleSelect = (example: IDiagramExample) => {
    const { nodes, edges } = layoutExampleDiagram(example)
    loadCanvasNodes(nodes, edges)
    reset()
    setSelectedId(example.id)
  }

  return (
    <div className="flex-1 space-y-1.5 overflow-y-auto p-3">
      <div className="mb-1 flex items-center gap-1.5 px-1">
        <BookOpen className="h-3.5 w-3.5 text-primary" />
        <h3 className="text-xs font-semibold uppercase tracking-wider text-foreground">
          Exemplos
        </h3>
      </div>
      {examples.map((example) => {
        const selected = selectedId === example.id
        return (
          <button
            key={example.id}
            type="button"
            title={example.description}
            onClick={() => handleSelect(example)}
            aria-pressed={selected}
            className={`group w-full rounded-lg border px-2.5 py-2 text-left transition-all duration-200 ${
              selected
                ? "border-primary bg-primary/5 shadow-sm"
                : "border-transparent hover:border-border hover:bg-muted/50"
            }`}
          >
            <div className="flex items-center justify-between gap-2">
              <div className="min-w-0 flex-1">
                <div className="mb-0.5 flex items-center gap-2">
                  <span
                    className="rounded border px-1.5 py-0.5 text-[10px] font-semibold"
                    style={categoryStyle(example.category)}
                  >
                    {example.category}
                  </span>
                </div>
                <p className="truncate text-xs font-medium text-foreground">
                  {example.title}
                </p>
              </div>
              <ChevronRight
                className={`h-3.5 w-3.5 shrink-0 transition-colors ${
                  selected
                    ? "text-primary"
                    : "text-muted-foreground/50 group-hover:text-muted-foreground"
                }`}
              />
            </div>
          </button>
        )
      })}
    </div>
  )
}
