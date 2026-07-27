import type { ISimulatorState, ISimulatorAction } from "../../interfaces/simulator";

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
};

export function simulatorReducer(
  state: ISimulatorState,
  action: ISimulatorAction,
): ISimulatorState {
  switch (action.type) {
    case "START":
      return { ...state, isStarted: true, isRunning: false, isFinished: false, error: null, currentStepIndex: 0, outputs: [] };
    case "STEP_FORWARD":
      return { ...state, currentStepIndex: state.currentStepIndex + 1 };
    case "STEP_BACK":
      return { ...state, currentStepIndex: Math.max(0, state.currentStepIndex - 1) };
    case "RUN_ALL":
      return { ...state, isRunning: true };
    case "STOP":
      return { ...state, isRunning: false };
    case "RESET":
      return { ...initialState };
    case "SET_SPEED":
      return { ...state, speed: action.speed };
    case "SET_ERROR":
      return { ...state, error: action.error, isRunning: false };
    case "SET_OUTPUTS":
      return { ...state, outputs: action.outputs };
    case "SET_CODE":
      return { ...state, jsCode: action.js, tsCode: action.ts };
    case "SET_STEPS":
      return { ...state, steps: action.steps };
    case "EDIT_VARIABLE": {
      const newSteps = state.steps.map((step, i) => {
        if (i !== action.stepIndex) return step;
        return {
          ...step,
          variables: step.variables.map((v) =>
            v.name === action.varName ? { ...v, value: action.newValue } : v,
          ),
        };
      });
      return { ...state, steps: newSteps };
    }
    case "FINISH":
      return { ...state, isFinished: true, isRunning: false };
    default:
      return state;
  }
}
