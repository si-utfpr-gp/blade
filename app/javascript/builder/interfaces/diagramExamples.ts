type DiagramNode = {
  id: string
  type: string
  data: Record<string, unknown>
}

type DiagramEdge = {
  id: string
  source: string
  target: string
  sourceHandle?: string
  targetHandle?: string
  label?: string
}

export interface IDiagramExample {
  id: string
  title: string
  description: string
  category: string
  diagram: {
    nodes: DiagramNode[]
    edges: DiagramEdge[]
    subroutines?: unknown[]
  }
}

const node = (id: string, type: string, label: string, data: Record<string, unknown> = {}): DiagramNode => ({
  id,
  type,
  data: { label, ...data },
})

// Every example must be one a student could draw: a block takes a single
// arrow, so branches meet and loops close on a connector, reached through the
// side the constructor would use (see connectorRole.ts).
const edge = (id: string, source: string, target: string, targetHandle?: string): DiagramEdge => ({
  id,
  source,
  target,
  ...(targetHandle ? { targetHandle } : {}),
})

// A connector has a single exit, at the bottom.
const fromConnector = (id: string, source: string, target: string, targetHandle?: string): DiagramEdge => ({
  id,
  source,
  target,
  sourceHandle: "bottom-out",
  ...(targetHandle ? { targetHandle } : {}),
})

// An arrow leaving a decision, labelled like the canvas labels it.
const branch = (id: string, source: string, target: string, sourceHandle: "yes" | "no", targetHandle?: string): DiagramEdge => ({
  id,
  source,
  target,
  sourceHandle,
  label: sourceHandle === "yes" ? "VERDADEIRO" : "FALSO",
  ...(targetHandle ? { targetHandle } : {}),
})

// An arrow leaving a selection. A case's arrow carries no label, since the
// value is drawn at its exit on the block; the Falso one reads FALSO.
const caseEdge = (id: string, source: string, target: string, sourceHandle: string, targetHandle?: string): DiagramEdge => ({
  id,
  source,
  target,
  sourceHandle,
  ...(sourceHandle === "default" ? { label: "FALSO" } : {}),
  ...(targetHandle ? { targetHandle } : {}),
})

const memory = (variables: string, type = "inteiro", initialValue?: string) => ({
  rows: [{ type, variables, ...(initialValue ? { initialValue } : {}) }],
})

const diagram = (nodes: DiagramNode[], edges: DiagramEdge[], subroutines?: unknown[]) => ({
  nodes,
  edges,
  ...(subroutines ? { subroutines } : {}),
})

export const DIAGRAM_EXAMPLES: IDiagramExample[] = [
  {
    id: "soma-dois-valores",
    title: "Soma de dois valores",
    description: "Lê dois inteiros e exibe a soma.",
    category: "Entrada e saída",
    diagram: diagram(
      [
        node("n1", "startEnd", "Início", { variant: "start" }),
        node("n2", "memory", "Memória", memory("num1, num2, soma")),
        node("n3", "input", "num1, num2"),
        node("n4", "process", "soma = num1 + num2"),
        node("n5", "output", "'A soma é: ' + soma"),
        node("n6", "startEnd", "Fim", { variant: "end" }),
      ],
      [edge("e1", "n1", "n2"), edge("e2", "n2", "n3"), edge("e3", "n3", "n4"), edge("e4", "n4", "n5"), edge("e5", "n5", "n6")]
    ),
  },
  {
    id: "media-de-duas-notas",
    title: "Média de Duas Notas",
    description: "Calcula a média aritmética de duas notas.",
    category: "Entrada e saída",
    diagram: diagram(
      [
        node("n1", "startEnd", "Início", { variant: "start" }),
        node("n2", "memory", "Memória", memory("notaUm, notaDois, media", "real")),
        node("n3", "input", "notaUm, notaDois"),
        node("n4", "process", "media = (notaUm + notaDois) / 2"),
        node("n5", "output", "media"),
        node("n6", "startEnd", "Fim", { variant: "end" }),
      ],
      [edge("e1", "n1", "n2"), edge("e2", "n2", "n3"), edge("e3", "n3", "n4"), edge("e4", "n4", "n5"), edge("e5", "n5", "n6")]
    ),
  },
  {
    id: "par-ou-impar",
    title: "Par ou Ímpar",
    description: "Decide se um número é par ou ímpar.",
    category: "Condicionais",
    diagram: diagram(
      [
        node("n1", "startEnd", "Início", { variant: "start" }),
        node("n2", "memory", "Memória", memory("n")),
        node("n3", "input", "n"),
        node("n4", "decision", "n % 2 == 0"),
        node("n5", "output", "'O número é PAR'"),
        node("n6", "output", "'O número é ÍMPAR'"),
        node("n7", "connector", "Fim do se"),
        node("n8", "startEnd", "Fim", { variant: "end" }),
      ],
      [
        edge("e1", "n1", "n2"),
        edge("e2", "n2", "n3"),
        edge("e3", "n3", "n4"),
        branch("e4", "n4", "n5", "yes"),
        branch("e5", "n4", "n6", "no"),
        edge("e6", "n5", "n7", "right-in"),
        edge("e7", "n6", "n7", "left-in"),
        fromConnector("e8", "n7", "n8"),
      ]
    ),
  },
  {
    id: "validacao-de-nota",
    title: "Validação de Nota",
    description: "Verifica se uma nota está entre zero e dez.",
    category: "Condicionais",
    diagram: diagram(
      [
        node("n1", "startEnd", "Início", { variant: "start" }),
        node("n2", "memory", "Memória", memory("nota", "real")),
        node("n3", "input", "nota"),
        node("n4", "decision", "nota >= 0 e nota <= 10"),
        node("n5", "output", "'NOTA VÁLIDA'"),
        node("n6", "output", "'NOTA INVÁLIDA'"),
        node("n7", "connector", "Fim do se"),
        node("n8", "startEnd", "Fim", { variant: "end" }),
      ],
      [
        edge("e1", "n1", "n2"),
        edge("e2", "n2", "n3"),
        edge("e3", "n3", "n4"),
        branch("e4", "n4", "n5", "yes"),
        branch("e5", "n4", "n6", "no"),
        edge("e6", "n5", "n7", "right-in"),
        edge("e7", "n6", "n7", "left-in"),
        fromConnector("e8", "n7", "n8"),
      ]
    ),
  },
  {
    id: "maior-de-tres",
    title: "Maior de Três",
    description: "Encontra o maior entre três números.",
    category: "Condicionais",
    diagram: diagram(
      [
        node("n1", "startEnd", "Início", { variant: "start" }),
        node("n2", "memory", "Memória", memory("a, b, c, maior")),
        node("n3", "input", "a, b, c"),
        node("n4", "process", "maior = a"),
        node("n5", "decision", "b > maior"),
        node("n6", "process", "maior = b"),
        node("n7", "connector", "Fim do se b"),
        node("n8", "decision", "c > maior"),
        node("n9", "process", "maior = c"),
        node("n10", "connector", "Fim do se c"),
        node("n11", "output", "'O maior é: ' + maior"),
        node("n12", "startEnd", "Fim", { variant: "end" }),
      ],
      [
        edge("e1", "n1", "n2"),
        edge("e2", "n2", "n3"),
        edge("e3", "n3", "n4"),
        edge("e4", "n4", "n5"),
        branch("e5", "n5", "n6", "yes"),
        edge("e6", "n6", "n7", "right-in"),
        branch("e7", "n5", "n7", "no", "left-in"),
        fromConnector("e8", "n7", "n8"),
        branch("e9", "n8", "n9", "yes"),
        edge("e10", "n9", "n10", "right-in"),
        branch("e11", "n8", "n10", "no", "left-in"),
        fromConnector("e12", "n10", "n11"),
        edge("e13", "n11", "n12"),
      ]
    ),
  },
  {
    id: "menu-de-opcoes",
    title: "Menu de opções",
    description: "Escolhe uma mensagem pelo número da opção.",
    category: "Condicionais",
    diagram: diagram(
      [
        node("n1", "startEnd", "Início", { variant: "start" }),
        node("n2", "memory", "Memória", memory("opcao")),
        node("n3", "input", "opcao"),
        node("n4", "selection", "opcao", { cases: ["1", "2", "3"] }),
        node("n5", "output", "'Novo jogo'"),
        node("n6", "output", "'Carregar jogo'"),
        node("n7", "output", "'Sair'"),
        node("n8", "output", "'Opção inválida'"),
        node("n9", "connector", "Fim da escolha"),
        node("n10", "startEnd", "Fim", { variant: "end" }),
      ],
      [
        edge("e1", "n1", "n2"),
        edge("e2", "n2", "n3"),
        edge("e3", "n3", "n4"),
        caseEdge("e4", "n4", "n5", "case-0"),
        caseEdge("e5", "n4", "n6", "case-1"),
        caseEdge("e6", "n4", "n7", "case-2"),
        caseEdge("e7", "n4", "n8", "default"),
        edge("e8", "n5", "n9", "left-in"),
        edge("e9", "n6", "n9", "top-in"),
        edge("e10", "n7", "n9", "right-in"),
        edge("e11", "n8", "n9", "left-in"),
        fromConnector("e12", "n9", "n10"),
      ]
    ),
  },
  {
    id: "conceito-da-nota",
    title: "Conceito da Nota",
    description: "Escolhe a faixa da nota pelo conceito digitado.",
    category: "Condicionais",
    diagram: diagram(
      [
        node("n1", "startEnd", "Início", { variant: "start" }),
        node("n2", "memory", "Memória", memory("conceito", "caractere")),
        node("n3", "input", "conceito"),
        node("n4", "selection", "conceito", { cases: ["'A'", "'B'", "'C'"] }),
        node("n5", "output", "'Acima de 9'"),
        node("n6", "output", "'Entre 7 e 9'"),
        node("n7", "output", "'Entre 5 e 7'"),
        node("n8", "output", "'Conceito inválido'"),
        node("n9", "connector", "Fim da escolha"),
        node("n10", "startEnd", "Fim", { variant: "end" }),
      ],
      [
        edge("e1", "n1", "n2"),
        edge("e2", "n2", "n3"),
        edge("e3", "n3", "n4"),
        caseEdge("e4", "n4", "n5", "case-0"),
        caseEdge("e5", "n4", "n6", "case-1"),
        caseEdge("e6", "n4", "n7", "case-2"),
        caseEdge("e7", "n4", "n8", "default"),
        edge("e8", "n5", "n9", "left-in"),
        edge("e9", "n6", "n9", "top-in"),
        edge("e10", "n7", "n9", "right-in"),
        edge("e11", "n8", "n9", "left-in"),
        fromConnector("e12", "n9", "n10"),
      ]
    ),
  },
  {
    id: "numeros-por-extenso",
    title: "Números por Extenso",
    description: "Escreve por extenso um número de 0 a 6.",
    category: "Condicionais",
    diagram: diagram(
      [
        node("n1", "startEnd", "Início", { variant: "start" }),
        node("n2", "memory", "Memória", memory("numero")),
        node("n3", "input", "numero"),
        node("n4", "selection", "numero", { cases: ["0", "1", "2", "3", "4", "5", "6"] }),
        node("n5", "output", "'Zero'"),
        node("n6", "output", "'Um'"),
        node("n7", "output", "'Dois'"),
        node("n8", "output", "'Três'"),
        node("n9", "output", "'Quatro'"),
        node("n10", "output", "'Cinco'"),
        node("n11", "output", "'Seis'"),
        node("n12", "output", "'Número inválido!'"),
        node("n13", "connector", "Fim da escolha"),
        node("n14", "startEnd", "Fim", { variant: "end" }),
      ],
      [
        edge("e1", "n1", "n2"),
        edge("e2", "n2", "n3"),
        edge("e3", "n3", "n4"),
        caseEdge("e4", "n4", "n5", "case-0"),
        caseEdge("e5", "n4", "n6", "case-1"),
        caseEdge("e6", "n4", "n7", "case-2"),
        caseEdge("e7", "n4", "n8", "case-3"),
        caseEdge("e8", "n4", "n9", "case-4"),
        caseEdge("e9", "n4", "n10", "case-5"),
        caseEdge("e10", "n4", "n11", "case-6"),
        caseEdge("e11", "n4", "n12", "default"),
        edge("e12", "n5", "n13", "left-in"),
        edge("e13", "n6", "n13", "left-in"),
        edge("e14", "n7", "n13", "left-in"),
        edge("e15", "n8", "n13", "top-in"),
        edge("e16", "n9", "n13", "right-in"),
        edge("e17", "n10", "n13", "right-in"),
        edge("e18", "n11", "n13", "right-in"),
        edge("e19", "n12", "n13", "left-in"),
        fromConnector("e20", "n13", "n14"),
      ]
    ),
  },
  {
    id: "calculadora",
    title: "Calculadora",
    description: "Faz a conta escolhida pelo operador digitado.",
    category: "Condicionais",
    diagram: diagram(
      [
        node("n1", "startEnd", "Início", { variant: "start" }),
        node("n2", "memory", "Memória", { rows: [{ type: "caractere", variables: "op" }, { type: "real", variables: "a, b, r" }] }),
        node("n3", "output", "'Escolha a operação: + para somar, - para subtrair, * para multiplicar, / para dividir. Depois digite dois valores.'"),
        node("n4", "input", "op, a, b"),
        node("n5", "selection", "op", { cases: ["'+'", "'-'", "'*'", "'/'"] }),
        node("n6", "process", "r = a + b"),
        node("n7", "output", "a + ' + ' + b + ' = ' + r"),
        node("n8", "process", "r = a - b"),
        node("n9", "output", "a + ' - ' + b + ' = ' + r"),
        node("n10", "process", "r = a * b"),
        node("n11", "output", "a + ' * ' + b + ' = ' + r"),
        node("n12", "decision", "b != 0"),
        node("n13", "process", "r = a / b"),
        node("n14", "output", "a + ' / ' + b + ' = ' + r"),
        node("n15", "output", "'Divisão por zero!'"),
        node("n16", "connector", "Fim do se"),
        node("n17", "output", "'Operador inválido!'"),
        node("n18", "connector", "Fim da escolha"),
        node("n19", "startEnd", "Fim", { variant: "end" }),
      ],
      [
        edge("e1", "n1", "n2"),
        edge("e2", "n2", "n3"),
        edge("e3", "n3", "n4"),
        edge("e4", "n4", "n5"),
        caseEdge("e5", "n5", "n6", "case-0"),
        edge("e6", "n6", "n7"),
        caseEdge("e7", "n5", "n8", "case-1"),
        edge("e8", "n8", "n9"),
        caseEdge("e9", "n5", "n10", "case-2"),
        edge("e10", "n10", "n11"),
        caseEdge("e11", "n5", "n12", "case-3"),
        branch("e12", "n12", "n13", "yes"),
        edge("e13", "n13", "n14"),
        edge("e14", "n14", "n16", "right-in"),
        branch("e15", "n12", "n15", "no"),
        edge("e16", "n15", "n16", "left-in"),
        caseEdge("e17", "n5", "n17", "default"),
        edge("e18", "n17", "n18", "left-in"),
        edge("e19", "n7", "n18", "left-in"),
        edge("e20", "n9", "n18", "top-in"),
        edge("e21", "n11", "n18", "right-in"),
        fromConnector("e22", "n16", "n18", "right-in"),
        fromConnector("e23", "n18", "n19"),
      ]
    ),
  },
  {
    id: "fatorial",
    title: "Fatorial",
    description: "Calcula o fatorial com um laço enquanto.",
    category: "Repetições",
    diagram: diagram(
      [
        node("n1", "startEnd", "Início", { variant: "start" }),
        node("n2", "memory", "Memória", memory("n, fatorial, i")),
        node("n3", "input", "n"),
        node("n4", "process", "fatorial = 1"),
        node("n5", "process", "i = 1"),
        node("n6", "connector", "Início do laço"),
        node("n7", "decision", "i <= n"),
        node("n8", "process", "fatorial = fatorial * i"),
        node("n9", "process", "i = i + 1"),
        node("n10", "output", "'O fatorial de ' + n + ' é ' + fatorial"),
        node("n11", "startEnd", "Fim", { variant: "end" }),
      ],
      [
        edge("e1", "n1", "n2"),
        edge("e2", "n2", "n3"),
        edge("e3", "n3", "n4"),
        edge("e4", "n4", "n5"),
        edge("e5", "n5", "n6", "top-in"),
        fromConnector("e6", "n6", "n7"),
        branch("e7", "n7", "n8", "yes"),
        edge("e8", "n8", "n9"),
        edge("e9", "n9", "n6", "right-in"),
        branch("e10", "n7", "n10", "no"),
        edge("e11", "n10", "n11"),
      ]
    ),
  },
  {
    id: "soma-ate-zero",
    title: "Soma até Zero",
    description: "Soma números até receber zero.",
    category: "Repetições",
    diagram: diagram(
      [
        node("n1", "startEnd", "Início", { variant: "start" }),
        node("n2", "memory", "Memória", memory("num, soma")),
        node("n3", "process", "soma = 0"),
        node("n4", "connector", "Iniciar leitura"),
        node("n5", "input", "num"),
        node("n6", "process", "soma = soma + num"),
        node("n7", "decision", "num != 0"),
        node("n8", "output", "'A soma é: ' + soma"),
        node("n9", "startEnd", "Fim", { variant: "end" }),
      ],
      [
        edge("e1", "n1", "n2"),
        edge("e2", "n2", "n3"),
        edge("e3", "n3", "n4", "top-in"),
        fromConnector("e4", "n4", "n5"),
        edge("e5", "n5", "n6"),
        edge("e6", "n6", "n7"),
        branch("e7", "n7", "n4", "yes", "right-in"),
        branch("e8", "n7", "n8", "no"),
        edge("e9", "n8", "n9"),
      ]
    ),
  },
  {
    id: "media-de-valores",
    title: "Média de Valores",
    description: "Lê vários valores e calcula a média.",
    category: "Repetições",
    diagram: diagram(
      [
        node("n1", "startEnd", "Início", { variant: "start" }),
        node("n2", "memory", "Memória", { rows: [{ type: "inteiro", variables: "n, i" }, { type: "real", variables: "valor, soma, media" }] }),
        node("n3", "input", "n"),
        node("n4", "process", "soma = 0"),
        node("n5", "process", "i = 0"),
        node("n6", "connector", "Início do laço"),
        node("n7", "decision", "i < n"),
        node("n8", "input", "valor"),
        node("n9", "process", "soma = soma + valor"),
        node("n10", "process", "i = i + 1"),
        node("n11", "process", "media = soma / n"),
        node("n12", "output", "'A média é: ' + media"),
        node("n13", "startEnd", "Fim", { variant: "end" }),
      ],
      [
        edge("e1", "n1", "n2"),
        edge("e2", "n2", "n3"),
        edge("e3", "n3", "n4"),
        edge("e4", "n4", "n5"),
        edge("e5", "n5", "n6", "top-in"),
        fromConnector("e6", "n6", "n7"),
        branch("e7", "n7", "n8", "yes"),
        edge("e8", "n8", "n9"),
        edge("e9", "n9", "n10"),
        edge("e10", "n10", "n6", "right-in"),
        branch("e11", "n7", "n11", "no"),
        edge("e12", "n11", "n12"),
        edge("e13", "n12", "n13"),
      ]
    ),
  },
  {
    id: "media-de-notas-com-vetor",
    title: "Média de Notas com Vetor",
    description: "Armazena notas em um vetor e calcula a média.",
    category: "Vetores",
    diagram: diagram(
      [
        node("n1", "startEnd", "Início", { variant: "start" }),
        node("n2", "memory", "Memória", { rows: [{ type: "inteiro", variables: "n, i" }, { type: "real", variables: "notas[5], soma, media, nota" }] }),
        node("n3", "input", "n"),
        node("n4", "process", "soma = 0"),
        node("n5", "process", "i = 0"),
        node("n6", "connector", "Início do laço"),
        node("n7", "decision", "i < n"),
        node("n8", "input", "nota"),
        node("n9", "process", "notas[i] = nota"),
        node("n10", "process", "soma = soma + nota"),
        node("n11", "process", "i = i + 1"),
        node("n12", "process", "media = soma / n"),
        node("n13", "output", "'A média das notas é: ' + media"),
        node("n14", "startEnd", "Fim", { variant: "end" }),
      ],
      [
        edge("e1", "n1", "n2"),
        edge("e2", "n2", "n3"),
        edge("e3", "n3", "n4"),
        edge("e4", "n4", "n5"),
        edge("e5", "n5", "n6", "top-in"),
        fromConnector("e6", "n6", "n7"),
        branch("e7", "n7", "n8", "yes"),
        edge("e8", "n8", "n9"),
        edge("e9", "n9", "n10"),
        edge("e10", "n10", "n11"),
        edge("e11", "n11", "n6", "right-in"),
        branch("e12", "n7", "n12", "no"),
        edge("e13", "n12", "n13"),
        edge("e14", "n13", "n14"),
      ]
    ),
  },
  {
    id: "subrotina-visual-fatorial",
    title: "Sub-rotina Visual — Fatorial",
    description: "Chama uma sub-rotina que retorna o fatorial.",
    category: "Sub-rotinas",
    diagram: diagram(
      [
        node("n1", "startEnd", "Início", { variant: "start" }),
        node("n2", "memory", "Memória", memory("n, resultado")),
        node("n3", "input", "n"),
        node("n4", "subroutine", "resultado = fatorial(n)"),
        node("n5", "output", "'Fatorial: ' + resultado"),
        node("n6", "startEnd", "Fim", { variant: "end" }),
      ],
      [edge("e1", "n1", "n2"), edge("e2", "n2", "n3"), edge("e3", "n3", "n4"), edge("e4", "n4", "n5"), edge("e5", "n5", "n6")],
      [
        {
          id: "routine-fatorial",
          name: "fatorial",
          parameters: ["valor"],
          returnVariable: "retorno",
          nodes: [
            node("r1", "startEnd", "Início fatorial", { variant: "start" }),
            node("r2", "memory", "Memória local", memory("retorno, i")),
            node("r3", "process", "retorno = 1"),
            node("r4", "process", "i = 1"),
            node("r5", "connector", "Início do laço"),
            node("r6", "decision", "i <= valor"),
            node("r7", "process", "retorno = retorno * i"),
            node("r8", "process", "i = i + 1"),
            node("r9", "startEnd", "Fim fatorial", { variant: "end" }),
          ],
          edges: [
            edge("re1", "r1", "r2"),
            edge("re2", "r2", "r3"),
            edge("re3", "r3", "r4"),
            edge("re4", "r4", "r5", "top-in"),
            fromConnector("re5", "r5", "r6"),
            branch("re6", "r6", "r7", "yes"),
            edge("re7", "r7", "r8"),
            edge("re8", "r8", "r5", "right-in"),
            branch("re9", "r6", "r9", "no"),
          ],
        },
      ]
    ),
  },
]

export const DIAGRAM_EXAMPLE_CATEGORIES = ["Entrada e saída", "Condicionais", "Repetições", "Vetores", "Sub-rotinas"]
