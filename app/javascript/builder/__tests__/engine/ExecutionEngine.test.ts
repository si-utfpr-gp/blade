import { describe, it, expect } from "vitest"
import { parse } from "../../parser/parser"
import { ExecutionEngine } from "../../engine/ExecutionEngine"
import type { Node, Edge } from "@xyflow/react"

function g(nodes: Node[], edges: Edge[]) { return parse(nodes, edges) }

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

  it("step() avança pulando memory", () => {
    const e = new ExecutionEngine(g(
      [{ id:"n1",type:"startEnd",position:{x:0,y:0},data:{variant:"start"} },
       { id:"n2",type:"memory",position:{x:0,y:80},data:{rows:[{type:"inteiro",variables:"x"}]} },
       { id:"n3",type:"process",position:{x:0,y:200},data:{label:"x = 10"} },
       { id:"n4",type:"startEnd",position:{x:0,y:320},data:{variant:"end"} }],
      [{ id:"e1",source:"n1",target:"n2"},{ id:"e2",source:"n2",target:"n3"},{ id:"e3",source:"n3",target:"n4"}]
    ))
    e.start()
    const s2 = e.step()
    expect(s2?.nodeType).toBe("process")
    expect(s2?.variables.find(v=>v.name==="x")?.value).toBe("10")
    const s3 = e.step()
    expect(s3?.nodeType).toBe("startEnd")
    expect(e.getCurrentState().finished).toBe(true)
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
    const ds = e.step()
    expect(ds?.log).toContain("V")
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

  it("restores memory, outputs, and the next node for a selected snapshot", () => {
    const e = inputProcessOutputEngine()
    e.start()
    e.step("25")
    e.step()
    e.step()

    expect(e.goToStep(0)).toBe(true)
    expect(e.getCurrentState().variables.has("x")).toBe(false)
    expect(e.getCurrentOutputs()).toEqual([])
    expect(e.step()).toMatchObject({ waitingForInput: true, inputVariable: "x" })
  })

  it("replaces later steps after a new input instead of adding duplicates", () => {
    const e = inputProcessOutputEngine()
    e.start()
    e.step("25")
    e.step()
    e.goToStep(0)
    e.step("10")

    expect(e.getSteps()).toHaveLength(2)
    expect(e.getSteps()[1].variables.find((v) => v.name === "x")?.value).toBe("10")
    expect(e.currentStepIndex).toBe(1)
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
    e.step()
    e.step("5")
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
    e.step()      // entrada n (aguardando)
    e.step("3")   // n = 3
    e.step()      // soma = 0; i = 0
    e.step()      // decision i < 3 -> sim
    e.step("10")  // nota = 10
    e.step()      // notas[0] = 10
    e.step()      // decision -> sim
    e.step("20")  // nota = 20
    e.step()
    e.step()
    e.step("30")
    e.step()
    e.step()      // decision i < 3 -> nao
    const mediaStep = e.step() // media = soma / n
    expect(mediaStep?.nodeType).toBe("process")
    const out = e.step()
    expect(out?.output).toBe("Média: 20")
  })
})
