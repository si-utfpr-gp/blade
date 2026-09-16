import type { Edge } from "@xyflow/react"

export type ConnectorRole =
  | "loopStart" // 2 entradas: sequencial (cima) + repetição (lateral)
  | "decisionJoin" // 2 entradas laterais
  | "loopEnd" // 1 entrada lateral (ramo Falso)
  | "passThrough" // 1 entrada pelo topo — ligação simples entre partes distantes
  | "invalid"
  | "empty"

export const CONNECTOR_ROLE_LABEL: Record<ConnectorRole, string> = {
  loopStart: "Início de laço",
  decisionJoin: "Junção de decisão",
  loopEnd: "Fim de laço",
  passThrough: "Ligação de fluxo",
  invalid: "Combinação inválida",
  empty: "Sem conexões",
}

export function getConnectorRole(nodeId: string, edges: Edge[]): ConnectorRole {
  const incoming = edges.filter((edge) => edge.target === nodeId)

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
