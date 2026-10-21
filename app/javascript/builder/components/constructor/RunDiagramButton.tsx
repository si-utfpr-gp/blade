import { useConstructor } from "./ConstructorProvider"
import { useToast } from "../ui/Toast"
import { useSimulator } from "../simulator/SimulatorContext"
import { normalizeDiagram } from "./normalizeDiagram"

interface IRunDiagramButtonProps {
  onDiagramLoaded?: () => void
}

export function RunDiagramButton({ onDiagramLoaded }: IRunDiagramButtonProps) {
  const { nodes, edges } = useConstructor()
  const { loadAndStartDiagram } = useSimulator()
  const { notify } = useToast()

  const handleRun = () => {
    const { nodes: normalizedNodes, edges: normalizedEdges } = normalizeDiagram(
      nodes,
      edges,
    )
    const result = loadAndStartDiagram(normalizedNodes, normalizedEdges)
    if (result.ok) {
      onDiagramLoaded?.()
    } else {
      // The debugger panel is usually closed, and always is on a phone, so
      // the reason is said where it is seen.
      notify(result.error, "error")
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
