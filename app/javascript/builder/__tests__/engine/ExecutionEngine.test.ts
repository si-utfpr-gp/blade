import { describe, it, expect } from "vitest"
import { parse } from "../../parser/parser"
import { ExecutionEngine } from "../../engine/ExecutionEngine"
import { ExecutionError } from "../../engine/errors"
import type { Node, Edge } from "@xyflow/react"

function g(nodes: Node[], edges: Edge[]) { return parse(nodes, edges) }

function processEngine(label: string, processId = "process-1") {
  return new ExecutionEngine(g(
    [
      { id: "start", type: "startEnd", position: { x: 0, y: 0 }, data: { variant: "start" } },
      { id: processId, type: "process", position: { x: 0, y: 100 }, data: { label } },
      { id: "end", type: "startEnd", position: { x: 0, y: 200 }, data: { variant: "end" } },
    ],
    [
      { id: "start-process", source: "start", target: processId },
      { id: "process-end", source: processId, target: "end" },
    ],
  ))
}

function subroutineDobroEngine() {
  return new ExecutionEngine(parse(
    [
      { id: "start", type: "startEnd", position: { x: 0, y: 0 }, data: { variant: "start" } },
      { id: "memory", type: "memory", position: { x: 0, y: 80 }, data: { rows: [{ type: "inteiro", variables: "n, resultado" }] } },
      { id: "set-n", type: "process", position: { x: 0, y: 160 }, data: { label: "n = 7" } },
      { id: "call", type: "subroutine", position: { x: 0, y: 240 }, data: { label: "resultado = dobro(n)" } },
      { id: "end", type: "startEnd", position: { x: 0, y: 320 }, data: { variant: "end" } },
    ],
    [
      { id: "e1", source: "start", target: "memory" },
      { id: "e2", source: "memory", target: "set-n" },
      { id: "e3", source: "set-n", target: "call" },
      { id: "e4", source: "call", target: "end" },
    ],
    {
      subroutines: [
        {
          id: "routine-dobro",
          name: "dobro",
          parameters: ["valor"],
          returnVariable: "retorno",
          nodes: [
            { id: "r-start", type: "startEnd", position: { x: 0, y: 0 }, data: { variant: "start" } },
            { id: "r-memory", type: "memory", position: { x: 0, y: 80 }, data: { rows: [{ type: "inteiro", variables: "retorno" }] } },
            { id: "r-process", type: "process", position: { x: 0, y: 160 }, data: { label: "retorno = valor * 2" } },
            { id: "r-end", type: "startEnd", position: { x: 0, y: 240 }, data: { variant: "end" } },
          ],
          edges: [
            { id: "re1", source: "r-start", target: "r-memory" },
            { id: "re2", source: "r-memory", target: "r-process" },
            { id: "re3", source: "r-process", target: "r-end" },
          ],
        },
      ],
    },
  ))
}

function inputProcessOutputEngine() {
  return new ExecutionEngine(g(
    [
      { id:"n1", type:"startEnd", position:{x:0,y:0}, data:{variant:"start"} },
      { id:"n2", type:"memory", position:{x:0,y:80}, data:{rows:[{type:"inteiro",variables:"x, y"}]} },
      { id:"n3", type:"input", position:{x:0,y:160}, data:{label:"x"} },
      { id:"n4", type:"process", position:{x:0,y:240}, data:{label:"y = x"} },
      { id:"n5", type:"output", position:{x:0,y:320}, data:{label:"y"} },
      { id:"n6", type:"startEnd", position:{x:0,y:400}, data:{variant:"end"} },
    ],
    [
      { id:"e1", source:"n1", target:"n2" },
      { id:"e2", source:"n2", target:"n3" },
      { id:"e3", source:"n3", target:"n4" },
      { id:"e4", source:"n4", target:"n5" },
      { id:"e5", source:"n5", target:"n6" },
    ],
  ))
}

function sumUntilZeroDidacticEngine() {
  return new ExecutionEngine(g(
    [
      { id: "start", type: "startEnd", position: { x: 0, y: 0 }, data: { variant: "start" } },
      { id: "memory", type: "memory", position: { x: 0, y: 80 }, data: { rows: [{ type: "inteiro", variables: "n" }, { type: "inteiro", variables: "soma", initialValue: "0" }] } },
      { id: "entry-connector", type: "connector", position: { x: 0, y: 160 }, data: { label: "Iniciar leitura" } },
      { id: "input", type: "input", position: { x: 0, y: 240 }, data: { label: "n" } },
      { id: "sum", type: "process", position: { x: 0, y: 320 }, data: { label: "soma = soma + n" } },
      { id: "decision", type: "decision", position: { x: 0, y: 400 }, data: { label: "n != 0" } },
      { id: "loop-connector", type: "connector", position: { x: 220, y: 480 }, data: { label: "Ler próximo número" } },
      { id: "output", type: "output", position: { x: 0, y: 560 }, data: { label: "'Soma: ' + soma" } },
      { id: "end", type: "startEnd", position: { x: 0, y: 640 }, data: { variant: "end" } },
    ],
    [
      { id: "e1", source: "start", target: "memory" },
      { id: "e2", source: "memory", target: "entry-connector" },
      { id: "e3", source: "entry-connector", target: "input" },
      { id: "e4", source: "input", target: "sum" },
      { id: "e5", source: "sum", target: "decision" },
      { id: "e6", source: "decision", target: "loop-connector", sourceHandle: "yes" },
      { id: "e7", source: "loop-connector", target: "input" },
      { id: "e8", source: "decision", target: "output", sourceHandle: "no" },
      { id: "e9", source: "output", target: "end" },
    ],
  ))
}

function submitNextInput(engine: ExecutionEngine, value: string) {
  while (true) {
    const step = engine.step()
    if (!step) return null
    if (step.waitingForInput) return engine.step(value)
  }
}

function stepUntil(engine: ExecutionEngine, predicate: (step: NonNullable<ReturnType<ExecutionEngine["step"]>>) => boolean) {
  while (true) {
    const step = engine.step()
    if (!step || predicate(step)) return step
  }
}

describe("ExecutionEngine", () => {
  it("start() retorna passo inicial", () => {
    const e = new ExecutionEngine(g(
      [{ id:"n1",type:"startEnd",position:{x:0,y:0},data:{variant:"start",label:"Início"} },
       { id:"n2",type:"startEnd",position:{x:0,y:100},data:{variant:"end",label:"Fim"} }],
      [{ id:"e1",source:"n1",target:"n2" }]
    ))
    const s = e.start()
    expect(s?.nodeType).toBe("startEnd")
    expect(s?.log).toBe("Iniciando o algoritmo.")
  })

  it("step() registra a declaração de variáveis", () => {
    const e = new ExecutionEngine(g(
      [{ id:"n1",type:"startEnd",position:{x:0,y:0},data:{variant:"start"} },
       { id:"n2",type:"memory",position:{x:0,y:80},data:{rows:[{type:"inteiro",variables:"x"}]} },
       { id:"n3",type:"process",position:{x:0,y:200},data:{label:"x = 10"} },
       { id:"n4",type:"startEnd",position:{x:0,y:320},data:{variant:"end"} }],
      [{ id:"e1",source:"n1",target:"n2"},{ id:"e2",source:"n2",target:"n3"},{ id:"e3",source:"n3",target:"n4"}]
    ))
    e.start()
    const s2 = e.step()
    expect(s2?.nodeType).toBe("memory")
    expect(s2?.variables.find(v=>v.name==="x")?.value).toBeNull()
    const s3 = e.step()
    expect(s3?.nodeType).toBe("process")
    expect(s3?.variables.find(v=>v.name==="x")?.value).toBe("10")
    const s4 = e.step()
    expect(s4?.nodeType).toBe("startEnd")
    expect(e.getCurrentState().finished).toBe(true)
  })

  it("registra a trilha didática completa ao somar até zero", () => {
    const e = sumUntilZeroDidacticEngine()
    const inputs = ["2", "7", "14", "0"]

    e.start()
    while (!e.getCurrentState().finished) {
      const step = e.step()
      if (step?.waitingForInput) e.step(inputs.shift())
    }

    expect(e.getSteps().map((step) => step.nodeType)).toEqual([
      "startEnd",
      "memory",
      "connector",
      "input",
      "process",
      "decision",
      "branch",
      "connector",
      "input",
      "process",
      "decision",
      "branch",
      "connector",
      "input",
      "process",
      "decision",
      "branch",
      "connector",
      "input",
      "process",
      "decision",
      "branch",
      "output",
      "startEnd",
    ])
    expect(e.getSteps().filter((step) => step.nodeType === "branch").map((step) => step.log)).toEqual([
      "Caso Verdadeiro.",
      "Caso Verdadeiro.",
      "Caso Verdadeiro.",
      "Caso Falso.",
    ])
    expect(e.getCurrentOutputs()).toEqual(["Soma: 23"])
    expect(e.getSteps()[1].variables).toEqual(expect.arrayContaining([
      expect.objectContaining({ name: "n", value: null }),
      expect.objectContaining({ name: "soma", value: "0" }),
    ]))
  })

  it("restaura o caso da decisão ao voltar para seu passo no histórico", () => {
    const e = sumUntilZeroDidacticEngine()

    e.start()
    e.step()
    e.step()
    e.step()
    e.step("2")
    e.step()
    const decision = e.step()
    expect(decision?.nodeType).toBe("decision")

    const decisionIndex = e.currentStepIndex
    e.step()
    expect(e.goToStep(decisionIndex)).toBe(true)
    expect(e.step()).toMatchObject({ nodeType: "branch", log: "Caso Verdadeiro." })
    expect(e.step()?.nodeId).toBe("loop-connector")
  })

  it("executes a visual subroutine with parameter, local memory, and return assignment", () => {
    const e = subroutineDobroEngine()

    e.start()
    e.step()
    e.step()
    const call = e.step()
    expect(call?.nodeType).toBe("subroutine")
    expect(call?.callStack?.map((frame) => frame.routineName)).toEqual(["Principal", "dobro"])

    const inner = e.step()
    expect(inner?.nodeId).toBe("r-start")
    expect(inner?.log).toBe("Iniciando sub-rotina dobro.")
    e.step()
    e.step()
    const innerEnd = e.step()
    expect(innerEnd?.log).toBe("Sub-rotina dobro finalizada.")

    const state = e.getCurrentState()
    expect(state.variables.get("resultado")?.value).toBe("14")
    expect(state.variables.has("retorno")).toBe(false)
  })

  it("keeps semicolons and equals signs inside string assignments", () => {
    const e = processEngine("mensagem = 'a; b = c'; contador = 1")
    e.start()

    const step = e.step()

    expect(step?.variables.find((v) => v.name === "mensagem")?.value).toBe("a; b = c")
    expect(step?.variables.find((v) => v.name === "contador")?.value).toBe("1")
  })

  it("preserves the blockId from an expression error", () => {
    const e = processEngine("resultado = fetch('x')")
    e.start()

    try {
      e.step()
      expect.unreachable("the invalid expression should throw")
    } catch (error) {
      expect(error).toBeInstanceOf(ExecutionError)
      expect(error).toMatchObject({ blockId: "process-1", type: "INVALID_EXPRESSION" })
    }
    expect(e.getCurrentState().error).toContain("Expressão inválida")
  })

  it("throws a structured contract error when the called subroutine does not exist", () => {
    const e = new ExecutionEngine(parse(
      [
        { id: "start", type: "startEnd", position: { x: 0, y: 0 }, data: { variant: "start" } },
        { id: "call", type: "subroutine", position: { x: 0, y: 100 }, data: { label: "resultado = ausente(1)" } },
        { id: "end", type: "startEnd", position: { x: 0, y: 200 }, data: { variant: "end" } },
      ],
      [
        { id: "e1", source: "start", target: "call" },
        { id: "e2", source: "call", target: "end" },
      ],
    ))

    e.start()
    expect(() => e.step()).toThrow(ExecutionError)
    expect(e.getCurrentState().error).toContain("Sub-rotina 'ausente' não encontrada")
  })

  it("throws a structured contract error when argument count differs from parameters", () => {
    const e = new ExecutionEngine(parse(
      [
        { id: "start", type: "startEnd", position: { x: 0, y: 0 }, data: { variant: "start" } },
        { id: "call", type: "subroutine", position: { x: 0, y: 100 }, data: { label: "resultado = dobro(1, 2)" } },
        { id: "end", type: "startEnd", position: { x: 0, y: 200 }, data: { variant: "end" } },
      ],
      [
        { id: "e1", source: "start", target: "call" },
        { id: "e2", source: "call", target: "end" },
      ],
      {
        subroutines: [{
          id: "routine-dobro",
          name: "dobro",
          parameters: ["valor"],
          returnVariable: "retorno",
          nodes: [
            { id: "r-start", type: "startEnd", position: { x: 0, y: 0 }, data: { variant: "start" } },
            { id: "r-end", type: "startEnd", position: { x: 0, y: 80 }, data: { variant: "end" } },
          ],
          edges: [{ id: "re1", source: "r-start", target: "r-end" }],
        }],
      },
    ))

    e.start()
    expect(() => e.step()).toThrow(ExecutionError)
    expect(e.getCurrentState().error).toContain("esperava 1 argumento(s), recebeu 2")
  })

  it("throws a structured contract error when a returning call has no return variable", () => {
    const e = new ExecutionEngine(parse(
      [
        { id: "start", type: "startEnd", position: { x: 0, y: 0 }, data: { variant: "start" } },
        { id: "call", type: "subroutine", position: { x: 0, y: 100 }, data: { label: "resultado = semRetorno()" } },
        { id: "end", type: "startEnd", position: { x: 0, y: 200 }, data: { variant: "end" } },
      ],
      [
        { id: "e1", source: "start", target: "call" },
        { id: "e2", source: "call", target: "end" },
      ],
      {
        subroutines: [{
          id: "routine-sem-retorno",
          name: "semRetorno",
          parameters: [],
          nodes: [
            { id: "r-start", type: "startEnd", position: { x: 0, y: 0 }, data: { variant: "start" } },
            { id: "r-end", type: "startEnd", position: { x: 0, y: 80 }, data: { variant: "end" } },
          ],
          edges: [{ id: "re1", source: "r-start", target: "r-end" }],
        }],
      },
    ))

    e.start()
    e.step()
    e.step()
    expect(() => e.step()).toThrow(ExecutionError)
    expect(e.getCurrentState().error).toContain("não possui variável de retorno")
  })

  it("decision segue yes/no", () => {
    const graph = g(
      [{ id:"n1",type:"startEnd",position:{x:0,y:0},data:{variant:"start"} },
       { id:"n2",type:"memory",position:{x:0,y:80},data:{rows:[{type:"inteiro",variables:"n"}]} },
       { id:"n3",type:"process",position:{x:0,y:200},data:{label:"n = 10"} },
       { id:"n4",type:"decision",position:{x:0,y:320},data:{label:"n > 5"} },
       { id:"n5",type:"startEnd",position:{x:200,y:450},data:{variant:"end",label:"Fim"} }],
      [{ id:"e1",source:"n1",target:"n2"},{ id:"e2",source:"n2",target:"n3"},
       { id:"e3",source:"n3",target:"n4"},{ id:"e4",source:"n4",target:"n5",sourceHandle:"yes"}]
    )
    const e = new ExecutionEngine(graph)
    e.start()
    e.step()
    e.step()
    const ds = e.step()
    expect(ds?.log).toContain("V")
    expect(e.step()?.nodeType).toBe("branch")
    expect(e.step()?.nodeType).toBe("startEnd")
  })

  it("reset limpa tudo", () => {
    const e = new ExecutionEngine(g(
      [{ id:"n1",type:"startEnd",position:{x:0,y:0},data:{variant:"start"}},
       { id:"n2",type:"startEnd",position:{x:0,y:100},data:{variant:"end"}}],
      [{ id:"e1",source:"n1",target:"n2"}]
    ))
    e.start(); e.step()
    expect(e.getSteps()).toHaveLength(2)
    e.reset()
    expect(e.getSteps()).toHaveLength(0)
  })

  it("restores the active routine and local memory when navigating to a subroutine snapshot", () => {
    const e = subroutineDobroEngine()
    e.start()
    e.step()
    e.step()
    e.step()
    const innerStartIndex = e.currentStepIndex + 1
    e.step()
    e.step()
    e.goToStep(innerStartIndex)

    const state = e.getCurrentState()
    expect(state.callStack?.map((frame) => frame.routineName)).toEqual(["Principal", "dobro"])
    expect(state.currentNodeId).toBe("r-memory")
    expect(Array.from(state.variables.keys())).not.toContain("retorno")
    e.step()
    expect(e.step()?.nodeId).toBe("r-process")
  })

  it("restores memory, outputs, and the next node for a selected snapshot", () => {
    const e = inputProcessOutputEngine()
    e.start()
    e.step()
    e.step("25")
    e.step()
    e.step()

    expect(e.goToStep(0)).toBe(true)
    expect(e.getCurrentState().variables.has("x")).toBe(false)
    expect(e.getCurrentOutputs()).toEqual([])
    expect(e.step()?.nodeType).toBe("memory")
    expect(e.step()).toMatchObject({ waitingForInput: true, inputVariable: "x" })
  })

  it("replaces later steps after a new input instead of adding duplicates", () => {
    const e = inputProcessOutputEngine()
    e.start()
    e.step()
    e.step("25")
    e.step()
    e.goToStep(0)
    e.step()
    e.step("10")

    expect(e.getSteps()).toHaveLength(3)
    expect(e.getSteps()[2].variables.find((v) => v.name === "x")?.value).toBe("10")
    expect(e.currentStepIndex).toBe(2)
  })

  it("detecta erro de variável não inicializada", () => {
    const e = new ExecutionEngine(g(
      [{ id:"n1",type:"startEnd",position:{x:0,y:0},data:{variant:"start"}},
       { id:"n2",type:"memory",position:{x:0,y:80},data:{rows:[{type:"inteiro",variables:"x"}]}},
       { id:"n3",type:"process",position:{x:0,y:200},data:{label:"y = x"}},
       { id:"n4",type:"startEnd",position:{x:0,y:320},data:{variant:"end"}}],
      [{ id:"e1",source:"n1",target:"n2"},{ id:"e2",source:"n2",target:"n3"},{ id:"e3",source:"n3",target:"n4"}]
    ))
    e.start()
    e.step()
    expect(() => e.step()).toThrow()
    expect(e.getCurrentState().error).not.toBeNull()
  })

  it("input sem valor retorna waitingForInput", () => {
    const e = new ExecutionEngine(g(
      [{ id:"n1",type:"startEnd",position:{x:0,y:0},data:{variant:"start"}},
       { id:"n2",type:"input",position:{x:0,y:100},data:{label:"x"}},
       { id:"n3",type:"startEnd",position:{x:0,y:200},data:{variant:"end"}}],
      [{ id:"e1",source:"n1",target:"n2"},{ id:"e2",source:"n2",target:"n3"}]
    ))
    e.start()
    const s = e.step()
    expect(s?.waitingForInput).toBe(true)
  })

  it("input com valor avança corretamente", () => {
    const e = new ExecutionEngine(g(
      [{ id:"n1",type:"startEnd",position:{x:0,y:0},data:{variant:"start"}},
       { id:"n2",type:"input",position:{x:0,y:100},data:{label:"x"}},
       { id:"n3",type:"startEnd",position:{x:0,y:200},data:{variant:"end"}}],
      [{ id:"e1",source:"n1",target:"n2"},{ id:"e2",source:"n2",target:"n3"}]
    ))
    e.start()
    const s = e.step("42")
    expect(s?.variables.find(v=>v.name==="x")?.value).toBe("42")
    expect(s?.waitingForInput).toBeFalsy()
  })

  it("input com múltiplas variáveis pede um valor por vez", () => {
    const e = new ExecutionEngine(g(
      [{ id:"n1",type:"startEnd",position:{x:0,y:0},data:{variant:"start"}},
       { id:"n2",type:"memory",position:{x:0,y:80},data:{rows:[{type:"inteiro",variables:"x, y"}]}},
       { id:"n3",type:"input",position:{x:0,y:200},data:{label:"x, y"}},
       { id:"n4",type:"startEnd",position:{x:0,y:320},data:{variant:"end"}}],
      [{ id:"e1",source:"n1",target:"n2"},{ id:"e2",source:"n2",target:"n3"},{ id:"e3",source:"n3",target:"n4"}]
    ))
    e.start()
    e.step()
    const w1 = e.step()
    expect(w1?.waitingForInput).toBe(true)
    expect(w1?.inputEntered).toBe(false)
    expect(w1?.inputVariable).toBe("x")
    const s1 = e.step("10")
    expect(s1?.inputEntered).toBe(true)
    expect(s1?.waitingForInput).toBe(true)
    expect(s1?.inputVariable).toBe("y")
    expect(s1?.variables.find(v=>v.name==="x")?.value).toBe("10")
    const s2 = e.step("20")
    expect(s2?.waitingForInput).toBe(false)
    expect(s2?.variables.find(v=>v.name==="x")?.value).toBe("10")
    expect(s2?.variables.find(v=>v.name==="y")?.value).toBe("20")
    expect(e.getSteps().filter(s => s.nodeType === "input")).toHaveLength(2)
  })

  it("input validation rejects invalid integer", () => {
    const e = new ExecutionEngine(g(
      [{ id:"n1",type:"startEnd",position:{x:0,y:0},data:{variant:"start"}},
       { id:"n2",type:"memory",position:{x:0,y:80},data:{rows:[{type:"inteiro",variables:"x"}]}},
       { id:"n3",type:"input",position:{x:0,y:200},data:{label:"x"}},
       { id:"n4",type:"startEnd",position:{x:0,y:320},data:{variant:"end"}}],
      [{ id:"e1",source:"n1",target:"n2"},{ id:"e2",source:"n2",target:"n3"},{ id:"e3",source:"n3",target:"n4"}]
    ))
    e.start()
    e.step()
    expect(() => e.step("abc")).toThrow("inteiro")
  })

  it("input type is returned in waiting step", () => {
    const e = new ExecutionEngine(g(
      [{ id:"n1",type:"startEnd",position:{x:0,y:0},data:{variant:"start"}},
       { id:"n2",type:"memory",position:{x:0,y:80},data:{rows:[{type:"real",variables:"x"}]}},
       { id:"n3",type:"input",position:{x:0,y:200},data:{label:"x"}},
       { id:"n4",type:"startEnd",position:{x:0,y:320},data:{variant:"end"}}],
      [{ id:"e1",source:"n1",target:"n2"},{ id:"e2",source:"n2",target:"n3"},{ id:"e3",source:"n3",target:"n4"}]
    ))
    e.start()
    e.step()
    const s = e.step()
    expect(s?.inputType).toBe("real")
  })

  it("input validation rejects invalid logical value", () => {
    const e = new ExecutionEngine(g(
      [{ id:"n1",type:"startEnd",position:{x:0,y:0},data:{variant:"start"}},
       { id:"n2",type:"memory",position:{x:0,y:80},data:{rows:[{type:"logico",variables:"ok"}]}},
       { id:"n3",type:"input",position:{x:0,y:200},data:{label:"ok"}},
       { id:"n4",type:"startEnd",position:{x:0,y:320},data:{variant:"end"}}],
      [{ id:"e1",source:"n1",target:"n2"},{ id:"e2",source:"n2",target:"n3"},{ id:"e3",source:"n3",target:"n4"}]
    ))
    e.start()
    e.step()
    expect(() => e.step("talvez")).toThrow("lógico")
  })

  it("gera explicação para cada passo", () => {
    const e = new ExecutionEngine(g(
      [{ id:"n1",type:"startEnd",position:{x:0,y:0},data:{variant:"start"}},
       { id:"n2",type:"process",position:{x:0,y:100},data:{label:"a = 1 + 2"}},
       { id:"n3",type:"startEnd",position:{x:0,y:200},data:{variant:"end"}}],
      [{ id:"e1",source:"n1",target:"n2"},{ id:"e2",source:"n2",target:"n3"}]
    ))
    e.start()
    const s = e.step()
    expect(s?.explanation.length).toBeGreaterThan(0)
    expect(s?.changes.length).toBeGreaterThan(0)
  })

  it("executa loop de fatorial (enquanto)", () => {
    const graph = g(
      [
        { id:"n1",type:"startEnd",position:{x:0,y:0},data:{variant:"start"} },
        { id:"n2",type:"memory",position:{x:0,y:80},data:{rows:[{type:"inteiro",variables:"n, fatorial, i"}]} },
        { id:"n3",type:"input",position:{x:0,y:200},data:{label:"n"} },
        { id:"n4",type:"process",position:{x:0,y:300},data:{label:"fatorial = 1; i = 1"} },
        { id:"n5",type:"decision",position:{x:0,y:400},data:{label:"i <= n"} },
        { id:"n6",type:"process",position:{x:220,y:500},data:{label:"fatorial = fatorial * i; i = i + 1"} },
        { id:"n7",type:"output",position:{x:0,y:620},data:{label:"'Fatorial: ' + fatorial"} },
        { id:"n8",type:"startEnd",position:{x:0,y:720},data:{variant:"end"} },
      ],
      [
        { id:"e1",source:"n1",target:"n2"},
        { id:"e2",source:"n2",target:"n3"},
        { id:"e3",source:"n3",target:"n4"},
        { id:"e4",source:"n4",target:"n5"},
        { id:"e5",source:"n5",target:"n6",sourceHandle:"yes"},
        { id:"e6",source:"n6",target:"n5"},
        { id:"e7",source:"n5",target:"n7",sourceHandle:"no"},
        { id:"e8",source:"n7",target:"n8"},
      ]
    )
    const e = new ExecutionEngine(graph)
    e.start()
    submitNextInput(e, "5")
    let guard = 0
    while (e.step() !== null && guard++ < 100) { /* itera até terminar */ }
    const outputSteps = e.getCurrentState().steps.filter(st => st.nodeType === "output")
    expect(outputSteps.length).toBeGreaterThan(0)
  })

  it("atualiza vetor por índice em loop", () => {
    const graph = g(
      [
        { id:"n1", type:"startEnd",position:{x:0,y:0},data:{variant:"start"} },
        { id:"n2", type:"memory",position:{x:0,y:80},data:{rows:[{type:"inteiro",variables:"n, i"},{type:"real",variables:"notas[3], soma, media"}]} },
        { id:"n3", type:"input",position:{x:0,y:200},data:{label:"n"} },
        { id:"n4", type:"process",position:{x:0,y:300},data:{label:"soma = 0; i = 0"} },
        { id:"n5", type:"decision",position:{x:0,y:400},data:{label:"i < n"} },
        { id:"n6", type:"input",position:{x:220,y:500},data:{label:"nota"} },
        { id:"n7", type:"process",position:{x:220,y:600},data:{label:"notas[i] = nota; soma = soma + nota; i = i + 1"} },
        { id:"n8", type:"process",position:{x:0,y:720},data:{label:"media = soma / n"} },
        { id:"n9", type:"output",position:{x:0,y:820},data:{label:"'Média: ' + media"} },
        { id:"n10", type:"startEnd",position:{x:0,y:920},data:{variant:"end"} },
      ],
      [
        { id:"e1",source:"n1",target:"n2"},
        { id:"e2",source:"n2",target:"n3"},
        { id:"e3",source:"n3",target:"n4"},
        { id:"e4",source:"n4",target:"n5"},
        { id:"e5",source:"n5",target:"n6",sourceHandle:"yes"},
        { id:"e6",source:"n6",target:"n7"},
        { id:"e7",source:"n7",target:"n5"},
        { id:"e8",source:"n5",target:"n8",sourceHandle:"no"},
        { id:"e9",source:"n8",target:"n9"},
        { id:"e10",source:"n9",target:"n10"},
      ]
    )
    const e = new ExecutionEngine(graph)
    e.start()
    submitNextInput(e, "3")
    submitNextInput(e, "10")
    submitNextInput(e, "20")
    submitNextInput(e, "30")
    const mediaStep = stepUntil(e, (step) => step.nodeId === "n8")
    expect(mediaStep?.nodeType).toBe("process")
    const out = stepUntil(e, (step) => step.nodeType === "output")
    expect(out?.output).toBe("Média: 20")
  })

  it("executa decisão composta e aninhada", () => {
    const e = new ExecutionEngine(g(
      [
        { id:"n1", type:"startEnd", position:{x:0,y:0}, data:{variant:"start"} },
        { id:"n2", type:"memory", position:{x:0,y:80}, data:{rows:[{type:"inteiro",variables:"a, b, resultado"}]} },
        { id:"n3", type:"process", position:{x:0,y:160}, data:{label:"a = 3; b = 7"} },
        { id:"n4", type:"decision", position:{x:0,y:240}, data:{label:"a < b e b > 0"} },
        { id:"n5", type:"decision", position:{x:120,y:320}, data:{label:"b > 5"} },
        { id:"n6", type:"process", position:{x:220,y:400}, data:{label:"resultado = 1"} },
        { id:"n7", type:"process", position:{x:20,y:400}, data:{label:"resultado = 2"} },
        { id:"n8", type:"process", position:{x:-160,y:320}, data:{label:"resultado = 3"} },
        { id:"n9", type:"output", position:{x:0,y:480}, data:{label:"resultado"} },
        { id:"n10", type:"startEnd", position:{x:0,y:560}, data:{variant:"end"} },
      ],
      [
        { id:"e1", source:"n1", target:"n2" },
        { id:"e2", source:"n2", target:"n3" },
        { id:"e3", source:"n3", target:"n4" },
        { id:"e4", source:"n4", target:"n5", sourceHandle:"yes" },
        { id:"e5", source:"n4", target:"n8", sourceHandle:"no" },
        { id:"e6", source:"n5", target:"n6", sourceHandle:"yes" },
        { id:"e7", source:"n5", target:"n7", sourceHandle:"no" },
        { id:"e8", source:"n6", target:"n9" },
        { id:"e9", source:"n7", target:"n9" },
        { id:"e10", source:"n8", target:"n9" },
        { id:"e11", source:"n9", target:"n10" },
      ],
    ))

    e.start()
    while (e.step() !== null) { /* execute até o fim */ }

    expect(e.getCurrentOutputs()).toEqual(["1"])
  })

  it("executa faça-enquanto antes de avaliar a condição", () => {
    const e = new ExecutionEngine(g(
      [
        { id:"n1", type:"startEnd", position:{x:0,y:0}, data:{variant:"start"} },
        { id:"n2", type:"memory", position:{x:0,y:80}, data:{rows:[{type:"inteiro",variables:"i, soma"}]} },
        { id:"n3", type:"process", position:{x:0,y:160}, data:{label:"i = 0; soma = 0"} },
        { id:"n4", type:"process", position:{x:0,y:240}, data:{label:"i = i + 1; soma = soma + i"} },
        { id:"n5", type:"decision", position:{x:0,y:320}, data:{label:"i < 3"} },
        { id:"n6", type:"output", position:{x:0,y:400}, data:{label:"soma"} },
        { id:"n7", type:"startEnd", position:{x:0,y:480}, data:{variant:"end"} },
      ],
      [
        { id:"e1", source:"n1", target:"n2" },
        { id:"e2", source:"n2", target:"n3" },
        { id:"e3", source:"n3", target:"n4" },
        { id:"e4", source:"n4", target:"n5" },
        { id:"e5", source:"n5", target:"n4", sourceHandle:"yes" },
        { id:"e6", source:"n5", target:"n6", sourceHandle:"no" },
        { id:"e7", source:"n6", target:"n7" },
      ],
    ))

    e.start()
    while (e.step() !== null) { /* execute até o fim */ }

    expect(e.getCurrentOutputs()).toEqual(["6"])
  })

  it("lê vetor por índice variável em uma expressão", () => {
    const e = new ExecutionEngine(g(
      [
        { id:"n1", type:"startEnd", position:{x:0,y:0}, data:{variant:"start"} },
        { id:"n2", type:"memory", position:{x:0,y:80}, data:{rows:[{type:"inteiro",variables:"i, total, notas[2]"}]} },
        { id:"n3", type:"process", position:{x:0,y:160}, data:{label:"i = 1; notas[0] = 10; notas[i] = 20; total = notas[0] + notas[i]"} },
        { id:"n4", type:"output", position:{x:0,y:240}, data:{label:"total"} },
        { id:"n5", type:"startEnd", position:{x:0,y:320}, data:{variant:"end"} },
      ],
      [
        { id:"e1", source:"n1", target:"n2" },
        { id:"e2", source:"n2", target:"n3" },
        { id:"e3", source:"n3", target:"n4" },
        { id:"e4", source:"n4", target:"n5" },
      ],
    ))

    e.start()
    e.step()
    const process = e.step()
    expect(process?.variables.find((variable) => variable.name === "total")?.value).toBe("30")
    expect(e.step()?.output).toBe("30")
  })
})
