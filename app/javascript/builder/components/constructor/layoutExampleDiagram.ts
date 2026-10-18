import type { IDiagramExample } from "../../interfaces/diagramExamples"
import { selectionCaseIndex } from "../blocks/blockCapabilities"

export interface PositionedExampleNode {
  id: string
  type: string
  data: Record<string, unknown>
  position: { x: number; y: number }
}

export interface PositionedExampleEdge {
  id: string
  source: string
  target: string
  sourceHandle?: string
  targetHandle?: string
  label?: string
}

export interface LaidOutExample {
  nodes: PositionedExampleNode[]
  edges: PositionedExampleEdge[]
}

type RawNode = IDiagramExample["diagram"]["nodes"][number]
type RawEdge = IDiagramExample["diagram"]["edges"][number]

const CENTER_X = 400
const LANE_WIDTH = 280
const ROW_GAP = 56
const MIN_GAP_X = 48

/**
 * Lays a bundled example out the way a flowchart is drawn by hand: the main
 * flow in one straight column, the true branch of a decision to the right and
 * the false one to the left, a loop body beside its condition with the exit
 * below the whole body, and the cases of a selection spread under it.
 *
 * Examples carry no geometry, so this runs every time one is opened.
 */
export function layoutExampleDiagram(example: IDiagramExample): LaidOutExample {
  const { nodes: rawNodes, edges: rawEdges } = example.diagram
  const nodeById = new Map(rawNodes.map((node) => [node.id, node]))
  const outgoing = new Map<string, RawEdge[]>()
  for (const edge of rawEdges) {
    outgoing.set(edge.source, [...(outgoing.get(edge.source) ?? []), edge])
  }

  const start =
    rawNodes.find((node) => node.type === "startEnd" && node.data.variant === "start") ??
    rawNodes[0]

  const backEdges = findBackEdges(start?.id, outgoing)
  const forward = rawEdges.filter((edge) => !backEdges.has(edge))
  const loopBodies = loopBodiesByHeader(backEdges, forward)

  // A loop's exit goes below its whole body: an extra ordering edge from the
  // block that closes the loop to wherever the flow leaves it.
  const ordering = forward.map((edge) => [edge.source, edge.target] as [string, string])
  for (const back of backEdges) {
    const body = loopBodies.get(back.target) ?? new Set<string>()
    for (const edge of forward) {
      if (body.has(edge.source) && !body.has(edge.target)) ordering.push([back.source, edge.target])
    }
  }

  const order = topologicalOrder(rawNodes, ordering, start?.id)
  const rowOf = longestPathRows(order, ordering)
  const columnOf = assignColumns(order, forward, nodeById, loopBodies)

  // Rows grow to their tallest block; each block is centred in its row and
  // on its column, so the arrows between them run straight.
  const rowCount = Math.max(0, ...rowOf.values()) + 1
  const rowHeight = new Array<number>(rowCount).fill(0)
  for (const node of rawNodes) {
    const row = rowOf.get(node.id) ?? 0
    rowHeight[row] = Math.max(rowHeight[row], estimatedSize(node).height)
  }
  const rowTop: number[] = []
  rowHeight.reduce((top, height, row) => {
    rowTop[row] = top
    return top + height + ROW_GAP
  }, 0)

  const placed = order.map((id) => {
    const raw = nodeById.get(id) as RawNode
    const { width, height } = estimatedSize(raw)
    const row = rowOf.get(id) ?? 0
    return {
      raw,
      row,
      width,
      left: CENTER_X + (columnOf.get(id) ?? 0) * LANE_WIDTH - width / 2,
      top: rowTop[row] + (rowHeight[row] - height) / 2,
    }
  })
  separateWithinRows(placed)

  const nodes: PositionedExampleNode[] = placed.map(({ raw, left, top }) => ({
    id: raw.id,
    type: raw.type,
    data: raw.data,
    position: { x: Math.round(left), y: Math.round(top) },
  }))

  const edges: PositionedExampleEdge[] = rawEdges.map((edge) => ({
    id: edge.id,
    source: edge.source,
    target: edge.target,
    ...(edge.sourceHandle !== undefined ? { sourceHandle: edge.sourceHandle } : {}),
    ...(edge.targetHandle !== undefined ? { targetHandle: edge.targetHandle } : {}),
    ...(edge.label !== undefined ? { label: edge.label } : {}),
  }))

  return { nodes, edges }
}

/** Size a block renders at, close enough to keep blocks apart. */
export function estimatedSize(node: RawNode): { width: number; height: number } {
  const label = String(node.data.label ?? "")
  switch (node.type) {
    case "startEnd":
      return { width: 140, height: 50 }
    case "memory":
      return { width: 330, height: 60 + 35 * ((node.data.rows as unknown[] | undefined)?.length ?? 1) }
    case "decision":
      return { width: 140, height: 100 }
    case "connector":
      return { width: 48, height: 48 }
    case "selection": {
      const cases = (node.data.cases as unknown[] | undefined)?.length ?? 0
      return { width: Math.max(160, (cases + 1) * 64), height: 130 }
    }
    default:
      return { width: Math.max(160, 40 + 8.5 * label.length), height: 50 }
  }
}

/** Edges that close a loop, found by a depth-first walk from the start. */
function findBackEdges(startId: string | undefined, outgoing: Map<string, RawEdge[]>): Set<RawEdge> {
  const back = new Set<RawEdge>()
  const state = new Map<string, "open" | "done">()
  const visit = (id: string) => {
    state.set(id, "open")
    for (const edge of outgoing.get(id) ?? []) {
      const seen = state.get(edge.target)
      if (seen === "open") back.add(edge)
      else if (!seen) visit(edge.target)
    }
    state.set(id, "done")
  }
  if (startId) visit(startId)
  for (const id of outgoing.keys()) if (!state.has(id)) visit(id)
  return back
}

/** For each loop header, the blocks between it and the edge that returns to it. */
function loopBodiesByHeader(backEdges: Set<RawEdge>, forward: RawEdge[]): Map<string, Set<string>> {
  const reaches = (from: string, to: string) => {
    const seen = new Set<string>()
    const stack = [from]
    while (stack.length) {
      const id = stack.pop() as string
      if (id === to) return true
      if (seen.has(id)) continue
      seen.add(id)
      for (const edge of forward) if (edge.source === id) stack.push(edge.target)
    }
    return false
  }

  const ids = new Set(forward.flatMap((edge) => [edge.source, edge.target]))
  const bodies = new Map<string, Set<string>>()
  for (const back of backEdges) {
    const body = bodies.get(back.target) ?? new Set<string>()
    for (const id of ids) {
      if (reaches(back.target, id) && reaches(id, back.source)) body.add(id)
    }
    body.add(back.source)
    bodies.set(back.target, body)
  }
  return bodies
}

/** Blocks in flow order, the start first; blocks out of reach come last. */
function topologicalOrder(rawNodes: RawNode[], ordering: [string, string][], startId?: string): string[] {
  const indegree = new Map(rawNodes.map((node) => [node.id, 0]))
  for (const [, target] of ordering) indegree.set(target, (indegree.get(target) ?? 0) + 1)

  const queue = rawNodes
    .filter((node) => (indegree.get(node.id) ?? 0) === 0)
    .sort((a, b) => (a.id === startId ? -1 : b.id === startId ? 1 : 0))
    .map((node) => node.id)
  const order: string[] = []
  while (queue.length) {
    const id = queue.shift() as string
    order.push(id)
    for (const [source, target] of ordering) {
      if (source !== id) continue
      const left = (indegree.get(target) ?? 0) - 1
      indegree.set(target, left)
      if (left === 0) queue.push(target)
    }
  }
  for (const node of rawNodes) if (!order.includes(node.id)) order.push(node.id)
  return order
}

function longestPathRows(order: string[], ordering: [string, string][]): Map<string, number> {
  const row = new Map(order.map((id) => [id, 0]))
  for (const id of order) {
    for (const [source, target] of ordering) {
      if (source === id) row.set(target, Math.max(row.get(target) ?? 0, (row.get(id) ?? 0) + 1))
    }
  }
  return row
}

/**
 * Columns in lanes, relative to the block a branch leaves from. A block with
 * several ways in (a join) sits between them.
 */
function assignColumns(
  order: string[],
  forward: RawEdge[],
  nodeById: Map<string, RawNode>,
  loopBodies: Map<string, Set<string>>,
): Map<string, number> {
  const candidates = new Map<string, number[]>()
  const column = new Map<string, number>()

  const loopBodyOf = (decisionId: string) => {
    for (const body of loopBodies.values()) if (body.has(decisionId)) return body
    return null
  }

  for (const id of order) {
    const options = candidates.get(id)
    column.set(id, options?.length ? options.reduce((sum, value) => sum + value, 0) / options.length : 0)
    const from = column.get(id) as number
    const node = nodeById.get(id)

    for (const edge of forward.filter((item) => item.source === id)) {
      let offset = 0
      if (node?.type === "decision") {
        // In a loop the branch that stays inside steps aside and the one that
        // leaves keeps the main column; elsewhere true goes right, false left.
        const body = loopBodyOf(id)
        if (body) offset = body.has(edge.target) ? 1 : 0
        else offset = edge.sourceHandle === "yes" ? 1 : edge.sourceHandle === "no" ? -1 : 0
      } else if (node?.type === "selection") {
        const cases = (node.data.cases as unknown[] | undefined)?.length ?? 0
        const caseIndex = selectionCaseIndex(edge.sourceHandle)
        const slot = caseIndex === null ? 0 : caseIndex + 1
        offset = slot - cases / 2
      }
      candidates.set(edge.target, [...(candidates.get(edge.target) ?? []), from + offset])
    }
  }
  return column
}

/** Pushes apart blocks that still touch within a row, keeping their order. */
function separateWithinRows(placed: { row: number; left: number; width: number }[]): void {
  const rows = new Map<number, typeof placed>()
  for (const item of placed) rows.set(item.row, [...(rows.get(item.row) ?? []), item])
  for (const items of rows.values()) {
    items.sort((a, b) => a.left - b.left)
    for (let i = 1; i < items.length; i++) {
      const previous = items[i - 1]
      const minimum = previous.left + previous.width + MIN_GAP_X
      if (items[i].left < minimum) items[i].left = minimum
    }
  }
}
