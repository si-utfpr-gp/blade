import { useConstructor } from "./ConstructorProvider"
import { useSimulator } from "../simulator/SimulatorContext"
import { normalizeDiagram } from "./normalizeDiagram"

interface IRunDiagramButtonProps {
  onDiagramLoaded?: () => void
}

export function RunDiagramButton({ onDiagramLoaded }: IRunDiagramButtonProps) {
  const { nodes, edges } = useConstructor()
  const { loadDiagram, reset } = useSimulator()

  const handleRun = () => {
    reset()
    const { nodes: normalizedNodes, edges: normalizedEdges } = normalizeDiagram(
      nodes,
      edges,
    )
    const result = loadDiagram(normalizedNodes, normalizedEdges)
    if (result.ok) {
      console.log({ ok: true, message: "Diagrama carregado no simulador." })
      onDiagramLoaded?.()
    } else {
      console.error({ ok: false, message: result.error })
    }
  }

  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        onClick={handleRun}
        className="rounded-md bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground hover:opacity-90"
      >
        Executar
      </button>
    </div>
  )
}
