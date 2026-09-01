import type { IParserData, IParserNode, IParserRoutineDefinition } from "../parser/types"
import type { IExecutionStep } from "../interfaces/execution"

type Lang = "js" | "ts"

/**
 * Converts the logical diagram graph into readable JavaScript/TypeScript.
 *
 * The generator intentionally ignores visual metadata such as node positions.
 * It supports the canonical structures used by the builder/tests: sequential
 * flow, if/else branches, simple while loops represented by a decision whose
 * branch reaches the same decision again, typed inputs, arrays, and Portugol
 * boolean operators.
 */
export class CodeGenerator {
  private varTypes = new Map<string, string>()
  private inputBufferDeclared = false

  constructor(private graph: IParserData) {
    this.collectDeclaredTypes()
  }

  generate(options?: { lang?: Lang }): string {
    const lang = options?.lang ?? "js"
    const lines: string[] = []
    this.emitSubroutines(lines, lang)
    this.inputBufferDeclared = false
    this.emitPath(this.graph.startNodeId, lines, 0, lang, new Set())
    return this.compact(lines).join("\n")
  }

  generateFromSteps(steps: IExecutionStep[], options?: { lang?: Lang }): string {
    const lang = options?.lang ?? "js"
    const lines: string[] = []
    const emittedMemory = new Set<string>()

    for (const [, node] of this.graph.nodes) {
      if (node.type === "memory" && node.rows) {
        const memoryLines = this.translateMemory(node, lang, 0)
        if (memoryLines.length > 0) {
          emittedMemory.add(node.id)
          lines.push(...memoryLines)
        }
      }
    }

    this.inputBufferDeclared = false

    for (const step of steps) {
      const node = this.graph.nodes.get(step.nodeId)
      if (!node || emittedMemory.has(node.id)) continue
      lines.push(...this.translate(node, lang, 0))
    }

    return this.compact(lines).join("\n")
  }

  private emitSubroutines(lines: string[], lang: Lang): void {
    if (!this.graph.subroutines?.size) return

    for (const [, routine] of this.graph.subroutines) {
      lines.push(...this.translateSubroutineDefinition(routine, lang))
      lines.push("")
    }
  }

  private translateSubroutineDefinition(routine: IParserRoutineDefinition, lang: Lang): string[] {
    const returnType = this.returnTypeFor(routine)
    const params = routine.parameters.map((parameter) => lang === "ts" ? `${parameter}: number` : parameter).join(", ")
    const signature = lang === "ts"
      ? `function ${routine.name}(${params}): ${returnType} {`
      : `function ${routine.name}(${params}) {`
    const bodyGenerator = new CodeGenerator(routine.graph)
    const body: string[] = []

    bodyGenerator.emitPath(routine.graph.startNodeId, body, 1, lang, new Set())

    const lines = [signature]
    lines.push(...body.filter((line) => {
      const trimmed = line.trim()
      return trimmed !== "// Início do algoritmo" && trimmed !== "// Fim do algoritmo"
    }))
    if (routine.returnVariable) lines.push(`  return ${routine.returnVariable};`)
    lines.push("}")
    return lines
  }

  private returnTypeFor(routine: IParserRoutineDefinition): string {
    if (!routine.returnVariable) return "void"
    const type = this.declaredTypeInGraph(routine.graph, routine.returnVariable)
    return this.typeToTS(type ?? "inteiro")
  }

  private declaredTypeInGraph(graph: IParserData, variable: string): string | null {
    for (const [, node] of graph.nodes) {
      if (node.type !== "memory") continue
      for (const row of node.rows ?? []) {
        for (const raw of row.variables.split(",").map(s => s.trim()).filter(Boolean)) {
          if (this.baseVarName(raw) === variable) return row.type
        }
      }
    }
    return null
  }

  /** Walks the graph from one node until the end or a known merge/loop point. */
  private emitPath(
    nodeId: string | null,
    lines: string[],
    indent: number,
    lang: Lang,
    emitted: Set<string>,
    stopAt?: string | null,
  ): void {
    if (!nodeId || nodeId === stopAt) return
    if (emitted.has(nodeId)) {
      lines.push(`${this.indent(indent)}// fluxo retorna para ${nodeId}`)
      return
    }

    const node = this.graph.nodes.get(nodeId)
    if (!node) return

    const doWhile = this.findDoWhileLoop(nodeId, emitted)
    if (doWhile) {
      this.emitDoWhile(doWhile, lines, indent, lang, emitted, stopAt)
      return
    }

    if (node.type === "connector") {
      this.emitPath(this.graph.getNextNode(nodeId), lines, indent, lang, emitted, stopAt)
      return
    }

    if (node.type === "decision") {
      emitted.add(nodeId)
      this.emitDecision(node, lines, indent, lang, emitted, stopAt)
      return
    }

    emitted.add(nodeId)
    lines.push(...this.translate(node, lang, indent))
    this.emitPath(this.graph.getNextNode(nodeId), lines, indent, lang, emitted, stopAt)
  }

  /** Emits either an if/else or a while when one decision branch loops back. */
  private emitDecision(
    node: IParserNode,
    lines: string[],
    indent: number,
    lang: Lang,
    emitted: Set<string>,
    stopAt?: string | null,
  ): void {
    const yesNext = this.graph.getNextNode(node.id, "yes")
    const noNext = this.graph.getNextNode(node.id, "no")
    const condition = this.translateExpression(node.label ?? "false")
    const ind = this.indent(indent)

    if (yesNext && this.pathReaches(yesNext, node.id)) {
      lines.push(`${ind}while (${condition}) {`)
      this.emitPath(yesNext, lines, indent + 1, lang, emitted, node.id)
      lines.push(`${ind}}`)
      this.emitPath(noNext, lines, indent, lang, emitted, stopAt)
      return
    }

    if (noNext && this.pathReaches(noNext, node.id)) {
      lines.push(`${ind}while (!(${condition})) {`)
      this.emitPath(noNext, lines, indent + 1, lang, emitted, node.id)
      lines.push(`${ind}}`)
      this.emitPath(yesNext, lines, indent, lang, emitted, stopAt)
      return
    }

    const merge = this.findMerge(yesNext, noNext)
    lines.push(`${ind}if (${condition}) {`)
    this.emitPath(yesNext, lines, indent + 1, lang, emitted, merge)

    if (noNext) {
      lines.push(`${ind}} else {`)
      this.emitPath(noNext, lines, indent + 1, lang, emitted, merge)
    }

    lines.push(`${ind}}`)
    this.emitPath(merge, lines, indent, lang, emitted, stopAt)
  }

  private findDoWhileLoop(
    startNodeId: string,
    emitted: Set<string>,
  ): { body: IParserNode[]; decision: IParserNode; exitNodeId: string } | null {
    const body: IParserNode[] = []
    const visited = new Set<string>()
    let currentId: string | null = startNodeId

    while (currentId && !visited.has(currentId)) {
      visited.add(currentId)
      const current = this.graph.nodes.get(currentId)
      if (!current) return null

      if (current.type === "connector") {
        currentId = this.graph.getNextNode(current.id)
        continue
      }

      if (current.type === "decision") {
        if (emitted.has(current.id)) return null
        const yesNext = this.graph.getNextNode(current.id, "yes")
        const noNext = this.graph.getNextNode(current.id, "no")
        if (body.length === 0 || !yesNext || !noNext || !this.pathReaches(yesNext, startNodeId)) {
          return null
        }
        return { body, decision: current, exitNodeId: noNext }
      }

      if (emitted.has(currentId) || current.type === "startEnd") return null
      body.push(current)
      currentId = this.graph.getNextNode(current.id)
    }

    return null
  }

  private emitDoWhile(
    loop: { body: IParserNode[]; decision: IParserNode; exitNodeId: string },
    lines: string[],
    indent: number,
    lang: Lang,
    emitted: Set<string>,
    stopAt?: string | null,
  ): void {
    const ind = this.indent(indent)
    lines.push(`${ind}do {`)
    for (const node of loop.body) {
      emitted.add(node.id)
      lines.push(...this.translate(node, lang, indent + 1))
    }
    emitted.add(loop.decision.id)
    lines.push(`${ind}} while (${this.translateExpression(loop.decision.label ?? "false")});`)
    this.emitPath(loop.exitNodeId, lines, indent, lang, emitted, stopAt)
  }

  private translate(node: IParserNode, lang: Lang, indent: number): string[] {
    switch (node.type) {
      case "startEnd":
        if (node.variant === "start") return [`${this.indent(indent)}// Início do algoritmo`]
        if (node.variant === "end") return [`${this.indent(indent)}// Fim do algoritmo`]
        return []

      case "memory":
        return this.translateMemory(node, lang, indent)

      case "input":
        return this.translateInput(node, lang, indent)

      case "output":
        return [`${this.indent(indent)}console.log(${this.translateExpression(node.label ?? "\"\"")});`]

      case "process":
        return this.translateProcess(node, indent)

      case "subroutine": {
        const label = (node.label ?? "").trim()
        return label ? [`${this.indent(indent)}${this.ensureSemicolon(label)}`] : []
      }

      default:
        return []
    }
  }

  private translateMemory(node: IParserNode, lang: Lang, indent: number): string[] {
    if (!node.rows?.length) return []
    const ind = this.indent(indent)
    const lines: string[] = []

    for (const row of node.rows) {
      for (const raw of row.variables.split(",").map(s => s.trim()).filter(Boolean)) {
        const arrayMatch = raw.match(/^(\w+)\[(\d+)\]$/)
        if (arrayMatch) {
          const [, name, size] = arrayMatch
          const tsType = this.typeToTS(row.type)
          lines.push(lang === "ts"
            ? `${ind}let ${name}: ${tsType}[] = new Array(${size});`
            : `${ind}let ${name} = new Array(${size});`)
        } else {
          const initialValue = row.initialValue === undefined
            ? ""
            : ` = ${this.translateExpression(row.initialValue)}`
          lines.push(lang === "ts"
            ? `${ind}let ${raw}: ${this.typeToTS(row.type)}${initialValue};`
            : `${ind}let ${raw}${initialValue};`)
        }
      }
    }

    return lines
  }

  private translateInput(node: IParserNode, _lang: Lang, indent: number): string[] {
    const ind = this.indent(indent)
    const vars = (node.label ?? "").split(",").map(s => s.trim()).filter(Boolean)
    const lines: string[] = []

    if (!this.inputBufferDeclared) {
      this.emitInputBufferDeclaration(lines, _lang, indent)
      this.inputBufferDeclared = true
    }

    for (const variable of vars) {
      const type = this.varTypes.get(this.baseVarName(variable)) ?? "caractere"
      lines.push(ind + "textoDigitado = prompt(\"Valor para " + variable + ":\") ?? \"\";")
      lines.push(ind + variable + " = " + this.parseInputValue("textoDigitado", type) + ";")
    }

    return lines
  }

  private translateProcess(node: IParserNode, indent: number): string[] {
    const ind = this.indent(indent)
    return this.splitStatements(node.label ?? "").map(statement => {
      const assignmentIndex = this.findAssignmentIndex(statement)
      if (assignmentIndex < 0) return `${ind}${this.ensureSemicolon(this.translateExpression(statement))}`

      const target = statement.slice(0, assignmentIndex).trim()
      const source = statement.slice(assignmentIndex + 1).trim()
      return `${ind}${target} = ${this.translateExpression(source)};`
    })
  }

  /** Translates the subset of Portugol-style expressions supported by the engine to JS. */
  private translateExpression(expr: string): string {
    let out = ""
    let i = 0

    while (i < expr.length) {
      const ch = expr[i]
      if (ch === '"' || ch === "'") {
        const q = ch
        let j = i + 1
        while (j < expr.length) {
          if (expr[j] === "\\") {
            j += 2
            continue
          }
          if (expr[j] === q) break
          j++
        }
        out += expr.slice(i, Math.min(j + 1, expr.length))
        i = Math.min(j + 1, expr.length)
        continue
      }

      const word = expr.slice(i).match(/^[a-zA-Z_]\w*/)?.[0]
      if (word) {
        const lower = word.toLowerCase()
        const keywords: Record<string, string> = {
          verdadeiro: "true",
          falso: "false",
          e: "&&",
          ou: "||",
          nao: "!",
        }
        out += keywords[lower] ?? word
        i += word.length
        continue
      }

      const rest = expr.slice(i)
      if (rest.startsWith(">=")) { out += ">="; i += 2; continue }
      if (rest.startsWith("<=")) { out += "<="; i += 2; continue }
      if (rest.startsWith("!=")) { out += "!=="; i += 2; continue }
      if (rest.startsWith("==")) { out += "==="; i += 2; continue }
      if (rest.startsWith("=") && !rest.startsWith("=>")) { out += "==="; i += 1; continue }

      out += ch
      i++
    }

    return out.trim()
  }

  private parseInputValue(rawName: string, type: string): string {
    switch (type) {
      case "inteiro":
        return `Number.parseInt(${rawName}, 10)`
      case "real":
        return `Number.parseFloat(${rawName})`
      case "logico":
        return `["verdadeiro", "v", "true", "1"].includes(${rawName}.trim().toLowerCase())`
      case "caractere":
      default:
        return rawName
    }
  }

  private emitInputBufferDeclaration(lines: string[], lang: Lang, indent: number): void {
    const ind = this.indent(indent)
    lines.push(lang === "ts"
      ? `${ind}let textoDigitado: string;`
      : `${ind}let textoDigitado;`)
  }

  private collectDeclaredTypes(): void {
    for (const [, node] of this.graph.nodes) {
      if (node.type !== "memory") continue
      for (const row of node.rows ?? []) {
        for (const raw of row.variables.split(",").map(s => s.trim()).filter(Boolean)) {
          this.varTypes.set(this.baseVarName(raw), row.type)
        }
      }
    }
  }

  /** Returns true when a branch eventually reaches a target node; used for loop detection. */
  private pathReaches(from: string | null, target: string, seen = new Set<string>()): boolean {
    if (!from) return false
    if (from === target) return true
    if (seen.has(from)) return false
    seen.add(from)

    for (const edge of this.graph.getOutgoing(from)) {
      if (this.pathReaches(edge.target, target, seen)) return true
    }
    return false
  }

  /** Finds a simple convergence node shared by the yes/no branches of a decision. */
  private findMerge(a: string | null, b: string | null): string | null {
    if (!a || !b) return null
    const aOrder = this.reachableOrder(a)
    const bReachable = new Set(this.reachableOrder(b))
    return aOrder.find(id => bReachable.has(id)) ?? null
  }

  private reachableOrder(start: string): string[] {
    const result: string[] = []
    const seen = new Set<string>()
    const queue = [start]

    while (queue.length > 0) {
      const id = queue.shift()
      if (!id || seen.has(id)) continue
      seen.add(id)
      result.push(id)
      for (const edge of this.graph.getOutgoing(id)) queue.push(edge.target)
    }

    return result
  }

  private splitStatements(input: string): string[] {
    const result: string[] = []
    let current = ""
    let quote: string | null = null

    for (let i = 0; i < input.length; i++) {
      const ch = input[i]
      if (quote) {
        current += ch
        if (ch === "\\") {
          current += input[++i] ?? ""
          continue
        }
        if (ch === quote) quote = null
        continue
      }

      if (ch === '"' || ch === "'") {
        quote = ch
        current += ch
        continue
      }

      if (ch === ";") {
        if (current.trim()) result.push(current.trim())
        current = ""
        continue
      }

      current += ch
    }

    if (current.trim()) result.push(current.trim())
    return result
  }

  private findAssignmentIndex(statement: string): number {
    let quote: string | null = null
    for (let i = 0; i < statement.length; i++) {
      const ch = statement[i]
      if (quote) {
        if (ch === "\\") { i++; continue }
        if (ch === quote) quote = null
        continue
      }
      if (ch === '"' || ch === "'") { quote = ch; continue }
      if (ch !== "=") continue
      if ([">", "<", "!", "="].includes(statement[i - 1] ?? "")) continue
      if (statement[i + 1] === "=" || statement[i + 1] === ">") continue
      return i
    }
    return -1
  }

  private ensureSemicolon(statement: string): string {
    const trimmed = statement.trim()
    return trimmed.endsWith(";") ? trimmed : `${trimmed};`
  }

  private baseVarName(name: string): string {
    return name.trim().replace(/\[.*\]$/, "")
  }

  private typeToTS(type: string): string {
    const map: Record<string, string> = {
      inteiro: "number",
      real: "number",
      caractere: "string",
      logico: "boolean",
    }
    return map[type] ?? "unknown"
  }

  private indent(level: number): string {
    return "  ".repeat(level)
  }

  private compact(lines: string[]): string[] {
    return lines.filter(line => line.trim().length > 0)
  }
}
