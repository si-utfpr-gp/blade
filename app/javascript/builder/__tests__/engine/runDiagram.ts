import { expect } from "vitest"
import type { Edge, Node } from "@xyflow/react"
import { parse } from "../../parser/parser"
import { ExecutionEngine } from "../../engine/ExecutionEngine"
import { classifyError, type IExecutionError } from "../../engine/errors"
import type { IExecutionStep } from "../../interfaces/execution"
import { validateConnection } from "../../components/constructor/connectionRules"
import type { AlgorithmNode } from "../../components/constructor/ConstructorProvider"
import type { BlockType } from "../../components/blocks/blockDefinitions"

export interface RawNode {
  id: string
  type: string
  data?: Record<string, unknown>
}

export interface RawEdge {
  id: string
  source: string
  target: string
  sourceHandle?: string
  targetHandle?: string
  label?: string
}

export interface RawSubroutine {
  id: string
  name: string
  parameters: string[]
  returnVariable?: string
  nodes: RawNode[]
  edges: RawEdge[]
}

export interface RawDiagram {
  nodes: RawNode[]
  edges: RawEdge[]
  subroutines?: RawSubroutine[]
}

export interface DiagramRun {
  outputs: string[]
  /** Root memory as the desk check shows it, by variable name. */
  variables: Record<string, string | null>
  steps: IExecutionStep[]
  error: IExecutionError | null
  finished: boolean
  unusedInputs: string[]
}

const withPosition = (nodes: RawNode[]): Node[] =>
  nodes.map((node) => ({ data: {}, ...node, position: { x: 0, y: 0 } }) as Node)

/** The engine the debugger would build for this diagram. */
export function engineFor(diagram: RawDiagram): ExecutionEngine {
  const routines = diagram.subroutines?.map((routine) => ({
    ...routine,
    nodes: withPosition(routine.nodes),
    edges: routine.edges as Edge[],
  }))
  return new ExecutionEngine(parse(
    withPosition(diagram.nodes),
    diagram.edges as Edge[],
    routines ? { subroutines: routines } : undefined,
  ))
}

/** Runs a diagram to the end like the debugger does, feeding `inputs` in order. */
export function runDiagram(diagram: RawDiagram, inputs: string[] = [], options: { maxSteps?: number } = {}): DiagramRun {
  const engine = engineFor(diagram)
  // The real limit is 10000 steps; a lower one lets a test reach it quickly.
  if (options.maxSteps !== undefined) (engine as unknown as { max: number }).max = options.maxSteps

  const queue = [...inputs]
  let error: IExecutionError | null = null
  try {
    let last = engine.start()
    for (let guard = 0; guard < 20000 && !engine.getCurrentState().finished; guard++) {
      if (last?.waitingForInput) {
        const input = queue.shift()
        if (input === undefined) throw new Error("O diagrama pediu mais entradas do que o teste forneceu")
        last = engine.step(input)
      } else {
        last = engine.step()
      }
      if (!last) break
    }
  } catch (caught) {
    if (caught instanceof Error && caught.message.startsWith("O diagrama pediu")) throw caught
    error = classifyError(caught, null)
  }

  const state = engine.getCurrentState()
  return {
    outputs: engine.getCurrentOutputs(),
    variables: Object.fromEntries([...state.variables].map(([name, variable]) => [name, variable.value])),
    steps: engine.getSteps(),
    error,
    finished: state.finished,
    unusedInputs: queue,
  }
}

/** Runs and requires a clean finish with every input consumed. */
export function runToEnd(diagram: RawDiagram, inputs: string[] = []): DiagramRun {
  const run = runDiagram(diagram, inputs)
  expect(run.error).toBeNull()
  expect(run.finished).toBe(true)
  expect(run.unusedInputs).toEqual([])
  return run
}

/**
 * Redraws the diagram arrow by arrow under the constructor's own rules and
 * lists every arrow the canvas would refuse. An empty list means a student
 * can build this diagram by hand, connectors included.
 */
export function constructorIssues(diagram: RawDiagram): string[] {
  const issues = graphIssues("Principal", diagram.nodes, diagram.edges)
  for (const routine of diagram.subroutines ?? []) {
    issues.push(...graphIssues(routine.name, routine.nodes, routine.edges))
  }
  return issues
}

function graphIssues(graph: string, rawNodes: RawNode[], rawEdges: RawEdge[]): string[] {
  const nodes: AlgorithmNode[] = rawNodes.map((node) => ({
    id: node.id,
    type: node.type,
    position: { x: 0, y: 0 },
    data: { ...(node.data ?? {}), blockType: node.type as BlockType, label: String(node.data?.label ?? "") },
  }))
  const issues: string[] = []
  const drawn: Edge[] = []

  for (const edge of rawEdges) {
    const target = nodes.find((node) => node.id === edge.target)
    if (target?.data.blockType === "connector" && !edge.targetHandle) {
      issues.push(`${graph}: ${edge.id} chega ao conector ${edge.target} sem targetHandle`)
    }
    const result = validateConnection({
      connection: {
        source: edge.source,
        target: edge.target,
        sourceHandle: edge.sourceHandle ?? null,
        targetHandle: edge.targetHandle ?? null,
      },
      nodes,
      edges: drawn,
    })
    if (!result.valid) issues.push(`${graph}: ${edge.id} (${edge.source} → ${edge.target}) recusada: ${result.reason}`)
    drawn.push(edge as Edge)
  }

  return issues
}
