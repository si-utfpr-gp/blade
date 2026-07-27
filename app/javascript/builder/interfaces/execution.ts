export interface IVariable {
  name: string
  value: string | null
  type: string
  scope: string
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
  explanation: string
  changes: string[]
  nextHint: string
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
}
