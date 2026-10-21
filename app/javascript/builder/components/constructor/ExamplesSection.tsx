import { useEffect, useRef, useState } from "react"
import { BookOpen, FolderOpen, ChevronDown, ChevronRight, Pencil, Trash2 } from "lucide-react"
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
import { ALGORITHM_NAME_MAX_LENGTH, useAlgorithmNameField } from "./AlgorithmNameProvider"
import { useToast } from "../ui/Toast"
import { ConfirmDialog } from "../ui/ConfirmDialog"
import { CanvasImportButton } from "./CanvasImportButton"
import { useDiagramOrigin } from "./DiagramOrigin"
import { useOpenSavedAlgorithm } from "./useOpenSavedAlgorithm"
import { useDrawer } from "../layout/DrawerContext"

const CATEGORY_COLOR: Record<string, string> = {
  "Entrada e saída": "var(--node-input)",
  Condicionais: "var(--node-decision)",
  "Repetições": "var(--node-memory)",
  Vetores: "var(--node-connector)",
}

// Not a category like the examples use: this says where the diagram lives,
// which is the one thing a student cannot tell by looking at the list.
const LOCAL_CATEGORY = "Nesta máquina"

// The browser keeps a timestamp; the list shows the day it stands for.
function keptOn(timestamp: string): string {
  const date = new Date(timestamp)
  return Number.isNaN(date.getTime()) ? timestamp : date.toLocaleDateString("pt-BR")
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
  // Shown as a coloured badge, as the examples' topics are.
  category?: string
  // Read out after the title, for what the list already says once on screen.
  spokenHint?: string
  // A quiet second line, such as when a file was kept.
  meta?: string
}

interface ISidebarDropdownProps {
  icon: React.ReactNode
  label: string
  items: IDropdownItem[]
  selectedId: string | null
  emptyText: string
  // Said once above the items, instead of on every row.
  caption?: string
  onSelect: (id: string) => void
  // Left out where the item does not belong to the student, such as the
  // examples that ship with the app.
  onDelete?: (id: string) => void
  // Left out for the examples too. Gets a trimmed, non-empty name.
  onRename?: (id: string, name: string) => void
}

function SidebarDropdown({
  icon,
  label,
  items,
  selectedId,
  emptyText,
  caption,
  onSelect,
  onDelete,
  onRename,
}: ISidebarDropdownProps) {
  const [open, setOpen] = useState(false)
  const [renaming, setRenaming] = useState<{ id: string; draft: string } | null>(null)

  // Enter and leaving the field both end up here; the first one wins.
  const finishRename = () => {
    if (!renaming) return
    const item = items.find((candidate) => candidate.id === renaming.id)
    const name = renaming.draft.trim()
    setRenaming(null)
    if (item && name && name !== item.title) onRename?.(item.id, name)
  }
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

  // Opening near the bottom of a short screen, the list would start out of
  // sight; it scrolls the sidebar just enough to show itself.
  const listRef = useRef<HTMLDivElement>(null)
  useEffect(() => {
    if (open) listRef.current?.scrollIntoView?.({ block: "nearest", behavior: "smooth" })
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

      {/* In place rather than floating: as a popover it opened inside the
          sidebar's scroll and was cut off on short screens. */}
      {open && (
        <div
          ref={listRef}
          role="group"
          aria-label={label}
          className="mt-1 max-h-[min(18rem,50dvh)] overflow-y-auto overscroll-contain rounded-lg border border-border bg-card p-1 shadow-sm"
        >
          {caption && items.length > 0 && (
            <p className="px-2 pb-1 pt-1.5 text-xs text-muted-foreground">{caption}</p>
          )}
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
                {renaming?.id === item.id ? (
                  <input
                    aria-label={`Novo nome para "${item.title}"`}
                    value={renaming.draft}
                    maxLength={ALGORITHM_NAME_MAX_LENGTH}
                    autoFocus
                    onFocus={(event) => event.currentTarget.select()}
                    onChange={(event) => setRenaming({ id: item.id, draft: event.target.value })}
                    onKeyDown={(event) => {
                      if (event.key === "Enter") {
                        event.preventDefault()
                        finishRename()
                      } else if (event.key === "Escape") {
                        // Gives up on the name only; the list and the drawer
                        // stay open.
                        event.stopPropagation()
                        setRenaming(null)
                      }
                    }}
                    onBlur={finishRename}
                    className="min-h-11 min-w-0 flex-1 rounded-md border border-primary/50 bg-background px-2 text-xs font-medium text-foreground outline-none ring-2 ring-primary/20 md:min-h-0 md:py-1.5"
                  />
                ) : (
                <button
                  type="button"
                  aria-pressed={isSelected}
                  // The visible row carries the badge and the title, but a
                  // screen reader is better served by the name first and where
                  // the diagram lives after it.
                  aria-label={
                    item.category || item.spokenHint
                      ? `${item.title}, ${item.category ?? item.spokenHint}`
                      : item.title
                  }
                  title={item.description}
                  onClick={() => {
                    onSelect(item.id)
                    setOpen(false)
                  }}
                  // Finger-sized rows on a phone, compact ones with a mouse.
                  className={`flex min-h-11 min-w-0 flex-1 items-center justify-between gap-2 rounded-md px-2 py-2 text-left md:min-h-0 md:py-1.5 ${
                    isSelected ? "bg-primary/5 text-primary" : ""
                  }`}
                >
                  <span className="min-w-0 flex-1">
                    {item.category && (
                      <span
                        className="mb-0.5 block w-fit rounded border px-1.5 text-xs font-medium leading-4"
                        style={categoryStyle(item.category)}
                      >
                        {item.category}
                      </span>
                    )}
                    <span className="block truncate text-xs font-medium text-foreground">
                      {item.title}
                    </span>
                    {item.meta && (
                      <span className="block truncate text-xs text-muted-foreground">
                        {item.meta}
                      </span>
                    )}
                  </span>
                  <ChevronRight
                    className={`h-3.5 w-3.5 shrink-0 ${
                      isSelected
                        ? "text-primary"
                        : "text-muted-foreground/50"
                    }`}
                  />
                </button>
                )}
                {onRename && renaming?.id !== item.id && (
                  <button
                    type="button"
                    aria-label={`Renomear "${item.title}"`}
                    title="Renomear"
                    onClick={() => setRenaming({ id: item.id, draft: item.title })}
                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-primary/10 hover:text-primary md:h-7 md:w-7"
                  >
                    <Pencil className="h-3.5 w-3.5" aria-hidden="true" />
                  </button>
                )}
                {onDelete && renaming?.id !== item.id && (
                  <button
                    type="button"
                    aria-label={`Excluir "${item.title}"`}
                    title="Excluir"
                    onClick={() => onDelete(item.id)}
                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive md:h-7 md:w-7"
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
  const { algorithms, signedIn, deleteAlgorithm, updateAlgorithm, loadError } = useAlgorithms()
  const openSaved = useOpenSavedAlgorithm()
  const {
    algorithms: localAlgorithms,
    getAlgorithm: getLocalAlgorithm,
    deleteAlgorithm: deleteLocalAlgorithm,
    renameAlgorithm: renameLocalAlgorithm,
  } = useLocalAlgorithms()
  const { onAlgorithmNameChange } = useAlgorithmNameField()
  const { origin, markExample, markLocal } = useDiagramOrigin()
  // On a phone the lists live in a drawer over the canvas; opening something
  // closes it so the student sees what was opened.
  const drawer = useDrawer()
  const { notify } = useToast()

  // The list not loading is said once, as a notice like every other message.
  useEffect(() => {
    if (signedIn && loadError) notify(loadError, "error")
  }, [signedIn, loadError, notify])
  // Each list marks the diagram on the canvas, read from where it came from,
  // so anything else taking the canvas (an import, a new algorithm, a clear)
  // unmarks it without each of those having to remember the lists.
  const selectedId = origin.kind === "example" ? origin.id : null
  const selectedUserId = origin.kind === "saved" ? origin.id.toString() : null
  const selectedLocalId = origin.kind === "local" ? origin.id : null
  const [pendingDelete, setPendingDelete] = useState<{
    name: string
    run: () => void
  } | null>(null)

  const examples = DIAGRAM_EXAMPLES.filter(
    (example) => !example.diagram.subroutines?.length,
  )

  const handleSelect = (example: IDiagramExample) => {
    const { nodes, edges, centers } = layoutExampleDiagram(example)
    loadCanvasNodes(nodes, edges, { centers })
    reset()
    onAlgorithmNameChange(example.title)
    markExample(example.id)
    drawer?.close()
  }

  const handleSelectUserAlgorithm = (id: string) => {
    void openSaved(Number(id))
    drawer?.close()
  }

  const handleSelectLocalAlgorithm = (id: string) => {
    const stored = getLocalAlgorithm(id)
    if (!stored) return
    loadCanvasNodes(stored.diagram.nodes, stored.diagram.edges)
    reset()
    onAlgorithmNameChange(stored.name)
    markLocal(stored.id)
    drawer?.close()
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
    })
  }

  // The open diagram keeps its name in the field at the top, so renaming it
  // from the list renames it there too.
  const handleRenameLocal = (id: string, name: string) => {
    if (renameLocalAlgorithm(id, name) && origin.kind === "local" && origin.id === id) {
      onAlgorithmNameChange(name)
    }
  }

  const handleRenameSaved = async (id: string, name: string) => {
    const algorithm = algorithms.find((item) => item.id.toString() === id)
    if (!algorithm) return
    const result = await updateAlgorithm(algorithm.id, name, algorithm.diagram)
    if (!result.ok) {
      // The account says why, for instance that the name is taken.
      notify(result.message, "error")
      return
    }
    if (origin.kind === "saved" && origin.id === algorithm.id) onAlgorithmNameChange(result.algorithm.name)
  }

  const handleDeleteLocal = (id: string) => {
    const algorithm = localAlgorithms.find((item) => item.id === id)
    if (!algorithm) return
    confirmDelete(algorithm.name, () => {
      deleteLocalAlgorithm(id)
    })
  }

  return (
    // The sidebar scrolls as a whole; see BlocksPanel.
    <div className="space-y-2 p-3">
      <SidebarDropdown
        icon={<HardDrive className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />}
        label="Meus arquivos"
        items={localAlgorithms.map((algorithm) => ({
          id: algorithm.id,
          title: algorithm.name,
          description: `Guardado em ${keptOn(algorithm.created_at)}`,
          spokenHint: LOCAL_CATEGORY,
          meta: keptOn(algorithm.created_at),
        }))}
        caption="Guardados nesta máquina, só neste navegador."
        selectedId={selectedLocalId}
        emptyText="Nenhum arquivo guardado neste navegador."
        onSelect={handleSelectLocalAlgorithm}
        onDelete={handleDeleteLocal}
        onRename={handleRenameLocal}
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
          emptyText={loadError ? "Não foi possível carregar seus algoritmos." : "Nenhum algoritmo salvo ainda."}
          onSelect={handleSelectUserAlgorithm}
          onDelete={handleDeleteSaved}
          onRename={(id, name) => void handleRenameSaved(id, name)}
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