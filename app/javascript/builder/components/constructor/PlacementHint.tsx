import { useBlockPlacement } from "./BlockPlacement"
import { getBlockDisplayName } from "../blocks/blockDefinitions"

/**
 * Tells the user where to tap after picking a block. Without it the armed tile
 * looks selected and the next tap on the canvas is a surprise.
 */
export function PlacementHint() {
  const { pendingBlock } = useBlockPlacement()

  if (!pendingBlock) return null

  return (
    <div
      role="status"
      // Save and run already sit at top-3, one on each side. Centred up there
      // the hint ended up behind them once the canvas got narrow, so below md
      // it moves to the bottom where there is nothing in the way.
      className="pointer-events-none absolute left-1/2 top-3 z-10 max-w-[calc(100%-2rem)] -translate-x-1/2 rounded-full border border-primary/40 bg-card/95 px-3 py-1 text-center text-xs font-medium text-primary shadow-md backdrop-blur max-md:top-auto max-md:bottom-4"
    >
      Toque no canvas para posicionar{" "}
      <strong>
        {getBlockDisplayName(pendingBlock.type, pendingBlock.variant)}
      </strong>{" "}
      · Esc cancela
    </div>
  )
}