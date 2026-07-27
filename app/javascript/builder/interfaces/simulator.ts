import type { IExecutionStep } from "./execution";

export interface ISimulatorState {
  steps: IExecutionStep[];
  currentStepIndex: number;
  outputs: string[];
  isRunning: boolean;
  isFinished: boolean;
  isStarted: boolean;
  error: string | null;
  speed: number;
  jsCode: string;
  tsCode: string;
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

export interface ISimulatorCallbacks {
  onStart?: () => void;
  onStepForward?: () => void;
  onStepBack?: () => void;
  onRunAll?: () => void;
  onStop?: () => void;
  onReset?: () => void;
  onVariableEdit?: (stepIndex: number, varName: string, newValue: string) => void;
}
