import {
  createContext,
  useContext,
  useReducer,
  useCallback,
  useEffect,
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
import { parse } from "../../parser";
import { CodeGenerator } from "../../engine/CodeGenerator";
import type { Node, Edge } from "@xyflow/react";

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
  goToStep: (index: number) => void;
  submitInput: (value: string) => void;
  cancelInput: () => void;
  setEngine: (engine: ExecutionEngine) => void;
  loadDiagram: (nodes: Node[], edges: Edge[]) => { ok: true } | { ok: false; error: string };
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

  const syncFromEngine = useCallback(() => {
    const engine = engineRef.current;
    if (!engine) return;
    const execution = engine.getCurrentState();
    dispatch({
      type: "SYNC_EXECUTION",
      steps: execution.steps,
      currentStepIndex: engine.currentStepIndex,
      outputs: execution.outputs,
      isFinished: execution.finished,
    });
  }, []);

  const loadDiagram = useCallback((nodes: Node[], edges: Edge[]) => {
    try {
      const graph = parse(nodes, edges);
      if (!graph.startNodeId) {
        return { ok: false, error: "Nenhum bloco de início (RN01)" };
      }
      const engine = new ExecutionEngine(graph);
      setEngine(engine);
      const codeGen = new CodeGenerator(graph);
      const js = codeGen.generate({ lang: "js" });
      const ts = codeGen.generate({ lang: "ts" });
      dispatch({ type: "SET_CODE", js, ts });
      return { ok: true };
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Erro ao carregar diagrama";
      return { ok: false, error: msg };
    }
  }, [setEngine]);

  const canStepBack =
    state.isStarted && state.currentStepIndex > 0 && !state.isRunning && !state.awaitingInput;
  const canStepForward =
    state.isStarted && !state.isFinished && !state.isRunning && !state.awaitingInput;

  const executeNextStep = useCallback((input?: string) => {
    const engine = engineRef.current;
    if (!engine) {
      dispatch({ type: "SET_ERROR", error: "Nenhum diagrama carregado." });
      return;
    }

    try {
      const step = engine.step(input);
      if (!step) {
        dispatch({ type: "FINISH" });
        return;
      }

      if (step.waitingForInput) {
        if (step.inputEntered) syncFromEngine();
        dispatch({
          type: "INPUT_REQUESTED",
          prompt: step.inputPrompt ?? `Valor para '${step.nodeLabel}':`,
          variable: step.inputVariable ?? step.nodeLabel,
          inputType: step.inputType ?? "caractere",
        });
      } else {
        syncFromEngine();
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Erro durante a execução.";
      dispatch({ type: "SET_ERROR", error: msg });
    }
  }, [syncFromEngine]);

  const start = useCallback(() => {
    dispatch({ type: "START" });
    callbacks?.onStart?.();

    const engine = engineRef.current;
    if (engine) {
      const step = engine.start();
      if (step) syncFromEngine();
    }
  }, [callbacks, syncFromEngine]);

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
    dispatch({ type: "STOP" });
    callbacks?.onInputCancel?.();
  }, [callbacks]);

  const stepBack = useCallback(() => {
    if (state.currentStepIndex <= 0) return;
    engineRef.current?.goToStep(state.currentStepIndex - 1);
    syncFromEngine();
    callbacks?.onStepBack?.();
  }, [callbacks, state.currentStepIndex, syncFromEngine]);

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

  const goToStep = useCallback((index: number) => {
    if (index < 0 || index >= state.steps.length) return
    if (engineRef.current?.goToStep(index)) syncFromEngine()
  }, [state.steps.length, syncFromEngine])

  useEffect(() => {
    if (!state.isRunning || state.awaitingInput || state.isFinished) return;

    const timer = window.setTimeout(() => {
      executeNextStep();
    }, state.speed);

    return () => window.clearTimeout(timer);
  }, [
    state.isRunning,
    state.awaitingInput,
    state.isFinished,
    state.speed,
    state.currentStepIndex,
    state.steps.length,
    executeNextStep,
  ]);

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
        goToStep,
        submitInput,
        cancelInput,
        setEngine,
        loadDiagram,
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
