import type { IMemory } from "../interfaces/memory";

export class ExprEvaluator {
  constructor(private memory: IMemory) {}

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

      const varMatch = expr.slice(i).match(/^[a-zA-Z_]\w*(\[\d+\])?/)
      if (varMatch) {
        const base = varMatch[0].replace(/\[\d+\]$/, "")
        const full = varMatch[0]
        if (!this.memory.has(base)) throw new Error(`Variável '${base}' não declarada`)
        const val = this.memory.get(full)
        if (val === null) throw new Error(`Variável '${base}' não inicializada`)
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

  assign(expr: string): string[] {
    return expr.split(";").filter(Boolean).map(s => {
      const [target, ...rest] = s.trim().split("=")
      const src = rest.join("=").trim()
      const res = String(new Function(`return (${this.resolve(src)})`)())
      if (!this.memory.has(target.trim())) {
        this.memory.declare(target.trim(), "desconhecido")
      }
      this.memory.set(target.trim(), res)
      return `${target.trim()} = ${res}`
    })
  }

  condition(expr: string): boolean {
    return Boolean(new Function(`return (${this.resolve(expr)})`)())
  }

  output(expr: string): string {
    return String(new Function(`return (${this.resolve(expr)})`)())
  }
}
