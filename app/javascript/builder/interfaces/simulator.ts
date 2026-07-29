import type { IExecutionStep } from "./execution"

export interface ISimulatorState {
  steps: IExecutionStep[]
  currentStepIndex: number
  outputs: string[]
  isRunning: boolean
  isFinished: boolean
  isStarted: boolean
  error: string | null
  speed: number
  jsCode: string
  tsCode: string
  awaitingInput: boolean
  inputPrompt: string
  inputVariable: string
  inputType: string
}

export type ISimulatorAction =
  | { type: "START" }
  | { type: "STEP_FORWARD"; step?: IExecutionStep }
  | { type: "STEP_BACK" }
  | { type: "RUN_ALL" }
  | { type: "STOP" }
  | { type: "RESET" }
  | { type: "SET_SPEED"; speed: number }
  | { type: "SET_ERROR"; error: string | null }
  | { type: "SET_OUTPUTS"; outputs: string[] }
  | { type: "SET_CODE"; js: string; ts: string }
  | { type: "SET_STEPS"; steps: IExecutionStep[] }
  | { type: "EDIT_VARIABLE"; stepIndex: number; varName: string; newValue: string }
  | { type: "FINISH" }
  | { type: "INPUT_REQUESTED"; prompt: string; variable: string; inputType: string }
  | { type: "SUBMIT_INPUT" }
  | { type: "GO_TO_STEP"; index: number }

export interface ISimulatorCallbacks {
  onStart?: () => void
  onStepForward?: (input?: string) => void
  onStepBack?: () => void
  onRunAll?: () => void
  onStop?: () => void
  onReset?: () => void
  onVariableEdit?: (stepIndex: number, varName: string, newValue: string) => void
  onInputSubmit?: (value: string) => void
  onInputCancel?: () => void
}

export const initialState: ISimulatorState = {
  steps: [],
  currentStepIndex: 0,
  outputs: [],
  isRunning: false,
  isFinished: false,
  isStarted: false,
  error: null,
  speed: 1000,
  jsCode: "",
  tsCode: "",
  awaitingInput: false,
  inputPrompt: "",
  inputVariable: "",
  inputType: "",
}

export function simulatorReducer(state: ISimulatorState, action: ISimulatorAction): ISimulatorState {
  switch (action.type) {
    case "START":
      return { ...state, isStarted: true, isRunning: false, isFinished: false, error: null, currentStepIndex: 0, outputs: [], awaitingInput: false, inputPrompt: "", inputVariable: "", inputType: "" }
    case "STEP_FORWARD": {
      if (action.step) {
        return {
          ...state,
          steps: [...state.steps, action.step],
          currentStepIndex: state.steps.length,
        }
      }
      return { ...state, currentStepIndex: state.currentStepIndex + 1 }
    }
    case "STEP_BACK":
      return { ...state, currentStepIndex: Math.max(0, state.currentStepIndex - 1) }
    case "RUN_ALL":
      return { ...state, isRunning: true }
    case "STOP":
      return { ...state, isRunning: false }
    case "RESET":
      return { ...initialState }
    case "SET_SPEED":
      return { ...state, speed: action.speed }
    case "SET_ERROR":
      return { ...state, error: action.error, isRunning: false }
    case "SET_OUTPUTS":
      return { ...state, outputs: action.outputs }
    case "SET_CODE":
      return { ...state, jsCode: action.js, tsCode: action.ts }
    case "SET_STEPS":
      return { ...state, steps: action.steps }
    case "EDIT_VARIABLE": {
      const newSteps = state.steps.map((step, i) => {
        if (i !== action.stepIndex) return step
        return {
          ...step,
          variables: step.variables.map((v) =>
            v.name === action.varName ? { ...v, value: action.newValue } : v
          ),
        }
      })
      return { ...state, steps: newSteps }
    }
    case "FINISH":
      return { ...state, isFinished: true, isRunning: false }
    case "INPUT_REQUESTED":
      return { ...state, awaitingInput: true, inputPrompt: action.prompt, inputVariable: action.variable, inputType: action.inputType }
    case "SUBMIT_INPUT":
      return { ...state, awaitingInput: false, inputPrompt: "", inputVariable: "", inputType: "" }
    case "GO_TO_STEP": {
      if (action.index < 0 || action.index >= state.steps.length) return state
      return { ...state, currentStepIndex: action.index }
    }
    default:
      return state
  }
}
