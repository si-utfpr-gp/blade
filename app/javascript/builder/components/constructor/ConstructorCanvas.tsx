import { Background, Controls, ReactFlow, useReactFlow } from "@xyflow/react"
import { useCallback, useEffect, useState } from "react"
import type { MouseEvent } from "react"
import { useConstructor, type AlgorithmNode } from "./ConstructorProvider"
import { nodeTypes } from "./nodes"
import { DRAG_DATA_KEY, isBlockType } from "../blocks/blockDefinitions"
import ContextMenu from "./ContextMenu"

export default function ConstructorCanvas() {
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
    duplicateNode,
  } = useConstructor()

  const { screenToFlowPosition } = useReactFlow()

  const [contextMenu, setContextMenu] = useState<{
    nodeId: string
    x: number
    y: number
  } | null>(null)

  const handleDrop = (event: React.DragEvent) => {
    event.preventDefault()

    const type = event.dataTransfer.getData(DRAG_DATA_KEY)

    if (!isBlockType(type)) return

    const position = screenToFlowPosition({
      x: event.clientX,
      y: event.clientY,
    })

    addNode(type, position)
  }

  const handleNodeContextMenu = useCallback(
    (event: MouseEvent, node: AlgorithmNode) => {
      event.preventDefault()

      const canvas = event.currentTarget.getBoundingClientRect()

      setSelectedNodeId(node.id)

      setContextMenu({
        nodeId: node.id,
        x: event.clientX - canvas.left / 3,
        y: event.clientY - canvas.top / 2,
      })
    },
    [setSelectedNodeId],
  )

  const handleDuplicate = useCallback(() => {
    if (!contextMenu) return

    duplicateNode(contextMenu.nodeId)
    setContextMenu(null)
  }, [contextMenu, duplicateNode])

  const handleDelete = useCallback(() => {
    if (!contextMenu) return

    removeNode(contextMenu.nodeId)
    setContextMenu(null)
  }, [contextMenu, removeNode])

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
      className="relative h-full w-full"
      onDrop={handleDrop}
      onDragOver={(event) => {
        event.preventDefault()
        event.dataTransfer.dropEffect = "move"
      }}
    >
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onReconnect={onReconnect}
        onReconnectStart={onReconnectStart}
        onReconnectEnd={onReconnectEnd}
        isValidConnection={isValidConnection}
        edgesReconnectable
        onNodeClick={(_, node) => setSelectedNodeId(node.id)}
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
          label={
            nodes.find((node) => node.id === contextMenu.nodeId)?.data.label ||
            ""
          }
          onDuplicate={handleDuplicate}
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
