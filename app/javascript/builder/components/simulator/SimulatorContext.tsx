import {
  createContext,
  useContext,
  useReducer,
  useCallback,
  useState,
  useRef,
  type ReactNode,
} from "react";
import type {
  ISimulatorState,
  ISimulatorCallbacks,
} from "../../interfaces/simulator";
import { initialState, simulatorReducer } from "../../interfaces/simulator";
import { ExecutionEngine } from "../../engine/ExecutionEngine";

type Tab = "trace" | "explain" | "code";

interface ISimulatorContextValue {
  state: ISimulatorState;
  activeTab: Tab;
  setActiveTab: (tab: Tab) => void;
  canStepBack: boolean;
  canStepForward: boolean;
  start: () => void;
  stepForward: () => void;
  stepBack: () => void;
  runAll: () => void;
  stop: () => void;
  reset: () => void;
  setSpeed: (speed: number) => void;
  setCode: (js: string, ts: string) => void;
  editVariable: (stepIndex: number, varName: string, newValue: string) => void;
  submitInput: (value: string) => void;
  cancelInput: () => void;
  setEngine: (engine: ExecutionEngine) => void;
}

const SimulatorContext = createContext<ISimulatorContextValue | null>(null);

export function SimulatorProvider({
  children,
  callbacks,
}: {
  children: ReactNode;
  callbacks?: ISimulatorCallbacks;
}) {
  const [state, dispatch] = useReducer(simulatorReducer, initialState);
  const [activeTab, setActiveTab] = useState<Tab>("trace");
  const engineRef = useRef<ExecutionEngine | null>(null);

  const setEngine = useCallback((engine: ExecutionEngine) => {
    engineRef.current = engine;
  }, []);

  const canStepBack =
    state.isStarted && state.currentStepIndex > 0 && !state.isRunning && !state.awaitingInput;
  const canStepForward =
    state.isStarted && !state.isFinished && !state.isRunning && !state.awaitingInput;

  const executeNextStep = useCallback((input?: string) => {
    const engine = engineRef.current;
    if (!engine) return;

    const step = engine.step(input);
    if (!step) {
      dispatch({ type: "FINISH" });
      return;
    }

    if (step.waitingForInput) {
      dispatch({
        type: "INPUT_REQUESTED",
        prompt: step.inputPrompt ?? `Valor para '${step.nodeLabel}':`,
        variable: step.nodeLabel,
        inputType: step.inputType ?? "caractere",
      });
      dispatch({ type: "STEP_FORWARD", step });
    } else {
      if (step.output !== undefined) {
        dispatch({ type: "SET_OUTPUTS", outputs: [...state.outputs, step.output] });
      }
      dispatch({ type: "STEP_FORWARD", step });
    }
  }, [state.outputs]);

  const start = useCallback(() => {
    dispatch({ type: "START" });
    callbacks?.onStart?.();

    const engine = engineRef.current;
    if (engine) {
      const step = engine.start();
      if (step) {
        dispatch({ type: "SET_STEPS", steps: [step] });
      }
    }
  }, [callbacks]);

  const stepForward = useCallback(() => {
    callbacks?.onStepForward?.();
    executeNextStep();
  }, [callbacks, executeNextStep]);

  const submitInput = useCallback((value: string) => {
    dispatch({ type: "SUBMIT_INPUT" });
    callbacks?.onInputSubmit?.(value);
    executeNextStep(value);
  }, [callbacks, executeNextStep]);

  const cancelInput = useCallback(() => {
    dispatch({ type: "SUBMIT_INPUT" });
    callbacks?.onInputCancel?.();
  }, [callbacks]);

  const stepBack = useCallback(() => {
    dispatch({ type: "STEP_BACK" });
    callbacks?.onStepBack?.();
  }, [callbacks]);

  const runAll = useCallback(() => {
    dispatch({ type: "RUN_ALL" });
    callbacks?.onRunAll?.();
  }, [callbacks]);

  const stop = useCallback(() => {
    dispatch({ type: "STOP" });
    callbacks?.onStop?.();
  }, [callbacks]);

  const reset = useCallback(() => {
    dispatch({ type: "RESET" });
    engineRef.current?.reset();
    callbacks?.onReset?.();
  }, [callbacks]);

  const setSpeed = useCallback((speed: number) => {
    dispatch({ type: "SET_SPEED", speed });
  }, []);

  const setCode = useCallback((js: string, ts: string) => {
    dispatch({ type: "SET_CODE", js, ts });
  }, []);

  const editVariable = useCallback(
    (stepIndex: number, varName: string, newValue: string) => {
      dispatch({ type: "EDIT_VARIABLE", stepIndex, varName, newValue });
      callbacks?.onVariableEdit?.(stepIndex, varName, newValue);
    },
    [callbacks],
  );

  return (
    <SimulatorContext.Provider
      value={{
        state,
        activeTab,
        setActiveTab,
        canStepBack,
        canStepForward,
        start,
        stepForward,
        stepBack,
        runAll,
        stop,
        reset,
        setSpeed,
        setCode,
        editVariable,
        submitInput,
        cancelInput,
        setEngine,
      }}
    >
      {children}
    </SimulatorContext.Provider>
  );
}

export function useSimulator(): ISimulatorContextValue {
  const ctx = useContext(SimulatorContext);
  if (!ctx) {
    throw new Error("useSimulator must be used within SimulatorProvider");
  }
  return ctx;
}
