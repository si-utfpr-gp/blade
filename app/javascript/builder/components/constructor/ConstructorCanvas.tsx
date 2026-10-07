import { Background, Controls, ReactFlow, useReactFlow } from "@xyflow/react"
import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import type { MouseEvent } from "react"
import { useConstructor, type AlgorithmNode } from "./ConstructorProvider"
import { useSimulator } from "../simulator/SimulatorContext"
import {
  getHighlightedNodeId,
  isCanvasLocked,
  getContextMenuPosition,
  centerDropPosition,
} from "./canvasSync"
import { nodeTypes } from "./nodes"
import {
  DRAG_DATA_KEY,
  DRAG_VARIANT_KEY,
  getBlockDisplayName,
  isBlockType,
} from "../blocks/blockDefinitions"
import ContextMenu from "./ContextMenu"
import { RunDiagramButton } from "./RunDiagramButton"

interface IConstructorCanvasProps {
  onDiagramLoaded?: () => void
}

export default function ConstructorCanvas({
  onDiagramLoaded,
}: IConstructorCanvasProps) {
  const {
    nodes,
    edges,
    onNodesChange,
    onEdgesChange,
    onConnect,
    onReconnect,
    onReconnectStart,
    onReconnectEnd,
    isValidConnection,
    connectionError,
    addNode,
    setSelectedNodeId,
    removeNode,
  } = useConstructor()

  const { screenToFlowPosition, getNode, setCenter } = useReactFlow()
  const { state: simulatorState } = useSimulator()

  const locked = isCanvasLocked(
    simulatorState.isStarted,
    simulatorState.isFinished,
  )
  const highlightedNodeId = getHighlightedNodeId(
    simulatorState.steps,
    simulatorState.currentStepIndex,
  )

  const displayNodes = useMemo<AlgorithmNode[]>(() => {
    if (!highlightedNodeId) return nodes
    return nodes.map((node) =>
      node.id === highlightedNodeId ? { ...node, selected: true } : node,
    )
  }, [nodes, highlightedNodeId])

  useEffect(() => {
    if (!highlightedNodeId) return
    const target = getNode(highlightedNodeId)
    if (!target) return
    const width = target.measured?.width ?? 0
    const height = target.measured?.height ?? 0
    setCenter(target.position.x + width / 2, target.position.y + height / 2, {
      zoom: 2,
      duration: 300,
    })
  }, [highlightedNodeId, getNode, setCenter])

  const wrapperRef = useRef<HTMLDivElement>(null)

  const [contextMenu, setContextMenu] = useState<{
    nodeId: string
    x: number
    y: number
  } | null>(null)

  const handleDrop = (event: React.DragEvent) => {
    event.preventDefault()

    if (locked) return

    const type = event.dataTransfer.getData(DRAG_DATA_KEY)

    if (!isBlockType(type)) return

    const rawVariant = event.dataTransfer.getData(DRAG_VARIANT_KEY)
    const variant =
      rawVariant === "start" || rawVariant === "end" ? rawVariant : undefined

    const position = centerDropPosition(
      screenToFlowPosition({
        x: event.clientX,
        y: event.clientY,
      }),
      type,
    )

    addNode(type, position, variant)
  }

  const handleNodeContextMenu = useCallback(
    (event: MouseEvent, node: AlgorithmNode) => {
      if (locked) return
      event.preventDefault()

      const rect = wrapperRef.current?.getBoundingClientRect()

      setSelectedNodeId(node.id)

      setContextMenu({
        nodeId: node.id,
        ...getContextMenuPosition(event.clientX, event.clientY, {
          left: rect?.left ?? 0,
          top: rect?.top ?? 0,
        }),
      })
    },
    [setSelectedNodeId, locked],
  )

  const handleDelete = useCallback(() => {
    if (!contextMenu || locked) return

    removeNode(contextMenu.nodeId)
    setContextMenu(null)
  }, [contextMenu, removeNode, locked])

  useEffect(() => {
    const handleClick = () => {
      setContextMenu(null)
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setContextMenu(null)
      }
    }

    window.addEventListener("click", handleClick)
    window.addEventListener("keydown", handleKeyDown)

    return () => {
      window.removeEventListener("click", handleClick)
      window.removeEventListener("keydown", handleKeyDown)
    }
  }, [])

  return (
    <div
      ref={wrapperRef}
      className="relative h-full w-full"
      onDrop={handleDrop}
      onDragOver={(event) => {
        event.preventDefault()
        event.dataTransfer.dropEffect = "move"
      }}
    >
      <div
        data-testid="canvas-toolbar"
        className="absolute right-3 top-3 z-10 rounded-lg border border-border bg-card/95 px-2 py-1.5 shadow-md backdrop-blur"
      >
        <RunDiagramButton onDiagramLoaded={onDiagramLoaded} />
      </div>

      <ReactFlow
        nodes={displayNodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={locked ? undefined : onConnect}
        onReconnect={locked ? undefined : onReconnect}
        onReconnectStart={onReconnectStart}
        onReconnectEnd={onReconnectEnd}
        isValidConnection={isValidConnection}
        edgesReconnectable={!locked}
        nodesDraggable={!locked}
        nodesConnectable={!locked}
        elementsSelectable={!locked}
        onNodeClick={(_, node) => {
          if (locked) return
          setSelectedNodeId(node.id)
        }}
        onNodeContextMenu={handleNodeContextMenu}
        nodeTypes={nodeTypes}
        fitView
      >
        <Background />
        <Controls />
      </ReactFlow>

      {contextMenu && (
        <ContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          label={(() => {
            const target = nodes.find((node) => node.id === contextMenu.nodeId)
            if (!target) return ""
            return getBlockDisplayName(target.data.blockType, target.data.variant)
          })()}
          onDelete={handleDelete}
        />
      )}

      {connectionError && (
        <div className="pointer-events-none absolute bottom-4 left-1/2 z-10 -translate-x-1/2 rounded-md bg-red-600 px-3 py-2 text-xs font-medium text-white shadow-lg">
          {connectionError}
        </div>
      )}
    </div>
  )
}
