import { Plus, Trash2 } from "lucide-react"
import { useConstructor } from "./ConstructorProvider"
import { useSimulator } from "../simulator/SimulatorContext"
import { useAlgorithms } from "./AlgorithmsProvider"
import { useAlgorithmNameField } from "./AlgorithmNameProvider"
import { useDiagramOrigin } from "./DiagramOrigin"

export function CanvasActions() {
  const { resetCanvas, clearCanvas } = useConstructor()
  const { reset } = useSimulator()
  const { error } = useAlgorithms()
  const { clearAlgorithmName } = useAlgorithmNameField()
  const { markBlank } = useDiagramOrigin()

  const handleNew = () => {
    resetCanvas()
    reset()
    clearAlgorithmName()
    markBlank()
  }

  const handleClear = () => {
    clearCanvas()
    reset()
    clearAlgorithmName()
    markBlank()
  }

  return (
    <div className="space-y-2 border-t border-border p-2">
      {error && (
        <p className="text-[10px] text-destructive" role="alert">
          {error}
        </p>
      )}

      <button
        type="button"
        onClick={handleNew}
        className="flex w-full items-center justify-center gap-1.5 rounded-lg border border-primary/30 px-3 py-1.5 text-xs font-medium text-primary transition-colors hover:bg-primary hover:text-primary-foreground"
      >
        <Plus className="h-3 w-3" /> Novo Algoritmo
      </button>
      <button
        type="button"
        onClick={handleClear}
        className="flex w-full items-center justify-center gap-1.5 rounded-lg border border-destructive/30 px-3 py-1.5 text-xs font-medium text-destructive transition-colors hover:bg-destructive hover:text-destructive-foreground"
      >
        <Trash2 className="h-3 w-3" /> Limpar
      </button>
    </div>
  )
}