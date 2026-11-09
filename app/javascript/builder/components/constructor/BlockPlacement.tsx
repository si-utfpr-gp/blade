import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
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

/** Places a block at a screen point; false when the point is off the canvas. */
export type DropAtScreen = (point: { x: number; y: number }, block: IPendingBlock) => boolean

interface IBlockPlacementContextValue {
  pendingBlock: IPendingBlock | null
  arm: (type: BlockType, variant?: "start" | "end") => void
  cancel: () => void
  // A finger drag ends outside React Flow's reach, in the blocks menu's own
  // handlers; the canvas registers how to turn that point into a block.
  dropAt: DropAtScreen
  registerDropTarget: (target: DropAtScreen | null) => void
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

  const dropTarget = useRef<DropAtScreen | null>(null)
  const registerDropTarget = useCallback((target: DropAtScreen | null) => {
    dropTarget.current = target
  }, [])
  const dropAt = useCallback<DropAtScreen>(
    (point, block) => dropTarget.current?.(point, block) ?? false,
    [],
  )

  const value = useMemo(
    () => ({ pendingBlock, arm, cancel, dropAt, registerDropTarget }),
    [pendingBlock, arm, cancel, dropAt, registerDropTarget],
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