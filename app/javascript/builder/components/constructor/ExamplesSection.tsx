import { useEffect, useRef, useState } from "react"
import { BookOpen, FolderOpen, ChevronDown, ChevronRight, Trash2 } from "lucide-react"
import { useConstructor } from "./ConstructorProvider"
import { useSimulator } from "../simulator/SimulatorContext"
import {
  DIAGRAM_EXAMPLES,
  type IDiagramExample,
} from "../../interfaces/diagramExamples"
import { layoutExampleDiagram } from "./layoutExampleDiagram"
import { HardDrive } from "lucide-react"
import { useAlgorithms } from "./AlgorithmsProvider"
import { useLocalAlgorithms } from "./LocalAlgorithmsProvider"
import { useAlgorithmNameField } from "./AlgorithmNameProvider"
import { useToast } from "../ui/Toast"
import { ConfirmDialog } from "../ui/ConfirmDialog"
import { CanvasImportButton } from "./CanvasImportButton"
import { useDiagramOrigin } from "./DiagramOrigin"

const CATEGORY_COLOR: Record<string, string> = {
  "Entrada e saída": "var(--node-input)",
  Condicionais: "var(--node-decision)",
  "Repetições": "var(--node-memory)",
  Vetores: "var(--node-connector)",
}

// Not a category like the examples use: this says where the diagram lives,
// which is the one thing a student cannot tell by looking at the list.
const LOCAL_CATEGORY = "Nesta máquina"

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
  // Left out where the item does not belong to the student, such as the
  // examples that ship with the app.
  onDelete?: (id: string) => void
}

function SidebarDropdown({
  icon,
  label,
  items,
  selectedId,
  emptyText,
  onSelect,
  onDelete,
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
          className="absolute left-0 right-0 top-full z-50 mt-1 max-h-72 overflow-y-auto rounded-lg border border-border bg-card p-1 shadow-lg"
        >
          {items.length === 0 && (
            <p className="px-2 py-2 text-xs text-muted-foreground">
              {emptyText}
            </p>
          )}

          {items.map((item) => {
            const isSelected = item.id === selectedId
            return (
              // A container rather than a button, because the delete action is
              // a button too and nesting one inside another is invalid markup
              // that browsers are free to render however they like.
              <div
                key={item.id}
                className="flex w-full items-center gap-1 rounded-md transition-colors hover:bg-muted/50"
              >
                <button
                  type="button"
                  aria-pressed={isSelected}
                  // The visible row carries the badge and the title, but a
                  // screen reader is better served by the name first and where
                  // the diagram lives after it.
                  aria-label={
                    item.category ? `${item.title}, ${item.category}` : item.title
                  }
                  title={item.description}
                  onClick={() => {
                    onSelect(item.id)
                    setOpen(false)
                  }}
                  className={`flex min-w-0 flex-1 items-center justify-between gap-2 rounded-md px-2 py-1.5 text-left ${
                    isSelected ? "bg-primary/5 text-primary" : ""
                  }`}
                >
                  <span className="min-w-0 flex-1">
                    {item.category && (
                      <span
                        className="mb-0.5 block w-fit rounded border px-1.5 py-0.5 text-xs font-semibold"
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
                {onDelete && (
                  <button
                    type="button"
                    aria-label={`Excluir "${item.title}"`}
                    title="Excluir"
                    onClick={() => onDelete(item.id)}
                    className="shrink-0 rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
                  >
                    <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                  </button>
                )}
              </div>
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
  const { algorithms, getAlgorithm, signedIn, deleteAlgorithm } = useAlgorithms()
  const {
    algorithms: localAlgorithms,
    getAlgorithm: getLocalAlgorithm,
    deleteAlgorithm: deleteLocalAlgorithm,
  } = useLocalAlgorithms()
  const { onAlgorithmNameChange } = useAlgorithmNameField()
  const { markExample, markSaved, markLocal } = useDiagramOrigin()
  const { notify } = useToast()
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null)
  const [selectedLocalId, setSelectedLocalId] = useState<string | null>(null)
  const [pendingDelete, setPendingDelete] = useState<{
    name: string
    run: () => void
  } | null>(null)

  const examples = DIAGRAM_EXAMPLES.filter(
    (example) => !example.diagram.subroutines?.length,
  )

  const handleSelect = (example: IDiagramExample) => {
    const { nodes, edges } = layoutExampleDiagram(example)
    loadCanvasNodes(nodes, edges)
    reset()
    onAlgorithmNameChange(example.title)
    markExample(example.id)
    setSelectedId(example.id)
  }

  const handleSelectUserAlgorithm = async (id: string) => {
    const saved = await getAlgorithm(Number(id))
    if (!saved) return
    loadCanvasNodes(saved.diagram.nodes, saved.diagram.edges)
    reset()
    onAlgorithmNameChange(saved.name)
    markSaved(saved.id)
    setSelectedUserId(saved.id.toString())
  }

  const handleSelectLocalAlgorithm = (id: string) => {
    const stored = getLocalAlgorithm(id)
    if (!stored) return
    loadCanvasNodes(stored.diagram.nodes, stored.diagram.edges)
    reset()
    onAlgorithmNameChange(stored.name)
    markLocal(stored.id)
    setSelectedLocalId(stored.id)
  }

  // Deleting asks first and says which of the two stores is involved, since
  // from the student's side the two lists look alike.
  const confirmDelete = (name: string, run: () => void) =>
    setPendingDelete(() => ({ name, run }))

  const handleDeleteSaved = (id: string) => {
    const algorithm = algorithms.find((item) => item.id.toString() === id)
    if (!algorithm) return
    confirmDelete(algorithm.name, async () => {
      const removed = await deleteAlgorithm(algorithm.id)
      notify(
        removed
          ? `Algoritmo "${algorithm.name}" excluído.`
          : "Não foi possível excluir o algoritmo.",
        removed ? "success" : "error",
      )
      if (removed) setSelectedUserId(null)
    })
  }

  const handleDeleteLocal = (id: string) => {
    const algorithm = localAlgorithms.find((item) => item.id === id)
    if (!algorithm) return
    confirmDelete(algorithm.name, () => {
      const removed = deleteLocalAlgorithm(id)
      if (!removed) return
      setSelectedLocalId(null)
    })
  }

  return (
    <div className="flex-1 space-y-2 overflow-y-auto p-3">
      <SidebarDropdown
        icon={<HardDrive className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />}
        label="Meus arquivos"
        items={localAlgorithms.map((algorithm) => ({
          id: algorithm.id,
          title: algorithm.name,
          description: `Guardado em ${algorithm.created_at}`,
          category: LOCAL_CATEGORY,
        }))}
        selectedId={selectedLocalId}
        emptyText="Nenhum arquivo guardado neste navegador."
        onSelect={handleSelectLocalAlgorithm}
        onDelete={handleDeleteLocal}
      />

      <CanvasImportButton />

      {signedIn && (
        <SidebarDropdown
          icon={<FolderOpen className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />}
          label="Meus algoritmos"
          items={algorithms.map((algorithm) => ({
            id: algorithm.id.toString(),
            title: algorithm.name,
            description: `Salvo em ${algorithm.created_at}`,
          }))}
          selectedId={selectedUserId}
          emptyText="Nenhum algoritmo salvo ainda."
          onSelect={(id) => void handleSelectUserAlgorithm(id)}
          onDelete={handleDeleteSaved}
        />
      )}

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

      <ConfirmDialog
        open={pendingDelete !== null}
        title={`Excluir "${pendingDelete?.name ?? ""}"?`}
        description="Essa ação não pode ser desfeita."
        confirmLabel="Excluir"
        destructive
        onConfirm={() => {
          const pending = pendingDelete
          setPendingDelete(null)
          pending?.run()
        }}
        onCancel={() => setPendingDelete(null)}
      />
    </div>
  )
}