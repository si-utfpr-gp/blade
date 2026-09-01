import { describe, it, expect } from "vitest"
import { parse } from "../../parser/parser"
import { CodeGenerator } from "../../engine/CodeGenerator"
import type { Node, Edge } from "@xyflow/react"
import type { IExecutionStep } from "../../interfaces/execution"

function g(nodes: Node[], edges: Edge[]) { return parse(nodes, edges) }

function subroutineDobroGraph() {
  return parse(
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
  )
}


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

  it("generate() inicializa variável declarada na memória", () => {
    const gen = new CodeGenerator(g(
      [{ id:"n1",type:"startEnd",position:{x:0,y:0},data:{variant:"start"} },
       { id:"n2",type:"memory",position:{x:0,y:80},data:{rows:[{type:"inteiro",variables:"soma",initialValue:"0"}]} },
       { id:"n3",type:"startEnd",position:{x:0,y:200},data:{variant:"end"} }],
      [{ id:"e1",source:"n1",target:"n2"},{ id:"e2",source:"n2",target:"n3"}]
    ))

    expect(gen.generate({ lang: "js" })).toContain("let soma = 0;")
    expect(gen.generate({ lang: "ts" })).toContain("let soma: number = 0;")
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

  it("generate() quebra input sem memory em leitura e atribuição de texto", () => {
    const gen = new CodeGenerator(g(
      [{ id:"n1",type:"startEnd",position:{x:0,y:0},data:{variant:"start"} },
       { id:"n2",type:"input",position:{x:0,y:100},data:{label:"num1"} },
       { id:"n3",type:"startEnd",position:{x:0,y:200},data:{variant:"end"} }],
      [{ id:"e1",source:"n1",target:"n2"},{ id:"e2",source:"n2",target:"n3"}]
    ))
    const code = gen.generate({ lang: "js" })
    expect(code).toContain("let textoDigitado;")
    expect(code).toContain('textoDigitado = prompt("Valor para num1:") ?? "";')
    expect(code).toContain("num1 = textoDigitado;")
  })

  it("generate() quebra input inteiro declarado em leitura e conversão", () => {
    const gen = new CodeGenerator(g(
      [{ id:"n1",type:"startEnd",position:{x:0,y:0},data:{variant:"start"} },
       { id:"n2",type:"memory",position:{x:0,y:80},data:{rows:[{type:"inteiro",variables:"num1"}]} },
       { id:"n3",type:"input",position:{x:0,y:100},data:{label:"num1"} },
       { id:"n4",type:"startEnd",position:{x:0,y:200},data:{variant:"end"} }],
      [{ id:"e1",source:"n1",target:"n2"},{ id:"e2",source:"n2",target:"n3"},{ id:"e3",source:"n3",target:"n4"}]
    ))
    const code = gen.generate({ lang: "js" })
    expect(code).toContain("let textoDigitado;")
    expect(code).toContain('textoDigitado = prompt("Valor para num1:") ?? "";')
    expect(code).toContain("num1 = Number.parseInt(textoDigitado, 10);")
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

  it("generates function declarations for visual subroutines", () => {
    const gen = new CodeGenerator(subroutineDobroGraph())
    const code = gen.generate({ lang: "ts" })
    const jsCode = gen.generate({ lang: "js" })

    expect(code).toContain("function dobro(valor: number): number {")
    expect(code).toContain("let retorno: number;")
    expect(code).toContain("retorno = valor * 2;")
    expect(code).toContain("return retorno;")
    expect(code).toContain("resultado = dobro(n);")
    expect(jsCode).toContain("function dobro(valor) {")
    expect(jsCode.indexOf("function dobro(valor) {")).toBeLessThan(jsCode.indexOf("resultado = dobro(n);"))
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

  it("generate() routes through connectors without emitting them", () => {
    const gen = new CodeGenerator(g(
      [{ id:"n1",type:"startEnd",position:{x:0,y:0},data:{variant:"start"} },
       { id:"n2",type:"process",position:{x:0,y:80},data:{label:"antes = 1"} },
       { id:"n3",type:"connector",position:{x:0,y:160},data:{} },
       { id:"n4",type:"process",position:{x:0,y:240},data:{label:"depois = 2"} },
       { id:"n5",type:"startEnd",position:{x:0,y:320},data:{variant:"end"} }],
      [{ id:"e1",source:"n1",target:"n2"},{ id:"e2",source:"n2",target:"n3"},
       { id:"e3",source:"n3",target:"n4"},{ id:"e4",source:"n4",target:"n5"}]
    ))
    const code = gen.generate()
    expect(code).not.toContain("connector")
    expect(code).toContain("antes = 1;")
    expect(code).toContain("depois = 2;")
    expect(code.indexOf("antes = 1;")).toBeLessThan(code.indexOf("depois = 2;"))
    expect(code).toContain("// Início do algoritmo")
    expect(code).toContain("// Fim do algoritmo")
  })

  it("generate() preserves the order of sequential process nodes", () => {
    const gen = new CodeGenerator(g(
      [
        { id: "n1", type: "startEnd", position: { x: 0, y: 0 }, data: { variant: "start" } },
        { id: "n2", type: "process", position: { x: 0, y: 80 }, data: { label: "a = 1" } },
        { id: "n3", type: "process", position: { x: 0, y: 160 }, data: { label: "b = a + 1" } },
        { id: "n4", type: "startEnd", position: { x: 0, y: 240 }, data: { variant: "end" } },
      ],
      [{ id: "e1", source: "n1", target: "n2" }, { id: "e2", source: "n2", target: "n3" }, { id: "e3", source: "n3", target: "n4" }],
    ))

    const code = gen.generate()

    expect(code.indexOf("a = 1;")).toBeLessThan(code.indexOf("b = a + 1;"))
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
    expect(code).toContain('let textoDigitado: string;')
    expect(code).toContain('textoDigitado = prompt("Valor para num:") ?? "";')
    expect(code).toContain('num = Number.parseInt(textoDigitado, 10);')
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
    expect(code).toContain("let textoDigitado;")
    expect(code).toContain('textoDigitado = prompt("Valor para num1:") ?? "";')
    expect(code).toContain("num1 = Number.parseInt(textoDigitado, 10);")
    expect(code).toContain('textoDigitado = prompt("Valor para num2:") ?? "";')
    expect(code).toContain("num2 = Number.parseInt(textoDigitado, 10);")
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

  it("generate() preserves the canonical visual for-loop flow as a while loop", () => {
    const gen = new CodeGenerator(g(
      [
        { id: "n1", type: "startEnd", position: { x: 0, y: 0 }, data: { variant: "start" } },
        { id: "n2", type: "memory", position: { x: 0, y: 80 }, data: { rows: [{ type: "inteiro", variables: "n, i, soma" }] } },
        { id: "n3", type: "process", position: { x: 0, y: 160 }, data: { label: "i = 0; soma = 0" } },
        { id: "n4", type: "decision", position: { x: 0, y: 240 }, data: { label: "i < n" } },
        { id: "n5", type: "process", position: { x: 0, y: 320 }, data: { label: "soma = soma + i" } },
        { id: "n6", type: "process", position: { x: 0, y: 400 }, data: { label: "i = i + 1" } },
        { id: "n7", type: "connector", position: { x: 0, y: 480 }, data: {} },
        { id: "n8", type: "output", position: { x: 0, y: 560 }, data: { label: "soma" } },
        { id: "n9", type: "startEnd", position: { x: 0, y: 640 }, data: { variant: "end" } },
      ],
      [
        { id: "e1", source: "n1", target: "n2" }, { id: "e2", source: "n2", target: "n3" },
        { id: "e3", source: "n3", target: "n4" }, { id: "e4", source: "n4", target: "n5", sourceHandle: "yes" },
        { id: "e5", source: "n5", target: "n6" }, { id: "e6", source: "n6", target: "n7" },
        { id: "e7", source: "n7", target: "n4" }, { id: "e8", source: "n4", target: "n8", sourceHandle: "no" },
        { id: "e9", source: "n8", target: "n9" },
      ],
    ))

    const code = gen.generate()

    expect(code).toContain("i = 0;")
    expect(code).toContain("while (i < n) {")
    expect(code).toContain("  soma = soma + i;")
    expect(code).toContain("  i = i + 1;")
    expect(code).not.toContain("fluxo retorna")
    expect(code).toContain("console.log(soma);")
  })

  it("generate() gera do-while quando o ramo verdadeiro retorna ao corpo antes da decisão", () => {
    const gen = new CodeGenerator(g(
      [
        { id: "n1", type: "startEnd", position: { x: 0, y: 0 }, data: { variant: "start" } },
        { id: "n2", type: "memory", position: { x: 0, y: 80 }, data: { rows: [{ type: "inteiro", variables: "num" }, { type: "inteiro", variables: "soma", initialValue: "0" }] } },
        { id: "n3", type: "connector", position: { x: 0, y: 160 }, data: {} },
        { id: "n4", type: "input", position: { x: 0, y: 240 }, data: { label: "num" } },
        { id: "n5", type: "process", position: { x: 0, y: 320 }, data: { label: "soma = soma + num" } },
        { id: "n6", type: "decision", position: { x: 0, y: 400 }, data: { label: "num != 0" } },
        { id: "n7", type: "connector", position: { x: 200, y: 480 }, data: {} },
        { id: "n8", type: "connector", position: { x: -200, y: 480 }, data: {} },
        { id: "n9", type: "output", position: { x: 0, y: 560 }, data: { label: "'A soma é: ' + soma" } },
        { id: "n10", type: "startEnd", position: { x: 0, y: 640 }, data: { variant: "end" } },
      ],
      [
        { id: "e1", source: "n1", target: "n2" }, { id: "e2", source: "n2", target: "n3" },
        { id: "e3", source: "n3", target: "n4" }, { id: "e4", source: "n4", target: "n5" },
        { id: "e5", source: "n5", target: "n6" }, { id: "e6", source: "n6", target: "n7", sourceHandle: "yes" },
        { id: "e7", source: "n7", target: "n4" }, { id: "e8", source: "n6", target: "n8", sourceHandle: "no" },
        { id: "e9", source: "n8", target: "n9" }, { id: "e10", source: "n9", target: "n10" },
      ],
    ))

    const code = gen.generate()
    const tsCode = gen.generate({ lang: "ts" })

    expect(code).toContain("do {")
    expect(code).toContain('  textoDigitado = prompt("Valor para num:") ?? "";')
    expect(code).toContain("  num = Number.parseInt(textoDigitado, 10);")
    expect(code).toContain("  soma = soma + num;")
    expect(code).toContain("} while (num !== 0);")
    expect(code).not.toContain("fluxo retorna")
    expect(code).toContain("console.log('A soma é: ' + soma);")
    expect(tsCode).toContain("let num: number;")
    expect(tsCode).toContain("let soma: number = 0;")
    expect(tsCode).toContain("} while (num !== 0);")
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
    expect(code).toContain('textoDigitado = prompt("Valor para nota:") ?? "";')
    expect(code).toContain("nota = Number.parseFloat(textoDigitado);")
    expect(code).toContain('textoDigitado = prompt("Valor para ok:") ?? "";')
    expect(code).toContain('ok = ["verdadeiro", "v", "true", "1"].includes(textoDigitado.trim().toLowerCase());')
  })

})
