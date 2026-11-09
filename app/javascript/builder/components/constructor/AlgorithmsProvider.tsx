import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react"
import { csrfToken } from "../../lib/csrf"
import type { SerializedDiagram } from "./serializeDiagram"

export interface SavedAlgorithm {
  id: number
  name: string
  diagram: SerializedDiagram
  created_at: string
  // Set while the algorithm has a public link; null when it is private.
  share_token?: string | null
}

export type AlgorithmsStatus = "idle" | "loading" | "saving" | "deleting" | "error"

// The reason a write failed travels with the result: reading it back from the
// provider state inside the caller is too late, React has not re-rendered yet.
export type WriteResult =
  | { ok: true; algorithm: SavedAlgorithm }
  | { ok: false; message: string }

interface IAlgorithmsContextValue {
  algorithms: SavedAlgorithm[]
  // Lets the sidebar hide the whole section instead of showing an empty list
  // that would only invite a visitor to sign in.
  signedIn: boolean
  status: AlgorithmsStatus
  error: string | null
  // Only why the list itself did not load; a failed save is told by its caller.
  loadError: string | null
  loadAlgorithms: () => Promise<void>
  saveAlgorithm: (name: string, diagram: SerializedDiagram) => Promise<WriteResult>
  updateAlgorithm: (id: number, name: string, diagram: SerializedDiagram) => Promise<WriteResult>
  deleteAlgorithm: (id: number) => Promise<boolean>
  getAlgorithm: (id: number) => Promise<SavedAlgorithm | null>
}

const AlgorithmsContext = createContext<IAlgorithmsContextValue | null>(null)

const OFFLINE_MESSAGE =
  "Sem conexão com o servidor. Verifique a internet e tente de novo."

// fetch throws a TypeError, in the browser's own words, when the request
// never reached the server; anything else already carries our message.
function failureMessage(cause: unknown, fallback: string): string {
  if (cause instanceof TypeError) return OFFLINE_MESSAGE
  return cause instanceof Error ? cause.message : fallback
}

async function readErrors(response: Response): Promise<string> {
  try {
    const body = await response.json()
    if (Array.isArray(body?.errors) && body.errors.length > 0) {
      return body.errors.join(" ")
    }
    if (typeof body?.error === "string") return body.error
  } catch {
    // fall through to the generic message below
  }
  return `Falha na requisição (${response.status}).`
}

export function AlgorithmsProvider({
  children,
  signedIn = false,
}: {
  children: ReactNode
  signedIn?: boolean
}) {
  const [algorithms, setAlgorithms] = useState<SavedAlgorithm[]>([])
  const [status, setStatus] = useState<AlgorithmsStatus>("idle")
  const [error, setError] = useState<string | null>(null)
  const [loadError, setLoadError] = useState<string | null>(null)

  const fetchAlgorithms = useCallback(async () => {
    try {
      const response = await fetch("/algorithms", {
        method: "GET",
        headers: { Accept: "application/json" },
      })
      if (!response.ok) throw new Error(await readErrors(response))
      setAlgorithms((await response.json()) as SavedAlgorithm[])
      setError(null)
      setLoadError(null)
      setStatus("idle")
    } catch (cause) {
      const message = failureMessage(cause, "Falha ao carregar.")
      setError(message)
      setLoadError(message)
      setStatus("error")
    }
  }, [])

  const loadAlgorithms = useCallback(async () => {
    setStatus("loading")
    setError(null)
    await fetchAlgorithms()
  }, [fetchAlgorithms])

  const saveAlgorithm = useCallback(
    async (name: string, diagram: SerializedDiagram) => {
      setStatus("saving")
      setError(null)
      try {
        const response = await fetch("/algorithms", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
            "X-CSRF-Token": csrfToken(),
          },
          body: JSON.stringify({ name, diagram }),
        })
        if (!response.ok) throw new Error(await readErrors(response))
        const saved = (await response.json()) as SavedAlgorithm
        setAlgorithms((current) => [
          saved,
          ...current.filter((item) => item.id !== saved.id),
        ])
        setStatus("idle")
        return { ok: true, algorithm: saved }
      } catch (cause) {
        const message =
          failureMessage(cause, "Falha ao salvar.")
        setError(message)
        setStatus("error")
        return { ok: false, message }
      }
    },
    [],
  )

  const updateAlgorithm = useCallback(
    async (id: number, name: string, diagram: SerializedDiagram) => {
      setStatus("saving")
      setError(null)
      try {
        const response = await fetch(`/algorithms/${id}`, {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
            "X-CSRF-Token": csrfToken(),
          },
          body: JSON.stringify({ name, diagram }),
        })
        if (!response.ok) throw new Error(await readErrors(response))
        const updated = (await response.json()) as SavedAlgorithm
        setAlgorithms((current) =>
          current.map((item) => (item.id === id ? updated : item)),
        )
        setStatus("idle")
        return { ok: true, algorithm: updated }
      } catch (cause) {
        const message =
          failureMessage(cause, "Falha ao atualizar.")
        setError(message)
        setStatus("error")
        return { ok: false, message }
      }
    },
    [],
  )

  const deleteAlgorithm = useCallback(async (id: number) => {
    setStatus("deleting")
    setError(null)
    try {
      const response = await fetch(`/algorithms/${id}`, {
        method: "DELETE",
        headers: { Accept: "application/json", "X-CSRF-Token": csrfToken() },
      })
      if (!response.ok) throw new Error(await readErrors(response))
      setAlgorithms((current) => current.filter((item) => item.id !== id))
      setStatus("idle")
      return true
    } catch (cause) {
      setError(failureMessage(cause, "Falha ao excluir."))
      setStatus("error")
      return false
    }
  }, [])

  const getAlgorithm = useCallback(async (id: number) => {
    try {
      const response = await fetch(`/algorithms/${id}`, {
        method: "GET",
        headers: { Accept: "application/json" },
      })
      if (!response.ok) return null
      return (await response.json()) as SavedAlgorithm
    } catch {
      return null
    }
  }, [])

  useEffect(() => {
    // Without an account there is nothing to list, and asking anyway would
    // only earn a 401 and an error toast on a page that works for a visitor.
    if (!signedIn) return

    // Data fetching on mount. Every setState inside fetchAlgorithms runs after
    // an awaited response, so no render is cascaded synchronously here.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void fetchAlgorithms()
  }, [fetchAlgorithms, signedIn])

  const value = useMemo<IAlgorithmsContextValue>(
    () => ({
      algorithms: signedIn ? algorithms : [],
      signedIn,
      status,
      error,
      loadError,
      loadAlgorithms,
      saveAlgorithm,
      updateAlgorithm,
      deleteAlgorithm,
      getAlgorithm,
    }),
    [
      algorithms,
      signedIn,
      status,
      error,
      loadError,
      loadAlgorithms,
      saveAlgorithm,
      updateAlgorithm,
      deleteAlgorithm,
      getAlgorithm,
    ],
  )

  return (
    <AlgorithmsContext.Provider value={value}>
      {children}
    </AlgorithmsContext.Provider>
  )
}

export function useAlgorithms(): IAlgorithmsContextValue {
  const context = useContext(AlgorithmsContext)
  if (!context) {
    throw new Error("useAlgorithms must be used inside AlgorithmsProvider")
  }
  return context
}