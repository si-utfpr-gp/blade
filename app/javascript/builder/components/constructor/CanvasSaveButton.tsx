import { Save } from "lucide-react"
import { useToast } from "../ui/Toast"
import { useConstructor } from "./ConstructorProvider"
import { useAlgorithms } from "./AlgorithmsProvider"
import { useDiagramOrigin } from "./DiagramOrigin"
import { useAlgorithmNameField } from "./AlgorithmNameProvider"
import { serializeDiagramForSave } from "./serializeDiagram"

export function CanvasSaveButton() {
  const { nodes, edges } = useConstructor()
  const { saveAlgorithm, updateAlgorithm, status, error } = useAlgorithms()
  const { origin, isReadOnly, markSaved } = useDiagramOrigin()
  const { algorithmName } = useAlgorithmNameField()
  const { notify } = useToast()

  const handleSave = async () => {
    const trimmed = algorithmName.trim()
    if (!trimmed || isReadOnly) return

    const diagram = serializeDiagramForSave(nodes, edges)

    // A selected saved algorithm is updated in place; anything else is a new
    // record, so repeated saves never pile up duplicates.
    // The name stays in the field after saving: emptying it made the save look
    // like it had failed, and the diagram on screen is still that algorithm.
    if (origin.kind === "saved") {
      const updated = await updateAlgorithm(origin.id, trimmed, diagram)
      if (updated) {
        notify(`Algoritmo "${updated.name}" atualizado.`, "success")
      } else {
        notify("Não foi possível atualizar o algoritmo.", "error")
      }
      return
    }

    const saved = await saveAlgorithm(trimmed, diagram)
    if (saved) {
      markSaved(saved.id)
      notify(`Algoritmo "${saved.name}" salvo.`, "success")
    } else {
      // saveAlgorithm already stored the API message on `error`.
      notify("Não foi possível salvar o algoritmo.", "error")
    }
  }

  const saving = status === "saving"
  const canSave = algorithmName.trim().length > 0 && !saving && !isReadOnly

  const label = isReadOnly
    ? "Exemplo não pode ser salvo"
    : origin.kind === "saved"
      ? "Atualizar algoritmo"
      : "Salvar algoritmo"

  const hint = isReadOnly
    ? "Exemplos não podem ser alterados"
    : origin.kind === "saved"
      ? "Atualizar o algoritmo atual"
      : "Salvar o algoritmo na sua conta"

  // Icon only, to leave room on small screens. With no visible text the
  // accessible name and the title carry the whole meaning: screen readers get
  // aria-label, and the desktop tooltip gets title. Touch has no hover, so
  // the label is also what explains a disabled button.
  return (
    <div className="flex items-center gap-1.5">
      <button
        type="button"
        onClick={handleSave}
        disabled={!canSave}
        aria-label={saving ? "Salvando..." : label}
        title={hint}
        className="flex h-10 w-10 items-center justify-center rounded-lg border border-border bg-card/95 text-foreground transition-colors hover:border-primary/40 hover:bg-muted/50 disabled:cursor-not-allowed disabled:opacity-40 sm:h-8 sm:w-8"
      >
        <Save className="h-3.5 w-3.5" aria-hidden="true" />
      </button>
      {error && (
        <span className="sr-only" role="alert">
          {error}
        </span>
      )}
    </div>
  )
}
