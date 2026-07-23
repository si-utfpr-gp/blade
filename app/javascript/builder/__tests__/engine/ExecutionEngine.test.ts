import { describe, it, expect } from "vitest"
import { parse } from "../../parser/parser"
import { ExecutionEngine } from "../../engine/ExecutionEngine"
import type { Node, Edge } from "@xyflow/react"

function g(nodes: Node[], edges: Edge[]) { return parse(nodes, edges) }

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
})