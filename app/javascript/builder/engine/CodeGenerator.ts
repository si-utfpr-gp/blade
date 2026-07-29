import type { IParserData, IParserNode } from "../parser/types"
import type { IExecutionStep } from "../interfaces/execution"

export class CodeGenerator {
  constructor(private graph: IParserData) {}

  generate(options?: { lang?: 'js' | 'ts' }): string {
    const lang = options?.lang ?? 'js'
    const lines: string[] = []
    const visited = new Set<string>()
    this.traverse(this.graph.startNodeId, lines, 0, lang, visited)
    return lines.join("\n")
  }

  generateFromSteps(steps: IExecutionStep[], options?: { lang?: 'js' | 'ts' }): string {
    const lang = options?.lang ?? 'js'
    const lines: string[] = []
    for (const [id, node] of this.graph.nodes) {
      if (node.type === "memory" && node.rows) {
        const memLine = this.translateMemory(node, lang, 0)
        if (memLine) lines.push(memLine)
      }
    }
    for (const step of steps) {
      const node = this.graph.nodes.get(step.nodeId)
      if (!node) continue
      const line = this.translate(node, lang, 0)
      if (line !== null && node.type !== "memory") {
        lines.push(line)
      }
    }
    return lines.join("\n")
  }

  private traverse(
    nodeId: string | null, lines: string[], indent: number,
    lang: 'js' | 'ts', visited: Set<string>
  ): void {
    if (!nodeId || visited.has(nodeId)) return
    const node = this.graph.nodes.get(nodeId)
    if (!node) return

    if (node.type === "connector") {
      this.traverse(this.graph.getNextNode(nodeId), lines, indent, lang, visited)
      return
    }

    visited.add(nodeId)

    if (node.type === "decision") {
      const ind = "  ".repeat(indent)
      lines.push(`${ind}if (${node.label ?? ""}) {`)
      const yesNext = this.graph.getNextNode(nodeId, "yes")
      this.traverse(yesNext, lines, indent + 1, lang, visited)
      const noNext = this.graph.getNextNode(nodeId, "no")
      if (noNext) {
        lines.push(`${ind}} else {`)
        this.traverse(noNext, lines, indent + 1, lang, visited)
      }
      lines.push(`${ind}}`)
      return
    }

    const line = this.translate(node, lang, indent)
    if (line !== null) lines.push(line)

    this.traverse(this.graph.getNextNode(nodeId), lines, indent, lang, visited)
  }

  private translate(node: IParserNode, lang: 'js' | 'ts', indent: number): string | null {
    const ind = "  ".repeat(indent)
    switch (node.type) {
      case "startEnd":
        if (node.variant === "start") return `${ind}// Início do algoritmo`
        if (node.variant === "end") return `${ind}// Fim do algoritmo`
        return null

      case "memory":
        return this.translateMemory(node, lang, indent)

      case "input": {
        const vars = (node.label ?? "").split(",").map(s => s.trim()).filter(Boolean)
        const stmts = vars.map(v => {
          if (lang === "ts") return `${ind}${v} = parseInt(prompt("") || "0");`
          return `${ind}${v} = parseInt(prompt(""));`
        })
        return stmts.join("\n")
      }

      case "output": {
        return `${ind}console.log(${node.label ?? ""});`
      }

      case "process": {
        const stmts = (node.label ?? "").split(";").filter(Boolean).map(s => `${ind}${s.trim()};`)
        return stmts.join("\n")
      }

      case "subroutine": {
        return `${ind}${node.label ?? ""};`
      }

      default:
        return null
    }
  }

  private translateMemory(node: IParserNode, lang: 'js' | 'ts', indent: number): string | null {
    if (!node.rows?.length) return null
    const ind = "  ".repeat(indent)
    const parts: string[] = []
    for (const row of node.rows) {
      for (const v of row.variables.split(",").map(s => s.trim())) {
        const arrayMatch = v.match(/^(\w+)\[(\d+)\]$/)
        if (arrayMatch) {
          const [_, name, size] = arrayMatch
          if (lang === "ts") {
            parts.push(`${ind}let ${name}: ${this.typeToTS(row.type)}[] = new Array(${size});`)
          } else {
            parts.push(`${ind}let ${name} = new Array(${size});`)
          }
        } else {
          if (lang === "ts") {
            parts.push(`${ind}let ${v}: ${this.typeToTS(row.type)};`)
          } else {
            parts.push(`${ind}let ${v};`)
          }
        }
      }
    }
    return parts.join("\n") || null
  }

  private typeToTS(type: string): string {
    const map: Record<string, string> = {
      inteiro: "number", real: "number",
      caractere: "string", logico: "boolean",
    }
    return map[type] ?? "any"
  }
}
