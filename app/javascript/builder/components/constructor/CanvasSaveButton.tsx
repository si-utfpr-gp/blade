import { Save } from "lucide-react"
import { useConstructor } from "./ConstructorProvider"
import { useAlgorithms } from "./AlgorithmsProvider"
import { useDiagramOrigin } from "./DiagramOrigin"
import { useAlgorithmNameField } from "./AlgorithmNameProvider"
import { serializeDiagramForSave } from "./serializeDiagram"

export function CanvasSaveButton() {
  const { nodes, edges } = useConstructor()
  const { saveAlgorithm, updateAlgorithm, status, error } = useAlgorithms()
  const { origin, isReadOnly } = useDiagramOrigin()
  const { algorithmName, clearAlgorithmName } = useAlgorithmNameField()

  const handleSave = async () => {
    const trimmed = algorithmName.trim()
    if (!trimmed || isReadOnly) return

    const diagram = serializeDiagramForSave(nodes, edges)

    // A selected saved algorithm is updated in place; anything else is a new
    // record, so repeated saves never pile up duplicates.
    const saved =
      origin.kind === "saved"
        ? await updateAlgorithm(origin.id, trimmed, diagram)
        : await saveAlgorithm(trimmed, diagram)

    if (saved) clearAlgorithmName()
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
        className="flex items-center gap-1 rounded-lg border border-border px-2 py-1 text-[10px] font-medium text-foreground transition-colors hover:border-primary/40 hover:bg-muted/50 disabled:opacity-40"
      >
        <Save className="h-3 w-3" />
        {saving ? "Salvando..." : label}
      </button>
      {error && (
        <span className="text-[10px] text-destructive" role="alert">
          {error}
        </span>
      )}
    </div>
  )
}