# Diagramas de Teste — JSON do Módulo de Construção

Documento com diagramas prontos para copiar e colar no **Harness JSON** (canvas do builder) e
validar o **Módulo de Execução e Teste de Mesa** (parser → motor → teste de mesa → explicação →
código transpilado).

Para teste de mesa, os exemplos podem ser escritos no formato lógico limpo, sem `position`. O campo
`position` pertence ao construtor visual/React Flow e só serve para layout no canvas; o parser e o
motor de execução ignoram esse campo.

## Como usar

1. Abra a página do builder (harness no canvas + simulador à direita).
2. Copie um dos JSONs abaixo e cole na textarea do harness.
3. Clique em **Carregar**. Se tudo ok, aparece *"Diagrama carregado. Código JS/TS gerado. Use o simulador ao lado para executar."*.
4. No simulador, clique **Iniciar Execução** e avance com **Próximo**.
5. Quando um bloco `input` aparecer, o diálogo solicita o(s) valor(es). Digite e confirme.
6. Veja na aba **Trace** o teste de mesa (passos + variáveis), na **Explain** a explicação e na
   **Code** o código JS/TS gerado.

## Formato do JSON (resumo)

```jsonc
{
  "nodes": [ // lista de blocos
    { "id": "n1", "type": "startEnd",
      "data": { "label": "Início", "variant": "start" } },
    { "id": "n2", "type": "memory", "data": { "rows": [
        { "type": "inteiro", "variables": "n, i" },
        { "type": "inteiro", "variables": "contador" },
        { "type": "real", "variables": "notas[5], soma" } ] } },
    { "id": "n3", "type": "input", "data": { "label": "n" } },
    { "id": "n4", "type": "process","data": { "label": "soma = 0" } },
    { "id": "n5", "type": "decision","data": { "label": "i < n" } },
    { "id": "n6", "type": "output", "data": { "label": "'Média: ' + media" } },
    { "id": "n7", "type": "subroutine", "data": { "label": "resultado = dobro(n)" } }
  ],
  "edges": [ // conexões
    { "id": "e1", "source": "n1", "target": "n2" },
    { "id": "e2", "source": "n5", "target": "n6", "sourceHandle": "yes" } // decisão: "yes"/"no"
  ],
  "subroutines": [ // opcional: funções visuais chamadas por blocos subroutine
    {
      "id": "routine-dobro",
      "name": "dobro",
      "parameters": ["valor"],
      "returnVariable": "retorno",
      "nodes": [ /* diagrama interno da rotina */ ],
      "edges": [ /* conexões internas da rotina */ ]
    }
  ]
}
```

O bloco `memory` só declara variáveis com o tipo. Valores iniciais são dados em blocos `process`
(por exemplo `contador = 0`), para que cada valor apareça como um passo no teste de mesa; uma linha
com `initialValue` interrompe a execução com erro.

**Tipos de bloco:** `startEnd` (com `variant: "start"|"end"`), `memory`, `input`, `process`,
`output`, `decision`, `selection`, `subroutine`, `connector`.

**Sub-rotinas:** o campo opcional `subroutines` define diagramas internos chamados por blocos `subroutine`. Cada item deve conter `id`, `name`, `parameters`, `returnVariable`, `nodes` e `edges`. A chamada no bloco usa o formato `resultado = nome(argumento)`, e `nome` precisa existir em `subroutines[].name`. O resumo acima é ilustrativo; para copiar e executar, use o exemplo completo de sub-rotina na seção 14.

**Campos de layout:** `position`, `width`, `height`, `selected` e outros metadados do React Flow são
opcionais para execução. Eles podem aparecer no JSON exportado pelo construtor, mas não devem ser
necessários nos JSONs de teste de mesa.

## Sintaxe de expressões suportada pelo motor

| Recurso | Sintaxe | Exemplo |
|---|---|---|
| Aritmética | `+ - * /` `%` `()` | `soma = n1 + n2` |
| Comparação | `= == != < > <= >=` | `i <= n` |
| Lógica (Portugol) | `e` `ou` `nao` | `nota >= 0 e nota <= 10` |
| Atribuição | uma instrução por bloco `process`; duas instruções com `;` interrompem a execução | `soma = 0` |
| Texto (string) | aspas simples | `'A média é: ' + media` |
| Vetor | `nome[indice]` | `notas[i] = nota` |
| Tipos | `inteiro real caractere logico` | bloco `memory` |

> Em `decision`, as arestas de saída devem usar `sourceHandle: "yes"` (verdadeiro) e
> `sourceHandle: "no"` (falso).

> **Conectores, como no construtor:** cada bloco recebe uma única aresta. Ramos que se juntam e laços
> que voltam passam por um `connector`, e a aresta que chega a ele indica o lado em `targetHandle`:
> `top-in` (fluxo de cima), `left-in` ou `right-in` (laterais). A saída do conector usa
> `sourceHandle: "bottom-out"`. Os papéis aceitos são: junção de decisão (duas laterais), início de
> laço (topo + uma lateral), fim de laço (uma lateral), ligação simples (só o topo) e junção de
> escolha (várias entradas vindas da mesma escolha). Os JSONs abaixo são os mesmos dos exemplos do
> construtor.

> Em `selection` (escolha/caso), `data.label` é a expressão comparada e `data.cases` lista os
> valores dos casos, cada um escrito como expressão (`1`, `'a'`). A aresta do caso de índice `i` usa
> `sourceHandle: "case-i"` e a do ramo Falso (`outrocaso`) usa `sourceHandle: "default"`. A comparação
> é por igualdade estrita: o número `1` não coincide com o texto `'1'`. Valores repetidos, ou um caso
> escolhido sem aresta, interrompem a execução com erro. Os ramos convergem em um `connector`, que
> aceita várias arestas no mesmo ponto de entrada quando todas vêm da mesma escolha.

---

# 1. Soma de dois valores — SEQUENCIAL

Soma dois inteiros e exibe o resultado. Fluxo linear, sem desvios.

**Entradas:** `num1` e `num2` (inteiros).
**Saída esperada:** `A soma é: <num1+num2>` (ex.: `num1=10, num2=20` → `A soma é: 30`).

```json
{
  "nodes": [
    { "id": "n1", "type": "startEnd", "data": { "label": "Início", "variant": "start" } },
    { "id": "n2", "type": "memory", "data": { "label": "Memória", "rows": [ { "type": "inteiro", "variables": "num1, num2, soma" } ] } },
    { "id": "n3", "type": "input", "data": { "label": "num1, num2" } },
    { "id": "n4", "type": "process", "data": { "label": "soma = num1 + num2" } },
    { "id": "n5", "type": "output", "data": { "label": "'A soma é: ' + soma" } },
    { "id": "n6", "type": "startEnd", "data": { "label": "Fim", "variant": "end" } }
  ],
  "edges": [
    { "id": "e1", "source": "n1", "target": "n2" },
    { "id": "e2", "source": "n2", "target": "n3" },
    { "id": "e3", "source": "n3", "target": "n4" },
    { "id": "e4", "source": "n4", "target": "n5" },
    { "id": "e5", "source": "n5", "target": "n6" }
  ]
}
```

---

# 2. Média de Duas Notas — SEQUENCIAL

Lê duas notas reais, calcula a média aritmética e exibe o resultado em um fluxo linear de seis passos.

**Entradas:** `notaUm` e `notaDois` (reais).
**Saída esperada:** a média das duas notas (ex.: `notaUm=8` e `notaDois=6` → `7`).
No teste de mesa, as leituras do único bloco de entrada aparecem como passos `3` e `3.1`; o processo permanece no passo `4`.

```json
{
  "nodes": [
    { "id": "n1", "type": "startEnd", "data": { "label": "Início", "variant": "start" } },
    { "id": "n2", "type": "memory", "data": { "label": "Memória", "rows": [ { "type": "real", "variables": "notaUm, notaDois, media" } ] } },
    { "id": "n3", "type": "input", "data": { "label": "notaUm, notaDois" } },
    { "id": "n4", "type": "process", "data": { "label": "media = (notaUm + notaDois) / 2" } },
    { "id": "n5", "type": "output", "data": { "label": "media" } },
    { "id": "n6", "type": "startEnd", "data": { "label": "Fim", "variant": "end" } }
  ],
  "edges": [
    { "id": "e1", "source": "n1", "target": "n2" },
    { "id": "e2", "source": "n2", "target": "n3" },
    { "id": "e3", "source": "n3", "target": "n4" },
    { "id": "e4", "source": "n4", "target": "n5" },
    { "id": "e5", "source": "n5", "target": "n6" }
  ]
}
```

---

# 3. Par ou Ímpar — SE COMPOSTA (if/else)

Testa se um número é par ou ímpar usando `n % 2 == 0` em um bloco `decision`, com dois ramos de saída.

**Entradas:** `n` (inteiro).
**Saída esperada:** `O número é PAR` (se par) ou `O número é ÍMPAR` (se ímpar).

```json
{
  "nodes": [
    { "id": "n1", "type": "startEnd", "data": { "label": "Início", "variant": "start" } },
    { "id": "n2", "type": "memory", "data": { "label": "Memória", "rows": [ { "type": "inteiro", "variables": "n" } ] } },
    { "id": "n3", "type": "input", "data": { "label": "n" } },
    { "id": "n4", "type": "decision", "data": { "label": "n % 2 == 0" } },
    { "id": "n5", "type": "output", "data": { "label": "'O número é PAR'" } },
    { "id": "n6", "type": "output", "data": { "label": "'O número é ÍMPAR'" } },
    { "id": "n7", "type": "connector", "data": { "label": "Fim do se" } },
    { "id": "n8", "type": "startEnd", "data": { "label": "Fim", "variant": "end" } }
  ],
  "edges": [
    { "id": "e1", "source": "n1", "target": "n2" },
    { "id": "e2", "source": "n2", "target": "n3" },
    { "id": "e3", "source": "n3", "target": "n4" },
    { "id": "e4", "source": "n4", "target": "n5", "sourceHandle": "yes", "label": "VERDADEIRO" },
    { "id": "e5", "source": "n4", "target": "n6", "sourceHandle": "no", "label": "FALSO" },
    { "id": "e6", "source": "n5", "target": "n7", "targetHandle": "right-in" },
    { "id": "e7", "source": "n6", "target": "n7", "targetHandle": "left-in" },
    { "id": "e8", "source": "n7", "target": "n8", "sourceHandle": "bottom-out" }
  ]
}
```

---

# 4. Validação de Nota — SE COMPOSTA (condição composta)

Valida se a nota está no intervalo `[0, 10]` usando uma condição composta com `e`.

**Entradas:** `nota` (real).
**Saída esperada:** `NOTA VÁLIDA` (se `0 <= nota <= 10`) ou `NOTA INVÁLIDA`.

```json
{
  "nodes": [
    { "id": "n1", "type": "startEnd", "data": { "label": "Início", "variant": "start" } },
    { "id": "n2", "type": "memory", "data": { "label": "Memória", "rows": [ { "type": "real", "variables": "nota" } ] } },
    { "id": "n3", "type": "input", "data": { "label": "nota" } },
    { "id": "n4", "type": "decision", "data": { "label": "nota >= 0 e nota <= 10" } },
    { "id": "n5", "type": "output", "data": { "label": "'NOTA VÁLIDA'" } },
    { "id": "n6", "type": "output", "data": { "label": "'NOTA INVÁLIDA'" } },
    { "id": "n7", "type": "connector", "data": { "label": "Fim do se" } },
    { "id": "n8", "type": "startEnd", "data": { "label": "Fim", "variant": "end" } }
  ],
  "edges": [
    { "id": "e1", "source": "n1", "target": "n2" },
    { "id": "e2", "source": "n2", "target": "n3" },
    { "id": "e3", "source": "n3", "target": "n4" },
    { "id": "e4", "source": "n4", "target": "n5", "sourceHandle": "yes", "label": "VERDADEIRO" },
    { "id": "e5", "source": "n4", "target": "n6", "sourceHandle": "no", "label": "FALSO" },
    { "id": "e6", "source": "n5", "target": "n7", "targetHandle": "right-in" },
    { "id": "e7", "source": "n6", "target": "n7", "targetHandle": "left-in" },
    { "id": "e8", "source": "n7", "target": "n8", "sourceHandle": "bottom-out" }
  ]
}
```

---

# 5. Maior de Três — SE ANINHADA

Encontra o maior entre três números usando decisões aninhadas (if dentro de if).

**Entradas:** `a`, `b`, `c` (inteiros).
**Saída esperada:** `O maior é: <maior>` (ex.: `a=3, b=7, c=5` → `O maior é: 7`).

```json
{
  "nodes": [
    { "id": "n1", "type": "startEnd", "data": { "label": "Início", "variant": "start" } },
    { "id": "n2", "type": "memory", "data": { "label": "Memória", "rows": [ { "type": "inteiro", "variables": "a, b, c, maior" } ] } },
    { "id": "n3", "type": "input", "data": { "label": "a, b, c" } },
    { "id": "n4", "type": "process", "data": { "label": "maior = a" } },
    { "id": "n5", "type": "decision", "data": { "label": "b > maior" } },
    { "id": "n6", "type": "process", "data": { "label": "maior = b" } },
    { "id": "n7", "type": "connector", "data": { "label": "Fim do se b" } },
    { "id": "n8", "type": "decision", "data": { "label": "c > maior" } },
    { "id": "n9", "type": "process", "data": { "label": "maior = c" } },
    { "id": "n10", "type": "connector", "data": { "label": "Fim do se c" } },
    { "id": "n11", "type": "output", "data": { "label": "'O maior é: ' + maior" } },
    { "id": "n12", "type": "startEnd", "data": { "label": "Fim", "variant": "end" } }
  ],
  "edges": [
    { "id": "e1", "source": "n1", "target": "n2" },
    { "id": "e2", "source": "n2", "target": "n3" },
    { "id": "e3", "source": "n3", "target": "n4" },
    { "id": "e4", "source": "n4", "target": "n5" },
    { "id": "e5", "source": "n5", "target": "n6", "sourceHandle": "yes", "label": "VERDADEIRO" },
    { "id": "e6", "source": "n6", "target": "n7", "targetHandle": "right-in" },
    { "id": "e7", "source": "n5", "target": "n7", "sourceHandle": "no", "label": "FALSO", "targetHandle": "left-in" },
    { "id": "e8", "source": "n7", "target": "n8", "sourceHandle": "bottom-out" },
    { "id": "e9", "source": "n8", "target": "n9", "sourceHandle": "yes", "label": "VERDADEIRO" },
    { "id": "e10", "source": "n9", "target": "n10", "targetHandle": "right-in" },
    { "id": "e11", "source": "n8", "target": "n10", "sourceHandle": "no", "label": "FALSO", "targetHandle": "left-in" },
    { "id": "e12", "source": "n10", "target": "n11", "sourceHandle": "bottom-out" },
    { "id": "e13", "source": "n11", "target": "n12" }
  ]
}
```

---

# 6. Menu de opções — ESCOLHA/CASO

Lê o número de uma opção e exibe a mensagem do caso correspondente, ou `Opção inválida` pelo ramo Falso.

**Entrada:** `opcao` (inteiro).
**Saída esperada:** `opcao=2` → `Carregar jogo`; `opcao=7` → `Opção inválida`.

```json
{
  "nodes": [
    { "id": "n1", "type": "startEnd", "data": { "label": "Início", "variant": "start" } },
    { "id": "n2", "type": "memory", "data": { "label": "Memória", "rows": [ { "type": "inteiro", "variables": "opcao" } ] } },
    { "id": "n3", "type": "input", "data": { "label": "opcao" } },
    { "id": "n4", "type": "selection", "data": { "label": "opcao", "cases": [ "1", "2", "3" ] } },
    { "id": "n5", "type": "output", "data": { "label": "'Novo jogo'" } },
    { "id": "n6", "type": "output", "data": { "label": "'Carregar jogo'" } },
    { "id": "n7", "type": "output", "data": { "label": "'Sair'" } },
    { "id": "n8", "type": "output", "data": { "label": "'Opção inválida'" } },
    { "id": "n9", "type": "connector", "data": { "label": "Fim da escolha" } },
    { "id": "n10", "type": "startEnd", "data": { "label": "Fim", "variant": "end" } }
  ],
  "edges": [
    { "id": "e1", "source": "n1", "target": "n2" },
    { "id": "e2", "source": "n2", "target": "n3" },
    { "id": "e3", "source": "n3", "target": "n4" },
    { "id": "e4", "source": "n4", "target": "n5", "sourceHandle": "case-0" },
    { "id": "e5", "source": "n4", "target": "n6", "sourceHandle": "case-1" },
    { "id": "e6", "source": "n4", "target": "n7", "sourceHandle": "case-2" },
    { "id": "e7", "source": "n4", "target": "n8", "sourceHandle": "default", "label": "FALSO" },
    { "id": "e8", "source": "n5", "target": "n9", "targetHandle": "left-in" },
    { "id": "e9", "source": "n6", "target": "n9", "targetHandle": "top-in" },
    { "id": "e10", "source": "n7", "target": "n9", "targetHandle": "right-in" },
    { "id": "e11", "source": "n8", "target": "n9", "targetHandle": "left-in" },
    { "id": "e12", "source": "n9", "target": "n10", "sourceHandle": "bottom-out" }
  ]
}
```

---

# 7. Conceito da Nota — ESCOLHA/CASO COM CARACTERE

Lê um conceito (`caractere`) e exibe a faixa da nota. Os valores dos casos são textos, então vão entre
aspas simples (`'A'`). Sem aspas, `A` seria lido como o nome de uma variável.

**Entrada:** `conceito` (caractere).
**Saída esperada:** `conceito=B` → `Entre 7 e 9`; `conceito=Z` → `Conceito inválido`.

> **Aba Código:** o gerador ainda não converte escolha/caso. No lugar do losango aparece o comentário
> `// escolha/caso (conceito) ainda não é convertida para código`, e o código gerado termina ali. O
> teste de mesa e a execução passo a passo funcionam normalmente.

```json
{
  "nodes": [
    { "id": "n1", "type": "startEnd", "data": { "label": "Início", "variant": "start" } },
    { "id": "n2", "type": "memory", "data": { "label": "Memória", "rows": [ { "type": "caractere", "variables": "conceito" } ] } },
    { "id": "n3", "type": "input", "data": { "label": "conceito" } },
    { "id": "n4", "type": "selection", "data": { "label": "conceito", "cases": [ "'A'", "'B'", "'C'" ] } },
    { "id": "n5", "type": "output", "data": { "label": "'Acima de 9'" } },
    { "id": "n6", "type": "output", "data": { "label": "'Entre 7 e 9'" } },
    { "id": "n7", "type": "output", "data": { "label": "'Entre 5 e 7'" } },
    { "id": "n8", "type": "output", "data": { "label": "'Conceito inválido'" } },
    { "id": "n9", "type": "connector", "data": { "label": "Fim da escolha" } },
    { "id": "n10", "type": "startEnd", "data": { "label": "Fim", "variant": "end" } }
  ],
  "edges": [
    { "id": "e1", "source": "n1", "target": "n2" },
    { "id": "e2", "source": "n2", "target": "n3" },
    { "id": "e3", "source": "n3", "target": "n4" },
    { "id": "e4", "source": "n4", "target": "n5", "sourceHandle": "case-0" },
    { "id": "e5", "source": "n4", "target": "n6", "sourceHandle": "case-1" },
    { "id": "e6", "source": "n4", "target": "n7", "sourceHandle": "case-2" },
    { "id": "e7", "source": "n4", "target": "n8", "sourceHandle": "default", "label": "FALSO" },
    { "id": "e8", "source": "n5", "target": "n9", "targetHandle": "left-in" },
    { "id": "e9", "source": "n6", "target": "n9", "targetHandle": "top-in" },
    { "id": "e10", "source": "n7", "target": "n9", "targetHandle": "right-in" },
    { "id": "e11", "source": "n8", "target": "n9", "targetHandle": "left-in" },
    { "id": "e12", "source": "n9", "target": "n10", "sourceHandle": "bottom-out" }
  ]
}
```

---

# 8. Números por Extenso — ESCOLHA/CASO COM INTEIRO

Lê um número inteiro entre 0 e 6 e o escreve por extenso. Um número fora do intervalo segue o caso
Falso (o "Padrão" da estrutura caso) e é avisado como inválido. É o primeiro exemplo de escolha/caso
do material da disciplina.

**Entradas:** `numero` (inteiro).
**Saída esperada:** o número por extenso (ex.: `0` → `Zero`), ou `Número inválido!` fora de 0 a 6.

```json
{
  "nodes": [
    { "id": "n1", "type": "startEnd", "data": { "label": "Início", "variant": "start" } },
    { "id": "n2", "type": "memory", "data": { "label": "Memória", "rows": [ { "type": "inteiro", "variables": "numero" } ] } },
    { "id": "n3", "type": "input", "data": { "label": "numero" } },
    { "id": "n4", "type": "selection", "data": { "label": "numero", "cases": [ "0", "1", "2", "3", "4", "5", "6" ] } },
    { "id": "n5", "type": "output", "data": { "label": "'Zero'" } },
    { "id": "n6", "type": "output", "data": { "label": "'Um'" } },
    { "id": "n7", "type": "output", "data": { "label": "'Dois'" } },
    { "id": "n8", "type": "output", "data": { "label": "'Três'" } },
    { "id": "n9", "type": "output", "data": { "label": "'Quatro'" } },
    { "id": "n10", "type": "output", "data": { "label": "'Cinco'" } },
    { "id": "n11", "type": "output", "data": { "label": "'Seis'" } },
    { "id": "n12", "type": "output", "data": { "label": "'Número inválido!'" } },
    { "id": "n13", "type": "connector", "data": { "label": "Fim da escolha" } },
    { "id": "n14", "type": "startEnd", "data": { "label": "Fim", "variant": "end" } }
  ],
  "edges": [
    { "id": "e1", "source": "n1", "target": "n2" },
    { "id": "e2", "source": "n2", "target": "n3" },
    { "id": "e3", "source": "n3", "target": "n4" },
    { "id": "e4", "source": "n4", "target": "n5", "sourceHandle": "case-0" },
    { "id": "e5", "source": "n4", "target": "n6", "sourceHandle": "case-1" },
    { "id": "e6", "source": "n4", "target": "n7", "sourceHandle": "case-2" },
    { "id": "e7", "source": "n4", "target": "n8", "sourceHandle": "case-3" },
    { "id": "e8", "source": "n4", "target": "n9", "sourceHandle": "case-4" },
    { "id": "e9", "source": "n4", "target": "n10", "sourceHandle": "case-5" },
    { "id": "e10", "source": "n4", "target": "n11", "sourceHandle": "case-6" },
    { "id": "e11", "source": "n4", "target": "n12", "sourceHandle": "default", "label": "FALSO" },
    { "id": "e12", "source": "n5", "target": "n13", "targetHandle": "left-in" },
    { "id": "e13", "source": "n6", "target": "n13", "targetHandle": "left-in" },
    { "id": "e14", "source": "n7", "target": "n13", "targetHandle": "left-in" },
    { "id": "e15", "source": "n8", "target": "n13", "targetHandle": "top-in" },
    { "id": "e16", "source": "n9", "target": "n13", "targetHandle": "right-in" },
    { "id": "e17", "source": "n10", "target": "n13", "targetHandle": "right-in" },
    { "id": "e18", "source": "n11", "target": "n13", "targetHandle": "right-in" },
    { "id": "e19", "source": "n12", "target": "n13", "targetHandle": "left-in" },
    { "id": "e20", "source": "n13", "target": "n14", "sourceHandle": "bottom-out" }
  ]
}
```

No teste de mesa do número `0`, a escolha aparece como `Condição (numero)` seguida do subpasso
`Caso 0`; com `10`, o subpasso é `Caso Falso`.

---

# 9. Calculadora — ESCOLHA/CASO COM CARACTERE

Mostra as operações, lê um operador (`+`, `-`, `*` ou `/`) e dois números, e faz a conta
escolhida. O caso `/` verifica antes se o divisor é zero; qualquer outro caractere segue o caso
Falso, `Operador inválido!`.

**Entradas:** `op` (caractere), `a` e `b` (reais), no mesmo bloco de entrada.
**Saída esperada:** a mensagem das operações e a conta (ex.: `*`, `5`, `3` → `5 * 3 = 15`).

```json
{
  "nodes": [
    { "id": "n1", "type": "startEnd", "data": { "label": "Início", "variant": "start" } },
    { "id": "n2", "type": "memory", "data": { "label": "Memória", "rows": [ { "type": "caractere", "variables": "op" }, { "type": "real", "variables": "a, b, r" } ] } },
    { "id": "n3", "type": "output", "data": { "label": "'Escolha a operação: + para somar, - para subtrair, * para multiplicar, / para dividir. Depois digite dois valores.'" } },
    { "id": "n4", "type": "input", "data": { "label": "op, a, b" } },
    { "id": "n5", "type": "selection", "data": { "label": "op", "cases": [ "'+'", "'-'", "'*'", "'/'" ] } },
    { "id": "n6", "type": "process", "data": { "label": "r = a + b" } },
    { "id": "n7", "type": "output", "data": { "label": "a + ' + ' + b + ' = ' + r" } },
    { "id": "n8", "type": "process", "data": { "label": "r = a - b" } },
    { "id": "n9", "type": "output", "data": { "label": "a + ' - ' + b + ' = ' + r" } },
    { "id": "n10", "type": "process", "data": { "label": "r = a * b" } },
    { "id": "n11", "type": "output", "data": { "label": "a + ' * ' + b + ' = ' + r" } },
    { "id": "n12", "type": "decision", "data": { "label": "b != 0" } },
    { "id": "n13", "type": "process", "data": { "label": "r = a / b" } },
    { "id": "n14", "type": "output", "data": { "label": "a + ' / ' + b + ' = ' + r" } },
    { "id": "n15", "type": "output", "data": { "label": "'Divisão por zero!'" } },
    { "id": "n16", "type": "connector", "data": { "label": "Fim do se" } },
    { "id": "n17", "type": "output", "data": { "label": "'Operador inválido!'" } },
    { "id": "n18", "type": "connector", "data": { "label": "Fim da escolha" } },
    { "id": "n19", "type": "startEnd", "data": { "label": "Fim", "variant": "end" } }
  ],
  "edges": [
    { "id": "e1", "source": "n1", "target": "n2" },
    { "id": "e2", "source": "n2", "target": "n3" },
    { "id": "e3", "source": "n3", "target": "n4" },
    { "id": "e4", "source": "n4", "target": "n5" },
    { "id": "e5", "source": "n5", "target": "n6", "sourceHandle": "case-0" },
    { "id": "e6", "source": "n6", "target": "n7" },
    { "id": "e7", "source": "n5", "target": "n8", "sourceHandle": "case-1" },
    { "id": "e8", "source": "n8", "target": "n9" },
    { "id": "e9", "source": "n5", "target": "n10", "sourceHandle": "case-2" },
    { "id": "e10", "source": "n10", "target": "n11" },
    { "id": "e11", "source": "n5", "target": "n12", "sourceHandle": "case-3" },
    { "id": "e12", "source": "n12", "target": "n13", "sourceHandle": "yes", "label": "VERDADEIRO" },
    { "id": "e13", "source": "n13", "target": "n14" },
    { "id": "e14", "source": "n14", "target": "n16", "targetHandle": "right-in" },
    { "id": "e15", "source": "n12", "target": "n15", "sourceHandle": "no", "label": "FALSO" },
    { "id": "e16", "source": "n15", "target": "n16", "targetHandle": "left-in" },
    { "id": "e17", "source": "n5", "target": "n17", "sourceHandle": "default", "label": "FALSO" },
    { "id": "e18", "source": "n17", "target": "n18", "targetHandle": "left-in" },
    { "id": "e19", "source": "n7", "target": "n18", "targetHandle": "left-in" },
    { "id": "e20", "source": "n9", "target": "n18", "targetHandle": "top-in" },
    { "id": "e21", "source": "n11", "target": "n18", "targetHandle": "right-in" },
    { "id": "e22", "source": "n16", "target": "n18", "sourceHandle": "bottom-out", "targetHandle": "right-in" },
    { "id": "e23", "source": "n18", "target": "n19", "sourceHandle": "bottom-out" }
  ]
}
```

---

# 10. Fatorial — ENQUANTO (while)

Calcula o fatorial de `n` com laço `enquanto`: o conector "Início do laço" recebe a entrada pelo topo e o retorno do corpo pela lateral, e a decisão logo abaixo dele controla a repetição.

**Entradas:** `n` (inteiro, `n >= 0`).
**Saída esperada:** `O fatorial de 5 é 120`.

```json
{
  "nodes": [
    { "id": "n1", "type": "startEnd", "data": { "label": "Início", "variant": "start" } },
    { "id": "n2", "type": "memory", "data": { "label": "Memória", "rows": [ { "type": "inteiro", "variables": "n, fatorial, i" } ] } },
    { "id": "n3", "type": "input", "data": { "label": "n" } },
    { "id": "n4", "type": "process", "data": { "label": "fatorial = 1" } },
    { "id": "n5", "type": "process", "data": { "label": "i = 1" } },
    { "id": "n6", "type": "connector", "data": { "label": "Início do laço" } },
    { "id": "n7", "type": "decision", "data": { "label": "i <= n" } },
    { "id": "n8", "type": "process", "data": { "label": "fatorial = fatorial * i" } },
    { "id": "n9", "type": "process", "data": { "label": "i = i + 1" } },
    { "id": "n10", "type": "output", "data": { "label": "'O fatorial de ' + n + ' é ' + fatorial" } },
    { "id": "n11", "type": "startEnd", "data": { "label": "Fim", "variant": "end" } }
  ],
  "edges": [
    { "id": "e1", "source": "n1", "target": "n2" },
    { "id": "e2", "source": "n2", "target": "n3" },
    { "id": "e3", "source": "n3", "target": "n4" },
    { "id": "e4", "source": "n4", "target": "n5" },
    { "id": "e5", "source": "n5", "target": "n6", "targetHandle": "top-in" },
    { "id": "e6", "source": "n6", "target": "n7", "sourceHandle": "bottom-out" },
    { "id": "e7", "source": "n7", "target": "n8", "sourceHandle": "yes", "label": "VERDADEIRO" },
    { "id": "e8", "source": "n8", "target": "n9" },
    { "id": "e9", "source": "n9", "target": "n6", "targetHandle": "right-in" },
    { "id": "e10", "source": "n7", "target": "n10", "sourceHandle": "no", "label": "FALSO" },
    { "id": "e11", "source": "n10", "target": "n11" }
  ]
}
```

---

# 11. Soma até Zero — FAÇA-ENQUANTO (do-while)

Soma números fornecidos até que o valor informado seja `0` (o `0` não altera a soma).

**Entradas:** sequência de inteiros terminada em `0` (ex.: `5`, `3`, `0`).
**Saída esperada:** `A soma é: 8`.

```json
{
  "nodes": [
    { "id": "n1", "type": "startEnd", "data": { "label": "Início", "variant": "start" } },
    { "id": "n2", "type": "memory", "data": { "label": "Memória", "rows": [ { "type": "inteiro", "variables": "num, soma" } ] } },
    { "id": "n3", "type": "process", "data": { "label": "soma = 0" } },
    { "id": "n4", "type": "connector", "data": { "label": "Iniciar leitura" } },
    { "id": "n5", "type": "input", "data": { "label": "num" } },
    { "id": "n6", "type": "process", "data": { "label": "soma = soma + num" } },
    { "id": "n7", "type": "decision", "data": { "label": "num != 0" } },
    { "id": "n8", "type": "output", "data": { "label": "'A soma é: ' + soma" } },
    { "id": "n9", "type": "startEnd", "data": { "label": "Fim", "variant": "end" } }
  ],
  "edges": [
    { "id": "e1", "source": "n1", "target": "n2" },
    { "id": "e2", "source": "n2", "target": "n3" },
    { "id": "e3", "source": "n3", "target": "n4", "targetHandle": "top-in" },
    { "id": "e4", "source": "n4", "target": "n5", "sourceHandle": "bottom-out" },
    { "id": "e5", "source": "n5", "target": "n6" },
    { "id": "e6", "source": "n6", "target": "n7" },
    { "id": "e7", "source": "n7", "target": "n4", "sourceHandle": "yes", "label": "VERDADEIRO", "targetHandle": "right-in" },
    { "id": "e8", "source": "n7", "target": "n8", "sourceHandle": "no", "label": "FALSO" },
    { "id": "e9", "source": "n8", "target": "n9" }
  ]
}
```

A soma começa em `0` em um bloco de processo, antes do conector "Iniciar leitura". O conector
recebe o fluxo pelo topo e o ramo Verdadeiro de `num != 0` pela lateral direita, fechando o laço.
O ramo Falso segue direto para a saída, sem conector, porque é o único caminho que chega até ela.

O gerador converte esse ciclo para um `do...while`, preservando a leitura e a soma dentro do
laço e a saída somente após o valor `0`:

```js
soma = 0;

do {
  num = Number(prompt("Digite o valor de num:"));

  soma = soma + num;
} while (num !== 0);
```

---

# 12. Média de Valores — ENQUANTO (while)

Lê `n` valores e calcula a média. Laço com contador `i`.

**Entradas:** `n` (inteiro) seguido de `n` valores (ex.: `n=3` e valores `10, 20, 30`).
**Saída esperada:** `A média é: 20`.

```json
{
  "nodes": [
    { "id": "n1", "type": "startEnd", "data": { "label": "Início", "variant": "start" } },
    { "id": "n2", "type": "memory", "data": { "label": "Memória", "rows": [ { "type": "inteiro", "variables": "n, i" }, { "type": "real", "variables": "valor, soma, media" } ] } },
    { "id": "n3", "type": "input", "data": { "label": "n" } },
    { "id": "n4", "type": "process", "data": { "label": "soma = 0" } },
    { "id": "n5", "type": "process", "data": { "label": "i = 0" } },
    { "id": "n6", "type": "connector", "data": { "label": "Início do laço" } },
    { "id": "n7", "type": "decision", "data": { "label": "i < n" } },
    { "id": "n8", "type": "input", "data": { "label": "valor" } },
    { "id": "n9", "type": "process", "data": { "label": "soma = soma + valor" } },
    { "id": "n10", "type": "process", "data": { "label": "i = i + 1" } },
    { "id": "n11", "type": "process", "data": { "label": "media = soma / n" } },
    { "id": "n12", "type": "output", "data": { "label": "'A média é: ' + media" } },
    { "id": "n13", "type": "startEnd", "data": { "label": "Fim", "variant": "end" } }
  ],
  "edges": [
    { "id": "e1", "source": "n1", "target": "n2" },
    { "id": "e2", "source": "n2", "target": "n3" },
    { "id": "e3", "source": "n3", "target": "n4" },
    { "id": "e4", "source": "n4", "target": "n5" },
    { "id": "e5", "source": "n5", "target": "n6", "targetHandle": "top-in" },
    { "id": "e6", "source": "n6", "target": "n7", "sourceHandle": "bottom-out" },
    { "id": "e7", "source": "n7", "target": "n8", "sourceHandle": "yes", "label": "VERDADEIRO" },
    { "id": "e8", "source": "n8", "target": "n9" },
    { "id": "e9", "source": "n9", "target": "n10" },
    { "id": "e10", "source": "n10", "target": "n6", "targetHandle": "right-in" },
    { "id": "e11", "source": "n7", "target": "n11", "sourceHandle": "no", "label": "FALSO" },
    { "id": "e12", "source": "n11", "target": "n12" },
    { "id": "e13", "source": "n12", "target": "n13" }
  ]
}
```

---

# 13. Média de Notas com Vetor — VARIÁVEIS INDEXADAS

Armazena as notas em um vetor `notas[5]` e calcula a média. Usa atribuição indexada `notas[i] = nota`.

**Entradas:** `n` (inteiro, `1 <= n <= 5`) seguido de `n` notas (ex.: `n=3` e notas `10, 20, 30`).
**Saída esperada:** `A média das notas é: 20`.
**Observação:** o vetor tem tamanho `5`; se `n > 5`, o motor acusa índice fora dos limites (comportamento esperado).

```json
{
  "nodes": [
    { "id": "n1", "type": "startEnd", "data": { "label": "Início", "variant": "start" } },
    { "id": "n2", "type": "memory", "data": { "label": "Memória", "rows": [ { "type": "inteiro", "variables": "n, i" }, { "type": "real", "variables": "notas[5], soma, media, nota" } ] } },
    { "id": "n3", "type": "input", "data": { "label": "n" } },
    { "id": "n4", "type": "process", "data": { "label": "soma = 0" } },
    { "id": "n5", "type": "process", "data": { "label": "i = 0" } },
    { "id": "n6", "type": "connector", "data": { "label": "Início do laço" } },
    { "id": "n7", "type": "decision", "data": { "label": "i < n" } },
    { "id": "n8", "type": "input", "data": { "label": "nota" } },
    { "id": "n9", "type": "process", "data": { "label": "notas[i] = nota" } },
    { "id": "n10", "type": "process", "data": { "label": "soma = soma + nota" } },
    { "id": "n11", "type": "process", "data": { "label": "i = i + 1" } },
    { "id": "n12", "type": "process", "data": { "label": "media = soma / n" } },
    { "id": "n13", "type": "output", "data": { "label": "'A média das notas é: ' + media" } },
    { "id": "n14", "type": "startEnd", "data": { "label": "Fim", "variant": "end" } }
  ],
  "edges": [
    { "id": "e1", "source": "n1", "target": "n2" },
    { "id": "e2", "source": "n2", "target": "n3" },
    { "id": "e3", "source": "n3", "target": "n4" },
    { "id": "e4", "source": "n4", "target": "n5" },
    { "id": "e5", "source": "n5", "target": "n6", "targetHandle": "top-in" },
    { "id": "e6", "source": "n6", "target": "n7", "sourceHandle": "bottom-out" },
    { "id": "e7", "source": "n7", "target": "n8", "sourceHandle": "yes", "label": "VERDADEIRO" },
    { "id": "e8", "source": "n8", "target": "n9" },
    { "id": "e9", "source": "n9", "target": "n10" },
    { "id": "e10", "source": "n10", "target": "n11" },
    { "id": "e11", "source": "n11", "target": "n6", "targetHandle": "right-in" },
    { "id": "e12", "source": "n7", "target": "n12", "sourceHandle": "no", "label": "FALSO" },
    { "id": "e13", "source": "n12", "target": "n13" },
    { "id": "e14", "source": "n13", "target": "n14" }
  ]
}
```

---

# 14. Sub-rotina Visual — FATORIAL COM RETORNO

Exemplo completo de sub-rotina visual. O algoritmo principal lê `n`, chama `resultado = fatorial(n)` e recebe o retorno calculado no diagrama interno `fatorial`. As variáveis `retorno` e `i` pertencem à memória local da sub-rotina e não aparecem na memória global do algoritmo principal.

**Entradas:** `n` (inteiro, ex.: `5`).
**Saída esperada:** `Fatorial: 120`.

```json
{
  "nodes": [
    { "id": "n1", "type": "startEnd", "data": { "label": "Início", "variant": "start" } },
    { "id": "n2", "type": "memory", "data": { "label": "Memória", "rows": [ { "type": "inteiro", "variables": "n, resultado" } ] } },
    { "id": "n3", "type": "input", "data": { "label": "n" } },
    { "id": "n4", "type": "subroutine", "data": { "label": "resultado = fatorial(n)" } },
    { "id": "n5", "type": "output", "data": { "label": "'Fatorial: ' + resultado" } },
    { "id": "n6", "type": "startEnd", "data": { "label": "Fim", "variant": "end" } }
  ],
  "edges": [
    { "id": "e1", "source": "n1", "target": "n2" },
    { "id": "e2", "source": "n2", "target": "n3" },
    { "id": "e3", "source": "n3", "target": "n4" },
    { "id": "e4", "source": "n4", "target": "n5" },
    { "id": "e5", "source": "n5", "target": "n6" }
  ],
  "subroutines": [
    {
      "id": "routine-fatorial",
      "name": "fatorial",
      "parameters": [ "valor" ],
      "returnVariable": "retorno",
      "nodes": [
        { "id": "r1", "type": "startEnd", "data": { "label": "Início fatorial", "variant": "start" } },
        { "id": "r2", "type": "memory", "data": { "label": "Memória local", "rows": [ { "type": "inteiro", "variables": "retorno, i" } ] } },
        { "id": "r3", "type": "process", "data": { "label": "retorno = 1" } },
        { "id": "r4", "type": "process", "data": { "label": "i = 1" } },
        { "id": "r5", "type": "connector", "data": { "label": "Início do laço" } },
        { "id": "r6", "type": "decision", "data": { "label": "i <= valor" } },
        { "id": "r7", "type": "process", "data": { "label": "retorno = retorno * i" } },
        { "id": "r8", "type": "process", "data": { "label": "i = i + 1" } },
        { "id": "r9", "type": "startEnd", "data": { "label": "Fim fatorial", "variant": "end" } }
      ],
      "edges": [
        { "id": "re1", "source": "r1", "target": "r2" },
        { "id": "re2", "source": "r2", "target": "r3" },
        { "id": "re3", "source": "r3", "target": "r4" },
        { "id": "re4", "source": "r4", "target": "r5", "targetHandle": "top-in" },
        { "id": "re5", "source": "r5", "target": "r6", "sourceHandle": "bottom-out" },
        { "id": "re6", "source": "r6", "target": "r7", "sourceHandle": "yes", "label": "VERDADEIRO" },
        { "id": "re7", "source": "r7", "target": "r8" },
        { "id": "re8", "source": "r8", "target": "r5", "targetHandle": "right-in" },
        { "id": "re9", "source": "r6", "target": "r9", "sourceHandle": "no", "label": "FALSO" }
      ]
    }
  ]
}
```

---

# Checklist de validação

- [ ] O JSON carrega sem erro de sintaxe (botão **Carregar** retorna uma mensagem de diagrama carregado).
- [ ] O teste de mesa mostra cada bloco visitado, inclusive `memory` e `connector`, e o caso selecionado após cada decisão.
- [ ] As variáveis aparecem preenchidas no passo em que são alteradas.
- [ ] A explicação descreve a operação de cada passo.
- [ ] O código gerado é semanticamente equivalente ao diagrama (exceto escolha/caso, que gera só um comentário).
- [ ] Blocos `input` solicitam valor pelo diálogo durante a execução.
- [ ] Decisões seguem pelos ramos `yes`/`no` conforme o resultado da condição.
- [ ] Escolhas seguem pelo caso cujo valor coincide, ou pelo ramo `default` quando nenhum coincide.
- [ ] Laços (`enquanto`/`faça-enquanto`) repetem os passos e terminam quando a condição falha.
- [ ] Vetores (`notas[i]`) atualizam cada posição no teste de mesa.
