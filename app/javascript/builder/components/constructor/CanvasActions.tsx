import { Plus, Trash2 } from "lucide-react"
import { useConstructor } from "./ConstructorProvider"
import { useSimulator } from "../simulator/SimulatorContext"
import { useAlgorithms } from "./AlgorithmsProvider"
import { useAlgorithmNameField } from "./AlgorithmNameProvider"
import { useDiagramOrigin } from "./DiagramOrigin"
import { useDiscardGuard } from "./useDiscardGuard"

export function CanvasActions() {
  const { resetCanvas, clearCanvas, editLocked } = useConstructor()
  const { reset } = useSimulator()
  const { error } = useAlgorithms()
  const { clearAlgorithmName } = useAlgorithmNameField()
  const { markBlank, origin } = useDiagramOrigin()
  const { guard, dialog } = useDiscardGuard()

  const handleNew = () =>
    guard(() => {
      resetCanvas()
      reset()
      clearAlgorithmName()
      markBlank()
    })

  // Erase the blocks, keep everything that says which algorithm this is. Saving
  // afterwards empties that same algorithm, which is what the student asked
  // for by erasing rather than by starting over.
  //
  // An example is the exception: it is read only content shipped with the app,
  // not work belonging to a saved algorithm, so erasing it has to leave an
  // editable canvas behind rather than a locked empty one.
  const handleClear = () =>
    guard(() => {
      clearCanvas()
      reset()
      if (origin.kind !== "saved") markBlank()
    })

  return (
    <div className="space-y-2 border-t border-border p-2">
      {error && (
        <p className="text-xs text-destructive" role="alert">
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
        // Clearing is an edit; the lock keeps the diagram as it is.
        disabled={editLocked}
        title={editLocked ? "Destrave a edição para limpar" : undefined}
        className="flex w-full items-center justify-center gap-1.5 rounded-lg border border-destructive/30 px-3 py-1.5 text-xs font-medium text-destructive transition-colors hover:bg-destructive hover:text-destructive-foreground disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent disabled:hover:text-destructive"
      >
        <Trash2 className="h-3 w-3" /> Limpar
      </button>

      {dialog}
    </div>
  )
}