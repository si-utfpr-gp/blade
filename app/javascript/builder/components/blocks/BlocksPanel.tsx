import {
  BLOCK_DEFINITIONS,
  DRAG_DATA_KEY,
  DRAG_VARIANT_KEY,
} from "../blocks/blockDefinitions"
import BlockShapePreview from "./BlockShapePreview"
import { ExamplesSection } from "../constructor/ExamplesSection"
import { CanvasActions } from "../constructor/CanvasActions"

interface IBlocksPanelProps {
  errors: string[]
}

export default function BlocksPanel({ errors }: IBlocksPanelProps) {
  return (
    <div className="flex h-full flex-col bg-card">
      <div className="border-b border-border p-3">
        <h2 className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
          Blocos de Algoritmo
        </h2>
        <p className="mb-2 text-[10px] text-muted-foreground">Arraste itens para a tela</p>
        <div
          data-testid="blocks-grid"
          className="space-y-2"
        >
          {BLOCK_DEFINITIONS.map((block) => (
            <div
              key={block.variant ? `${block.type}-${block.variant}` : block.type}
              data-testid={`block-tile-${block.type}${block.variant ? `-${block.variant}` : ""}`}
              draggable
              onDragStart={(event) => {
                event.dataTransfer.setData(DRAG_DATA_KEY, block.type)
                if (block.variant) {
                  event.dataTransfer.setData(DRAG_VARIANT_KEY, block.variant)
                }
                event.dataTransfer.effectAllowed = "move"
              }}
              title={`${block.label} — ${block.description}`}
              className="flex cursor-grab flex-col items-center gap-1 rounded-lg border border-border bg-background p-2 transition-all hover:border-primary/30 hover:shadow-sm active:cursor-grabbing"
            >
              <BlockShapePreview type={block.type} variant={block.variant} compact />
              <span className="w-full truncate text-center text-[9px] font-medium leading-tight text-muted-foreground">
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
          <h3 className="mb-0.5 text-[10px] font-semibold text-destructive">
            ⚠ Validação
          </h3>
          <ul className="space-y-0.5">
            {errors.slice(0, 3).map((error) => (
              <li key={error} className="text-[10px] text-destructive/80">
                {error}
              </li>
            ))}
            {errors.length > 3 && (
              <li className="text-[10px] text-destructive/60">
                +{errors.length - 3} mais...
              </li>
            )}
          </ul>
        </div>
      )}
    </div>
  )
}
