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
      className="pointer-events-none absolute left-1/2 top-3 z-10 -translate-x-1/2 rounded-full border border-primary/40 bg-card/95 px-3 py-1 text-xs font-medium text-primary shadow-md backdrop-blur"
    >
      Toque no canvas para posicionar{" "}
      <strong>
        {getBlockDisplayName(pendingBlock.type, pendingBlock.variant)}
      </strong>{" "}
      · Esc cancela
    </div>
  )
}