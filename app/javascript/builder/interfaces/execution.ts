export interface Variable {
  name: string
  value: string | null
  type: string
  scope: string
}

export interface ExecutionStep {
  nodeId: string
  nodeLabel: string
  nodeType: string
  variables: Variable[]
  log: string
  output?: string
  waitingForInput?: boolean
  inputPrompt?: string
  inputType?: string
  explanation: string
  changes: string[]
  nextHint: string
}

export interface ExecutionState {
  currentNodeId: string | null
  variables: Map<string, Variable>
  steps: ExecutionStep[]
  logs: string[]
  outputs: string[]
  finished: boolean
  error: string | null
  inputQueue: string[]
  inputIndex: number
  stepCount: number
  pendingInputCursor?: number
}
