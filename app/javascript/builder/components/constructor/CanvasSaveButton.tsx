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

  return (
    <div className="flex items-center gap-1.5">
      <button
        type="button"
        onClick={handleSave}
        disabled={!canSave}
        title={isReadOnly ? "Exemplos não podem ser alterados" : undefined}
        className="flex items-center gap-1 rounded-lg border border-border px-2 py-1 text-sm font-medium text-shadow-card-foreground transition-colors hover:border-primary/40 disabled:hover:border-none hover:bg-muted/50 disabled:opacity-80 hover:cursor-pointer disabled:cursor-not-allowed"
      >
        <Save className="h-3 w-3" />
        {saving ? "Salvando..." : label}
      </button>
      {error && (
        <span className="sr-only" role="alert">
          {error}
        </span>
      )}
    </div>
  )
}
