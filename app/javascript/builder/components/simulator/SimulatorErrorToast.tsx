import { useEffect, useState } from "react"
import { AlertTriangle, X } from "lucide-react"

// The same time as the other error notices, long enough to be read.
const AUTO_DISMISS_MS = 5000

interface SimulatorErrorToastProps {
  message: string | null
  onDismiss?: () => void
}

/**
 * The run's error, over the page. It hides itself after a few seconds or when
 * closed; the debugger keeps showing the error. The panel remounts it per
 * message, so a new error is shown again.
 */
export default function SimulatorErrorToast({ message, onDismiss }: SimulatorErrorToastProps) {
  const [hidden, setHidden] = useState(false)

  useEffect(() => {
    if (!message) return
    const timer = setTimeout(() => {
      setHidden(true)
      onDismiss?.()
    }, AUTO_DISMISS_MS)
    return () => clearTimeout(timer)
  }, [message, onDismiss])

  if (!message || hidden) return null

  return (
    <div
      role="alert"
      className="pointer-events-auto fixed right-4 top-4 z-50 flex max-w-sm items-start gap-2 rounded-lg border border-destructive/30 bg-background px-3 py-2.5 text-destructive shadow-lg"
    >
      <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
      <p className="flex-1 text-xs font-medium">{message}</p>
      <button
        type="button"
        onClick={() => {
          setHidden(true)
          onDismiss?.()
        }}
        className="rounded p-0.5 hover:bg-destructive/10"
        aria-label="Fechar mensagem de erro"
      >
        <X className="h-3.5 w-3.5" />
      </button>
    </div>
  )
}
