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
  | { type: "SYNC_EXECUTION"; steps: IExecutionStep[]; currentStepIndex: number; outputs: string[]; isFinished: boolean }
  | { type: "FINISH" }
  // `step` is the row the desk check shows while the value is asked for.
  | { type: "INPUT_REQUESTED"; prompt: string; variable: string; inputType: string; step?: IExecutionStep }
  | { type: "SUBMIT_INPUT" }
  | { type: "GO_TO_STEP"; index: number }

export interface ISimulatorCallbacks {
  onStart?: () => void
  onStepForward?: (input?: string) => void
  onStepBack?: () => void
  onRunAll?: () => void
  onStop?: () => void
  onReset?: () => void
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
      return { ...state, error: action.error, isRunning: false, isFinished: false }
    case "SET_OUTPUTS":
      return { ...state, outputs: action.outputs }
    case "SET_CODE":
      return { ...state, jsCode: action.js, tsCode: action.ts }
    case "SET_STEPS":
      return { ...state, steps: action.steps }
    case "SYNC_EXECUTION":
      return {
        ...state,
        steps: action.steps,
        currentStepIndex: action.currentStepIndex,
        outputs: action.outputs,
        isFinished: action.isFinished,
      }
    case "FINISH":
      return { ...state, isFinished: true, isRunning: false }
    case "INPUT_REQUESTED": {
      const asked = { ...state, awaitingInput: true, inputPrompt: action.prompt, inputVariable: action.variable, inputType: action.inputType }
      if (!action.step) return asked
      // The waiting row follows the step being shown; anything after it was a
      // future the new value is about to replace.
      const steps = [...state.steps.slice(0, state.currentStepIndex + 1), action.step]
      return { ...asked, steps, currentStepIndex: steps.length - 1 }
    }
    case "SUBMIT_INPUT": {
      // The waiting row is a placeholder: the engine's own step replaces it.
      const steps = state.steps.filter((step) => !isWaitingForInput(step))
      return {
        ...state,
        steps,
        currentStepIndex: Math.max(0, Math.min(state.currentStepIndex, steps.length - 1)),
        awaitingInput: false, inputPrompt: "", inputVariable: "", inputType: "",
      }
    }
    case "GO_TO_STEP": {
      if (action.index < 0 || action.index >= state.steps.length) return state
      return { ...state, currentStepIndex: action.index }
    }
    default:
      return state
  }
}

/** The desk check row of an input still waiting for its value. */
export function isWaitingForInput(step: IExecutionStep): boolean {
  return step.waitingForInput === true && step.inputEntered === false
}
