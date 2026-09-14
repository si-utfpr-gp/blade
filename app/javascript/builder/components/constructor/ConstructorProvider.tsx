import {
  addEdge,
  useEdgesState,
  useNodesState,
  type Connection,
  type Edge,
  type Node,
  type OnEdgesChange,
  type OnNodesChange,
} from "@xyflow/react"

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react"

import { ReactFlowProvider } from "@xyflow/react"

import type { BlockType } from "../blocks/blockDefinitions"

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

interface ConstructorContextValue {
  nodes: AlgorithmNode[]
  edges: Edge[]

  selectedNodeId: string | null

  setSelectedNodeId: (id: string | null) => void

  onNodesChange: OnNodesChange<AlgorithmNode>
  onEdgesChange: OnEdgesChange

  onConnect: (connection: Connection) => void

  addNode: (type: BlockType, position: { x: number; y: number }) => void

  updateNodeData: (id: string, data: Partial<BlockNodeData>) => void

  removeNode: (id: string) => void
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

  const onConnect = useCallback(
    (connection: Connection) => {
      setEdges((currentEdges) =>
        addEdge(
          {
            ...connection,
            type: "smoothstep",
          },
          currentEdges,
        ),
      )
    },
    [setEdges],
  )

  const addNode = useCallback(
    (type: BlockType, position: { x: number; y: number }) => {
      const id = `${type}-${crypto.randomUUID()}`

      const variant: "start" | "end" | undefined =
        type === "startEnd"
          ? nodes.some(
              (n) =>
                n.data.blockType === "startEnd" && n.data.variant === "start",
            )
            ? "end"
            : "start"
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

  const value = useMemo(
    () => ({
      nodes,
      edges,
      selectedNodeId,
      setSelectedNodeId,
      onNodesChange,
      onEdgesChange,
      onConnect,
      addNode,
      updateNodeData,
      removeNode,
    }),
    [
      nodes,
      edges,
      selectedNodeId,
      onNodesChange,
      onEdgesChange,
      onConnect,
      addNode,
      updateNodeData,
      removeNode,
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
      return "Declaração"
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
      return ""
    default:
      return "Bloco"
  }
}
