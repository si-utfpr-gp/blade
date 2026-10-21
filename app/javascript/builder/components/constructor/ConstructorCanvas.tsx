import { Background, Controls, ReactFlow, useReactFlow } from "@xyflow/react"
import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import type { MouseEvent } from "react"
import { useConstructor, type AlgorithmNode } from "./ConstructorProvider"
import { useSimulator } from "../simulator/SimulatorContext"
import {
  getHighlightedNodeId,
  canvasPermissions,
  isCanvasLocked,
  getContextMenuPosition,
  centerDropPosition,
  followOffsetY,
} from "./canvasSync"
import { nodeTypes } from "./nodes"
import { edgeTypes } from "./edges/FlowStepEdge"
import {
  DRAG_DATA_KEY,
  DRAG_VARIANT_KEY,
  getBlockDisplayName,
  isBlockType,
} from "../blocks/blockDefinitions"
import ContextMenu from "./ContextMenu"
import { RunDiagramButton } from "./RunDiagramButton"
import { CanvasSaveButton } from "./CanvasSaveButton"
import { CanvasExportButton } from "./CanvasExportButton"
import { ShareButton } from "./ShareButton"
import { CanvasHistoryControls } from "./CanvasHistoryControls"
import { CenterDiagramButton, FloatingTools } from "./FloatingTools"
import { useFitOnDiagramLoad } from "./useFitOnDiagramLoad"
import { usePanePlacement } from "./usePanePlacement"
import { useBlockPlacement } from "./BlockPlacement"
import { PlacementHint } from "./PlacementHint"
import { useDiagramOrigin } from "./DiagramOrigin"
import { useIsDesktop } from "../layout/useMediaQuery"
import { useInspector } from "../layout/InspectorContext"
import { TerminalSquare } from "lucide-react"

interface IConstructorCanvasProps {
  onDiagramLoaded?: () => void
  // The read-only viewer of a public link: running is all there is to do, so
  // saving, exporting and the undo history stay out.
  viewer?: boolean
}

export default function ConstructorCanvas({
  onDiagramLoaded,
  viewer = false,
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
    diagramLoadCount,
  } = useConstructor()

  const { screenToFlowPosition, getNode, setCenter } = useReactFlow()
  const placeAt = usePanePlacement()
  const isDesktop = useIsDesktop()
  const inspector = useInspector()
  useFitOnDiagramLoad(diagramLoadCount)
  const { state: simulatorState } = useSimulator()

  const { isReadOnly } = useDiagramOrigin()

  // A running simulation freezes everything; a bundled example can still be
  // rearranged, but not edited.
  const { canMove, canEdit } = canvasPermissions({
    running: isCanvasLocked(simulatorState.isStarted, simulatorState.isFinished),
    isExample: isReadOnly,
  })
  const locked = !canEdit
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
    const zoom = 2
    const offset = followOffsetY({
      isDesktop,
      sheetOpen: inspector ? !inspector.collapsed : false,
      viewportHeight: window.innerHeight,
      zoom,
    })
    setCenter(target.position.x + width / 2, target.position.y + height / 2 + offset, {
      zoom,
      duration: 300,
    })
  }, [highlightedNodeId, getNode, setCenter, isDesktop, inspector])

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

  const { registerDropTarget } = useBlockPlacement()
  useEffect(() => {
    registerDropTarget((point, block) => {
      const rect = wrapperRef.current?.getBoundingClientRect()
      if (locked || !rect) return false
      const inside =
        point.x >= rect.left && point.x <= rect.right && point.y >= rect.top && point.y <= rect.bottom
      if (!inside) return false

      addNode(block.type, centerDropPosition(screenToFlowPosition(point), block.type), block.variant)
      return true
    })
    return () => registerDropTarget(null)
  }, [registerDropTarget, locked, addNode, screenToFlowPosition])

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
      data-testid="canvas-drop-zone"
      className="relative h-full w-full"
      onDrop={handleDrop}
      onDragOver={(event) => {
        event.preventDefault()
        event.dataTransfer.dropEffect = "move"
      }}
    >
      {isDesktop ? (
        <>
          {/* Save sits on the left edge, run on the right, so a click never
              lands on the wrong one. */}
          {!viewer && (
            <div
              data-testid="canvas-toolbar-save"
              // The padding follows the button: the touch target is taller on small
              // screens, and a fixed padding would clip it.
              className="absolute left-3 top-3 z-10 flex items-center gap-1.5 rounded-lg border border-border bg-card/95 px-1.5 py-1 shadow-md backdrop-blur sm:px-2 sm:py-1.5"
            >
              <CanvasSaveButton />
              <ShareButton />
            </div>
          )}

          <div
            data-testid="canvas-toolbar"
            className="absolute right-3 top-3 z-10 rounded-lg border border-border bg-card/95 px-2 py-1.5 shadow-md backdrop-blur"
          >
            <RunDiagramButton onDiagramLoaded={onDiagramLoaded} />
          </div>

          {/* Bottom right, away from save on the top left, run on the top right and
              the zoom controls on the bottom left. The error notice holds the
              bottom centre, so the four corners never crowd each other. */}
          {!viewer && (
            <>
              <div
                data-testid="canvas-toolbar-export"
                className="absolute bottom-3 right-3 z-10 rounded-lg border border-border bg-card/95 px-1.5 py-1 shadow-md backdrop-blur sm:px-2 sm:py-1.5"
              >
                <CanvasExportButton />
              </div>

              {/* Bottom left, right of the zoom controls that own the corner. */}
              <div
                data-testid="canvas-toolbar-undo"
                className="absolute bottom-3 left-14 z-10 rounded-lg border border-border bg-card/95 px-1.5 py-1 shadow-md backdrop-blur sm:px-2 sm:py-1.5"
              >
                <CanvasHistoryControls locked={locked} />
              </div>
            </>
          )}
        </>
      ) : (
        // On a phone the tools sit behind one floating ball the student can
        // drag anywhere; see FloatingTools for why not a fixed bar.
        <FloatingTools>
          {(close) => (
            <>
              {!viewer && (
                <>
                  <div className="col-span-2">
                    <CanvasHistoryControls locked={locked} />
                  </div>
                  <div onClick={close}>
                    <CenterDiagramButton />
                  </div>
                  {inspector && (
                    <button
                      type="button"
                      onClick={() => {
                        inspector.toggle()
                        close()
                      }}
                      aria-label={inspector.collapsed ? "Mostrar depurador" : "Esconder depurador"}
                      className="flex h-10 w-10 items-center justify-center rounded-lg border border-border bg-card/95 text-primary"
                    >
                      <TerminalSquare className="h-5 w-5" aria-hidden="true" />
                    </button>
                  )}
                  <CanvasSaveButton />
                  <ShareButton />
                  <CanvasExportButton />
                </>
              )}
              {viewer && (
                <div onClick={close}>
                  <CenterDiagramButton />
                </div>
              )}
              <div className="col-span-4" onClick={close}>
                <RunDiagramButton onDiagramLoaded={onDiagramLoaded} />
              </div>
            </>
          )}
        </FloatingTools>
      )}

      <ReactFlow
        onPaneClick={(event) => placeAt(screenToFlowPosition({ x: event.clientX, y: event.clientY }))}
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
        nodesDraggable={canMove}
        // Both keys delete the selected block. Typing in a field never
        // reaches here: React Flow ignores the keys inside inputs, so the
        // Backspace in the algorithm name cannot eat a block. A locked
        // canvas, an example included, has no key that deletes.
        deleteKeyCode={locked ? null : ["Backspace", "Delete"]}
        nodesConnectable={!locked}
        // A finger lets go roughly near a dot; on a phone the arrow snaps to
        // a dot from farther away.
        connectionRadius={isDesktop ? 20 : 40}
        elementsSelectable={!locked}
        onNodeClick={(_, node) => {
          if (locked) return
          setSelectedNodeId(node.id)
        }}
        onNodeContextMenu={handleNodeContextMenu}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        fitView
      >
        <PlacementHint />
        <Background />
        {/* Pinch zooms on a phone, and the bar needs the bottom edge. */}
        {isDesktop && <Controls />}
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
