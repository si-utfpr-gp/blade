import {
  BLOCK_DEFINITIONS,
  DRAG_DATA_KEY,
  DRAG_VARIANT_KEY,
} from "../blocks/blockDefinitions"
import { useRef } from "react"

import BlockShapePreview from "./BlockShapePreview"
import { useBlockPlacement } from "../constructor/BlockPlacement"
import { useDrawer } from "../layout/DrawerContext"
import { ExamplesSection } from "../constructor/ExamplesSection"
import { CanvasActions } from "../constructor/CanvasActions"

interface IBlocksPanelProps {
  errors: string[]
}

export default function BlocksPanel({ errors }: IBlocksPanelProps) {
  const { pendingBlock, arm } = useBlockPlacement()
  const drawer = useDrawer()
  // A mouse drag ends with a click event too; without this flag a drag would
  // also arm the block and the next tap would drop a second copy.
  const draggedRef = useRef(false)

  return (
    <div className="flex h-full flex-col bg-card">
      <div className="border-b border-border p-3">
        <h2 className="mb-1 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
          Blocos de Algoritmo
        </h2>
        <p className="mb-2 text-sm text-gray-700">
          Arraste itens para a tela
        </p>
        <div data-testid="blocks-grid" className="grid grid-cols-2 gap-2">
          {BLOCK_DEFINITIONS.map((block) => (
            <div
              key={
                block.variant ? `${block.type}-${block.variant}` : block.type
              }
              data-testid={`block-tile-${block.type}${block.variant ? `-${block.variant}` : ""}`}
              draggable
              onDragStart={(event) => {
                draggedRef.current = true
                event.dataTransfer.setData(DRAG_DATA_KEY, block.type)
                if (block.variant) {
                  event.dataTransfer.setData(DRAG_VARIANT_KEY, block.variant)
                }
                event.dataTransfer.effectAllowed = "move"
              }}
              onDragEnd={() => {
                // Reset after the click that the browser fires post-drag.
                setTimeout(() => {
                  draggedRef.current = false
                })
              }}
              role="button"
              aria-pressed={
                pendingBlock?.type === block.type &&
                pendingBlock?.variant === block.variant
              }
              onClick={() => {
                if (draggedRef.current) return
                arm(block.type, block.variant)
                // The drawer covers the canvas, so the block would land
                // behind it if the menu stayed open.
                if (drawer?.isOpen) drawer.close()
              }}
              title={`${block.label} — ${block.description}`}
              className={`flex cursor-grab flex-col items-center gap-1 rounded-lg border bg-background p-2 transition-all hover:border-primary/30 hover:shadow-sm active:cursor-grabbing ${
                pendingBlock?.type === block.type &&
                pendingBlock?.variant === block.variant
                  ? "border-primary ring-2 ring-primary/30"
                  : "border-border"
              }`}
            >
              <BlockShapePreview
                type={block.type}
                variant={block.variant}
                compact
              />
              <span className="w-full truncate text-center text-xs font-medium leading-tight text-muted-foreground">
                {block.label}
              </span>
            </div>
          ))}
        </div>
      </div>

      <ExamplesSection />

      <div className="mt-auto">
        <CanvasActions />
      </div>

      {errors.length > 0 && (
        <div className="mx-2 mb-2 rounded-lg border border-destructive/30 bg-destructive/5 p-2">
          <h3 className="mb-0.5 text-xs font-semibold text-destructive">
            ⚠ Validação
          </h3>
          <ul className="space-y-0.5">
            {errors.slice(0, 3).map((error) => (
              <li key={error} className="text-xs text-destructive/80">
                {error}
              </li>
            ))}
            {errors.length > 3 && (
              <li className="text-xs text-destructive/60">
                +{errors.length - 3} mais...
              </li>
            )}
          </ul>
        </div>
      )}
    </div>
  )
}
