export type BlockType =
  | "startEnd"
  | "memory"
  | "input"
  | "output"
  | "process"
  | "decision"
  | "subroutine"
  | "connector"

export interface BlockDefinition {
  type: BlockType
  label: string
  description: string
  color: string
  variant?: "start" | "end"
}

export const BLOCK_DEFINITIONS: BlockDefinition[] = [
  {
    type: "startEnd",
    label: "Início",
    description: "Define o início do algoritmo",
    color: "bg-emerald-600",
    variant: "start",
  },
  {
    type: "startEnd",
    label: "Fim",
    description: "Define o fim do algoritmo",
    color: "bg-orange-700",
    variant: "end",
  },

  {
    type: "memory",
    label: "Memória",
    description: "Declara variáveis",
    color: "bg-slate-500",
  },
  {
    type: "input",
    label: "Entrada",
    description: "Recebe dados",
    color: "bg-cyan-500",
  },
  {
    type: "output",
    label: "Saída",
    description: "Exibe informações",
    color: "bg-pink-500",
  },
  {
    type: "decision",
    label: "Decisão",
    description: "Executa uma condição",
    color: "bg-amber-500",
  },
  {
    type: "connector",
    label: "Conector",
    description: "Conecta diferentes partes do algoritmo",
    color: "bg-gray-500",
  },
  {
    type: "process",
    label: "Processo",
    description: "Executa uma operação",
    color: "bg-violet-500",
  },
  {
    type: "subroutine",
    label: "Subrotina",
    description: "Executa uma subrotina",
    color: "bg-indigo-900",
  },
]

export function getBlockDisplayName(
  type: BlockType,
  variant?: "start" | "end",
): string {
  const exact = BLOCK_DEFINITIONS.find(
    (block) =>
      block.type === type && (block.variant ?? null) === (variant ?? null),
  )
  if (exact) return exact.label
  return BLOCK_DEFINITIONS.find((block) => block.type === type)?.label ?? type
}

export function getBlockDefinition(type: BlockType): BlockDefinition {
  const definition = BLOCK_DEFINITIONS.find((block) => block.type === type)

  if (!definition) {
    throw new Error(`Unknown block type: ${type}`)
  }

  return definition
}

export const DRAG_DATA_KEY = "application/blade-block"
export const DRAG_VARIANT_KEY = "application/blade-variant"

export function isBlockType(value: string): value is BlockType {
  return BLOCK_DEFINITIONS.some((block) => block.type === value)
}
