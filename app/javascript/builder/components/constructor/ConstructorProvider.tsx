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
  useEffect,
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
  selectionCaseHandle,
  selectionCaseIndex,
} from "../blocks/blockCapabilities"
import {
  validateConnection,
  CONNECTION_REJECTION_MESSAGE,
  branchLabel,
  type ConnectionRejection,
} from "./connectionRules"
import { diagramSignature } from "./diagramSignature"
import { serializeDiagramForSave } from "./serializeDiagram"
import { recenterOnMeasuredSize, type PlannedCenters } from "./recenterOnMeasuredSize"
import { layoutExampleDiagram } from "./layoutExampleDiagram"
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
  cases?: string[]
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

  // Replaces the values of a selection. `origins[i]` is the index case i had
  // before the edit, or null for a new case, so the arrows follow their case.
  updateSelectionCases: (
    id: string,
    cases: string[],
    origins: (number | null)[],
  ) => void

  removeNode: (id: string) => void

  duplicateNode: (id: string) => void

  // `centers` is for a generated layout: once the canvas has measured the
  // blocks, each one is moved so its centre lands where the layout planned it.
  loadCanvasNodes: (
    nodes: CanvasNodeInput[],
    edges: CanvasEdgeInput[],
    options?: { centers?: PlannedCenters },
  ) => void

  resetCanvas: () => void

  // Lays the diagram out as the examples are drawn: the main flow in one
  // column, branches beside their decision. One step in the history.
  rearrange: () => void

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

  // The student's own lock: while on, nothing changes the diagram, whichever
  // way the change comes in. Opening, starting or resetting a diagram still
  // works, since that is not editing this one.
  editLocked: boolean
  setEditLocked: (locked: boolean) => void
}

// While locked, React Flow may still measure the blocks and select them;
// moving, adding and removing are refused.
const CHANGES_ALLOWED_WHILE_LOCKED = new Set(["select", "dimensions"])

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
  const pendingCenters = useRef<PlannedCenters | null>(null)
  const [editLocked, setEditLockedState] = useState(false)
  // React Flow's change handlers read the lock at call time, so a drag that
  // was under way when the lock went on stops at once.
  const editLockedRef = useRef(false)
  const setEditLocked = useCallback((locked: boolean) => {
    editLockedRef.current = locked
    setEditLockedState(locked)
  }, [])

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
  // A deletion also has to let go of the selection: without this the canvas
  // keeps pointing at a block that is no longer there, which used to leave
  // the Backspace key deleting nothing and the inspector reading stale data.
  const onNodesChange = useCallback(
    (incoming: NodeChange<AlgorithmNode>[]) => {
      const changes = editLockedRef.current
        ? incoming.filter((change) => CHANGES_ALLOWED_WHILE_LOCKED.has(change.type))
        : incoming
      if (changes.length === 0) return
      if (isHistoryWorthy(changes)) record()
      if (
        selectedNodeId !== null &&
        changes.some(
          (change) => change.type === "remove" && change.id === selectedNodeId,
        )
      ) {
        setSelectedNodeId(null)
      }
      applyNodeChanges(changes)
    },
    [applyNodeChanges, record, selectedNodeId, setSelectedNodeId],
  )

  const onEdgesChange = useCallback(
    (incoming: EdgeChange[]) => {
      const changes = editLockedRef.current
        ? incoming.filter((change) => CHANGES_ALLOWED_WHILE_LOCKED.has(change.type))
        : incoming
      if (changes.length === 0) return
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

      const label = branchLabel(
        nodes.find((node) => node.id === connection.source),
        connection.sourceHandle,
      )

      record()
      setEdges((currentEdges) =>
        addEdge(
          {
            ...connection,
            ...(label !== undefined ? { label } : {}),
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
      if (editLockedRef.current) return
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
      const label = branchLabel(
        nodes.find((node) => node.id === newConnection.source),
        newConnection.sourceHandle,
      )
      record()
      setEdges((currentEdges) =>
        reconnectEdge(
          { ...oldEdge, label },
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
          ...(type === "selection" ? { cases: ["1", "2"] } : {}),
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

  const updateSelectionCases = useCallback(
    (id: string, cases: string[], origins: (number | null)[]) => {
      record()
      setNodes((currentNodes) =>
        currentNodes.map((node) =>
          node.id === id ? { ...node, data: { ...node.data, cases } } : node,
        ),
      )

      // An arrow keeps following its case when cases move and goes away with
      // a removed case. It carries no label: the value shows on the block.
      setEdges((currentEdges) =>
        currentEdges.flatMap((edge) => {
          if (edge.source !== id) return [edge]
          const previous = selectionCaseIndex(edge.sourceHandle)
          if (previous === null) return [edge]
          const next = origins.indexOf(previous)
          if (next === -1) return []
          return [
            {
              ...edge,
              sourceHandle: selectionCaseHandle(next),
              label: undefined,
            },
          ]
        }),
      )
    },
    [setNodes, setEdges, record],
  )

  const removeNode = useCallback(
    (id: string) => {
      record()
      setNodes((currentNodes) => currentNodes.filter((node) => node.id !== id))

      setEdges((currentEdges) =>
        currentEdges.filter((edge) => edge.source !== id && edge.target !== id),
      )

      // Only the removed block loses the selection. Clearing it for any
      // removal would drop the selection the student just made elsewhere.
      if (id === selectedNodeId) setSelectedNodeId(null)
    },
    [setNodes, setEdges, record, selectedNodeId, setSelectedNodeId],
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
    (
      inputNodes: CanvasNodeInput[],
      inputEdges: CanvasEdgeInput[],
      options?: { centers?: PlannedCenters },
    ) => {
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
            ...(Array.isArray(node.data.cases)
              ? { cases: (node.data.cases as unknown[]).map(String) }
              : {}),
          },
        }))

      // Diagrams saved before case arrows lost their label still carry it.
      const selections = new Set(
        nextNodes.filter((node) => node.data.blockType === "selection").map((node) => node.id),
      )
      const keepsLabel = (edge: CanvasEdgeInput) =>
        edge.label !== undefined &&
        !(selections.has(edge.source) && selectionCaseIndex(edge.sourceHandle) !== null)

      const nextEdges: Edge[] = inputEdges.map((edge) => ({
        id: edge.id,
        source: edge.source,
        target: edge.target,
        ...(edge.sourceHandle !== undefined ? { sourceHandle: edge.sourceHandle } : {}),
        ...(edge.targetHandle !== undefined ? { targetHandle: edge.targetHandle } : {}),
        ...(keepsLabel(edge) ? { label: edge.label } : {}),
        type: "step",
        markerEnd: { type: MarkerType.ArrowClosed },
      }))

      pendingCenters.current = options?.centers ?? null
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

  // React Flow reports the real size of each block only after drawing it, so
  // the move to the planned centres waits for every block to be measured. It
  // is part of loading, not an edit: no history step and still clean.
  useEffect(() => {
    const centers = pendingCenters.current
    if (!centers || nodes.length === 0) return
    if (!nodes.every((node) => node.measured?.width && node.measured?.height)) return
    pendingCenters.current = null
    const centered = recenterOnMeasuredSize(nodes, centers)
    setNodes(centered)
    setCleanSignature(diagramSignature(centered, edges))
  }, [nodes, edges, setNodes])

  const rearrange = useCallback(() => {
    if (nodes.length === 0) return
    const { nodes: planned, centers } = layoutExampleDiagram({
      id: "rearrange",
      title: "",
      description: "",
      category: "",
      diagram: {
        nodes: nodes.map((node) => ({ id: node.id, type: node.type ?? "", data: node.data as Record<string, unknown> })),
        edges: edges.map((edge) => ({
          id: edge.id,
          source: edge.source,
          target: edge.target,
          ...(edge.sourceHandle ? { sourceHandle: edge.sourceHandle } : {}),
          ...(edge.targetHandle ? { targetHandle: edge.targetHandle } : {}),
        })),
      },
    })
    const plannedById = new Map(planned.map((node) => [node.id, node.position]))
    record()
    // The blocks on the canvas are already measured, so each one lands on its
    // planned centre right away; an unmeasured one keeps the estimate.
    setNodes(
      recenterOnMeasuredSize(
        nodes.map((node) => ({ ...node, position: plannedById.get(node.id) ?? node.position })),
        centers,
      ),
    )
  }, [nodes, edges, record, setNodes])

  const resetCanvas = useCallback(() => {
    pendingCenters.current = null
    setNodes(initialNodes)
    setEdges(initialEdges)
    setSelectedNodeId(null)
    setCleanSignature(diagramSignature(initialNodes, initialEdges))
    resetHistory()
    setDiagramLoadCount((count) => count + 1)
  }, [setNodes, setEdges, resetHistory])

  // Checks the lock itself: it touches refs, which the guard in the context
  // value may not wrap during render.
  const clearCanvas = useCallback(() => {
    if (editLockedRef.current) return
    pendingCenters.current = null
    setNodes([])
    setEdges([])
    setSelectedNodeId(null)
    setCleanSignature(diagramSignature([], []))
    resetHistory()
    setDiagramLoadCount((count) => count + 1)
  }, [setNodes, setEdges, resetHistory])

  // Every edit goes through here, so the lock holds for the canvas, the
  // blocks' own fields and the menus alike.
  const value = useMemo(() => {
    const unlessLocked =
      <Args extends unknown[]>(edit: (...args: Args) => void) =>
      (...args: Args) => {
        if (!editLocked) edit(...args)
      }
    return {
      nodes,
      edges,
      selectedNodeId,
      setSelectedNodeId,
      onNodesChange,
      onEdgesChange,
      onConnect: unlessLocked(onConnect),
      onReconnect,
      onReconnectStart,
      onReconnectEnd,
      isValidConnection,
      connectionError,
      addNode: unlessLocked(addNode),
      updateNodeData: unlessLocked(updateNodeData),
      updateSelectionCases: unlessLocked(updateSelectionCases),
      removeNode: unlessLocked(removeNode),
      duplicateNode: unlessLocked(duplicateNode),
      loadCanvasNodes,
      resetCanvas,
      rearrange: unlessLocked(rearrange),
      clearCanvas,
      isDirty,
      markClean,
      undo: unlessLocked(undo),
      redo: unlessLocked(redo),
      canUndo: history.canUndo,
      canRedo: history.canRedo,
      diagramLoadCount,
      editLocked,
      setEditLocked,
    }
  },
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
      updateSelectionCases,
      removeNode,
      duplicateNode,
      loadCanvasNodes,
      resetCanvas,
      rearrange,
      clearCanvas,
      isDirty,
      markClean,
      undo,
      redo,
      history.canUndo,
      history.canRedo,
      diagramLoadCount,
      editLocked,
      setEditLocked,
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
    case "selection":
      return "variável"
    case "subroutine":
      return "Subrotina"
    case "connector":
      return "Conector"
    default:
      return "Bloco"
  }
}
