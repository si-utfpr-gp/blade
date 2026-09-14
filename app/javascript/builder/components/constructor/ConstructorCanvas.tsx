import {
  Background,
  Controls,
  MiniMap,
  ReactFlow,
  useReactFlow,
} from "@xyflow/react"
import { useConstructor } from "./ConstructorProvider"
import { nodeTypes } from "./nodes"
import { DRAG_DATA_KEY, isBlockType } from "../blocks/blockDefinitions"

export default function ConstructorCanvas() {
  const {
    nodes,
    edges,
    onNodesChange,
    onEdgesChange,
    onConnect,
    addNode,
    setSelectedNodeId,
  } = useConstructor()

  const { screenToFlowPosition } = useReactFlow()

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

  return (
    <div
      className="h-full w-full"
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
        onNodeClick={(_, node) => {
          setSelectedNodeId(node.id)
        }}
        nodeTypes={nodeTypes}
        fitView
      >
        <Background />
        <Controls />
        <MiniMap />
      </ReactFlow>
    </div>
  )
}
