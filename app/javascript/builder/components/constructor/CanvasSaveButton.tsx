import { Save } from "lucide-react"
import { useConstructor } from "./ConstructorProvider"
import { useAlgorithms } from "./AlgorithmsProvider"
import { useAlgorithmNameField } from "./AlgorithmNameProvider"
import { serializeDiagramForSave } from "./serializeDiagram"

export function CanvasSaveButton() {
  const { nodes, edges } = useConstructor()
  const { saveAlgorithm, status, error } = useAlgorithms()
  const { algorithmName, clearAlgorithmName } = useAlgorithmNameField()

  const handleSave = async () => {
    const trimmed = algorithmName.trim()
    if (!trimmed) return

    const saved = await saveAlgorithm(
      trimmed,
      serializeDiagramForSave(nodes, edges),
    )
    if (saved) clearAlgorithmName()
  }

  const saving = status === "saving"
  const canSave = algorithmName.trim().length > 0 && !saving

  return (
    <div className="flex items-center gap-1.5">
      <button
        type="button"
        onClick={handleSave}
        disabled={!canSave}
        title={algorithmName.trim() ? undefined : "Informe um nome no cabeçalho"}
        className="flex items-center gap-1 rounded-lg border border-border px-2 py-1 text-[10px] font-medium text-foreground transition-colors hover:border-primary/40 hover:bg-muted/50 disabled:opacity-40"
      >
        <Save className="h-3 w-3" />
        {saving ? "Salvando..." : "Salvar algoritmo"}
      </button>
      {error && (
        <span className="text-[10px] text-destructive" role="alert">
          {error}
        </span>
      )}
    </div>
  )
}