# Simulator Tests — TDD Plan

> **For agentic workers:** Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Write React component tests for all simulator components using TDD (Red-Green-Refactor).

**Approach:** Write failing test, verify fail, write minimal code/use existing code, verify pass, refactor. Pure functions first, then reducers, then components.

**Tech Stack:** Vitest, @testing-library/react, @testing-library/jest-dom, jsdom

## Global Constraints

- Test files live next to source: `*.test.tsx`
- Follow existing vitest.config.ts setup (jsdom, globals: true)
- No mocks unless unavoidable (real reducer, real context)
- `@testing-library/jest-dom/vitest` for DOM matchers

---

### Task 1: Test setup

**Files:**
- Modify: `vitest.config.ts` (add setupFiles)
- Create: `app/javascript/builder/components/simulator/setup.ts`

- [ ] **Step 1: Create setup file**

```typescript
// app/javascript/builder/components/simulator/setup.ts
import "@testing-library/jest-dom/vitest"
```

- [ ] **Step 2: Update vitest.config.ts**

```typescript
import { defineConfig } from "vitest/config"

export default defineConfig({
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./app/javascript/builder/components/simulator/setup.ts"],
  },
})
```

- [ ] **Step 3: Verify setup works with a smoke test**

Create `app/javascript/builder/components/simulator/setup.test.ts`:

```typescript
test("setup works", () => {
  expect(true).toBe(true)
})
```

```bash
yarn test
```

Expected: PASS

- [ ] **Step 4: Remove smoke test and commit**

```bash
rm app/javascript/builder/components/simulator/setup.test.ts
git add vitest.config.ts app/javascript/builder/components/simulator/setup.ts
git commit -m "test: add vitest setup with jest-dom matchers"
```

---

### Task 2: Test labels.ts (pure functions — easiest entry)

**Files:**
- Create: `app/javascript/builder/components/simulator/labels.test.ts`

**Interfaces:**
- Consumes: `nodeTypeLabel(t: string): string` from `./labels`

- [ ] **Step 1: Write failing tests**

```typescript
import { describe, it, expect } from "vitest"
import { nodeTypeLabel } from "./labels"

describe("nodeTypeLabel", () => {
  it("returns 'Início/Fim' for startEnd", () => {
    expect(nodeTypeLabel("startEnd")).toBe("Início/Fim")
  })

  it("returns 'Memória' for memory", () => {
    expect(nodeTypeLabel("memory")).toBe("Memória")
  })

  it("returns 'Entrada' for input", () => {
    expect(nodeTypeLabel("input")).toBe("Entrada")
  })

  it("returns 'Saída' for output", () => {
    expect(nodeTypeLabel("output")).toBe("Saída")
  })

  it("returns 'Processo' for process", () => {
    expect(nodeTypeLabel("process")).toBe("Processo")
  })

  it("returns 'Decisão' for decision", () => {
    expect(nodeTypeLabel("decision")).toBe("Decisão")
  })

  it("returns 'Conector' for connector", () => {
    expect(nodeTypeLabel("connector")).toBe("Conector")
  })

  it("returns 'Sub-rotina' for subroutine", () => {
    expect(nodeTypeLabel("subroutine")).toBe("Sub-rotina")
  })

  it("returns the input unchanged for unknown types", () => {
    expect(nodeTypeLabel("unknown_type")).toBe("unknown_type")
  })
})
```

- [ ] **Step 2: Run test — verify fail**

```bash
yarn test app/javascript/builder/components/simulator/labels.test.ts
```

Expected: the module doesn't import correctly yet since `labels.ts` doesn't exist in test context? Actually it does exist — the test should PASS since `labels.ts` already exists. But per TDD, we need to WRITE the test first and see it PASS since the code already exists.

Wait — the user wants TDD for EXISTING components. The code already exists. So the tests will pass immediately. That's not pure TDD, but the user explicitly asked for tests for existing components.

Actually, let me re-read the requirement. The user said "vamos realizar tdd, programação orientada a testes, faça os teste para todos os componentes do react". So they want TDD. But the code already exists.

In the TDD skill, there's a section about this: "Existing code has no tests" → "You're improving it. Add tests for existing code."

So I think the intent is to write tests for the existing code using the TDD methodology, even though the code already exists. The tests will prove the code works correctly and catch regressions.

Let me adjust the plan to reflect this: write tests, run them (they should pass), and commit.

Actually, for existing code the TDD cycle is: write test -> run (it should pass because code exists) -> refactor if needed. The "red" step is skipped because the implementation already exists.

Let me adjust the plan to be practical about this.

- [ ] **Step 2: Run test**

```bash
yarn test app/javascript/builder/components/simulator/labels.test.ts
```

Expected: PASS (implementation already exists)

- [ ] **Step 3: Commit**

Let me adjust the plan template and continue writing it.

- [ ] **Step 2: Run tests to verify they pass (existing implementation)**

```bash
yarn test app/javascript/builder/components/simulator/labels.test.ts
```

Expected: PASS — all label mappings are correct

- [ ] **Step 3: Commit**

```bash
git add app/javascript/builder/components/simulator/labels.test.ts
git commit -m "test(simulator): add tests for nodeTypeLabel"
```

---

### Task 3: Test simulatorReducer (state logic)

**Files:**
- Create: `app/javascript/builder/components/simulator/simulatorReducer.test.ts`
- Uses: `simulatorReducer`, `initialState` from `../../interfaces/simulator`
- Uses: `ExecutionStep` from `../../interfaces`

- [ ] **Step 1: Write tests**

```typescript
import { describe, it, expect } from "vitest"
import { simulatorReducer, initialState } from "../../interfaces/simulator"
import type { ExecutionStep } from "../../interfaces"

const mockStep: ExecutionStep = {
  nodeId: "node-1",
  nodeLabel: "Início",
  nodeType: "startEnd",
  variables: [{ name: "x", value: "10", type: "number", scope: "local" }],
  log: "Iniciando algoritmo.",
  explanation: "O algoritmo começa.",
  changes: ["x = 10"],
  nextHint: "Próximo passo",
}

describe("simulatorReducer", () => {
  it("START resets state and sets isStarted", () => {
    const state = simulatorReducer(initialState, { type: "START" })
    expect(state.isStarted).toBe(true)
    expect(state.isRunning).toBe(false)
    expect(state.isFinished).toBe(false)
    expect(state.error).toBeNull()
    expect(state.currentStepIndex).toBe(0)
  })

  it("STEP_FORWARD increments currentStepIndex", () => {
    const state = simulatorReducer(
      { ...initialState, currentStepIndex: 0 },
      { type: "STEP_FORWARD" }
    )
    expect(state.currentStepIndex).toBe(1)
  })

  it("STEP_BACK decrements currentStepIndex but not below 0", () => {
    const state = simulatorReducer(
      { ...initialState, currentStepIndex: 1 },
      { type: "STEP_BACK" }
    )
    expect(state.currentStepIndex).toBe(0)
  })

  it("STEP_BACK does not go below 0", () => {
    const state = simulatorReducer(
      { ...initialState, currentStepIndex: 0 },
      { type: "STEP_BACK" }
    )
    expect(state.currentStepIndex).toBe(0)
  })

  it("RUN_ALL sets isRunning to true", () => {
    const state = simulatorReducer(initialState, { type: "RUN_ALL" })
    expect(state.isRunning).toBe(true)
  })

  it("STOP sets isRunning to false", () => {
    const state = simulatorReducer(
      { ...initialState, isRunning: true },
      { type: "STOP" }
    )
    expect(state.isRunning).toBe(false)
  })

  it("RESET returns initialState", () => {
    const modified = { ...initialState, isStarted: true, currentStepIndex: 5 }
    const state = simulatorReducer(modified, { type: "RESET" })
    expect(state).toEqual(initialState)
  })

  it("SET_SPEED updates speed", () => {
    const state = simulatorReducer(initialState, { type: "SET_SPEED", speed: 500 })
    expect(state.speed).toBe(500)
  })

  it("SET_ERROR sets error and stops running", () => {
    const state = simulatorReducer(
      { ...initialState, isRunning: true },
      { type: "SET_ERROR", error: "Algo deu errado" }
    )
    expect(state.error).toBe("Algo deu errado")
    expect(state.isRunning).toBe(false)
  })

  it("SET_OUTPUTS replaces outputs", () => {
    const state = simulatorReducer(initialState, {
      type: "SET_OUTPUTS",
      outputs: ["10", "20"],
    })
    expect(state.outputs).toEqual(["10", "20"])
  })

  it("SET_CODE sets jsCode and tsCode", () => {
    const state = simulatorReducer(initialState, {
      type: "SET_CODE",
      js: "console.log(1)",
      ts: "console.log(1 as number)",
    })
    expect(state.jsCode).toBe("console.log(1)")
    expect(state.tsCode).toBe("console.log(1 as number)")
  })

  it("SET_STEPS replaces steps", () => {
    const state = simulatorReducer(initialState, {
      type: "SET_STEPS",
      steps: [mockStep],
    })
    expect(state.steps).toHaveLength(1)
    expect(state.steps[0].nodeId).toBe("node-1")
  })

  it("FINISH sets isFinished and stops running", () => {
    const state = simulatorReducer(
      { ...initialState, isRunning: true },
      { type: "FINISH" }
    )
    expect(state.isFinished).toBe(true)
    expect(state.isRunning).toBe(false)
  })

  it("EDIT_VARIABLE updates variable value in the correct step", () => {
    const stateWithStep = {
      ...initialState,
      steps: [mockStep],
      currentStepIndex: 0,
    }
    const state = simulatorReducer(stateWithStep, {
      type: "EDIT_VARIABLE",
      stepIndex: 0,
      varName: "x",
      newValue: "20",
    })
    expect(state.steps[0].variables[0].value).toBe("20")
  })

  it("EDIT_VARIABLE does not affect other steps", () => {
    const step2: ExecutionStep = {
      ...mockStep,
      nodeId: "node-2",
      variables: [{ name: "x", value: "10", type: "number", scope: "local" }],
    }
    const stateWithSteps = { ...initialState, steps: [mockStep, step2] }
    const state = simulatorReducer(stateWithSteps, {
      type: "EDIT_VARIABLE",
      stepIndex: 0,
      varName: "x",
      newValue: "99",
    })
    expect(state.steps[0].variables[0].value).toBe("99")
    expect(state.steps[1].variables[0].value).toBe("10")
  })
})
```

- [ ] **Step 2: Run tests**

```bash
yarn test app/javascript/builder/components/simulator/simulatorReducer.test.ts
```

Expected: PASS — all reducer logic is already implemented

- [ ] **Step 3: Commit**

```bash
git add app/javascript/builder/components/simulator/simulatorReducer.test.ts
git commit -m "test(simulator): add tests for simulatorReducer"
```

---

### Task 4: Create a test wrapper for components that need context

**Files:**
- Create: `app/javascript/builder/components/simulator/test-utils.tsx`

- [ ] **Step 1: Create test utility**

```typescript
import { type ReactNode } from "react"
import { SimulatorProvider } from "./SimulatorContext"

export function renderWithSimulator(ui: ReactNode, callbacks?: Record<string, unknown>) {
  return (
    <SimulatorProvider callbacks={callbacks as any}>
      {ui}
    </SimulatorProvider>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add app/javascript/builder/components/simulator/test-utils.tsx
git commit -m "test(simulator): add renderWithSimulator test utility"
```

---

### Task 5: Test SimulatorHeader

**Files:**
- Create: `app/javascript/builder/components/simulator/SimulatorHeader.test.tsx`
- Uses: `renderWithSimulator` from `./test-utils`
- Uses: `render`, `screen` from `@testing-library/react`

- [ ] **Step 1: Write tests**

```typescript
import { describe, it, expect } from "vitest"
import { render, screen } from "@testing-library/react"
import { SimulatorProvider } from "./SimulatorContext"
import SimulatorHeader from "./SimulatorHeader"

function renderWithState(overrides?: Partial<import("../../interfaces/simulator").SimulatorState>) {
  return render(
    <SimulatorProvider>
      <SimulatorHeader />
    </SimulatorProvider>
  )
}

describe("SimulatorHeader", () => {
  it('shows "Pronto" when not started', () => {
    renderWithState()
    expect(screen.getByText("Pronto")).toBeInTheDocument()
  })

  it("shows the Terminal icon", () => {
    renderWithState()
    expect(screen.getByText("Depurador")).toBeInTheDocument()
  })
})
```

Note: To test different states (Executando, Finalizado, Pausado), we'd need to dispatch actions or set initial state. The current context doesn't support initial state injection. For now, test the default "Pronto" state.

- [ ] **Step 2: Run tests**

```bash
yarn test app/javascript/builder/components/simulator/SimulatorHeader.test.tsx
```

Expected: PASS

- [ ] **Step 3: Commit**

```bash
git add app/javascript/builder/components/simulator/SimulatorHeader.test.tsx
git commit -m "test(simulator): add SimulatorHeader tests"
```

---

### Task 6: Test SimulatorControl

**Files:**
- Create: `app/javascript/builder/components/simulator/SimulatorControl.test.tsx`

- [ ] **Step 1: Write tests**

```typescript
import { describe, it, expect } from "vitest"
import { render, screen, fireEvent } from "@testing-library/react"
import { SimulatorProvider } from "./SimulatorContext"
import SimulatorControl from "./SimulatorControl"

function renderControl() {
  return render(
    <SimulatorProvider>
      <SimulatorControl />
    </SimulatorProvider>
  )
}

describe("SimulatorControl", () => {
  it('shows "Iniciar Execução" button when not started', () => {
    renderControl()
    expect(screen.getByText("Iniciar Execução")).toBeInTheDocument()
  })

  it("dispatches START when clicking Iniciar Execução", () => {
    renderControl()
    fireEvent.click(screen.getByText("Iniciar Execução"))
    // After clicking, the Iniciar button should be gone
    expect(screen.queryByText("Iniciar Execução")).not.toBeInTheDocument()
  })

  it("shows step controls after starting", () => {
    renderControl()
    fireEvent.click(screen.getByText("Iniciar Execução"))
    expect(screen.getByTitle("Passo anterior")).toBeInTheDocument()
    expect(screen.getByText("Próximo")).toBeInTheDocument()
    expect(screen.getByTitle("Executar tudo")).toBeInTheDocument()
  })

  it("shows speed selector", () => {
    renderControl()
    expect(screen.getByRole("combobox")).toBeInTheDocument()
  })
})
```

- [ ] **Step 2: Run tests**

```bash
yarn test app/javascript/builder/components/simulator/SimulatorControl.test.tsx
```

Expected: PASS

- [ ] **Step 3: Commit**

```bash
git add app/javascript/builder/components/simulator/SimulatorControl.test.tsx
git commit -m "test(simulator): add SimulatorControl tests"
```

---

### Task 7: Test SimulatorTabs

**Files:**
- Create: `app/javascript/builder/components/simulator/SimulatorTabs.test.tsx`

- [ ] **Step 1: Write tests**

```typescript
import { describe, it, expect } from "vitest"
import { render, screen, fireEvent } from "@testing-library/react"
import { SimulatorProvider } from "./SimulatorContext"
import SimulatorTabs from "./SimulatorTabs"

function renderTabs() {
  return render(
    <SimulatorProvider>
      <SimulatorTabs />
    </SimulatorProvider>
  )
}

describe("SimulatorTabs", () => {
  it("renders all three tabs", () => {
    renderTabs()
    expect(screen.getByText("Teste de Mesa")).toBeInTheDocument()
    expect(screen.getByText("Explicação")).toBeInTheDocument()
    expect(screen.getByText("Código")).toBeInTheDocument()
  })

  it("has Teste de Mesa active by default", () => {
    renderTabs()
    const traceTab = screen.getByText("Teste de Mesa")
    expect(traceTab.className).toContain("border-primary")
  })

  it("switches active tab on click", () => {
    renderTabs()
    fireEvent.click(screen.getByText("Explicação"))
    const explainTab = screen.getByText("Explicação")
    expect(explainTab.className).toContain("border-primary")
  })
})
```

- [ ] **Step 2: Run tests**

```bash
yarn test app/javascript/builder/components/simulator/SimulatorTabs.test.tsx
```

Expected: PASS

- [ ] **Step 3: Commit**

```bash
git add app/javascript/builder/components/simulator/SimulatorTabs.test.tsx
git commit -m "test(simulator): add SimulatorTabs tests"
```

---

### Task 8: Test SimulatorStatusBar

**Files:**
- Create: `app/javascript/builder/components/simulator/SimulatorStatusBar.test.tsx`

- [ ] **Step 1: Write tests**

```typescript
import { describe, it, expect } from "vitest"
import { render, screen } from "@testing-library/react"
import { SimulatorProvider } from "./SimulatorContext"
import SimulatorStatusBar from "./SimulatorStatusBar"

function renderStatusBar() {
  return render(
    <SimulatorProvider>
      <SimulatorStatusBar />
    </SimulatorProvider>
  )
}

describe("SimulatorStatusBar", () => {
  it('shows "Aguardando início" when not started', () => {
    renderStatusBar()
    expect(screen.getByText("Aguardando início")).toBeInTheDocument()
  })
})
```

- [ ] **Step 2: Run tests**

```bash
yarn test app/javascript/builder/components/simulator/SimulatorStatusBar.test.tsx
```

Expected: PASS

- [ ] **Step 3: Commit**

```bash
git add app/javascript/builder/components/simulator/SimulatorStatusBar.test.tsx
git commit -m "test(simulator): add SimulatorStatusBar tests"
```

---

### Task 9: Test SimulatorCode

**Files:**
- Create: `app/javascript/builder/components/simulator/SimulatorCode.test.tsx`

- [ ] **Step 1: Write tests**

```typescript
import { describe, it, expect } from "vitest"
import { render, screen, fireEvent } from "@testing-library/react"
import { SimulatorProvider } from "./SimulatorContext"
import SimulatorCode from "./SimulatorCode"

describe("SimulatorCode", () => {
  it("renders JS and TS toggle buttons", () => {
    render(
      <SimulatorProvider>
        <SimulatorCode />
      </SimulatorProvider>
    )
    expect(screen.getByText("JavaScript")).toBeInTheDocument()
    expect(screen.getByText("TypeScript")).toBeInTheDocument()
  })

  it("shows JavaScript by default", () => {
    render(
      <SimulatorProvider>
        <SimulatorCode />
      </SimulatorProvider>
    )
    expect(screen.getByText("JavaScript").className).toContain("border-primary")
  })

  it("switches to TypeScript on click", () => {
    render(
      <SimulatorProvider>
        <SimulatorCode />
      </SimulatorProvider>
    )
    fireEvent.click(screen.getByText("TypeScript"))
    expect(screen.getByText("TypeScript").className).toContain("border-primary")
  })

  it('shows "Copiar" button', () => {
    render(
      <SimulatorProvider>
        <SimulatorCode />
      </SimulatorProvider>
    )
    expect(screen.getByText("Copiar")).toBeInTheDocument()
  })
})
```

- [ ] **Step 2: Run tests**

```bash
yarn test app/javascript/builder/components/simulator/SimulatorCode.test.tsx
```

Expected: PASS

- [ ] **Step 3: Commit**

```bash
git add app/javascript/builder/components/simulator/SimulatorCode.test.tsx
git commit -m "test(simulator): add SimulatorCode tests"
```

---

### Task 10: Test SimulatorExplain

**Files:**
- Create: `app/javascript/builder/components/simulator/SimulatorExplain.test.tsx`

- [ ] **Step 1: Write tests**

```typescript
import { describe, it, expect } from "vitest"
import { render, screen } from "@testing-library/react"
import { SimulatorProvider } from "./SimulatorContext"
import SimulatorExplain from "./SimulatorExplain"

describe("SimulatorExplain", () => {
  it('shows prompt when not started', () => {
    render(
      <SimulatorProvider>
        <SimulatorExplain />
      </SimulatorProvider>
    )
    expect(screen.getByText(/inicie a execução/i)).toBeInTheDocument()
  })
})
```

- [ ] **Step 2: Run tests**

```bash
yarn test app/javascript/builder/components/simulator/SimulatorExplain.test.tsx
```

Expected: PASS

- [ ] **Step 3: Commit**

```bash
git add app/javascript/builder/components/simulator/SimulatorExplain.test.tsx
git commit -m "test(simulator): add SimulatorExplain tests"
```

---

### Task 11: Test SimulatorTrace

**Files:**
- Create: `app/javascript/builder/components/simulator/SimulatorTrace.test.tsx`

- [ ] **Step 1: Write tests**

```typescript
import { describe, it, expect } from "vitest"
import { render, screen } from "@testing-library/react"
import { SimulatorProvider } from "./SimulatorContext"
import SimulatorTrace from "./SimulatorTrace"

describe("SimulatorTrace", () => {
  it('shows prompt when not started', () => {
    render(
      <SimulatorProvider>
        <SimulatorTrace />
      </SimulatorProvider>
    )
    expect(screen.getByText(/iniciar execução/i)).toBeInTheDocument()
  })

  it("shows output section", () => {
    render(
      <SimulatorProvider>
        <SimulatorTrace />
      </SimulatorProvider>
    )
    expect(screen.getByText("Saída do Algoritmo")).toBeInTheDocument()
  })
})
```

- [ ] **Step 2: Run tests**

```bash
yarn test app/javascript/builder/components/simulator/SimulatorTrace.test.tsx
```

Expected: PASS

- [ ] **Step 3: Commit**

```bash
git add app/javascript/builder/components/simulator/SimulatorTrace.test.tsx
git commit -m "test(simulator): add SimulatorTrace tests"
```

---

### Task 12: Run all tests and verify

- [ ] **Step 1: Run full test suite**

```bash
yarn test
```

Expected: All tests PASS

- [ ] **Step 2: Run lint**

```bash
yarn lint
```

Expected: No errors
