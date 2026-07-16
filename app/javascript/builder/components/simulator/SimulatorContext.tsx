import {
  createContext,
  useContext,
  useReducer,
  useCallback,
  useState,
  type ReactNode,
} from "react";
import type {
  SimulatorState,
  SimulatorCallbacks,
} from "../../interfaces/simulator";
import { initialState, simulatorReducer } from "../../interfaces/simulator";

type Tab = "trace" | "explain" | "code";

interface SimulatorContextValue {
  state: SimulatorState;
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
}

const SimulatorContext = createContext<SimulatorContextValue | null>(null);

export function SimulatorProvider({
  children,
  callbacks,
}: {
  children: ReactNode;
  callbacks?: SimulatorCallbacks;
}) {
  const [state, dispatch] = useReducer(simulatorReducer, initialState);
  const [activeTab, setActiveTab] = useState<Tab>("trace");

  const canStepBack =
    state.isStarted && state.currentStepIndex > 0 && !state.isRunning;
  const canStepForward =
    state.isStarted && !state.isFinished && !state.isRunning;

  const start = useCallback(() => {
    dispatch({ type: "START" });
    callbacks?.onStart?.();
  }, [callbacks]);

  const stepForward = useCallback(() => {
    dispatch({ type: "STEP_FORWARD" });
    callbacks?.onStepForward?.();
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
      }}
    >
      {children}
    </SimulatorContext.Provider>
  );
}

export function useSimulator(): SimulatorContextValue {
  const ctx = useContext(SimulatorContext);
  if (!ctx) {
    throw new Error("useSimulator must be used within SimulatorProvider");
  }
  return ctx;
}
