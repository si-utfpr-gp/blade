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
  const incoming = edges.filter((e) => e.target === nodeId)

  const hasTop = incoming.some((e) => e.targetHandle === "top-in")
  const hasLeft = incoming.some((e) => e.targetHandle === "left-in")
  const hasRight = incoming.some((e) => e.targetHandle === "right-in")
  const lateralCount = [hasLeft, hasRight].filter(Boolean).length

  if (!hasTop && lateralCount === 0) return "empty"
  if (hasTop && lateralCount === 0) return "loopStart"
  if (!hasTop && lateralCount === 2) return "decisionJoin"
  if (hasTop && lateralCount === 1) return "loopEnd"
  return "invalid" // ex: topo + as duas laterais ao mesmo tempo
}

// Usado no momento da conexão: "se eu aceitar essa nova entrada, o resultado ainda faz sentido?"
export function wouldConnectorRoleBeValid(
  nodeId: string,
  edges: Edge[],
  incomingHandleId: string,
): boolean {
  const hypothetical: Edge[] = [
    ...edges,
    {
      id: "__preview__",
      source: "__preview__",
      target: nodeId,
      targetHandle: incomingHandleId,
    } as Edge,
  ]
  return getConnectorRole(nodeId, hypothetical) !== "invalid"
}
