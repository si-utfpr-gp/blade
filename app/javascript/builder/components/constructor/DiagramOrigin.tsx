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

interface IDiagramOriginContextValue {
  origin: DiagramOrigin
  // Examples ship with the app and must not be edited or saved; the student's
  // own algorithms and a blank canvas are both fully editable.
  isReadOnly: boolean
  markBlank: () => void
  markExample: (id: string) => void
  markSaved: (id: number) => void
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

  const value = useMemo<IDiagramOriginContextValue>(
    () => ({
      origin,
      isReadOnly: origin.kind === "example",
      markBlank,
      markExample,
      markSaved,
    }),
    [origin, markBlank, markExample, markSaved],
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