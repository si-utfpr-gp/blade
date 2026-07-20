# Checklist - Blade

**Versao:** 2.0.0
**Atualizado em:** 2026-07-20

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

---

## Modulo de Execucao e Teste de Mesa (Lucas)

| # | Issue | Tarefa | Status |
|---|-------|--------|--------|
| 1 | [#51](https://github.com/si-utfpr-gp/blade/issues/51) | Parser: JSON diagram → execution graph | 🟡 Em andamento |
| 2 | [#52](https://github.com/si-utfpr-gp/blade/issues/52) | Execution Engine: flow controller + block interpreter | ⬜ Pendente |
| 3 | [#53](https://github.com/si-utfpr-gp/blade/issues/53) | Expression Evaluator (arithmetic/logical) | ⬜ Pendente |
| 4 | [#54](https://github.com/si-utfpr-gp/blade/issues/54) | Memory Manager (variables, arrays, types) | ⬜ Pendente |
| 5 | [#55](https://github.com/si-utfpr-gp/blade/issues/55) | Snapshot System (capture/store/restore) | ⬜ Pendente |
| 6 | [#56](https://github.com/si-utfpr-gp/blade/issues/56) | Explanation Generator (Portuguese text) | ⬜ Pendente |
| 7 | [#57](https://github.com/si-utfpr-gp/blade/issues/57) | Code Generator (JavaScript + TypeScript) | ⬜ Pendente |
| 8 | [#58](https://github.com/si-utfpr-gp/blade/issues/58) | Execution Errors detection (div by zero, etc.) | ⬜ Pendente |
| 9 | [#59](https://github.com/si-utfpr-gp/blade/issues/59) | User Input During Execution (input block) | ⬜ Pendente |
| 10 | [#60](https://github.com/si-utfpr-gp/blade/issues/60) | Navigate to Specific Step in History | ⬜ Pendente |
| 11 | [#61](https://github.com/si-utfpr-gp/blade/issues/61) | Builder ↔ Simulator Integration | ⬜ Pendente |
| 12 | [#62](https://github.com/si-utfpr-gp/blade/issues/62) | Custom Hooks (useExecutionEngine, useParser, useCodeGeneration) | ⬜ Pendente |

---

## UI do Simulador (ja implementado)

| Componente | Status |
|-------------|--------|
| Types/Interfaces (Variable, ExecutionStep, SimulatorState) | ✅ Feito |
| Simulator Reducer (15 actions) | ✅ Feito |
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
| Testes unitarios (9 files, 41 tests) | ✅ Feito |

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
