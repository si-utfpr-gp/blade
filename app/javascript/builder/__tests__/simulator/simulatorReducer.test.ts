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
