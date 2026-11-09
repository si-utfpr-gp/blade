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
  return String(normalizeNumber(value))
}

/**
 * Rounds a result to the 15 significant digits a real keeps in memory, so
 * 0.1 + 0.2 is 0.3 whether it is stored first or compared on the spot.
 */
export function normalizeNumber(value: number): number {
  if (Number.isInteger(value) || !Number.isFinite(value)) return value
  return Number.parseFloat(value.toPrecision(15))
}

/**
 * Values can only be compared with values of the same kind: a caractere
 * "12" is neither equal to nor less than the number 12. Integers and reals
 * are both numbers. Returns the message for a mismatch, or null.
 */
export function comparisonMismatch(a: ExpressionValue, b: ExpressionValue): string | null {
  if (typeof a === typeof b) return null
  return `não é possível comparar ${describe(a)} com ${describe(b)}`
}

/** Equality as the student sees it: numbers match at the 15 digits a real keeps. */
export function sameValue(a: ExpressionValue, b: ExpressionValue): boolean {
  if (typeof a === "number" && typeof b === "number") return normalizeNumber(a) === normalizeNumber(b)
  return a === b
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
