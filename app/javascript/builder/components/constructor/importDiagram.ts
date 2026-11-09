import { isBlockType, type BlockType } from "../blocks/blockDefinitions"

export interface ImportedNode {
  id: string
  type: BlockType
  position: { x: number; y: number }
  data: { label: string; [key: string]: unknown }
}

export interface ImportedEdge {
  id: string
  source: string
  target: string
  sourceHandle?: string
  targetHandle?: string
  label?: string
}

export interface ImportedDiagram {
  nodes: ImportedNode[]
  edges: ImportedEdge[]
}

export type ImportResult =
  // `positioned` is false when any block came without a position: the file
  // describes the diagram but not its drawing, and the canvas lays it out.
  | { ok: true; diagram: ImportedDiagram; positioned: boolean }
  | { ok: false; reason: string }

/**
 * Validates a diagram file before it replaces the canvas. The file comes from
 * outside the app, so nothing about its shape can be trusted: every field is
 * checked, unknown block types are dropped rather than rendered into a
 * broken canvas, and edges pointing at blocks that are not there go with
 * them.
 *
 * Lenient where it is safe to be: a missing position falls back to the
 * origin and a missing label to an empty string, the same defaults the
 * canvas itself uses. Strict where it is not: a file with no usable block
 * in it is refused instead of wiping the canvas for nothing.
 */
export function parseImportedDiagram(input: unknown): ImportResult {
  if (input === null || typeof input !== "object" || Array.isArray(input)) {
    return fail()
  }

  const { nodes, edges } = input as { nodes?: unknown; edges?: unknown }
  if (!Array.isArray(nodes) || !Array.isArray(edges)) return fail()

  const keptNodes = nodes.flatMap(toImportedNode)
  if (keptNodes.length === 0) return fail()

  const ids = new Set(keptNodes.map((node) => node.id))
  const keptEdges = edges.flatMap((edge) =>
    toImportedEdge(edge, ids),
  )

  const positioned = nodes.every(
    (node) => node === null || typeof node !== "object" || hasPosition((node as { position?: unknown }).position),
  )
  return { ok: true, diagram: { nodes: keptNodes, edges: keptEdges }, positioned }
}

/**
 * Reads a diagram file picked by the student. A file that cannot be read or
 * parsed answers with the same shape as a file that fails validation, since
 * from the student's side all three are "this file did not open".
 */
export async function readImportedFile(file: File): Promise<ImportResult> {
  let text: string
  try {
    text = await file.text()
  } catch {
    return { ok: false, reason: "Não foi possível ler esse arquivo." }
  }

  let parsed: unknown
  try {
    parsed = JSON.parse(text)
  } catch {
    // Not JSON at all, so it cannot hold a diagram either.
    return parseImportedDiagram(undefined)
  }
  return parseImportedDiagram(parsed)
}

function fail(): ImportResult {
  return {
    ok: false,
    reason:
      "Esse arquivo não parece um algoritmo do Blade. Exporte um algoritmo para obter um arquivo válido.",
  }
}

function toImportedNode(input: unknown): ImportedNode[] {
  if (input === null || typeof input !== "object") return []
  const candidate = input as Record<string, unknown>

  if (typeof candidate.id !== "string" || candidate.id === "") return []
  if (typeof candidate.type !== "string" || !isBlockType(candidate.type)) {
    return []
  }

  return [
    {
      id: candidate.id,
      type: candidate.type,
      position: toPosition(candidate.position),
      data: toData(candidate.data),
    },
  ]
}

function hasPosition(input: unknown): boolean {
  if (input === null || typeof input !== "object") return false
  const { x, y } = input as { x?: unknown; y?: unknown }
  return typeof x === "number" && Number.isFinite(x) && typeof y === "number" && Number.isFinite(y)
}

function toPosition(input: unknown): { x: number; y: number } {
  if (input === null || typeof input !== "object") return { x: 0, y: 0 }
  const { x, y } = input as { x?: unknown; y?: unknown }
  return {
    x: typeof x === "number" && Number.isFinite(x) ? x : 0,
    y: typeof y === "number" && Number.isFinite(y) ? y : 0,
  }
}

function toData(input: unknown): { label: string; [key: string]: unknown } {
  const data =
    input !== null && typeof input === "object"
      ? { ...(input as Record<string, unknown>) }
      : {}
  // The canvas reads the label unconditionally, so it is always present.
  if (typeof data.label !== "string") data.label = ""
  return data as { label: string; [key: string]: unknown }
}

function toImportedEdge(
  input: unknown,
  ids: Set<string>,
): ImportedEdge[] {
  if (input === null || typeof input !== "object") return []
  const candidate = input as Record<string, unknown>

  if (typeof candidate.id !== "string" || candidate.id === "") return []
  if (typeof candidate.source !== "string" || !ids.has(candidate.source)) {
    return []
  }
  if (typeof candidate.target !== "string" || !ids.has(candidate.target)) {
    return []
  }

  const edge: ImportedEdge = {
    id: candidate.id,
    source: candidate.source,
    target: candidate.target,
  }
  if (typeof candidate.sourceHandle === "string") {
    edge.sourceHandle = candidate.sourceHandle
  }
  if (typeof candidate.targetHandle === "string") {
    edge.targetHandle = candidate.targetHandle
  }
  if (typeof candidate.label === "string") edge.label = candidate.label
  return [edge]
}
