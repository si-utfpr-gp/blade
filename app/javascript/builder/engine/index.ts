export { ExecutionEngine } from "./ExecutionEngine"
export { ExprEvaluator } from "./ExprEvaluator"
export { MemoryManager } from "./MemoryManager"
export { SnapshotManager } from "./SnapshotManager"
export { ExplanationGenerator } from "./ExplanationGenerator"
export { CodeGenerator } from "./CodeGenerator"
export {
  ERROR_TYPES,
  ExecutionError,
  detectDivisionByZero,
  checkValidExpression,
  classifyError,
  buildDivByZeroError,
} from "./errors"
export type { IExecutionError, ExecutionErrorType } from "./errors"
