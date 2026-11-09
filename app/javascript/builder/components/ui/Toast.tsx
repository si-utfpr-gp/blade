import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react"
import { CheckCircle2, AlertCircle, Info, X } from "lucide-react"

export type ToastTone = "success" | "error" | "info"

export interface IToast {
  id: number
  message: string
  tone: ToastTone
}

interface IToastContextValue {
  toasts: IToast[]
  notify: (message: string, tone?: ToastTone) => void
  dismiss: (id: number) => void
}

const ToastContext = createContext<IToastContextValue | null>(null)

// No notice stays on screen. A confirmation only has to be noticed; an error
// stays longer, to be read.
const AUTO_DISMISS_MS: Record<ToastTone, number> = { success: 3000, info: 3000, error: 5000 }

// The project's own tokens, the ones the blocks use: green as the start
// block for what worked, red as an error, the card for the rest. The text is a
// darker shade of each, to keep its contrast on the tint.
const TONE_STYLE: Record<ToastTone, string> = {
  success:
    "border-[hsl(var(--node-start)/0.4)] bg-[hsl(var(--node-start)/0.12)] text-[hsl(150_60%_26%)]",
  error:
    "border-[hsl(var(--destructive)/0.4)] bg-[hsl(var(--destructive)/0.1)] text-[hsl(0_70%_42%)]",
  info: "border-[hsl(var(--border))] bg-[hsl(var(--card))] text-[hsl(var(--foreground))]",
}

const TONE_ICON = {
  success: CheckCircle2,
  error: AlertCircle,
  info: Info,
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<IToast[]>([])
  const nextId = useRef(1)
  const timers = useRef(new Map<number, ReturnType<typeof setTimeout>>())

  const dismiss = useCallback((id: number) => {
    setToasts((current) => current.filter((toast) => toast.id !== id))
    const timer = timers.current.get(id)
    if (timer) {
      clearTimeout(timer)
      timers.current.delete(id)
    }
  }, [])

  const notify = useCallback(
    (message: string, tone: ToastTone = "info") => {
      const id = nextId.current++
      setToasts((current) => [...current, { id, message, tone }])
      timers.current.set(
        id,
        setTimeout(() => dismiss(id), AUTO_DISMISS_MS[tone]),
      )
    },
    [dismiss],
  )

  // Clearing pending timers on unmount avoids setting state after teardown.
  useEffect(() => {
    const pending = timers.current
    return () => {
      for (const timer of pending.values()) clearTimeout(timer)
      pending.clear()
    }
  }, [])

  const value = useMemo(
    () => ({ toasts, notify, dismiss }),
    [toasts, notify, dismiss],
  )

  return (
    <ToastContext.Provider value={value}>
      {children}
      <ToastViewport toasts={toasts} onDismiss={dismiss} />
    </ToastContext.Provider>
  )
}

function ToastViewport({
  toasts,
  onDismiss,
}: {
  toasts: IToast[]
  onDismiss: (id: number) => void
}) {
  return (
    <div
      aria-live="polite"
      aria-atomic="false"
      className="pointer-events-none fixed bottom-4 right-4 z-[60] flex w-80 max-w-[calc(100vw-2rem)] flex-col gap-2"
    >
      {toasts.map((toast) => {
        const Icon = TONE_ICON[toast.tone]
        return (
          <div
            key={toast.id}
            // An error interrupts a screen reader; anything else waits.
            role={toast.tone === "error" ? "alert" : "status"}
            className={`pointer-events-auto flex items-start gap-2 rounded-lg border px-3 py-2 shadow-lg backdrop-blur ${TONE_STYLE[toast.tone]}`}
          >
            <Icon className="mt-0.5 h-3.5 w-3.5 shrink-0" />
            <p className="flex-1 text-xs font-medium">{toast.message}</p>
            <button
              type="button"
              onClick={() => onDismiss(toast.id)}
              aria-label="Fechar aviso"
              className="shrink-0 opacity-60 transition-opacity hover:opacity-100"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        )
      })}
    </div>
  )
}

export function useToast(): IToastContextValue {
  const context = useContext(ToastContext)
  if (!context) {
    throw new Error("useToast must be used inside ToastProvider")
  }
  return context
}