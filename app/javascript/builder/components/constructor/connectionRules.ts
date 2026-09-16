import type { Connection, Edge } from "@xyflow/react"
import type { AlgorithmNode } from "./ConstructorProvider"
import { getBlockCapabilities } from "../blocks/blockCapabilities"
import { getConnectorRole } from "./nodes/connectorRole"

export type ConnectionRejection =
  | "unknown-node"
  | "self-connection"
  | "source-handle-not-allowed"
  | "target-does-not-accept-incoming"
  | "target-handle-taken"
  | "invalid-connector-role"

export type ConnectionValidation =
  | { valid: true }
  | { valid: false; reason: ConnectionRejection }

export const CONNECTION_REJECTION_MESSAGE: Record<ConnectionRejection, string> =
  {
    "unknown-node": "Bloco de origem ou destino não encontrado.",
    "self-connection": "Um bloco não pode se conectar a si mesmo.",
    "source-handle-not-allowed":
      "Este bloco não permite uma saída a partir deste ponto.",
    "target-does-not-accept-incoming":
      "Este bloco não aceita conexões de entrada.",
    "target-handle-taken": "Este ponto de entrada já possui uma conexão.",
    "invalid-connector-role":
      "Esta combinação de conexões não forma um conector válido.",
  }

interface ValidateParams {
  connection: Connection
  nodes: AlgorithmNode[]
  edges: Edge[]
  ignoreEdgeId?: string
}

export function validateConnection({
  connection,
  nodes,
  edges,
  ignoreEdgeId,
}: ValidateParams): ConnectionValidation {
  const relevantEdges = ignoreEdgeId
    ? edges.filter((edge) => edge.id !== ignoreEdgeId)
    : edges

  const sourceNode = nodes.find((node) => node.id === connection.source)
  const targetNode = nodes.find((node) => node.id === connection.target)

  if (!sourceNode || !targetNode) {
    return { valid: false, reason: "unknown-node" }
  }

  if (connection.source === connection.target) {
    return { valid: false, reason: "self-connection" }
  }

  const sourceCapabilities = getBlockCapabilities(sourceNode.data)
  const handleAllowed = sourceCapabilities.outgoingHandles.some(
    (handle) => handle.id === (connection.sourceHandle ?? undefined),
  )

  if (!handleAllowed) {
    return { valid: false, reason: "source-handle-not-allowed" }
  }

  const targetCapabilities = getBlockCapabilities(targetNode.data)

  if (!targetCapabilities.allowsIncoming) {
    return { valid: false, reason: "target-does-not-accept-incoming" }
  }

  const targetHandleTaken = relevantEdges.some(
    (edge) =>
      edge.target === connection.target &&
      (edge.targetHandle ?? undefined) ===
        (connection.targetHandle ?? undefined),
  )

  if (targetHandleTaken) {
    return { valid: false, reason: "target-handle-taken" }
  }

  if (targetNode.data.blockType === "connector" && connection.targetHandle) {
    const hypothetical: Edge[] = [
      ...relevantEdges,
      {
        id: "__preview__",
        source: connection.source,
        target: connection.target,
        targetHandle: connection.targetHandle,
      } as Edge,
    ]

    if (getConnectorRole(targetNode.id, hypothetical) === "invalid") {
      return { valid: false, reason: "invalid-connector-role" }
    }
  }

  return { valid: true }
}
