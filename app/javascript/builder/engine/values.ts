import type { ExpressionValue } from "./ExpressionParser"
import type { VarType } from "./types"

/**
 * Typed bridge between the evaluator and the memory, which stores text.
 *
 * The declared type decides how a stored value is read back and which values
 * a variable accepts, so the desk check shows what a Portugol program would
 * hold (RN08) instead of guessing from the text.
 */

const TRUE_WORDS = ["verdadeiro", "v", "true"]
const FALSE_WORDS = ["falso", "f", "false"]

export class TypeMismatch extends Error {}

/** Text the student sees: Portuguese booleans and no float noise like 0.30000000000000004. */
export function formatValue(value: ExpressionValue): string {
  if (typeof value === "boolean") return value ? "verdadeiro" : "falso"
  if (typeof value === "number") return formatNumber(value)
  return value
}

function formatNumber(value: number): string {
  if (Number.isInteger(value)) return String(value)
  return String(Number.parseFloat(value.toPrecision(15)))
}

/** Parses the logical words accepted by an input block, or null when it is none of them. */
export function parseLogical(raw: string): boolean | null {
  const word = raw.trim().toLowerCase().replace(/\.$/, "")
  if (TRUE_WORDS.includes(word)) return true
  if (FALSE_WORDS.includes(word)) return false
  return null
}

/** Reads a stored text back as the value its declared type means. */
export function fromStored(stored: string, type: VarType): ExpressionValue {
  switch (type) {
    case "inteiro":
    case "real": {
      const number = Number(stored)
      if (stored.trim() === "" || Number.isNaN(number)) {
        throw new TypeMismatch(`valor '${stored}' guardado não é numérico`)
      }
      return number
    }
    case "logico": {
      const logical = parseLogical(stored)
      if (logical === null) throw new TypeMismatch(`valor '${stored}' guardado não é lógico`)
      return logical
    }
    case "caractere":
      return stored
  }
}

/** Checks a value against the declared type and returns the text to store. */
export function toStored(value: ExpressionValue, type: VarType, target: string): string {
  switch (type) {
    case "inteiro":
      if (typeof value !== "number" || !Number.isInteger(value)) {
        throw new TypeMismatch(`'${target}' é inteiro e não aceita ${describe(value)}`)
      }
      return formatNumber(value)
    case "real":
      if (typeof value !== "number") {
        throw new TypeMismatch(`'${target}' é real e não aceita ${describe(value)}`)
      }
      return formatNumber(value)
    case "logico":
      if (typeof value !== "boolean") {
        throw new TypeMismatch(`'${target}' é lógico e não aceita ${describe(value)}`)
      }
      return formatValue(value)
    case "caractere":
      return formatValue(value)
  }
}

/**
 * Type a subroutine parameter takes from the argument it receives; the
 * contract carries no types. Numbers become real, so a routine that halves an
 * integer argument is not rejected for a type the student never declared.
 */
export function typeOfValue(value: ExpressionValue): VarType {
  if (typeof value === "boolean") return "logico"
  if (typeof value === "number") return "real"
  return "caractere"
}

function describe(value: ExpressionValue): string {
  if (typeof value === "string") return `o texto '${value}'`
  if (typeof value === "boolean") return `o valor lógico ${formatValue(value)}`
  return `o valor ${formatValue(value)}`
}
