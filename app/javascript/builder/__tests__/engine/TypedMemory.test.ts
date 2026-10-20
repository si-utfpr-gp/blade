import { describe, it, expect } from "vitest"
import type { Edge, Node } from "@xyflow/react"
import { parse } from "../../parser/parser"
import { ExecutionEngine } from "../../engine/ExecutionEngine"
import { ERROR_TYPES, ExecutionError } from "../../engine/errors"
import type { IExecutionStep } from "../../interfaces/execution"

type Row = { type: string; variables: string; initialValue?: string }
type Block = { type: string; label: string }

/** Start → memory → blocks in a line → end. */
function linear(rows: Row[], blocks: Block[]): ExecutionEngine {
  const nodes: Node[] = [
    { id: "start", type: "startEnd", position: { x: 0, y: 0 }, data: { variant: "start" } },
    { id: "memory", type: "memory", position: { x: 0, y: 0 }, data: { rows } },
    ...blocks.map((block, i) => ({
      id: `b${i}`, type: block.type, position: { x: 0, y: 0 }, data: { label: block.label },
    })),
    { id: "end", type: "startEnd", position: { x: 0, y: 0 }, data: { variant: "end" } },
  ]
  const ids = nodes.map((node) => node.id)
  const edges: Edge[] = ids.slice(1).map((id, i) => ({ id: `e${i}`, source: ids[i], target: id }))
  return new ExecutionEngine(parse(nodes, edges))
}

/** Runs to the end, answering input blocks from the queue. */
function run(engine: ExecutionEngine, inputs: string[] = []): IExecutionStep[] {
  const steps: IExecutionStep[] = []
  let last = engine.start()
  if (last) steps.push(last)
  for (let guard = 0; guard < 200 && !engine.getCurrentState().finished; guard++) {
    last = last?.waitingForInput ? engine.step(inputs.shift()) : engine.step()
    if (!last) break
    steps.push(last)
  }
  return steps
}

function errorOf(action: () => unknown): ExecutionError {
  try {
    action()
  } catch (error) {
    if (error instanceof ExecutionError) return error
    throw error
  }
  throw new Error("expected an ExecutionError")
}

function valueOf(engine: ExecutionEngine, name: string): string | null | undefined {
  return engine.getCurrentState().variables.get(name)?.value
}

describe("memória tipada (RN08)", () => {
  it("lógico lido como 'falso' segue pelo caminho falso da decisão", () => {
    const nodes: Node[] = [
      { id: "start", type: "startEnd", position: { x: 0, y: 0 }, data: { variant: "start" } },
      { id: "memory", type: "memory", position: { x: 0, y: 0 }, data: { rows: [{ type: "logico", variables: "ok" }] } },
      { id: "read", type: "input", position: { x: 0, y: 0 }, data: { label: "ok" } },
      { id: "if", type: "decision", position: { x: 0, y: 0 }, data: { label: "ok" } },
      { id: "yes", type: "output", position: { x: 0, y: 0 }, data: { label: "'sim'" } },
      { id: "no", type: "output", position: { x: 0, y: 0 }, data: { label: "'não'" } },
      { id: "end", type: "startEnd", position: { x: 0, y: 0 }, data: { variant: "end" } },
    ]
    const edges: Edge[] = [
      { id: "e1", source: "start", target: "memory" },
      { id: "e2", source: "memory", target: "read" },
      { id: "e3", source: "read", target: "if" },
      { id: "e4", source: "if", target: "yes", sourceHandle: "yes" },
      { id: "e5", source: "if", target: "no", sourceHandle: "no" },
      { id: "e6", source: "yes", target: "end" },
      { id: "e7", source: "no", target: "end" },
    ]
    const engine = new ExecutionEngine(parse(nodes, edges))

    run(engine, ["falso"])

    expect(engine.getCurrentOutputs()).toEqual(["não"])
    expect(valueOf(engine, "ok")).toBe("falso")
  })

  it("aceita as abreviações v e f na entrada de lógico", () => {
    const engine = linear([{ type: "logico", variables: "a, b" }], [{ type: "input", label: "a, b" }])
    run(engine, ["v", "F"])
    expect(valueOf(engine, "a")).toBe("verdadeiro")
    expect(valueOf(engine, "b")).toBe("falso")
  })

  it("inteiro recusa um resultado com casas decimais", () => {
    const engine = linear([{ type: "inteiro", variables: "x" }], [{ type: "process", label: "x = 7 / 2" }])
    const error = errorOf(() => run(engine))
    expect(error.type).toBe(ERROR_TYPES.TYPE_MISMATCH)
    expect(error.message).toContain("'x' é inteiro e não aceita o valor 3.5")
    expect(error.blockId).toBe("b0")
  })

  it("inteiro aceita uma divisão exata e real aceita um inteiro", () => {
    const engine = linear(
      [{ type: "inteiro", variables: "x" }, { type: "real", variables: "y" }],
      [{ type: "process", label: "x = 8 / 2" }, { type: "process", label: "y = 5" }],
    )
    run(engine)
    expect(valueOf(engine, "x")).toBe("4")
    expect(valueOf(engine, "y")).toBe("5")
  })

  it("caractere com dígitos continua sendo texto ao concatenar", () => {
    const engine = linear(
      [{ type: "caractere", variables: "a, b, c" }],
      [{ type: "input", label: "a, b" }, { type: "process", label: "c = a + b" }],
    )
    run(engine, ["12", "3"])
    expect(valueOf(engine, "c")).toBe("123")
  })

  it("não faz conta com texto", () => {
    const engine = linear(
      [{ type: "caractere", variables: "a" }, { type: "inteiro", variables: "x" }],
      [{ type: "process", label: "a = '12'" }, { type: "process", label: "x = a * 2" }],
    )
    expect(errorOf(() => run(engine)).type).toBe(ERROR_TYPES.TYPE_MISMATCH)
  })

  it("mostra lógicos em português na saída e na memória", () => {
    const engine = linear(
      [{ type: "logico", variables: "ok" }],
      [{ type: "process", label: "ok = 3 > 2" }, { type: "output", label: "'Resultado: ' + ok" }],
    )
    run(engine)
    expect(valueOf(engine, "ok")).toBe("verdadeiro")
    expect(engine.getCurrentOutputs()).toEqual(["Resultado: verdadeiro"])
  })

  it("não mostra ruído de ponto flutuante", () => {
    const engine = linear([{ type: "real", variables: "x" }], [{ type: "process", label: "x = 0.1 + 0.2" }, { type: "output", label: "x" }])
    run(engine)
    expect(valueOf(engine, "x")).toBe("0.3")
    expect(engine.getCurrentOutputs()).toEqual(["0.3"])
  })

  it("exige uma condição lógica na decisão", () => {
    const nodes: Node[] = [
      { id: "start", type: "startEnd", position: { x: 0, y: 0 }, data: { variant: "start" } },
      { id: "memory", type: "memory", position: { x: 0, y: 0 }, data: { rows: [{ type: "inteiro", variables: "x" }] } },
      { id: "init", type: "process", position: { x: 0, y: 0 }, data: { label: "x = 1" } },
      { id: "if", type: "decision", position: { x: 0, y: 0 }, data: { label: "x" } },
      { id: "end", type: "startEnd", position: { x: 0, y: 0 }, data: { variant: "end" } },
    ]
    const edges: Edge[] = [
      { id: "e1", source: "start", target: "memory" },
      { id: "e2", source: "memory", target: "init" },
      { id: "e2b", source: "init", target: "if" },
      { id: "e3", source: "if", target: "end", sourceHandle: "yes" },
      { id: "e4", source: "if", target: "end", sourceHandle: "no" },
    ]
    const error = errorOf(() => run(new ExecutionEngine(parse(nodes, edges))))
    expect(error.type).toBe(ERROR_TYPES.TYPE_MISMATCH)
    expect(error.blockId).toBe("if")
  })

  it("lê um valor da entrada direto para uma posição do vetor", () => {
    const engine = linear(
      [{ type: "inteiro", variables: "i, notas[3]" }],
      [{ type: "process", label: "i = 1" }, { type: "input", label: "notas[i]" }],
    )
    run(engine, ["9"])
    expect(valueOf(engine, "notas[1]")).toBe("9")
  })
})

describe("declaração obrigatória (RN09)", () => {
  it("um erro de digitação na atribuição não cria uma variável nova", () => {
    const engine = linear([{ type: "inteiro", variables: "total" }], [{ type: "process", label: "totl = 5" }])
    const error = errorOf(() => run(engine))
    expect(error.type).toBe(ERROR_TYPES.UNDECLARED_VARIABLE)
    expect(error.message).toBe("Variável 'totl' não declarada")
    expect(engine.getCurrentState().variables.has("totl")).toBe(false)
  })

  it("a entrada não declara a variável que lê", () => {
    const engine = linear([{ type: "inteiro", variables: "x" }], [{ type: "input", label: "y" }])
    const error = errorOf(() => run(engine, ["4"]))
    expect(error.type).toBe(ERROR_TYPES.UNDECLARED_VARIABLE)
    expect(error.blockId).toBe("b0")
  })

  it("o retorno de uma sub-rotina exige a variável de destino declarada", () => {
    const nodes: Node[] = [
      { id: "start", type: "startEnd", position: { x: 0, y: 0 }, data: { variant: "start" } },
      { id: "call", type: "subroutine", position: { x: 0, y: 0 }, data: { label: "resultado = dobro(7)" } },
      { id: "end", type: "startEnd", position: { x: 0, y: 0 }, data: { variant: "end" } },
    ]
    const edges: Edge[] = [
      { id: "e1", source: "start", target: "call" },
      { id: "e2", source: "call", target: "end" },
    ]
    const engine = new ExecutionEngine(parse(nodes, edges, {
      subroutines: [{
        id: "dobro",
        name: "dobro",
        parameters: ["valor"],
        returnVariable: "retorno",
        nodes: [
          { id: "r-start", type: "startEnd", position: { x: 0, y: 0 }, data: { variant: "start" } },
          { id: "r-memory", type: "memory", position: { x: 0, y: 0 }, data: { rows: [{ type: "real", variables: "retorno" }] } },
          { id: "r-process", type: "process", position: { x: 0, y: 0 }, data: { label: "retorno = valor * 2" } },
          { id: "r-end", type: "startEnd", position: { x: 0, y: 0 }, data: { variant: "end" } },
        ],
        edges: [
          { id: "r1", source: "r-start", target: "r-memory" },
          { id: "r2", source: "r-memory", target: "r-process" },
          { id: "r3", source: "r-process", target: "r-end" },
        ],
      }],
    }))

    const error = errorOf(() => run(engine))
    expect(error.type).toBe(ERROR_TYPES.UNDECLARED_VARIABLE)
    expect(error.message).toBe("Variável 'resultado' não declarada")
  })
})
