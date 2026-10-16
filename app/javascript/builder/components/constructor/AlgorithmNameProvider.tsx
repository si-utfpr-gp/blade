import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react"

import { useDiagramOrigin } from "./DiagramOrigin"

interface IAlgorithmNameContextValue {
  algorithmName: string
  setAlgorithmName: (name: string) => void
  isNameMissing: boolean
  setIsNameMissing: (missing: boolean) => void
}

const AlgorithmNameContext = createContext<IAlgorithmNameContextValue | null>(
  null,
)

// The name is edited in the header but consumed by the save button in the
// canvas, so it needs to be shared rather than owned by either component.
export function AlgorithmNameProvider({ children }: { children: ReactNode }) {
  const [algorithmName, setAlgorithmName] = useState("")
  // Raised when saving was attempted without a name, so the header field can
  // point at itself. Typing clears it: the student has started fixing it.
  const [isNameMissing, setIsNameMissing] = useState(false)

  const value = useMemo<IAlgorithmNameContextValue>(
    () => ({ algorithmName, setAlgorithmName, isNameMissing, setIsNameMissing }),
    [algorithmName, isNameMissing],
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
  isNameLocked: boolean
  isNameMissing: boolean
  flagMissingName: () => void
} {
  const { algorithmName, setAlgorithmName, isNameMissing, setIsNameMissing } =
    useAlgorithmName()
  const { isReadOnly } = useDiagramOrigin()

  const onAlgorithmNameChange = useCallback(
    (name: string) => {
      setAlgorithmName(name)
      if (name.trim()) setIsNameMissing(false)
    },
    [setAlgorithmName, setIsNameMissing],
  )

  const clearAlgorithmName = useCallback(() => {
    setAlgorithmName("")
    setIsNameMissing(false)
  }, [setAlgorithmName, setIsNameMissing])

  return {
    algorithmName,
    onAlgorithmNameChange,
    clearAlgorithmName,
    isNameLocked: isReadOnly,
    isNameMissing,
    flagMissingName: () => setIsNameMissing(true),
  }
}