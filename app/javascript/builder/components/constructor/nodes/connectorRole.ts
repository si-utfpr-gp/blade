import type { Edge } from "@xyflow/react"

export type ConnectorRole =
  | "loopStart"
  | "decisionJoin"
  | "loopEnd"
  | "invalid"
  | "empty"

export const CONNECTOR_ROLE_LABEL: Record<ConnectorRole, string> = {
  loopStart: "Início de laço",
  decisionJoin: "Fechamento de decisão",
  loopEnd: "Fim de laço",
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
  if (hasTop && lateralCount === 0) return "loopStart"
  if (!hasTop && lateralCount === 2) return "decisionJoin"
  if (hasTop && lateralCount === 1) return "loopEnd"

  return "invalid"
}
