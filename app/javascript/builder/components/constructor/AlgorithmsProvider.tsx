import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react"
import type { SerializedDiagram } from "./serializeDiagram"

export interface SavedAlgorithm {
  id: number
  name: string
  diagram: SerializedDiagram
  created_at: string
}

export type AlgorithmsStatus = "idle" | "loading" | "saving" | "deleting" | "error"

interface IAlgorithmsContextValue {
  algorithms: SavedAlgorithm[]
  status: AlgorithmsStatus
  error: string | null
  loadAlgorithms: () => Promise<void>
  saveAlgorithm: (name: string, diagram: SerializedDiagram) => Promise<SavedAlgorithm | null>
  deleteAlgorithm: (id: number) => Promise<boolean>
  getAlgorithm: (id: number) => Promise<SavedAlgorithm | null>
}

const AlgorithmsContext = createContext<IAlgorithmsContextValue | null>(null)

function csrfToken(): string {
  return (
    document.querySelector<HTMLMetaElement>('meta[name="csrf-token"]')
      ?.content ?? ""
  )
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

export function AlgorithmsProvider({ children }: { children: ReactNode }) {
  const [algorithms, setAlgorithms] = useState<SavedAlgorithm[]>([])
  const [status, setStatus] = useState<AlgorithmsStatus>("idle")
  const [error, setError] = useState<string | null>(null)

  const loadAlgorithms = useCallback(async () => {
    setStatus("loading")
    setError(null)
    try {
      const response = await fetch("/algorithms", {
        method: "GET",
        headers: { Accept: "application/json" },
      })
      if (!response.ok) throw new Error(await readErrors(response))
      setAlgorithms((await response.json()) as SavedAlgorithm[])
      setStatus("idle")
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Falha ao carregar.")
      setStatus("error")
    }
  }, [])

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
        return saved
      } catch (cause) {
        setError(cause instanceof Error ? cause.message : "Falha ao salvar.")
        setStatus("error")
        return null
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
      setError(cause instanceof Error ? cause.message : "Falha ao excluir.")
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
    void loadAlgorithms()
  }, [loadAlgorithms])

  const value = useMemo<IAlgorithmsContextValue>(
    () => ({
      algorithms,
      status,
      error,
      loadAlgorithms,
      saveAlgorithm,
      deleteAlgorithm,
      getAlgorithm,
    }),
    [
      algorithms,
      status,
      error,
      loadAlgorithms,
      saveAlgorithm,
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