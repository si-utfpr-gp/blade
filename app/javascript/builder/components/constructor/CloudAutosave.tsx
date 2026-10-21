import { useEffect, useRef, useState } from "react"
import { Check, Cloud } from "lucide-react"
import { useConstructor } from "./ConstructorProvider"
import { useAlgorithms } from "./AlgorithmsProvider"
import { useDiagramOrigin } from "./DiagramOrigin"
import { useAlgorithmNameField } from "./AlgorithmNameProvider"
import { serializeDiagramForSave } from "./serializeDiagram"
import { useToast } from "../ui/Toast"

// Long enough that typing a name does not save every letter.
export const AUTOSAVE_DELAY_MS = 1500
const SAVED_NOTICE_MS = 2500

/**
 * Signed in, a new algorithm reaches the account on its own as soon as it
 * has a name, and every later change to it follows, so work that only lived
 * on screen is not lost to a closed tab. Examples, shared diagrams and files
 * on this machine are left alone: the student chose where those live. A
 * refusal, such as a name already taken, is said once and not retried until
 * the name or the diagram changes.
 */
export function CloudAutosave() {
  const { nodes, edges, isDirty, markClean } = useConstructor()
  const { signedIn, algorithms, saveAlgorithm, updateAlgorithm } = useAlgorithms()
  const { origin, markSaved } = useDiagramOrigin()
  const { algorithmName } = useAlgorithmNameField()
  const { notify } = useToast()
  const [status, setStatus] = useState<"idle" | "saving" | "saved">("idle")
  const refused = useRef<string | null>(null)

  const name = algorithmName.trim()
  const record = origin.kind === "saved" ? algorithms.find((item) => item.id === origin.id) : undefined
  const pending =
    signedIn &&
    name !== "" &&
    status !== "saving" &&
    (origin.kind === "blank" || (origin.kind === "saved" && (isDirty || (record !== undefined && record.name !== name))))
  const diagram = serializeDiagramForSave(nodes, edges)
  const attempt = `${origin.kind === "saved" ? origin.id : "new"}|${name}|${JSON.stringify(diagram)}`

  useEffect(() => {
    if (!pending || refused.current === attempt) return

    const timer = setTimeout(async () => {
      setStatus("saving")
      const result =
        origin.kind === "saved" ? await updateAlgorithm(origin.id, name, diagram) : await saveAlgorithm(name, diagram)
      if (!result.ok) {
        refused.current = attempt
        setStatus("idle")
        notify(result.message, "error")
        return
      }
      refused.current = null
      if (origin.kind !== "saved") markSaved(result.algorithm.id)
      // The callback from when this save began, so it marks what was sent as
      // clean, and an edit made meanwhile still counts as unsaved.
      markClean()
      setStatus("saved")
    }, AUTOSAVE_DELAY_MS)

    return () => clearTimeout(timer)
    // `attempt` stands for the name and the diagram.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pending, attempt])

  useEffect(() => {
    if (status !== "saved") return
    const timer = setTimeout(() => setStatus("idle"), SAVED_NOTICE_MS)
    return () => clearTimeout(timer)
  }, [status])

  return (
    <div
      role="status"
      className={`pointer-events-none absolute left-1/2 top-3 z-10 -translate-x-1/2 transition-opacity duration-300 ${
        status === "idle" ? "opacity-0" : "opacity-100"
      }`}
    >
      {status !== "idle" && (
        <span className="flex items-center gap-1.5 rounded-full border border-border bg-card/95 px-2.5 py-1 text-xs font-medium text-muted-foreground shadow-sm backdrop-blur">
          {status === "saving" ? (
            <Cloud className="h-3.5 w-3.5 animate-pulse text-primary" aria-hidden="true" />
          ) : (
            <Check className="h-3.5 w-3.5 text-primary" aria-hidden="true" />
          )}
          {status === "saving" ? "Salvando na nuvem…" : "Salvo na nuvem"}
        </span>
      )}
    </div>
  )
}
