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
}

export const BLOCK_DEFINITIONS: BlockDefinition[] = [
  {
    type: "startEnd",
    label: "Início / Fim",
    description: "Define o início ou fim do algoritmo",
    color: "bg-green-500",
  },
  {
    type: "memory",
    label: "Memória",
    description: "Declara variáveis",
    color: "bg-blue-500",
  },
  {
    type: "input",
    label: "Entrada",
    description: "Recebe dados",
    color: "bg-purple-500",
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
    color: "bg-yellow-500",
  },
  {
    type: "decision",
    label: "Decisão",
    description: "Executa uma condição",
    color: "bg-orange-500",
  },
  {
    type: "output",
    label: "Saída",
    description: "Exibe informações",
    color: "bg-cyan-500",
  },
  {
    type: "subroutine",
    label: "Subrotina",
    description: "Executa uma subrotina",
    color: "bg-pink-500",
  },
]

export function getBlockDefinition(type: BlockType): BlockDefinition {
  const definition = BLOCK_DEFINITIONS.find((block) => block.type === type)

  if (!definition) {
    throw new Error(`Unknown block type: ${type}`)
  }

  return definition
}

export const DRAG_DATA_KEY = "application/blade-block"

export function isBlockType(value: string): value is BlockType {
  return BLOCK_DEFINITIONS.some((block) => block.type === value)
}
