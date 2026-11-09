import { describe, it, expect } from "vitest"
import { highlightCode } from "../../components/simulator/highlightCode"

// The Código tab shows generated JavaScript and TypeScript. Colouring it helps
// the student match each part of the diagram to the code: keywords, text,
// numbers, comments and types each get their own colour.
function kinds(code: string) {
  return highlightCode(code)
    .filter((token) => token.kind !== "plain")
    .map((token) => [token.kind, token.text])
}

describe("highlightCode", () => {
  it("devolve o código inteiro, sem perder nenhum caractere", () => {
    const code = "let a: number = 1;\n// fim\nconsole.log('x' + a);\n"

    expect(highlightCode(code).map((token) => token.text).join("")).toBe(code)
  })

  it("marca palavras-chave, números e textos", () => {
    expect(kinds('if (a >= 10) { console.log("alto"); }')).toEqual([
      ["keyword", "if"],
      ["number", "10"],
      ["builtin", "console"],
      ["function", "log"],
      ["string", '"alto"'],
    ])
  })

  it("marca o comentário até o fim da linha", () => {
    expect(kinds("// Início do algoritmo\nlet x;")).toEqual([
      ["comment", "// Início do algoritmo"],
      ["keyword", "let"],
    ])
  })

  it("não confunde // dentro de um texto com comentário", () => {
    expect(kinds("console.log('a // b');")).toEqual([
      ["builtin", "console"],
      ["function", "log"],
      ["string", "'a // b'"],
    ])
  })

  it("respeita aspas escapadas dentro do texto", () => {
    expect(kinds("let s = 'it\\'s';")).toEqual([
      ["keyword", "let"],
      ["string", "'it\\'s'"],
    ])
  })

  it("marca os tipos do TypeScript", () => {
    expect(kinds("let v: number[] = new Array(3);\nfunction f(n: number): string {")).toEqual([
      ["keyword", "let"],
      ["type", "number"],
      ["keyword", "new"],
      ["builtin", "Array"],
      ["number", "3"],
      ["keyword", "function"],
      ["function", "f"],
      ["type", "number"],
      ["type", "string"],
    ])
  })

  it("marca valores lógicos e chamadas de funções do navegador", () => {
    expect(kinds('a = Number(prompt("Digite:")); b = true;')).toEqual([
      ["builtin", "Number"],
      ["function", "prompt"],
      ["string", '"Digite:"'],
      ["keyword", "true"],
    ])
  })
})
