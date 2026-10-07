import { useEffect, useRef, useState } from "react"
import { BookOpen, FolderOpen, ChevronDown, ChevronRight } from "lucide-react"
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

interface IDropdownItem {
  id: string
  title: string
  description: string
  category?: string
}

interface ISidebarDropdownProps {
  icon: React.ReactNode
  label: string
  items: IDropdownItem[]
  selectedId: string | null
  emptyText: string
  onSelect: (id: string) => void
}

function SidebarDropdown({
  icon,
  label,
  items,
  selectedId,
  emptyText,
  onSelect,
}: ISidebarDropdownProps) {
  const [open, setOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return

    const handlePointerDown = (event: MouseEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) {
        setOpen(false)
      }
    }
    const handleKeyDown = (event: globalThis.KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false)
    }

    document.addEventListener("mousedown", handlePointerDown)
    document.addEventListener("keydown", handleKeyDown)
    return () => {
      document.removeEventListener("mousedown", handlePointerDown)
      document.removeEventListener("keydown", handleKeyDown)
    }
  }, [open])

  const selected = items.find((item) => item.id === selectedId) ?? null

  const triggerClasses =
    "group flex w-full items-center justify-between gap-2 rounded-lg border border-border bg-background px-2.5 py-2 text-left transition-all hover:border-primary/30 hover:bg-muted/50"

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        aria-expanded={open}
        aria-label={`${label}: ${selected ? selected.title : "nenhum selecionado"}`}
        className={triggerClasses}
      >
        <span className="flex min-w-0 items-center gap-1.5">
          {icon}
          <span className="truncate text-xs font-medium text-foreground">
            {selected ? selected.title : label}
          </span>
        </span>
        <ChevronDown
          className={`h-3.5 w-3.5 shrink-0 text-muted-foreground transition-transform ${
            open ? "rotate-180" : ""
          }`}
        />
      </button>

      {open && (
        <div
          role="group"
          aria-label={label}
          className="absolute left-0 right-0 top-full z-20 mt-1 max-h-72 overflow-y-auto rounded-lg border border-border bg-card p-1 shadow-lg"
        >
          {items.length === 0 && (
            <p className="px-2 py-2 text-[11px] text-muted-foreground">
              {emptyText}
            </p>
          )}

          {items.map((item) => {
            const isSelected = item.id === selectedId
            return (
              <button
                key={item.id}
                type="button"
                aria-pressed={isSelected}
                title={item.description}
                onClick={() => {
                  onSelect(item.id)
                  setOpen(false)
                }}
                className={`flex w-full items-center justify-between gap-2 rounded-md px-2 py-1.5 text-left transition-colors ${
                  isSelected
                    ? "bg-primary/5 text-primary"
                    : "hover:bg-muted/50"
                }`}
              >
                <span className="min-w-0 flex-1">
                  {item.category && (
                    <span
                      className="mb-0.5 block w-fit rounded border px-1.5 py-0.5 text-[10px] font-semibold"
                      style={categoryStyle(item.category)}
                    >
                      {item.category}
                    </span>
                  )}
                  <span className="block truncate text-xs font-medium text-foreground">
                    {item.title}
                  </span>
                </span>
                <ChevronRight
                  className={`h-3.5 w-3.5 shrink-0 ${
                    isSelected
                      ? "text-primary"
                      : "text-muted-foreground/50"
                  }`}
                />
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
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
    <div className="flex-1 space-y-2 overflow-y-auto p-3">
      <SidebarDropdown
        icon={<FolderOpen className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />}
        label="Meus algoritmos"
        items={[]}
        selectedId={null}
        emptyText="Nenhum algoritmo salvo ainda."
        onSelect={() => undefined}
      />

      <SidebarDropdown
        icon={<BookOpen className="h-3.5 w-3.5 shrink-0 text-primary" />}
        label="Exemplos"
        items={examples.map((example) => ({
          id: example.id,
          title: example.title,
          description: example.description,
          category: example.category,
        }))}
        selectedId={selectedId}
        emptyText="Nenhum exemplo disponível."
        onSelect={(id) => {
          const example = examples.find((item) => item.id === id)
          if (example) handleSelect(example)
        }}
      />
    </div>
  )
}