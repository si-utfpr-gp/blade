# Checklist - Blade

**Versao:** 2.0.0
**Atualizado em:** 2026-08-11 (Execução automática, Code Generator e contrato JSON de teste sem `position`)

---

## Modulo de Construcao (Emanuel)

| # | Issue | Tarefa | Status |
|---|-------|--------|--------|
| 1 | — | Editor Visual (Canvas) com React Flow | ⬜ Pendente |
| 2 | — | Paleta de Blocos para arrastar | ⬜ Pendente |
| 3 | — | Inserir blocos no canvas | ⬜ Pendente |
| 4 | — | Conectar blocos (arestas com handles) | ⬜ Pendente |
| 5 | — | Editar propriedades dos blocos (label, variant, rows) | ⬜ Pendente |
| 6 | — | Organizar diagrama (mover, selecionar, deletar) | ⬜ Pendente |
| 7 | — | Validação Estrutural (RN01–RN16) | ⬜ Pendente |
| 8 | — | Exportar JSON `{ nodes, edges }` para o simulador | ⬜ Pendente |
| 9 | — | Normalizar JSON do construtor removendo dados visuais antes da execução (`position`, dimensões, seleção) | ⬜ Pendente |

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
