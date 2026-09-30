import { useState } from "react"
import { useConstructor } from "./ConstructorProvider"
import { useSimulator } from "../simulator/SimulatorContext"
import { normalizeDiagram } from "./normalizeDiagram"

interface IRunDiagramButtonProps {
  onDiagramLoaded?: () => void
}

export function RunDiagramButton({ onDiagramLoaded }: IRunDiagramButtonProps) {
  const { nodes, edges } = useConstructor()
  const { loadDiagram, reset } = useSimulator()
  const [status, setStatus] = useState<{ ok: boolean; message: string } | null>(null)

  const handleRun = () => {
    reset()
    const { nodes: normalizedNodes, edges: normalizedEdges } = normalizeDiagram(
      nodes,
      edges,
    )
    const result = loadDiagram(normalizedNodes, normalizedEdges)
    if (result.ok) {
      setStatus({ ok: true, message: "Diagrama carregado no simulador." })
      onDiagramLoaded?.()
    } else {
      setStatus({ ok: false, message: result.error })
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
      {status && (
        <span
          className={`text-xs font-medium ${status.ok ? "text-secondary" : "text-destructive"}`}
        >
          {status.message}
        </span>
      )}
    </div>
  )
}
