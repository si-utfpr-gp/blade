import {
  addEdge,
  useEdgesState,
  useNodesState,
  reconnectEdge,
  type Connection,
  type Edge,
  type Node,
  type OnEdgesChange,
  type OnNodesChange,
  MarkerType,
} from "@xyflow/react"

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react"

import { ReactFlowProvider } from "@xyflow/react"

import type { BlockType } from "../blocks/blockDefinitions"
import { isBlockType } from "../blocks/blockDefinitions"
import {
  validateConnection,
  CONNECTION_REJECTION_MESSAGE,
  decisionBranchLabel,
  type ConnectionRejection,
} from "./connectionRules"

export interface MemoryRow {
  type: string
  variables: string
}

export interface BlockNodeData extends Record<string, unknown> {
  blockType: BlockType
  label: string
  variant?: "start" | "end"
  rows?: MemoryRow[]
  hasError?: boolean
}

export type AlgorithmNode = Node<BlockNodeData>

export interface CanvasNodeInput {
  id: string
  type: string
  data: Record<string, unknown>
  position: { x: number; y: number }
}

export interface CanvasEdgeInput {
  id: string
  source: string
  target: string
  sourceHandle?: string
  targetHandle?: string
  label?: string
}

interface ConstructorContextValue {
  nodes: AlgorithmNode[]
  edges: Edge[]

  selectedNodeId: string | null

  setSelectedNodeId: (id: string | null) => void

  onNodesChange: OnNodesChange<AlgorithmNode>
  onEdgesChange: OnEdgesChange

  onConnect: (connection: Connection) => void

  onReconnect: (oldEdge: Edge, newConnection: Connection) => void

  onReconnectStart: () => void

  onReconnectEnd: (event: MouseEvent | TouchEvent, edge: Edge) => void

  isValidConnection: (connection: Connection | Edge) => boolean
  connectionError: string | null

  addNode: (
    type: BlockType,
    position: { x: number; y: number },
    variant?: "start" | "end",
  ) => void

  updateNodeData: (id: string, data: Partial<BlockNodeData>) => void

  removeNode: (id: string) => void

  duplicateNode: (id: string) => void

  loadCanvasNodes: (nodes: CanvasNodeInput[], edges: CanvasEdgeInput[]) => void

  resetCanvas: () => void

  clearCanvas: () => void
}

const ConstructorContext = createContext<ConstructorContextValue | null>(null)

const initialNodes: AlgorithmNode[] = [
  {
    id: "start-1",
    type: "startEnd",
    position: { x: 300, y: 80 },
    data: {
      blockType: "startEnd",
      label: "Início",
      variant: "start",
    },
  },
]

const initialEdges: Edge[] = []

export function ConstructorProvider({ children }: { children: ReactNode }) {
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes)

  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges)

  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null)

  const [connectionError, setConnectionError] = useState<string | null>(null)
  const edgeReconnectSuccessful = useRef(true)

  const reportRejection = useCallback((reason: ConnectionRejection) => {
    setConnectionError(CONNECTION_REJECTION_MESSAGE[reason])
    window.setTimeout(() => setConnectionError(null), 3000)
  }, [])

  const onReconnectStart = useCallback(() => {
    edgeReconnectSuccessful.current = false
  }, [])

  const onConnect = useCallback(
    (connection: Connection) => {
      const result = validateConnection({ connection, nodes, edges })

      if (!result.valid) {
        reportRejection(result.reason)
        return
      }

      const branchLabel = decisionBranchLabel(connection.sourceHandle)

      setEdges((currentEdges) =>
        addEdge(
          {
            ...connection,
            ...(branchLabel !== undefined ? { label: branchLabel } : {}),
            type: "step",
            markerEnd: { type: MarkerType.ArrowClosed },
          },
          currentEdges,
        ),
      )
    },
    [nodes, edges, setEdges, reportRejection],
  )

  const onReconnect = useCallback(
    (oldEdge: Edge, newConnection: Connection) => {
      const result = validateConnection({
        connection: newConnection,
        nodes,
        edges,
        ignoreEdgeId: oldEdge.id,
      })

      if (!result.valid) {
        reportRejection(result.reason)
        return
      }

      edgeReconnectSuccessful.current = true
      const branchLabel = decisionBranchLabel(newConnection.sourceHandle)
      setEdges((currentEdges) =>
        reconnectEdge(
          { ...oldEdge, label: branchLabel },
          newConnection,
          currentEdges,
        ),
      )
    },
    [nodes, edges, setEdges, reportRejection],
  )

  const onReconnectEnd = useCallback(
    (_event: MouseEvent | TouchEvent, edge: Edge) => {
      if (!edgeReconnectSuccessful.current) {
        setEdges((currentEdges) => currentEdges.filter((e) => e.id !== edge.id))
      }
      edgeReconnectSuccessful.current = true
    },
    [setEdges],
  )

  const isValidConnection = useCallback(
    (connection: Connection | Edge) => {
      const asConnection: Connection = {
        source: connection.source,
        target: connection.target,
        sourceHandle: connection.sourceHandle ?? null,
        targetHandle: connection.targetHandle ?? null,
      }

      return validateConnection({
        connection: asConnection,
        nodes,
        edges,
        ignoreEdgeId: "id" in connection ? connection.id : undefined,
      }).valid
    },
    [nodes, edges],
  )

  const addNode = useCallback(
    (
      type: BlockType,
      position: { x: number; y: number },
      explicitVariant?: "start" | "end",
    ) => {
      const id = `${type}-${crypto.randomUUID()}`

      const variant: "start" | "end" | undefined =
        type === "startEnd"
          ? (explicitVariant ??
            (nodes.some(
              (n) =>
                n.data.blockType === "startEnd" && n.data.variant === "start",
            )
              ? "end"
              : "start"))
          : undefined

      const node: AlgorithmNode = {
        id,
        type,
        position,
        data: {
          blockType: type,
          label: getDefaultLabel(type, variant),
          ...(variant ? { variant } : {}),
        },
      }

      setNodes((currentNodes) => [...currentNodes, node])
      setSelectedNodeId(id)
    },
    [setNodes, nodes],
  )

  const updateNodeData = useCallback(
    (id: string, data: Partial<BlockNodeData>) => {
      setNodes((currentNodes) =>
        currentNodes.map((node) =>
          node.id === id
            ? {
                ...node,
                data: {
                  ...node.data,
                  ...data,
                },
              }
            : node,
        ),
      )
    },
    [setNodes],
  )

  const removeNode = useCallback(
    (id: string) => {
      setNodes((currentNodes) => currentNodes.filter((node) => node.id !== id))

      setEdges((currentEdges) =>
        currentEdges.filter((edge) => edge.source !== id && edge.target !== id),
      )

      setSelectedNodeId(null)
    },
    [setNodes, setEdges],
  )

  const duplicateNode = useCallback(
    (id: string) => {
      const originalNode = nodes.find((node) => node.id === id)

      if (!originalNode) return

      const newId = `${originalNode.data.blockType}-${crypto.randomUUID()}`

      const duplicatedNode: AlgorithmNode = {
        ...originalNode,
        id: newId,
        position: {
          x: originalNode.position.x + 40,
          y: originalNode.position.y + 40,
        },
        selected: false,
        data: {
          ...originalNode.data,
        },
      }

      setNodes((currentNodes) => [...currentNodes, duplicatedNode])
      setSelectedNodeId(newId)
    },
    [nodes, setNodes],
  )

  const loadCanvasNodes = useCallback(
    (inputNodes: CanvasNodeInput[], inputEdges: CanvasEdgeInput[]) => {
      const nextNodes: AlgorithmNode[] = inputNodes
        .filter((node) => isBlockType(node.type))
        .map((node) => ({
          id: node.id,
          type: node.type,
          position: node.position,
          data: {
            blockType: node.type as BlockType,
            label: (node.data.label as string | undefined) ?? "",
            ...(node.data.variant !== undefined
              ? { variant: node.data.variant as "start" | "end" }
              : {}),
            ...(node.data.rows !== undefined
              ? { rows: node.data.rows as MemoryRow[] }
              : {}),
          },
        }))

      const nextEdges: Edge[] = inputEdges.map((edge) => ({
        id: edge.id,
        source: edge.source,
        target: edge.target,
        ...(edge.sourceHandle !== undefined ? { sourceHandle: edge.sourceHandle } : {}),
        ...(edge.targetHandle !== undefined ? { targetHandle: edge.targetHandle } : {}),
        ...(edge.label !== undefined ? { label: edge.label } : {}),
        type: "step",
        markerEnd: { type: MarkerType.ArrowClosed },
      }))

      setNodes(nextNodes)
      setEdges(nextEdges)
      setSelectedNodeId(null)
    },
    [setNodes, setEdges],
  )

  const resetCanvas = useCallback(() => {
    setNodes(initialNodes)
    setEdges(initialEdges)
    setSelectedNodeId(null)
  }, [setNodes, setEdges])

  const clearCanvas = useCallback(() => {
    setNodes([])
    setEdges([])
    setSelectedNodeId(null)
  }, [setNodes, setEdges])

  const value = useMemo(
    () => ({
      nodes,
      edges,
      selectedNodeId,
      setSelectedNodeId,
      onNodesChange,
      onEdgesChange,
      onConnect,
      onReconnect,
      onReconnectStart,
      onReconnectEnd,
      isValidConnection,
      connectionError,
      addNode,
      updateNodeData,
      removeNode,
      duplicateNode,
      loadCanvasNodes,
      resetCanvas,
      clearCanvas,
    }),
    [
      nodes,
      edges,
      selectedNodeId,
      onNodesChange,
      onEdgesChange,
      onConnect,
      onReconnect,
      onReconnectStart,
      onReconnectEnd,
      isValidConnection,
      connectionError,
      addNode,
      updateNodeData,
      removeNode,
      duplicateNode,
      loadCanvasNodes,
      resetCanvas,
      clearCanvas,
    ],
  )

  return (
    <ReactFlowProvider>
      <ConstructorContext.Provider value={value}>
        {children}
      </ConstructorContext.Provider>
    </ReactFlowProvider>
  )
}

export function useConstructor() {
  const context = useContext(ConstructorContext)

  if (!context) {
    throw new Error("useConstructor must be used inside ConstructorProvider")
  }

  return context
}

function getDefaultLabel(type: BlockType, variant?: "start" | "end") {
  switch (type) {
    case "startEnd":
      return variant === "end" ? "Fim" : "Início"
    case "memory":
      return "Memória"
    case "input":
      return "Entrada"
    case "output":
      return "Saída"
    case "process":
      return "Processo"
    case "decision":
      return "Condição"
    case "subroutine":
      return "Subrotina"
    case "connector":
      return "Conector"
    default:
      return "Bloco"
  }
}
