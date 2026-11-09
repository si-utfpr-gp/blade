import type { Edge, Node } from "@xyflow/react"

export type ConnectorRole =
  | "loopStart" // 2 entradas: sequencial (cima) + repetição (lateral)
  | "decisionJoin" // 2 entradas laterais
  | "selectionJoin" // N entradas, todas vindas dos ramos da mesma escolha
  | "loopEnd" // 1 entrada lateral (ramo Falso)
  | "passThrough" // 1 entrada pelo topo — ligação simples entre partes distantes
  | "invalid"
  | "empty"

export const CONNECTOR_ROLE_LABEL: Record<ConnectorRole, string> = {
  loopStart: "Início de laço",
  decisionJoin: "Junção de decisão",
  selectionJoin: "Junção de escolha",
  loopEnd: "Fim de laço",
  passThrough: "Ligação de fluxo",
  invalid: "Combinação inválida",
  empty: "Sem conexões",
}

type RoleNode = Pick<Node, "id" | "type">

/**
 * Classifies a connector by the arrows reaching it. The selection join is the
 * only role that takes more than one arrow on the same side, so it needs the
 * nodes to tell whether every arrow comes from the branches of one selection.
 */
export function getConnectorRole(
  nodeId: string,
  edges: Edge[],
  nodes: RoleNode[] = [],
): ConnectorRole {
  const incoming = edges.filter((edge) => edge.target === nodeId)
  const role = roleByHandles(incoming)
  const repeatsHandle =
    new Set(incoming.map((edge) => edge.targetHandle)).size < incoming.length

  if (role !== "invalid" && !repeatsHandle) return role
  return comesFromOneSelection(incoming, edges, nodes) ? "selectionJoin" : role
}

function roleByHandles(incoming: Edge[]): ConnectorRole {
  const hasTop = incoming.some((edge) => edge.targetHandle === "top-in")
  const hasLeft = incoming.some((edge) => edge.targetHandle === "left-in")
  const hasRight = incoming.some((edge) => edge.targetHandle === "right-in")
  const lateralCount = [hasLeft, hasRight].filter(Boolean).length

  if (!hasTop && lateralCount === 0) return "empty"

  if (hasTop && lateralCount === 0) return "passThrough"

  if (hasTop && lateralCount === 1) return "loopStart"

  if (!hasTop && lateralCount === 1) return "loopEnd"

  if (!hasTop && lateralCount === 2) return "decisionJoin"

  return "invalid"
}

function comesFromOneSelection(
  incoming: Edge[],
  edges: Edge[],
  nodes: RoleNode[],
): boolean {
  if (incoming.length < 2) return false

  const selections = new Set(
    nodes.filter((node) => node.type === "selection").map((node) => node.id),
  )
  if (selections.size === 0) return false

  const [first, ...rest] = incoming.map((edge) =>
    selectionAncestors(edge.source, edges, selections),
  )
  return [...first].some((id) => rest.every((ancestors) => ancestors.has(id)))
}

/** Selections from which `start` can be reached, `start` included when it is one. */
function selectionAncestors(
  start: string,
  edges: Edge[],
  selections: Set<string>,
): Set<string> {
  const found = new Set<string>()
  const visited = new Set<string>([start])
  const queue = [start]

  while (queue.length > 0) {
    const current = queue.shift()!
    if (selections.has(current)) found.add(current)
    for (const edge of edges) {
      if (edge.target === current && !visited.has(edge.source)) {
        visited.add(edge.source)
        queue.push(edge.source)
      }
    }
  }

  return found
}
