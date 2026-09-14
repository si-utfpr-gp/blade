import { BLOCK_DEFINITIONS } from "../blocks/blockDefinitions"

interface IBlocksPanelProps {
  errors: string[]
}

export default function BlocksPanel({ errors }: IBlocksPanelProps) {
  return (
    <div className="flex h-full flex-col">
      <div className="border-b p-4 text-center">
        <h2 className="text-sm font-bold uppercase tracking-wide">
          Blocos de Algoritmo
        </h2>
      </div>

      <div className="p-3">
        <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-400">
          Blocos Disponíveis
        </h3>

        <div className="space-y-2">
          {BLOCK_DEFINITIONS.map((block) => (
            <div
              key={block.type}
              draggable
              onDragStart={(event) => {
                event.dataTransfer.setData(
                  "application/blade-block",
                  block.type,
                )

                event.dataTransfer.effectAllowed = "move"
              }}
              className="cursor-grab rounded-lg border bg-white p-3 shadow-sm transition hover:border-blue-400 hover:shadow-md active:cursor-grabbing"
            >
              <div className="font-medium">{block.label}</div>

              <div className="text-xs text-gray-500">{block.description}</div>
            </div>
          ))}
        </div>
      </div>

      {errors.length > 0 && (
        <div className="border-t p-3">
          {errors.map((error) => (
            <p key={error} className="text-xs text-red-500">
              {error}
            </p>
          ))}
        </div>
      )}
    </div>
  )
}
