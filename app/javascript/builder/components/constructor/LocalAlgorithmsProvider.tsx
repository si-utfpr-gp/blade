import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react"
import { useToast } from "../ui/Toast"
import type { SerializedDiagram } from "./serializeDiagram"
import {
  readLocalAlgorithms,
  removeLocalAlgorithm,
  saveLocalAlgorithm,
  updateLocalAlgorithm,
  type LocalAlgorithm,
  type LocalStorageFailure,
} from "./localAlgorithms"

interface ILocalAlgorithmsContextValue {
  algorithms: LocalAlgorithm[]
  // The stored file, or null when the browser refused it.
  // `quiet` leaves the success message to the caller, as the import does.
  saveDiagram: (
    name: string,
    diagram: SerializedDiagram,
    options?: { quiet?: boolean },
  ) => LocalAlgorithm | null
  // Saving over a file and renaming one keep its id, so the canvas still
  // points at it.
  updateAlgorithm: (id: string, name: string, diagram: SerializedDiagram) => boolean
  renameAlgorithm: (id: string, name: string) => boolean
  deleteAlgorithm: (id: string) => boolean
  getAlgorithm: (id: string) => LocalAlgorithm | undefined
}

const LocalAlgorithmsContext = createContext<ILocalAlgorithmsContextValue | null>(
  null,
)

/**
 * Algorithms kept in the browser, for students without an account. They are
 * not on any server and do not follow the student to another computer, which
 * the sidebar says out loud rather than letting them find out later.
 */
export function LocalAlgorithmsProvider({ children }: { children: ReactNode }) {
  // Read once on mount rather than in an effect: the list the student sees on
  // the first paint is already the one in storage. A store that cannot be read
  // is not announced here, because an empty "Meus arquivos" on load would be
  // alarming over something the student has not tried yet; the reason is given
  // when a write fails, which is the moment it can be acted on.
  const [algorithms, setAlgorithms] = useState<LocalAlgorithm[]>(() => {
    const stored = readLocalAlgorithms()
    return stored.ok ? stored.value : []
  })
  const { notify } = useToast()

  const saveDiagram = useCallback(
    (name: string, diagram: SerializedDiagram, options?: { quiet?: boolean }) => {
      const result = saveLocalAlgorithm(name, diagram)

      if (!result.ok) {
        notify(failureMessage(result.reason), "error")
        return null
      }

      setAlgorithms((current) => [ result.value, ...current ])
      if (!options?.quiet) notify(`Algoritmo "${name}" guardado neste navegador.`, "success")
      return result.value
    },
    [notify],
  )

  const rewrite = useCallback(
    (id: string, changes: { name: string; diagram?: SerializedDiagram }) => {
      const result = updateLocalAlgorithm(id, changes)
      if (!result.ok) {
        notify(failureMessage(result.reason), "error")
        return false
      }
      setAlgorithms((current) => current.map((item) => (item.id === id ? result.value : item)))
      return true
    },
    [notify],
  )

  const updateAlgorithm = useCallback(
    (id: string, name: string, diagram: SerializedDiagram) => {
      const updated = rewrite(id, { name, diagram })
      if (updated) notify(`Algoritmo "${name}" atualizado neste navegador.`, "success")
      return updated
    },
    [rewrite, notify],
  )

  const renameAlgorithm = useCallback(
    (id: string, name: string) => rewrite(id, { name }),
    [rewrite],
  )

  const deleteAlgorithm = useCallback(
    (id: string) => {
      const result = removeLocalAlgorithm(id)

      if (!result.ok) {
        notify(STORAGE_BLOCKED_MESSAGE, "error")
        return false
      }

      setAlgorithms((current) => current.filter((item) => item.id !== id))
      return true
    },
    [notify],
  )

  const getAlgorithm = useCallback(
    (id: string) => algorithms.find((item) => item.id === id),
    [algorithms],
  )

  const value = useMemo<ILocalAlgorithmsContextValue>(
    () => ({ algorithms, saveDiagram, updateAlgorithm, renameAlgorithm, deleteAlgorithm, getAlgorithm }),
    [algorithms, saveDiagram, updateAlgorithm, renameAlgorithm, deleteAlgorithm, getAlgorithm],
  )

  return (
    <LocalAlgorithmsContext.Provider value={value}>
      {children}
    </LocalAlgorithmsContext.Provider>
  )
}

const STORAGE_BLOCKED_MESSAGE =
  "Não foi possível usar o armazenamento deste navegador, então o algoritmo não ficou guardado."
const STORAGE_FULL_MESSAGE =
  "O armazenamento do navegador está cheio. Exclua um algoritmo guardado para liberar espaço."
const STORAGE_MISSING_MESSAGE =
  "Esse arquivo não está mais guardado neste navegador; ele pode ter sido excluído em outra aba."

function failureMessage(reason: LocalStorageFailure): string {
  if (reason === "quota") return STORAGE_FULL_MESSAGE
  if (reason === "missing") return STORAGE_MISSING_MESSAGE
  return STORAGE_BLOCKED_MESSAGE
}

export function useLocalAlgorithms(): ILocalAlgorithmsContextValue {
  const context = useContext(LocalAlgorithmsContext)
  if (!context) {
    throw new Error(
      "useLocalAlgorithms must be used inside LocalAlgorithmsProvider",
    )
  }
  return context
}