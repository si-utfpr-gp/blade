import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react"

// Where the diagram currently on the canvas came from. The origin decides
// whether the canvas is editable and whether saving creates a new record or
// updates an existing one.
export type DiagramOrigin =
  | { kind: "blank" }
  | { kind: "example"; id: string }
  | { kind: "saved"; id: number }
  // Kept in the browser rather than on a server. Saving one onto an account
  // moves it, which is why the id is a string.
  | { kind: "local"; id: string }
  // Opened from a public link: someone else's algorithm, read only.
  | { kind: "shared" }

interface IDiagramOriginContextValue {
  origin: DiagramOrigin
  // Examples ship with the app and must not be edited or saved; the student's
  // own algorithms and a blank canvas are both fully editable.
  isReadOnly: boolean
  markBlank: () => void
  markExample: (id: string) => void
  markSaved: (id: number) => void
  markLocal: (id: string) => void
  markShared: () => void
}

const DiagramOriginContext = createContext<IDiagramOriginContextValue | null>(
  null,
)

export function DiagramOriginProvider({ children }: { children: ReactNode }) {
  const [origin, setOrigin] = useState<DiagramOrigin>({ kind: "blank" })

  const markBlank = useCallback(() => setOrigin({ kind: "blank" }), [])
  const markExample = useCallback(
    (id: string) => setOrigin({ kind: "example", id }),
    [],
  )
  const markSaved = useCallback(
    (id: number) => setOrigin({ kind: "saved", id }),
    [],
  )
  const markLocal = useCallback(
    (id: string) => setOrigin({ kind: "local", id }),
    [],
  )
  const markShared = useCallback(() => setOrigin({ kind: "shared" }), [])

  const value = useMemo<IDiagramOriginContextValue>(
    () => ({
      origin,
      isReadOnly: origin.kind === "example" || origin.kind === "shared",
      markBlank,
      markExample,
      markSaved,
      markLocal,
      markShared,
    }),
    [origin, markBlank, markExample, markSaved, markLocal, markShared],
  )

  return (
    <DiagramOriginContext.Provider value={value}>
      {children}
    </DiagramOriginContext.Provider>
  )
}

export function useDiagramOrigin(): IDiagramOriginContextValue {
  const context = useContext(DiagramOriginContext)
  if (!context) {
    throw new Error("useDiagramOrigin must be used inside DiagramOriginProvider")
  }
  return context
}