import { useState, useRef, useEffect } from "react"
import { useSimulator } from "./SimulatorContext"
import { AlertCircle } from "lucide-react"

const TYPE_HINTS: Record<string, string> = {
  inteiro: "Número inteiro (ex: 10, -5)",
  real: "Número decimal (ex: 3.14, 2.0)",
  caractere: "Texto (ex: João, Olá)",
  logico: "verdadeiro ou falso",
}

export default function InputDialog() {
  const { state, submitInput, cancelInput } = useSimulator()
  const { awaitingInput, inputPrompt, inputType } = state
  const [value, setValue] = useState("")
  const [error, setError] = useState("")
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (awaitingInput) {
      setValue("")
      setError("")
      setTimeout(() => inputRef.current?.focus(), 100)
    }
  }, [awaitingInput])

  if (!awaitingInput) return null

  const typeHint = TYPE_HINTS[inputType] ?? `Tipo: ${inputType}`

  const handleSubmit = () => {
    const trimmed = value.trim()
    if (trimmed === "") {
      setError("Informe um valor antes de continuar.")
      return
    }
    setError("")
    submitInput(trimmed)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") handleSubmit()
    if (e.key === "Escape") cancelInput()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-card rounded-xl border border-border shadow-2xl w-80 p-5 space-y-4">
        <div className="space-y-1">
          <h3 className="text-sm font-semibold text-foreground">
            Entrada de Dados
          </h3>
          <p className="text-xs text-muted-foreground">{inputPrompt}</p>
        </div>

        <div className="space-y-1.5">
          <input
            ref={inputRef}
            type="text"
            value={value}
            onChange={(e) => { setValue(e.target.value); setError("") }}
            onKeyDown={handleKeyDown}
            placeholder={typeHint}
            className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm font-mono text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
          />
          <p className="text-[10px] text-muted-foreground">{typeHint}</p>
        </div>

        {error && (
          <div className="flex items-center gap-1.5 text-destructive text-xs">
            <AlertCircle className="w-3.5 h-3.5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <div className="flex justify-end gap-2">
          <button
            onClick={cancelInput}
            className="px-3 py-1.5 rounded-md text-xs font-medium text-muted-foreground hover:bg-muted transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={handleSubmit}
            className="px-4 py-1.5 rounded-md bg-primary text-primary-foreground text-xs font-semibold hover:opacity-90 transition-opacity"
          >
            OK
          </button>
        </div>
      </div>
    </div>
  )
}
