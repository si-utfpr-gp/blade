import type { AlgorithmNode } from "./ConstructorProvider"

export type PlannedCenters = Map<string, { x: number; y: number }>

/**
 * Moves each measured block so its centre lands on the one planned for it.
 *
 * A generated layout can only estimate how big a block renders, and an
 * estimate a few pixels off is enough to bend the arrow between two blocks of
 * the same column. Blocks without a planned centre, or not measured yet, keep
 * their position.
 */
export function recenterOnMeasuredSize(
  nodes: AlgorithmNode[],
  centers: PlannedCenters,
): AlgorithmNode[] {
  return nodes.map((node) => {
    const center = centers.get(node.id)
    const width = node.measured?.width
    const height = node.measured?.height
    if (!center || !width || !height) return node
    return {
      ...node,
      position: { x: Math.round(center.x - width / 2), y: Math.round(center.y - height / 2) },
    }
  })
}
