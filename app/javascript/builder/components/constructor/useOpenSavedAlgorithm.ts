import { useCallback } from "react"
import { useConstructor } from "./ConstructorProvider"
import { useSimulator } from "../simulator/SimulatorContext"
import { useAlgorithms, type SavedAlgorithm } from "./AlgorithmsProvider"
import { useAlgorithmNameField } from "./AlgorithmNameProvider"
import { useDiagramOrigin } from "./DiagramOrigin"

/**
 * Loads a saved algorithm onto the canvas: its diagram, its name and its
 * origin, with any previous run cleared. Shared by the sidebar list and the
 * "Meus algoritmos" dialog so both open an algorithm the same way.
 */
export function useOpenSavedAlgorithm() {
  const { loadCanvasNodes } = useConstructor()
  const { reset } = useSimulator()
  const { getAlgorithm } = useAlgorithms()
  const { onAlgorithmNameChange } = useAlgorithmNameField()
  const { markSaved } = useDiagramOrigin()

  return useCallback(
    async (id: number): Promise<SavedAlgorithm | null> => {
      const saved = await getAlgorithm(id)
      if (!saved) return null
      loadCanvasNodes(saved.diagram.nodes, saved.diagram.edges)
      reset()
      onAlgorithmNameChange(saved.name)
      markSaved(saved.id)
      return saved
    },
    [getAlgorithm, loadCanvasNodes, reset, onAlgorithmNameChange, markSaved],
  )
}
