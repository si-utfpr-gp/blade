type FlowEdge = { id: string; source: string; target: string }
type Rect = { x: number; y: number; width: number; height: number }

// How far the arrow drops below the last block before turning, and how far
// it keeps from the body on its way up.
const DROP = 20
const LANE_GAP = 30

/**
 * The blocks inside the loop that `back` closes: reachable from its target
 * (the connector above the condition) and able to reach its source. Empty
 * when the arrow does not close a loop.
 */
export function loopBodyIds(back: FlowEdge, edges: FlowEdge[]): Set<string> {
  const others = edges.filter((edge) => edge.id !== back.id)
  const fromHeader = reach(back.target, others, "forward")
  if (!fromHeader.has(back.source)) return new Set()
  // A loop is entered only through its connector. The end of an if inside a
  // loop is reachable around that loop, but the flow gets to its branches
  // without passing through it, so it closes nothing.
  if (reachAvoiding(back.target, edges).has(back.source)) return new Set()

  const toLatch = reach(back.source, others, "backward")
  return new Set([...fromHeader].filter((id) => toLatch.has(id)))
}

/** What the flow reaches from the blocks nothing points to, never passing through `blocked`. */
function reachAvoiding(blocked: string, edges: FlowEdge[]): Set<string> {
  const targets = new Set(edges.map((edge) => edge.target))
  const roots = edges.map((edge) => edge.source).filter((id) => !targets.has(id) && id !== blocked)
  return reach(roots, edges.filter((edge) => edge.source !== blocked && edge.target !== blocked), "forward")
}

function reach(start: string | string[], edges: FlowEdge[], direction: "forward" | "backward"): Set<string> {
  const seen = new Set(typeof start === "string" ? [start] : start)
  const queue = [...seen]
  while (queue.length > 0) {
    const current = queue.shift()!
    for (const edge of edges) {
      const [from, to] = direction === "forward" ? [edge.source, edge.target] : [edge.target, edge.source]
      if (from === current && !seen.has(to)) {
        seen.add(to)
        queue.push(to)
      }
    }
  }
  return seen
}

/** The x of the vertical run, clear of every block of the body on that side. */
export function loopReturnLaneX(side: "left" | "right", body: Rect[]): number {
  return side === "right"
    ? Math.max(...body.map((rect) => rect.x + rect.width)) + LANE_GAP
    : Math.min(...body.map((rect) => rect.x)) - LANE_GAP
}

/**
 * Down from the last block, across to the lane, up beside the body and into
 * the side of the connector. An arrow leaving the side of a condition, as in
 * a do-while, goes straight across instead of dropping first. Returns the
 * path and where its label sits, as React Flow's path helpers do.
 */
export function loopReturnPath({
  sourceX,
  sourceY,
  targetX,
  targetY,
  laneX,
  fromSide = false,
}: {
  sourceX: number
  sourceY: number
  targetX: number
  targetY: number
  laneX: number
  fromSide?: boolean
}): [path: string, labelX: number, labelY: number] {
  const turnY = fromSide ? sourceY : sourceY + DROP
  const path = [
    `M ${sourceX},${sourceY}`,
    ...(fromSide ? [] : [`L ${sourceX},${turnY}`]),
    `L ${laneX},${turnY}`,
    `L ${laneX},${targetY}`,
    `L ${targetX},${targetY}`,
  ].join(" ")
  return [path, laneX, (turnY + targetY) / 2]
}
