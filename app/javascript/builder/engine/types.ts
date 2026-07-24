export const VALID_TYPES = ["inteiro", "real", "caractere", "logico"] as const
export type VarType = typeof VALID_TYPES[number]

export function isValidType(type: string): type is VarType {
  return VALID_TYPES.includes(type as VarType)
}
