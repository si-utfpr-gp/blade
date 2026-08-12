import { describe, it, expect } from "vitest"
import { parse } from "../../parser/parser"
import { CodeGenerator } from "../../engine/CodeGenerator"
import type { Node, Edge } from "@xyflow/react"
import type { IExecutionStep } from "../../interfaces/execution"

function g(nodes: Node[], edges: Edge[]) { return parse(nodes, edges) }

describe("CodeGenerator", () => {
  it("generate() converte memory — variáveis simples", () => {
    const gen = new CodeGenerator(g(
      [{ id:"n1",type:"startEnd",position:{x:0,y:0},data:{variant:"start"} },
       { id:"n2",type:"memory",position:{x:0,y:80},data:{rows:[{type:"inteiro",variables:"num1, num2, soma"}]} },
       { id:"n3",type:"startEnd",position:{x:0,y:200},data:{variant:"end"} }],
      [{ id:"e1",source:"n1",target:"n2"},{ id:"e2",source:"n2",target:"n3"}]
    ))
    const code = gen.generate()
    expect(code).toContain("num1;")
    expect(code).toContain("num2;")
    expect(code).toContain("soma;")
  })

  it("generate() converte memory — array", () => {
    const gen = new CodeGenerator(g(
      [{ id:"n1",type:"startEnd",position:{x:0,y:0},data:{variant:"start"} },
       { id:"n2",type:"memory",position:{x:0,y:80},data:{rows:[{type:"inteiro",variables:"notas[5]"}]} },
       { id:"n3",type:"startEnd",position:{x:0,y:200},data:{variant:"end"} }],
      [{ id:"e1",source:"n1",target:"n2"},{ id:"e2",source:"n2",target:"n3"}]
    ))
    const code = gen.generate()
    expect(code).toContain("let notas = new Array(5);")
  })

  it("generate() converte memory — tipo caractere", () => {
    const gen = new CodeGenerator(g(
      [{ id:"n1",type:"startEnd",position:{x:0,y:0},data:{variant:"start"} },
       { id:"n2",type:"memory",position:{x:0,y:80},data:{rows:[{type:"caractere",variables:"nome"}]} },
       { id:"n3",type:"startEnd",position:{x:0,y:200},data:{variant:"end"} }],
      [{ id:"e1",source:"n1",target:"n2"},{ id:"e2",source:"n2",target:"n3"}]
    ))
    const code = gen.generate()
    expect(code).toContain("let nome;")
  })

  it("generate() converte input sem memory como texto", () => {
    const gen = new CodeGenerator(g(
      [{ id:"n1",type:"startEnd",position:{x:0,y:0},data:{variant:"start"} },
       { id:"n2",type:"input",position:{x:0,y:100},data:{label:"num1"} },
       { id:"n3",type:"startEnd",position:{x:0,y:200},data:{variant:"end"} }],
      [{ id:"e1",source:"n1",target:"n2"},{ id:"e2",source:"n2",target:"n3"}]
    ))
    const code = gen.generate({ lang: "js" })
    expect(code).toContain('num1 = (prompt("Valor para num1:") ?? "");')
  })

  it("generate() converte input inteiro declarado com Number.parseInt", () => {
    const gen = new CodeGenerator(g(
      [{ id:"n1",type:"startEnd",position:{x:0,y:0},data:{variant:"start"} },
       { id:"n2",type:"memory",position:{x:0,y:80},data:{rows:[{type:"inteiro",variables:"num1"}]} },
       { id:"n3",type:"input",position:{x:0,y:100},data:{label:"num1"} },
       { id:"n4",type:"startEnd",position:{x:0,y:200},data:{variant:"end"} }],
      [{ id:"e1",source:"n1",target:"n2"},{ id:"e2",source:"n2",target:"n3"},{ id:"e3",source:"n3",target:"n4"}]
    ))
    const code = gen.generate({ lang: "js" })
    expect(code).toContain('num1 = Number.parseInt((prompt("Valor para num1:") ?? ""), 10);')
  })

  it("generate() converte output — console.log", () => {
    const gen = new CodeGenerator(g(
      [{ id:"n1",type:"startEnd",position:{x:0,y:0},data:{variant:"start"} },
       { id:"n2",type:"output",position:{x:0,y:100},data:{label:'"Resultado: " + soma'} },
       { id:"n3",type:"startEnd",position:{x:0,y:200},data:{variant:"end"} }],
      [{ id:"e1",source:"n1",target:"n2"},{ id:"e2",source:"n2",target:"n3"}]
    ))
    const code = gen.generate()
    expect(code).toContain('console.log("Resultado: " + soma);')
  })

  it("generate() converte process — atribuição simples", () => {
    const gen = new CodeGenerator(g(
      [{ id:"n1",type:"startEnd",position:{x:0,y:0},data:{variant:"start"} },
       { id:"n2",type:"process",position:{x:0,y:100},data:{label:"soma = num1 + num2"} },
       { id:"n3",type:"startEnd",position:{x:0,y:200},data:{variant:"end"} }],
      [{ id:"e1",source:"n1",target:"n2"},{ id:"e2",source:"n2",target:"n3"}]
    ))
    const code = gen.generate()
    expect(code).toContain("soma = num1 + num2;")
  })

  it("generate() converte process — múltiplos statements", () => {
    const gen = new CodeGenerator(g(
      [{ id:"n1",type:"startEnd",position:{x:0,y:0},data:{variant:"start"} },
       { id:"n2",type:"process",position:{x:0,y:100},data:{label:"soma = 0; i = 1"} },
       { id:"n3",type:"startEnd",position:{x:0,y:200},data:{variant:"end"} }],
      [{ id:"e1",source:"n1",target:"n2"},{ id:"e2",source:"n2",target:"n3"}]
    ))
    const code = gen.generate()
    expect(code).toContain("soma = 0;")
    expect(code).toContain("i = 1;")
  })

  it("generate() converte subroutine — chamada de função", () => {
    const gen = new CodeGenerator(g(
      [{ id:"n1",type:"startEnd",position:{x:0,y:0},data:{variant:"start"} },
       { id:"n2",type:"subroutine",position:{x:0,y:100},data:{label:"fatorial(n)"} },
       { id:"n3",type:"startEnd",position:{x:0,y:200},data:{variant:"end"} }],
      [{ id:"e1",source:"n1",target:"n2"},{ id:"e2",source:"n2",target:"n3"}]
    ))
    const code = gen.generate()
    expect(code).toContain("fatorial(n);")
  })

  it("generate() converte decision — if com yes apenas", () => {
    const gen = new CodeGenerator(g(
      [{ id:"n1",type:"startEnd",position:{x:0,y:0},data:{variant:"start"} },
       { id:"n2",type:"decision",position:{x:0,y:100},data:{label:"n > 5"} },
       { id:"n3",type:"startEnd",position:{x:0,y:200},data:{variant:"end"} }],
      [{ id:"e1",source:"n1",target:"n2"},
       { id:"e2",source:"n2",target:"n3",sourceHandle:"yes"}]
    ))
    const code = gen.generate()
    expect(code).toContain("if (n > 5) {")
    expect(code).toContain("// Fim do algoritmo")
    expect(code).toContain("}")
  })

  it("generate() converte decision — if/else com ambos caminhos", () => {
    const gen = new CodeGenerator(g(
      [{ id:"n1",type:"startEnd",position:{x:0,y:0},data:{variant:"start"} },
       { id:"n2",type:"decision",position:{x:0,y:100},data:{label:"n > 5"} },
       { id:"n3",type:"startEnd",position:{x:200,y:200},data:{variant:"end",label:"Fim"} },
       { id:"n4",type:"startEnd",position:{x:0,y:200},data:{variant:"end",label:"Fim"} }],
      [{ id:"e1",source:"n1",target:"n2"},
       { id:"e2",source:"n2",target:"n3",sourceHandle:"yes"},
       { id:"e3",source:"n2",target:"n4",sourceHandle:"no"}]
    ))
    const code = gen.generate()
    expect(code).toContain("if (n > 5) {")
    expect(code).toContain("} else {")
    expect(code).toContain("}")
  })

  it("generate() ignora connector", () => {
    const gen = new CodeGenerator(g(
      [{ id:"n1",type:"startEnd",position:{x:0,y:0},data:{variant:"start"} },
       { id:"n2",type:"connector",position:{x:0,y:80},data:{} },
       { id:"n3",type:"startEnd",position:{x:0,y:160},data:{variant:"end"} }],
      [{ id:"e1",source:"n1",target:"n2"},{ id:"e2",source:"n2",target:"n3"}]
    ))
    const code = gen.generate()
    expect(code).not.toContain("connector")
    expect(code).toContain("// Início do algoritmo")
    expect(code).toContain("// Fim do algoritmo")
  })

  it("generate() converte decision com nós dentro dos branches", () => {
    const gen = new CodeGenerator(g(
      [{ id:"n1",type:"startEnd",position:{x:0,y:0},data:{variant:"start"} },
       { id:"n2",type:"memory",position:{x:0,y:80},data:{rows:[{type:"inteiro",variables:"x"}]} },
       { id:"n3",type:"decision",position:{x:0,y:180},data:{label:"x > 0"} },
       { id:"n4",type:"process",position:{x:200,y:280},data:{label:"resultado = \"positivo\""} },
       { id:"n5",type:"process",position:{x:0,y:280},data:{label:"resultado = \"negativo\""} },
       { id:"n6",type:"startEnd",position:{x:0,y:400},data:{variant:"end"} }],
      [{ id:"e1",source:"n1",target:"n2"},{ id:"e2",source:"n2",target:"n3"},
       { id:"e3",source:"n3",target:"n4",sourceHandle:"yes"},
       { id:"e4",source:"n3",target:"n5",sourceHandle:"no"},
       { id:"e5",source:"n4",target:"n6"},{ id:"e6",source:"n5",target:"n6"}]
    ))
    const code = gen.generate()
    expect(code).toContain("if (x > 0) {")
    expect(code).toContain('resultado = "positivo";')
    expect(code).toContain("} else {")
    expect(code).toContain('resultado = "negativo";')
    expect(code).toContain("}")
    expect(code).toContain("// Fim do algoritmo")
  })

  it("generate() converte start e end para comentários", () => {
    const gen = new CodeGenerator(g(
      [{ id:"n1",type:"startEnd",position:{x:0,y:0},data:{variant:"start",label:"Início"} },
       { id:"n2",type:"startEnd",position:{x:0,y:100},data:{variant:"end",label:"Fim"} }],
      [{ id:"e1",source:"n1",target:"n2" }]
    ))
    const code = gen.generate()
    expect(code).toContain("// Início do algoritmo")
    expect(code).toContain("// Fim do algoritmo")
  })

  it("generate({ lang: 'ts' }) adiciona tipos nas variáveis", () => {
    const gen = new CodeGenerator(g(
      [{ id:"n1",type:"startEnd",position:{x:0,y:0},data:{variant:"start"} },
       { id:"n2",type:"memory",position:{x:0,y:80},data:{rows:[{type:"inteiro",variables:"x"}, {type:"caractere",variables:"nome"}]} },
       { id:"n3",type:"startEnd",position:{x:0,y:200},data:{variant:"end"} }],
      [{ id:"e1",source:"n1",target:"n2"},{ id:"e2",source:"n2",target:"n3"}]
    ))
    const code = gen.generate({ lang: "ts" })
    expect(code).toContain("let x: number;")
    expect(code).toContain("let nome: string;")
  })

  it("generate({ lang: 'ts' }) usa tipo declarado no input", () => {
    const gen = new CodeGenerator(g(
      [{ id:"n1",type:"startEnd",position:{x:0,y:0},data:{variant:"start"} },
       { id:"n2",type:"memory",position:{x:0,y:80},data:{rows:[{type:"inteiro",variables:"num"}]} },
       { id:"n3",type:"input",position:{x:0,y:100},data:{label:"num"} },
       { id:"n4",type:"startEnd",position:{x:0,y:200},data:{variant:"end"} }],
      [{ id:"e1",source:"n1",target:"n2"},{ id:"e2",source:"n2",target:"n3"},{ id:"e3",source:"n3",target:"n4"}]
    ))
    const code = gen.generate({ lang: "ts" })
    expect(code).toContain('let num: number;')
    expect(code).toContain('num = Number.parseInt((prompt("Valor para num:") ?? ""), 10);')
  })

  it("generateFromSteps() converte steps em código", () => {
    const gen = new CodeGenerator(g(
      [{ id:"n1",type:"startEnd",position:{x:0,y:0},data:{variant:"start",label:"Início"} },
       { id:"n2",type:"startEnd",position:{x:0,y:100},data:{variant:"end",label:"Fim"} }],
      [{ id:"e1",source:"n1",target:"n2" }]
    ))
    const steps: IExecutionStep[] = [
      { nodeId:"n1", nodeLabel:"Início", nodeType:"startEnd", variables:[], log:"", explanation:"", changes:[], nextHint:"" },
      { nodeId:"n2", nodeLabel:"Fim", nodeType:"startEnd", variables:[], log:"", explanation:"", changes:[], nextHint:"" },
    ]
    const code = gen.generateFromSteps(steps)
    expect(code).toContain("// Início do algoritmo")
    expect(code).toContain("// Fim do algoritmo")
  })

  it("generateFromSteps() inclui memory do grafo", () => {
    const gen = new CodeGenerator(g(
      [{ id:"n1",type:"startEnd",position:{x:0,y:0},data:{variant:"start"} },
       { id:"n2",type:"memory",position:{x:0,y:80},data:{rows:[{type:"inteiro",variables:"x"}]} },
       { id:"n3",type:"process",position:{x:0,y:200},data:{label:"x = 10"} },
       { id:"n4",type:"startEnd",position:{x:0,y:320},data:{variant:"end"} }],
      [{ id:"e1",source:"n1",target:"n2"},{ id:"e2",source:"n2",target:"n3"},{ id:"e3",source:"n3",target:"n4"}]
    ))
    const steps: IExecutionStep[] = [
      { nodeId:"n1", nodeLabel:"Início", nodeType:"startEnd", variables:[], log:"", explanation:"", changes:[], nextHint:"" },
      { nodeId:"n3", nodeLabel:"x = 10", nodeType:"process", variables:[], log:"", explanation:"", changes:[], nextHint:"" },
      { nodeId:"n4", nodeLabel:"Fim", nodeType:"startEnd", variables:[], log:"", explanation:"", changes:[], nextHint:"" },
    ]
    const code = gen.generateFromSteps(steps)
    expect(code).toContain("let x;")
    expect(code).toContain("x = 10;")
    expect(code).toContain("// Fim do algoritmo")
  })

  it("gera código completo — soma de dois números (JS)", () => {
    const gen = new CodeGenerator(g(
      [{ id:"n1",type:"startEnd",position:{x:250,y:0},data:{label:"Início",variant:"start"} },
       { id:"n2",type:"memory",position:{x:220,y:80},data:{rows:[{type:"inteiro",variables:"num1, num2, soma"}]} },
       { id:"n3",type:"input",position:{x:240,y:200},data:{label:"num1, num2"} },
       { id:"n4",type:"process",position:{x:230,y:310},data:{label:"soma = num1 + num2"} },
       { id:"n5",type:"output",position:{x:240,y:420},data:{label:'"A soma é: " + soma'} },
       { id:"n6",type:"startEnd",position:{x:250,y:530},data:{label:"Fim",variant:"end"} }],
      [{ id:"e1",source:"n1",target:"n2"},{ id:"e2",source:"n2",target:"n3"},
       { id:"e3",source:"n3",target:"n4"},{ id:"e4",source:"n4",target:"n5"},
       { id:"e5",source:"n5",target:"n6"}]
    ))
    const code = gen.generate()
    expect(code).toContain("// Início do algoritmo")
    expect(code).toContain("let num1;")
    expect(code).toContain("let num2;")
    expect(code).toContain("let soma;")
    expect(code).toContain('num1 = Number.parseInt((prompt("Valor para num1:") ?? ""), 10);')
    expect(code).toContain('num2 = Number.parseInt((prompt("Valor para num2:") ?? ""), 10);')
    expect(code).toContain("soma = num1 + num2;")
    expect(code).toContain('console.log("A soma é: " + soma);')
    expect(code).toContain("// Fim do algoritmo")
  })

  it("generate({ lang: 'ts' }) array com tipo", () => {
    const gen = new CodeGenerator(g(
      [{ id:"n1",type:"startEnd",position:{x:0,y:0},data:{variant:"start"} },
       { id:"n2",type:"memory",position:{x:0,y:80},data:{rows:[{type:"inteiro",variables:"notas[5]"}]} },
       { id:"n3",type:"startEnd",position:{x:0,y:200},data:{variant:"end"} }],
      [{ id:"e1",source:"n1",target:"n2"},{ id:"e2",source:"n2",target:"n3"}]
    ))
    const code = gen.generate({ lang: "ts" })
    expect(code).toContain("let notas: number[] = new Array(5);")
  })

  it("generate() traduz decisão com operadores Portugol", () => {
    const gen = new CodeGenerator(g(
      [{ id:"n1",type:"startEnd",position:{x:0,y:0},data:{variant:"start"} },
       { id:"n2",type:"decision",position:{x:0,y:100},data:{label:"nota >= 0 e nota <= 10"} },
       { id:"n3",type:"output",position:{x:0,y:200},data:{label:"'ok'"} },
       { id:"n4",type:"startEnd",position:{x:0,y:300},data:{variant:"end"} }],
      [{ id:"e1",source:"n1",target:"n2"},
       { id:"e2",source:"n2",target:"n3",sourceHandle:"yes"},
       { id:"e3",source:"n3",target:"n4"}]
    ))
    const code = gen.generate()
    expect(code).toContain("if (nota >= 0 && nota <= 10) {")
  })

  it("generate() gera while quando decisão retorna para ela mesma pelo ramo yes", () => {
    const gen = new CodeGenerator(g(
      [{ id:"n1",type:"startEnd",position:{x:0,y:0},data:{variant:"start"} },
       { id:"n2",type:"memory",position:{x:0,y:80},data:{rows:[{type:"inteiro",variables:"n, i"}]} },
       { id:"n3",type:"process",position:{x:0,y:160},data:{label:"i = 0"} },
       { id:"n4",type:"decision",position:{x:0,y:240},data:{label:"i < n"} },
       { id:"n5",type:"process",position:{x:0,y:320},data:{label:"i = i + 1"} },
       { id:"n6",type:"startEnd",position:{x:0,y:400},data:{variant:"end"} }],
      [{ id:"e1",source:"n1",target:"n2"},{ id:"e2",source:"n2",target:"n3"},{ id:"e3",source:"n3",target:"n4"},
       { id:"e4",source:"n4",target:"n5",sourceHandle:"yes"},{ id:"e5",source:"n5",target:"n4"},
       { id:"e6",source:"n4",target:"n6",sourceHandle:"no"}]
    ))
    const code = gen.generate()
    expect(code).toContain("while (i < n) {")
    expect(code).toContain("  i = i + 1;")
    expect(code).toContain("// Fim do algoritmo")
  })

  it("generate() usa parseFloat e boolean para tipos real/logico", () => {
    const gen = new CodeGenerator(g(
      [{ id:"n1",type:"startEnd",position:{x:0,y:0},data:{variant:"start"} },
       { id:"n2",type:"memory",position:{x:0,y:80},data:{rows:[{type:"real",variables:"nota"},{type:"logico",variables:"ok"}]} },
       { id:"n3",type:"input",position:{x:0,y:160},data:{label:"nota, ok"} },
       { id:"n4",type:"startEnd",position:{x:0,y:240},data:{variant:"end"} }],
      [{ id:"e1",source:"n1",target:"n2"},{ id:"e2",source:"n2",target:"n3"},{ id:"e3",source:"n3",target:"n4"}]
    ))
    const code = gen.generate()
    expect(code).toContain('nota = Number.parseFloat((prompt("Valor para nota:") ?? ""));')
    expect(code).toContain('ok = ["verdadeiro", "v", "true", "1"].includes((prompt("Valor para ok:") ?? "").trim().toLowerCase());')
  })

})
