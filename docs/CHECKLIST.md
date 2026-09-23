# Checklist - Blade

**Versao:** 2.0.0
**Atualizado em:** 2026-08-25 (execução de sub-rotinas visuais e exemplos JSON atualizados)

---

## Modulo de Construcao (Emanuel)

| # | Issue | Tarefa | Status |
|---|-------|--------|--------|
| 1 | [#149](https://github.com/si-utfpr-gp/blade/issues/149) | Editor Visual (Canvas) com React Flow | ✅ Feito |
| 2 | [#149](https://github.com/si-utfpr-gp/blade/issues/149) | Paleta de Blocos para arrastar | ✅ Feito |
| 3 | [#149](https://github.com/si-utfpr-gp/blade/issues/149) | Inserir blocos no canvas | ✅ Feito |
| 4 | [#149](https://github.com/si-utfpr-gp/blade/issues/149) | Conectar blocos (arestas com handles) | ✅ Feito |
| 5 | [#149](https://github.com/si-utfpr-gp/blade/issues/149) | Editar propriedades dos blocos (label, variant, rows) | ✅ Feito |
| 6 | [#149](https://github.com/si-utfpr-gp/blade/issues/149) | Organizar diagrama (mover, selecionar, deletar) | ✅ Feito |
| 7 | — | Validação Estrutural (RN01–RN16) | ⬜ Pendente |
| 8 | [#164](https://github.com/si-utfpr-gp/blade/issues/164) | Exportar diagrama do Constructor para o Simulator | 🟡 Em andamento |
| 9 | [#165](https://github.com/si-utfpr-gp/blade/issues/165) | Normalizar JSON removendo metadados visuais | 🟡 Em andamento |

---

## Sub-rotinas Visuais — Módulo de Construção (Emanuel)

| # | Tarefa | Status |
|---|--------|--------|
| 1 | Criar canvases internos para o algoritmo **Principal** e para cada sub-rotina definida pelo usuário | ⬜ Pendente |
| 2 | Criar fluxo de criação, seleção, renomeação e exclusão de sub-rotinas no construtor | ⬜ Pendente |
| 3 | Permitir configurar nome e parâmetros de cada sub-rotina | ⬜ Pendente |
| 4 | Criar o bloco visual `subroutine` para selecionar a função chamada, informar argumentos e variável de retorno | ⬜ Pendente |
| 5 | Definir e implementar a representação visual do retorno da sub-rotina | ⬜ Pendente |
| 6 | Exportar o contrato JSON com algoritmo principal e diagramas de sub-rotinas, sem metadados de layout | ⬜ Pendente |

---

## Integração Construtor → Simulador (Caminho Verdadeiro - Sem Validação)

| # | Issue | Tarefa | Status |
|---|-------|--------|--------|
| 1 | [#164](https://github.com/si-utfpr-gp/blade/issues/164) | Exportar diagrama do Constructor para o Simulator | 🟡 Em andamento |
| 2 | [#165](https://github.com/si-utfpr-gp/blade/issues/165) | Normalizar JSON removendo metadados visuais | 🟡 Em andamento |
| 3 | [#166](https://github.com/si-utfpr-gp/blade/issues/166) | Highlight sincronizado com execução no Canvas | 🟡 Em andamento |
| 4 | [#167](https://github.com/si-utfpr-gp/blade/issues/167) | Navegação histórica sincronizada | 🟡 Em andamento |
| 5 | [#168](https://github.com/si-utfpr-gp/blade/issues/168) | Importar exemplos diretamente no Canvas | ⬜ Pendente |

---

## Modulo de Execucao e Teste de Mesa (Lucas)

| # | Issue | Tarefa | Status |
|---|-------|--------|--------|
| 1 | [#51](https://github.com/si-utfpr-gp/blade/issues/51) | Parser: JSON diagram → execution graph | ✅ Feito |
| 2 | [#52](https://github.com/si-utfpr-gp/blade/issues/52) | Execution Engine: flow controller + block interpreter | ✅ Feito |
| 3 | [#53](https://github.com/si-utfpr-gp/blade/issues/53) | Expression Evaluator (arithmetic/logical) | ✅ Feito |
| 4 | [#54](https://github.com/si-utfpr-gp/blade/issues/54) | Memory Manager (variables, arrays, types) | ✅ Feito |
| 5 | [#55](https://github.com/si-utfpr-gp/blade/issues/55) | Snapshot System (capture/store/restore) | ✅ Feito |
| 6 | [#56](https://github.com/si-utfpr-gp/blade/issues/56) | Explanation Generator (Portuguese text) | ✅ Feito |
| 7 | [#57](https://github.com/si-utfpr-gp/blade/issues/57) | Code Generator (JavaScript + TypeScript) | ✅ Feito |
| 8 | [#58](https://github.com/si-utfpr-gp/blade/issues/58) | Execution Errors detection (div by zero, etc.) | ✅ Feito |
| 9 | [#59](https://github.com/si-utfpr-gp/blade/issues/59) | User Input During Execution (input block) | ✅ Feito |
| 10 | [#60](https://github.com/si-utfpr-gp/blade/issues/60) | Navigate to Specific Step in History | ✅ Feito |
| 11 | [#61](https://github.com/si-utfpr-gp/blade/issues/61) | Builder ↔ Simulator Integration | ⬜ Pendente |
| 12 | [#62](https://github.com/si-utfpr-gp/blade/issues/62) | Custom Hooks (useExecutionEngine, useParser, useCodeGeneration) | ⬜ Pendente |
| 13 | — | Aceitar JSON de execução sem `position` nos nós | ✅ Feito |
| 14 | — | Gerar código JS/TS com inputs tipados, operadores Portugol e `while` para loops simples | ✅ Feito |
| 15 | — | Avaliador seguro e erros estruturados: `ExprEvaluator` interpreta apenas a AST interna permitida, sem `eval` ou `new Function`; `ExecutionError` preserva `{ type, message, blockId }` até a `ExecutionEngine`. Chamadas, propriedades e payloads de construtor fora da gramática são rejeitados. | ✅ Feito |

---

## Sub-rotinas — Módulo de Execução (Lucas)

| # | Tarefa | Status |
|---|--------|--------|
| 1 | Executar sub-rotinas visuais: interpretar chamada, parâmetros, memória local, retorno, pilha de chamadas, snapshots e geração de código JS/TS | ✅ Feito |
| 2 | Testar chamada simples, parâmetros, retorno, erro de contrato e navegação por snapshots durante uma sub-rotina | ✅ Feito |

---

## UI do Simulador (ja implementado)

| Componente | Status |
|-------------|--------|
| Types/Interfaces (Variable, ExecutionStep, SimulatorState) | ✅ Feito |
| Simulator Reducer (18 actions) | ✅ Feito |
| Simulator Context/Provider | ✅ Feito |
| SimulatorPanel (layout principal) | ✅ Feito |
| SimulatorHeader (status indicator) | ✅ Feito |
| SimulatorControl (start, step, run all, reset, speed) | ✅ Feito |
| SimulatorTabs (Trace/Explain/Code) | ✅ Feito |
| SimulatorTrace (Desk Check Table) | ✅ Feito |
| SimulatorExplain (Explanation panel) | ✅ Feito |
| SimulatorCode (JS/TS code viewer) | ✅ Feito |
| SimulatorStatusBar (step counter) | ✅ Feito |
| Labels em Portugues (nodeTypeLabel) | ✅ Feito |
| Testes unitarios (19 files, 229 tests) | ✅ Feito |

---

## Contrato JSON para Teste de Mesa

Para o **módulo de execução/teste de mesa**, `position` não é obrigatório. `position` pertence ao construtor visual (React Flow) e deve ser tratado como metadado de layout.

Formato recomendado para testes manuais no Harness JSON:

```json
{
  "nodes": [
    { "id": "n1", "type": "startEnd", "data": { "label": "Início", "variant": "start" } },
    { "id": "n2", "type": "memory", "data": { "rows": [ { "type": "inteiro", "variables": "a, b, soma" } ] } },
    { "id": "n3", "type": "input", "data": { "label": "a, b" } },
    { "id": "n4", "type": "process", "data": { "label": "soma = a + b" } },
    { "id": "n5", "type": "output", "data": { "label": "'Soma: ' + soma" } },
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

Campos mínimos por nó: `id`, `type`, `data`. Campos mínimos por aresta: `id`, `source`, `target`. Em `decision`, usar `sourceHandle: "yes"` e `sourceHandle: "no"`.

---

## Documentacao

| Documento | Status |
|-----------|--------|
| PRD (docs/prd.md) | ✅ Atualizado v2.0.0 |
| SSD (docs/ssd.md) | ✅ Atualizado v2.0.0 |
| Contributing (docs/contributing.md) | ✅ Feito |
| CHECKLIST.md | ✅ Feito |

---

## Legenda

- ✅ Feito
- 🟡 Em andamento
- ⬜ Pendente
