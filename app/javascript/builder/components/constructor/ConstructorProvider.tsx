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
import type { EdgeChange, NodeChange } from "@xyflow/react"

import type { BlockType } from "../blocks/blockDefinitions"
import { isBlockType } from "../blocks/blockDefinitions"
import {
  validateConnection,
  CONNECTION_REJECTION_MESSAGE,
  decisionBranchLabel,
  type ConnectionRejection,
} from "./connectionRules"
import { diagramSignature } from "./diagramSignature"
import { serializeDiagramForSave } from "./serializeDiagram"
import {
  edgesFromDiagram,
  isHistoryWorthy,
  nodesFromDiagram,
  useDiagramHistory,
} from "./useDiagramHistory"

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

  // Undo and redo for the canvas only. The name is a separate field and is
  // left to the browser, so Ctrl+Z in it is not swallowed by the canvas.
  undo: () => void
  redo: () => void
  canUndo: boolean
  canRedo: boolean

  // Whether the canvas holds edits that no save or load has accounted for.
  // Guards the actions that throw work away ask on this before proceeding.
  isDirty: boolean

  // Called once a save is confirmed, so the current state becomes the baseline.
  markClean: () => void

  // Incremented whenever a whole diagram is loaded, cleared or reset, so the
  // canvas can tell a new diagram apart from ordinary editing.
  diagramLoadCount: number
}

const ConstructorContext = createContext<ConstructorContextValue | null>(null)

// The canvas opens empty: a seeded start block made the first screen look like
// work already in progress, and a student cannot save an unnamed algorithm
// anyway. The start block is one tap away in the palette.
const initialNodes: AlgorithmNode[] = []

const initialEdges: Edge[] = []

export function ConstructorProvider({ children }: { children: ReactNode }) {
  const [nodes, setNodes, applyNodeChanges] = useNodesState(initialNodes)
  const [diagramLoadCount, setDiagramLoadCount] = useState(0)

  const [edges, setEdges, applyEdgeChanges] = useEdgesState(initialEdges)

  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null)

  const [connectionError, setConnectionError] = useState<string | null>(null)
  const edgeReconnectSuccessful = useRef(true)

  // The dirty check compares the current diagram against the state it had when
  // it was loaded or last saved. Comparing fingerprints instead of toggling a
  // flag on each edit means undoing back to the saved state reads as clean
  // again, which a flag could never do on its own.
  const currentSignature = useMemo(
    () => diagramSignature(nodes, edges),
    [nodes, edges],
  )
  const [cleanSignature, setCleanSignature] = useState(() =>
    diagramSignature(initialNodes, initialEdges),
  )
  const isDirty = currentSignature !== cleanSignature
  const markClean = useCallback(
    () => setCleanSignature(currentSignature),
    [currentSignature],
  )

  const history = useDiagramHistory(
    () => serializeDiagramForSave(nodes, edges),
    (diagram) => {
      setNodes(nodesFromDiagram(diagram))
      setEdges(edgesFromDiagram(diagram))
      // A restored diagram is a different one, so the inspector must not keep
      // pointing at a block that is no longer there.
      setSelectedNodeId(null)
    },
  )
  const { record, undo, redo, reset: resetHistory } = history

  // React Flow delivers deletions and drags through the change handlers, so
  // both have to reach the history or those edits would be unundoable.
  const onNodesChange = useCallback(
    (changes: NodeChange<AlgorithmNode>[]) => {
      if (isHistoryWorthy(changes)) record()
      applyNodeChanges(changes)
    },
    [applyNodeChanges, record],
  )

  const onEdgesChange = useCallback(
    (changes: EdgeChange[]) => {
      if (isHistoryWorthy(changes)) record()
      applyEdgeChanges(changes)
    },
    [applyEdgeChanges, record],
  )

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

      record()
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
    [nodes, edges, setEdges, reportRejection, record],
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
      record()
      setEdges((currentEdges) =>
        reconnectEdge(
          { ...oldEdge, label: branchLabel },
          newConnection,
          currentEdges,
        ),
      )
    },
    [nodes, edges, setEdges, reportRejection, record],
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
      record()
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
    [setNodes, nodes, record],
  )

  const updateNodeData = useCallback(
    (id: string, data: Partial<BlockNodeData>) => {
      // Typing a character the field already held is not an edit. Recording it
      // would spend one undo on a keystroke that changed nothing.
      const existing = nodes.find((node) => node.id === id)
      const unchanged =
        existing !== undefined &&
        Object.entries(data).every(
          ([key, value]) => existing.data[key as keyof BlockNodeData] === value,
        )
      if (unchanged) return

      record()
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
    [setNodes, nodes, record],
  )

  const removeNode = useCallback(
    (id: string) => {
      record()
      setNodes((currentNodes) => currentNodes.filter((node) => node.id !== id))

      setEdges((currentEdges) =>
        currentEdges.filter((edge) => edge.source !== id && edge.target !== id),
      )

      setSelectedNodeId(null)
    },
    [setNodes, setEdges, record],
  )

  const duplicateNode = useCallback(
    (id: string) => {
      const originalNode = nodes.find((node) => node.id === id)

      if (!originalNode) return

      record()
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
    [nodes, setNodes, record],
  )

  const loadCanvasNodes = useCallback(
    (inputNodes: CanvasNodeInput[], inputEdges: CanvasEdgeInput[]) => {
      const nextNodes: AlgorithmNode[] = inputNodes
        .filter((node) => isBlockType(node.type))
        .map((node) => ({
          id: node.id,
          type: node.type,
          // Diagrams arrive from saved records, bundled examples and imported
          // files, and only the first two are guaranteed to carry geometry.
          // Falling back to the origin keeps a missing position from placing a
          // block nowhere, which the signature below would trip over too.
          position: node.position ?? { x: 0, y: 0 },
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
      // What lands on the canvas is the new point of comparison, so opening an
      // algorithm never reads as an edit the student has to confirm losing.
      setCleanSignature(diagramSignature(nextNodes, nextEdges))
      // Loading is a new starting point: walking back from it would bring back
      // a diagram the student deliberately left.
      resetHistory()
      setDiagramLoadCount((count) => count + 1)
    },
    [setNodes, setEdges, resetHistory],
  )

  const resetCanvas = useCallback(() => {
    setNodes(initialNodes)
    setEdges(initialEdges)
    setSelectedNodeId(null)
    setCleanSignature(diagramSignature(initialNodes, initialEdges))
    resetHistory()
    setDiagramLoadCount((count) => count + 1)
  }, [setNodes, setEdges, resetHistory])

  const clearCanvas = useCallback(() => {
    setNodes([])
    setEdges([])
    setSelectedNodeId(null)
    setCleanSignature(diagramSignature([], []))
    resetHistory()
    setDiagramLoadCount((count) => count + 1)
  }, [setNodes, setEdges, resetHistory])

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
      isDirty,
      markClean,
      undo,
      redo,
      canUndo: history.canUndo,
      canRedo: history.canRedo,
      diagramLoadCount,
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
      isDirty,
      markClean,
      undo,
      redo,
      history.canUndo,
      history.canRedo,
      diagramLoadCount,
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
