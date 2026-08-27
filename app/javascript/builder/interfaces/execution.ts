import type { IMemoryCheckpoint } from "./memory"

export interface IVariable {
  name: string
  value: string | null
  type: string
  scope: string
}

export interface ICallStackFrame {
  routineName: string
  nodeId: string | null
}

export interface IExecutionStep {
  nodeId: string
  nodeLabel: string
  nodeType: string
  variables: IVariable[]
  log: string
  output?: string
  waitingForInput?: boolean
  inputPrompt?: string
  inputType?: string
  inputEntered?: boolean
  explanation: string
  changes: string[]
  nextHint: string
  callStack?: ICallStackFrame[]
  inputVariable?: string
}

export interface IExplanationContext {
    nodeType: string;
    variant?: string;
    nodeLabel: string;
    inputValue?: string;
    expressionResult?: string;
    conditionResult?: boolean;
    changes?: string[];
    subroutineName?: string;
}

export interface ISnapshot {
  step: number
  blockId: string
  blockLabel: string
  blockType: string
  variables: IVariable[]
  output?: string
  explanation: string
  changes: string[]
  nextHint: string
}

export interface IPendingInputCheckpoint {
  nodeId: string
  names: string[]
  index: number
}

export interface IPendingDecisionCheckpoint {
  nodeId: string
  nodeLabel: string
  handle: "yes" | "no"
}

export interface IExecutionFrameCheckpoint {
  routineName: string
  graphName: string
  memory: IMemoryCheckpoint
  nextNodeId: string | null
  pendingInput: IPendingInputCheckpoint | null
  pendingDecision: IPendingDecisionCheckpoint | null
  returnTarget?: string
  returnToNode?: string | null
  returnVariable?: string
}

export interface IExecutionCheckpoint {
  memory: IMemoryCheckpoint
  outputs: string[]
  nextNodeId: string | null
  pendingInput: IPendingInputCheckpoint | null
  pendingDecision: IPendingDecisionCheckpoint | null
  finished: boolean
  frames?: IExecutionFrameCheckpoint[]
}

export interface IExecutionState {
  currentNodeId: string | null
  variables: Map<string, IVariable>
  steps: IExecutionStep[]
  logs: string[]
  outputs: string[]
  finished: boolean
  error: string | null
  inputQueue: string[]
  inputIndex: number
  stepCount: number
  pendingInputCursor?: number
  callStack?: ICallStackFrame[]
}
