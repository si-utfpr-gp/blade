import { AlertTriangle, X } from "lucide-react"

interface SimulatorErrorToastProps {
  message: string | null
  onDismiss?: () => void
}

export default function SimulatorErrorToast({ message, onDismiss }: SimulatorErrorToastProps) {
  if (!message) return null

  return (
    <div
      role="alert"
      className="pointer-events-auto fixed right-4 top-4 z-50 flex max-w-sm items-start gap-2 rounded-lg border border-destructive/30 bg-background px-3 py-2.5 text-destructive shadow-lg"
    >
      <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
      <p className="flex-1 text-xs font-medium">{message}</p>
      {onDismiss && (
        <button
          type="button"
          onClick={onDismiss}
          className="rounded p-0.5 hover:bg-destructive/10"
          aria-label="Fechar mensagem de erro"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      )}
    </div>
  )
}
