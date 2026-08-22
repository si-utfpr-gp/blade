import type { IMemory } from "../interfaces/memory"
import { detectDivisionByZero, checkValidExpression, buildDivByZeroError } from "./errors"

/**
 * Evaluates the expression subset used by diagram blocks.
 *
 * Expressions are first resolved from Portugol-like syntax and memory values
 * into JavaScript expressions, then evaluated. This is appropriate for the
 * local educational simulator, but should be sandboxed/replaced before running
 * untrusted external input in production.
 */
export class ExprEvaluator {
  constructor(private memory: IMemory) {}

  /** Replaces variables and Portugol operators with executable JavaScript syntax. */
  resolve(expr: string): string {
    let out = ""
    let i = 0
    while (i < expr.length) {
      if (expr[i] === '"' || expr[i] === "'") {
        const q = expr[i]
        let j = i + 1
        while (j < expr.length && expr[j] !== q) j++
        out += expr.slice(i, j + 1)
        i = j + 1
        continue
      }

      if (/^verdadeiro\b/i.test(expr.slice(i))) {
        out += "true"
        i += 10
        continue
      }
      if (/^falso\b/i.test(expr.slice(i))) {
        out += "false"
        i += 5
        continue
      }

      if (/^nao\b/i.test(expr.slice(i))) {
        out += "!"
        i += 3
        continue
      }
      if (/^ou\b/i.test(expr.slice(i))) {
        out += "||"
        i += 2
        continue
      }
      if (/^e\b/i.test(expr.slice(i))) {
        out += "&&"
        i += 1
        continue
      }

      const varMatch = expr.slice(i).match(/^[a-zA-Z_]\w*(\[(-?\d+|[a-zA-Z_]\w*)\])?/)
      if (varMatch) {
        const full = varMatch[0]
        const arrayAccess = full.match(/^(\w+)\[(-?\d+|[a-zA-Z_]\w*)\]$/)
        let val: string | null
        if (arrayAccess) {
          const arrName = arrayAccess[1]
          const indexExpr = arrayAccess[2]
          const idx = /^-?\d+$/.test(indexExpr)
            ? parseInt(indexExpr, 10)
            : Number(this.resolve(indexExpr))
          if (!this.memory.has(arrName)) {
            throw new Error(`Array '${arrName}' não declarado`)
          }
          val = this.memory.getIndex(arrName, idx)
        } else {
          if (!this.memory.has(full)) {
            throw new Error(`Variável '${full}' não declarada`)
          }
          val = this.memory.get(full)
        }
        const varName = full.replace(/\[\d+\]$/, "")
        if (val === null) throw new Error(`Variável '${varName}' não inicializada`)
        const isNum = /^-?\d+(\.\d+)?$/.test(val)
        const isBool = val === "true" || val === "false"
        out += isNum || isBool ? val : `"${val.replace(/"/g, '\\"')}"`
        i += varMatch[0].length
        continue
      }

      if (/^>=/.test(expr.slice(i))) { out += ">="; i += 2; continue }
      if (/^<=/.test(expr.slice(i))) { out += "<="; i += 2; continue }
      if (/^!=/.test(expr.slice(i))) { out += "!=="; i += 2; continue }
      if (/^==/.test(expr.slice(i))) { out += "==="; i += 2; continue }
      if (/^=(?!\w)/.test(expr.slice(i))) { out += "==="; i += 1; continue }

      out += expr[i]
      i++
    }
    return out
  }

  /** Executes one or more assignments separated by ';' and returns a change log. */
  assign(expr: string, blockId: string | null): string[] {
    return expr.split(";").filter(Boolean).map(s => {
      const [target, ...rest] = s.trim().split("=")
      const src = rest.join("=").trim()
      const resolved = this.resolve(src)
      if (detectDivisionByZero(resolved)) {
        throw new Error(buildDivByZeroError(blockId).message)
      }
      const err = checkValidExpression(resolved, blockId)
      if (err) throw new Error(err.message)
      const res = String(new Function(`return (${resolved})`)())
      const indexTarget = target.trim().match(/^(\w+)\[(-?\d+|\w+)\]$/)
      if (indexTarget) {
        const arrName = indexTarget[1]
        const idxExpr = indexTarget[2]
        const idx = /^-?\d+$/.test(idxExpr) ? parseInt(idxExpr, 10) : Number(this.resolve(idxExpr))
        this.memory.setIndex(arrName, idx, res)
        return `${target.trim()} = ${res}`
      }
      if (!this.memory.has(target.trim())) {
        this.memory.declare(target.trim(), "caractere")
      }
      this.memory.set(target.trim(), res)
      return `${target.trim()} = ${res}`
    })
  }

  condition(expr: string, blockId: string | null): boolean {
    const resolved = this.resolve(expr)
    if (detectDivisionByZero(resolved)) {
      throw new Error(buildDivByZeroError(blockId).message)
    }
    const err = checkValidExpression(resolved, blockId)
    if (err) throw new Error(err.message)
    return Boolean(new Function(`return (${resolved})`)())
  }

  output(expr: string, blockId: string | null): string {
    const resolved = this.resolve(expr)
    if (detectDivisionByZero(resolved)) {
      throw new Error(buildDivByZeroError(blockId).message)
    }
    const err = checkValidExpression(resolved, blockId)
    if (err) throw new Error(err.message)
    return String(new Function(`return (${resolved})`)())
  }
}
