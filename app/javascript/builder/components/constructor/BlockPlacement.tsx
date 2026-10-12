import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react"

import type { BlockType } from "../blocks/blockDefinitions"

/**
 * Touch devices never fire HTML5 drag events, so a block is placed in two
 * steps: the first tap arms it, the second tap picks the point. The same path
 * serves desktop, where dragging still works alongside it.
 */
export interface IPendingBlock {
  type: BlockType
  variant?: "start" | "end"
}

interface IBlockPlacementContextValue {
  pendingBlock: IPendingBlock | null
  arm: (type: BlockType, variant?: "start" | "end") => void
  cancel: () => void
}

const BlockPlacementContext = createContext<IBlockPlacementContextValue | null>(
  null,
)

export function BlockPlacementProvider({ children }: { children: ReactNode }) {
  const [pendingBlock, setPendingBlock] = useState<IPendingBlock | null>(null)

  const arm = useCallback((type: BlockType, variant?: "start" | "end") => {
    setPendingBlock({ type, variant })
  }, [])

  const cancel = useCallback(() => setPendingBlock(null), [])

  const value = useMemo(
    () => ({ pendingBlock, arm, cancel }),
    [pendingBlock, arm, cancel],
  )

  return (
    <BlockPlacementContext.Provider value={value}>
      {children}
    </BlockPlacementContext.Provider>
  )
}

export function useBlockPlacement(): IBlockPlacementContextValue {
  const context = useContext(BlockPlacementContext)
  if (!context) {
    throw new Error(
      "useBlockPlacement must be used inside BlockPlacementProvider",
    )
  }
  return context
}