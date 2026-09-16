interface ContextMenuProps {
  x: number
  y: number
  label: string
  onDuplicate: () => void
  onDelete: () => void
}

export default function ContextMenu({
  x,
  y,
  label,
  onDuplicate,
  onDelete,
}: ContextMenuProps) {
  return (
    <div
      className="absolute z-50 min-w-44 overflow-hidden rounded-md border border-border bg-white py-1 text-sm shadow-lg"
      style={{
        left: x,
        top: y,
      }}
      onContextMenu={(event) => event.preventDefault()}
    >
      <span className="block w-full px-3 py-2 text-xs font-medium uppercase text-muted-foreground">
        {label}
      </span>
      <button
        type="button"
        className="flex w-full items-center px-3 py-2 text-left hover:bg-muted"
        onClick={onDuplicate}
      >
        Duplicar
      </button>

      <div className="my-1 border-t border-border" />

      <button
        type="button"
        className="flex w-full items-center px-3 py-2 text-left text-destructive hover:bg-red-50"
        onClick={onDelete}
      >
        Excluir
      </button>
    </div>
  )
}
