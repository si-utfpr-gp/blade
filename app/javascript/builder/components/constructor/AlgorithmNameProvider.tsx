import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react"

interface IAlgorithmNameContextValue {
  algorithmName: string
  setAlgorithmName: (name: string) => void
}

const AlgorithmNameContext = createContext<IAlgorithmNameContextValue | null>(
  null,
)

// The name is edited in the header but consumed by the save button in the
// canvas, so it needs to be shared rather than owned by either component.
export function AlgorithmNameProvider({ children }: { children: ReactNode }) {
  const [algorithmName, setAlgorithmName] = useState("")

  const value = useMemo<IAlgorithmNameContextValue>(
    () => ({ algorithmName, setAlgorithmName }),
    [algorithmName],
  )

  return (
    <AlgorithmNameContext.Provider value={value}>
      {children}
    </AlgorithmNameContext.Provider>
  )
}

export function useAlgorithmName(): IAlgorithmNameContextValue {
  const context = useContext(AlgorithmNameContext)
  if (!context) {
    throw new Error(
      "useAlgorithmName must be used inside AlgorithmNameProvider",
    )
  }
  return context
}

export function useSetAlgorithmName(): (name: string) => void {
  return useAlgorithmName().setAlgorithmName
}

export const ALGORITHM_NAME_MAX_LENGTH = 50

export function useAlgorithmNameField(): {
  algorithmName: string
  onAlgorithmNameChange: (name: string) => void
  clearAlgorithmName: () => void
} {
  const { algorithmName, setAlgorithmName } = useAlgorithmName()

  const onAlgorithmNameChange = useCallback(
    (name: string) => setAlgorithmName(name),
    [setAlgorithmName],
  )

  const clearAlgorithmName = useCallback(() => setAlgorithmName(""), [
    setAlgorithmName,
  ])

  return { algorithmName, onAlgorithmNameChange, clearAlgorithmName }
}