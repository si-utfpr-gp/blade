import { useState } from "react"
import { Plus, Save, Trash2 } from "lucide-react"
import { useConstructor } from "./ConstructorProvider"
import { useSimulator } from "../simulator/SimulatorContext"
import { useAlgorithms } from "./AlgorithmsProvider"
import { serializeDiagramForSave } from "./serializeDiagram"

export function CanvasActions() {
  const { nodes, edges, resetCanvas, clearCanvas } = useConstructor()
  const { reset } = useSimulator()
  const { saveAlgorithm, status, error } = useAlgorithms()

  const [name, setName] = useState("")
  const [message, setMessage] = useState<string | null>(null)

  const handleNew = () => {
    resetCanvas()
    reset()
  }

  const handleClear = () => {
    clearCanvas()
    reset()
  }

  const handleSave = async () => {
    const trimmed = name.trim()
    if (!trimmed) {
      setMessage("Informe um nome para o algoritmo antes de salvar.")
      return
    }

    const saved = await saveAlgorithm(
      trimmed,
      serializeDiagramForSave(nodes, edges),
    )

    if (saved) {
      setMessage(`Algoritmo "${saved.name}" salvo.`)
      setName("")
    } else {
      setMessage(null)
    }
  }

  const saving = status === "saving"

  return (
    <div className="space-y-2 border-t border-border p-2">
      <div className="space-y-1">
        <label
          htmlFor="algorithm-name"
          className="block text-[10px] font-medium text-muted-foreground"
        >
          Nome do algoritmo
        </label>
        <input
          id="algorithm-name"
          type="text"
          value={name}
          maxLength={50}
          placeholder="Ex.: Soma de dois números"
          onChange={(event) => {
            setName(event.target.value)
            setMessage(null)
          }}
          className="w-full rounded-lg border border-border bg-background px-2.5 py-1.5 text-xs text-foreground placeholder:text-muted-foreground/70 focus:border-primary focus:outline-none"
        />
      </div>

      <button
        type="button"
        onClick={handleSave}
        disabled={saving}
        className="flex w-full items-center justify-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-foreground transition-colors hover:border-primary/40 hover:bg-muted/50 disabled:opacity-60"
      >
        <Save className="h-3 w-3" />
        {saving ? "Salvando..." : "Salvar algoritmo"}
      </button>

      {message && (
        <p className="text-[10px] text-primary" role="status">
          {message}
        </p>
      )}
      {!message && error && (
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