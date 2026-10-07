import type { BlockType } from "./blockDefinitions"

const SHAPE_COLOR: Record<BlockType, string> = {
  startEnd: "var(--node-start)",
  memory: "var(--node-memory)",
  input: "var(--node-input)",
  output: "var(--node-output)",
  process: "var(--node-process)",
  decision: "var(--node-decision)",
  subroutine: "var(--node-subroutine)",
  connector: "var(--node-connector)",
}

interface IBlockShapePreviewProps {
  type: BlockType
  variant?: "start" | "end"
  compact?: boolean
}

export function shapeColorToken(type: BlockType, variant?: "start" | "end"): string {
  if (type === "startEnd" && variant === "end") return "var(--node-end)"
  return SHAPE_COLOR[type]
}

export default function BlockShapePreview({ type, variant, compact = false }: IBlockShapePreviewProps) {
  const stroke = `hsl(${shapeColorToken(type, variant)})`

  return (
    <svg
      width={compact ? 44 : 64}
      height={compact ? 28 : 40}
      viewBox="0 0 64 40"
      data-testid={`block-shape-${type}`}
      aria-hidden="true"
      className="shrink-0"
    >
      {type === "startEnd" && (
        <ellipse cx="32" cy="20" rx="27" ry="14" fill="white" stroke={stroke} strokeWidth="3" />
      )}
      {type === "memory" && (
        <g>
          <rect x="6" y="6" width="52" height="28" rx="4" fill="white" stroke={stroke} strokeWidth="3" />
          <line x1="6" y1="17" x2="58" y2="17" stroke={stroke} strokeWidth="1.5" />
        </g>
      )}
      {(type === "input" || type === "output") && (
        <polygon points="15,5 59,5 49,35 5,35" fill="white" stroke={stroke} strokeWidth="3" strokeLinejoin="round" />
      )}
      {type === "process" && (
        <rect x="6" y="7" width="52" height="26" fill="white" stroke={stroke} strokeWidth="3" />
      )}
      {type === "decision" && (
        <polygon points="32,3 61,20 32,37 3,20" fill="white" stroke={stroke} strokeWidth="3" strokeLinejoin="round" />
      )}
      {type === "subroutine" && (
        <g>
          <rect x="8" y="7" width="48" height="26" rx="3" fill="white" stroke={stroke} strokeWidth="3" />
          <line x1="14" y1="7" x2="14" y2="33" stroke={stroke} strokeWidth="2" />
          <line x1="50" y1="7" x2="50" y2="33" stroke={stroke} strokeWidth="2" />
        </g>
      )}
      {type === "connector" && (
        <circle cx="32" cy="20" r="11" fill="white" stroke={stroke} strokeWidth="3" />
      )}
    </svg>
  )
}
