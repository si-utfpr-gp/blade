import { expect } from "vitest"
import {
  constructorIssues,
  runDiagram,
  statementsOf,
  type DiagramRun,
  type RawDiagram,
  type RawEdge,
  type RawNode,
  type RawSubroutine,
} from "./runDiagram"

/*
 * Builds test diagrams the way the constructor requires: each block takes
 * one arrow, so branches meet and loops close on connectors. Every diagram
 * built here is also checked against the constructor's connection rules.
 */

export type Row = [type: string, variables: string, initialValue?: string]

interface Exit {
  id: string
  sourceHandle?: string
}

export type Stmt = (d: DiagramBuilder, from: Exit) => Exit

class DiagramBuilder {
  nodes: RawNode[] = []
  edges: RawEdge[] = []
  private count = 0

  constructor(private prefix = "") {}

  add(type: string, label = "", data: Record<string, unknown> = {}): string {
    const id = `${this.prefix}b${++this.count}`
    this.nodes.push({ id, type, data: { label, ...data } })
    return id
  }

  /** Draws an arrow, picking the handle and label the canvas would. */
  link(from: Exit, target: string, targetHandle?: string): void {
    const source = this.nodes.find((node) => node.id === from.id)
    const sourceHandle = from.sourceHandle ?? (source?.type === "connector" ? "bottom-out" : undefined)
    this.edges.push({
      id: `${this.prefix}e${this.edges.length + 1}`,
      source: from.id,
      target,
      ...(sourceHandle ? { sourceHandle } : {}),
      ...(targetHandle ? { targetHandle } : {}),
      ...(this.branchLabel(source, sourceHandle) !== undefined ? { label: this.branchLabel(source, sourceHandle) } : {}),
    })
  }

  run(from: Exit, stmts: Stmt[]): Exit {
    return stmts.reduce((exit, stmt) => stmt(this, exit), from)
  }

  private branchLabel(source: RawNode | undefined, handle?: string): string | undefined {
    if (source?.type === "decision") return handle === "yes" ? "VERDADEIRO" : "FALSO"
    if (source?.type !== "selection") return undefined
    if (handle === "default") return "FALSO"
    const cases = source.data?.cases as string[]
    return cases[Number(handle?.replace("case-", ""))]
  }
}

export const block = (type: string, label: string): Stmt => (d, from) => {
  const id = d.add(type, label)
  d.link(from, id)
  return { id }
}
export const input = (label: string) => block("input", label)
// A process block holds one instruction, so "a = 1; b = 2" is drawn the way
// a student has to: one process block per instruction, in order.
export const proc = (label: string): Stmt => (d, from) =>
  d.run(from, statementsOf(label).map((statement) => block("process", statement)))
export const out = (label: string) => block("output", label)
export const call = (label: string) => block("subroutine", label)

/** se/senão: the true branch reaches the join on the right, the false one on the left. */
export const ifElse = (condition: string, yes: Stmt[], no: Stmt[] = []): Stmt => (d, from) => {
  const decision = d.add("decision", condition)
  d.link(from, decision)
  const join = d.add("connector", "Fim do se")
  d.link(d.run({ id: decision, sourceHandle: "yes" }, yes), join, "right-in")
  d.link(d.run({ id: decision, sourceHandle: "no" }, no), join, "left-in")
  return { id: join }
}

/** enquanto: a loop-start connector takes the flow from the top and the body back from the side. */
export const whileLoop = (condition: string, body: Stmt[]): Stmt => (d, from) => {
  const loop = d.add("connector", "Início do laço")
  d.link(from, loop, "top-in")
  const decision = d.add("decision", condition)
  d.link({ id: loop }, decision)
  d.link(d.run({ id: decision, sourceHandle: "yes" }, body), loop, "right-in")
  return { id: decision, sourceHandle: "no" }
}

/** faça-enquanto: the body runs before the condition, which loops back to the connector. */
export const doWhile = (body: Stmt[], condition: string): Stmt => (d, from) => {
  const loop = d.add("connector", "Início do laço")
  d.link(from, loop, "top-in")
  const decision = d.add("decision", condition)
  d.link(d.run({ id: loop }, body), decision)
  d.link({ id: decision, sourceHandle: "yes" }, loop, "right-in")
  return { id: decision, sourceHandle: "no" }
}

const SIDES = ["left-in", "top-in", "right-in"]

/** escolha/caso: every branch, the Falso one included, meets on one selection join. */
export const choose = (expression: string, cases: Array<[string, Stmt[]]>, otherwise: Stmt[] = []): Stmt => (d, from) => {
  const selection = d.add("selection", expression, { cases: cases.map(([value]) => value) })
  d.link(from, selection)
  const join = d.add("connector", "Fim da escolha")
  cases.forEach(([, stmts], index) => {
    d.link(d.run({ id: selection, sourceHandle: `case-${index}` }, stmts), join, SIDES[index % SIDES.length])
  })
  d.link(d.run({ id: selection, sourceHandle: "default" }, otherwise), join, "left-in")
  return { id: join }
}

function graph(prefix: string, rows: Row[], stmts: Stmt[]): { nodes: RawNode[]; edges: RawEdge[] } {
  const d = new DiagramBuilder(prefix)
  const start = d.add("startEnd", "Início", { variant: "start" })
  // The memory block only declares. A row's initial value becomes a process
  // block right after it, which is where a student gives a starting value.
  const memory = d.add("memory", "Memória", {
    rows: rows.map(([type, variables]) => ({ type, variables })),
  })
  d.link({ id: start }, memory)
  const initializations = rows.flatMap(([, variables, initialValue]) =>
    initialValue === undefined
      ? []
      : variables.split(",").map((variable) => proc(`${variable.trim()} = ${initialValue}`)),
  )
  const last = d.run({ id: memory }, [...initializations, ...stmts])
  const end = d.add("startEnd", "Fim", { variant: "end" })
  d.link(last, end)
  return { nodes: d.nodes, edges: d.edges }
}

export function routine(name: string, parameters: string[], returnVariable: string | undefined, rows: Row[], stmts: Stmt[]): RawSubroutine {
  return { id: `routine-${name}`, name, parameters, returnVariable, ...graph(`${name}-`, rows, stmts) }
}

/** Builds a diagram and requires that the constructor accepts every arrow in it. */
export function program(rows: Row[], stmts: Stmt[], subroutines?: RawSubroutine[]): RawDiagram {
  const diagram: RawDiagram = { ...graph("", rows, stmts), ...(subroutines ? { subroutines } : {}) }
  expect(constructorIssues(diagram)).toEqual([])
  return diagram
}

export function expectError(diagram: RawDiagram, inputs: string[], type: string, message: string | RegExp, options?: { maxSteps?: number }) {
  const run = runDiagram(diagram, inputs, options)
  expect(run.finished).toBe(false)
  expect(run.error?.type).toBe(type)
  if (typeof message === "string") expect(run.error?.message).toBe(message)
  else expect(run.error?.message).toMatch(message)
  return run as DiagramRun
}
