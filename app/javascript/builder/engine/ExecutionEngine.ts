import type { ICallStackFrame, IExecutionCheckpoint, IExecutionFrameCheckpoint, IExecutionStep, IPendingDecisionCheckpoint, IPendingInputCheckpoint } from "../interfaces/execution";
import type { IParserData, IParserNode } from "../parser/types";
import { ExprEvaluator } from "./ExprEvaluator";
import { MemoryManager } from "./MemoryManager";
import { SnapshotManager } from "./SnapshotManager";
import { ExplanationGenerator } from "./ExplanationGenerator";
import { classifyError, ERROR_TYPES, ExecutionError } from "./errors";
import type { ExpressionValue } from "./ExpressionParser";
import type { VarType } from "./types";
import { comparisonMismatch, formatValue, parseLogical, sameValue, typeOfValue } from "./values";

interface ExecutionFrame {
    routineName: string
    graphName: string
    graph: IParserData
    memory: MemoryManager
    expr: ExprEvaluator
    current: string | null
    pendingInput: IPendingInputCheckpoint | null
    pendingDecision: IPendingDecisionCheckpoint | null
    returnTarget?: string
    returnToNode?: string | null
    returnVariable?: string
}

interface SubroutineCall {
    returnTarget?: string
    name: string
    args: string[]
}

/**
 * Stateful interpreter for a parsed diagram.
 *
 * It walks the graph one visual block at a time, recording declarations,
 * connectors, decisions, and the selected decision branch in the desk check.
 */
export class ExecutionEngine {
    private frames: ExecutionFrame[] = [];
    private snapshots = new SnapshotManager();
    private explanations = new ExplanationGenerator();
    private outputs: string[] = [];
    private _err: string | null = null;
    private _done = false;
    private max = 10000;
    private shouldAdvanceCurrent = true;

    public constructor(private rootGraph: IParserData) { }

    public start(): IExecutionStep | null {
        this.reset();
        const root = this.createFrame("Principal", "Principal", this.rootGraph, this.rootGraph.startNodeId)
        this.frames = [root]
        if (!root.current) {
            this._err = "Nenhum bloco de início"; return null;
        }
        return this.advance();
    }

    public step(input?: string): IExecutionStep | null {
        const frame = this.activeFrame()
        if (this._done || !frame?.current) return null
        if (this.snapshots.size >= this.max) {
            const error = new ExecutionError(
                ERROR_TYPES.MAX_STEPS_EXCEEDED,
                "Limite de passos excedido",
                frame.current,
            )
            this._err = error.message
            throw error
        }

        const decisionBranch = this.advancePendingDecision()
        if (decisionBranch) {
            this.snapshots.store(decisionBranch, this.checkpoint())
            return decisionBranch
        }

        const active = this.activeFrame()
        if (!active?.current) return null

        const node = active.graph.nodes.get(active.current)
        if (!node) {
            const message = `Bloco '${active.current}' não encontrado`
            const error = new ExecutionError(ERROR_TYPES.UNKNOWN_BLOCK, message, active.current)
            this._err = error.message
            throw error
        }

        try {
            this.shouldAdvanceCurrent = true
            const step = this.exec(node, input)
            const isOnlyAskingForInput = step?.waitingForInput && step.inputEntered === false
            if (isOnlyAskingForInput) return step

            if (step?.waitingForInput) {
                this.snapshots.store(step, this.checkpoint())
                return step
            }

            this.finishStep(node, step)
            return step
        } catch (e) {
          const structured = e instanceof ExecutionError ? e : classifyError(e, this.activeFrame()?.current ?? null)
          this._err = structured.message
          throw e
        }
    }

    public goToStep(i: number): boolean {
        const checkpoint = this.snapshots.getCheckpoint(i);
        if (!checkpoint) return false;
        this.snapshots.goTo(i);

        if (checkpoint.frames?.length) {
            this.frames = checkpoint.frames.map((frame) => this.restoreFrame(frame))
        } else {
            const root = this.createFrame("Principal", "Principal", this.rootGraph, checkpoint.nextNodeId)
            root.memory.restore(checkpoint.memory)
            root.pendingInput = checkpoint.pendingInput
                ? { ...checkpoint.pendingInput, names: [...checkpoint.pendingInput.names] }
                : null
            this.frames = [root]
        }

        this.outputs = [...checkpoint.outputs];
        this._err = null;
        this._done = checkpoint.finished;
        return true;
    }

    public reset(): void {
        this.frames = [];
        this.snapshots.reset();
        this.outputs = [];
        this._err = null;
        this._done = false;
        this.shouldAdvanceCurrent = true;
    }

    public getSteps(): IExecutionStep[] { return this.snapshots.allSteps as IExecutionStep[]; }

    public get currentStepIndex(): number { return this.snapshots.currentIndex; }

    public getCurrentOutputs(): string[] { return this.outputs; }

    /** @deprecated Use getCurrentOutputs(). Kept to avoid breaking older callers. */
    public getCurretnOutputs(): string[] { return this.getCurrentOutputs(); }

    public getCurrentState() {
        const root = this.frames[0]
        const active = this.activeFrame()
        return {
            currentNodeId: active?.current ?? null,
            variables: new Map((root?.memory.snapshot() ?? []).map(v => [v.name, v])),
            steps: this.snapshots.allSteps as IExecutionStep[], logs: this.snapshots.allSteps.map(s => s.log), outputs: this.outputs,
            finished: this._done, error: this._err,
            inputQueue: [], inputIndex: 0, stepCount: this.snapshots.size,
            callStack: this.callStack(),
        }
    }

    private advance(): IExecutionStep | null {
        const frame = this.activeFrame()
        if (!frame?.current) return null

        const node = frame.graph.nodes.get(frame.current)
        if (!node) return null

        try {
            this.shouldAdvanceCurrent = true
            const step = this.exec(node)
            this.finishStep(node, step)
            return step
        } catch (e) {
          const structured = e instanceof ExecutionError ? e : classifyError(e, this.activeFrame()?.current ?? null)
          this._err = structured.message
          throw e
        }
    }


    /** Validates raw user input according to the type declared in a memory block. */
    private validateInput(value: string, type: string): string | null {
      switch (type) {
        case "inteiro": {
          if (!/^-?\d+$/.test(value.trim())) return `Valor inválido para inteiro: '${value}'`
          return null
        }
        case "real": {
          if (!/^-?\d+(\.\d+)?$/.test(value.trim())) return `Valor inválido para real: '${value}'`
          return null
        }
        case "logico": {
          const v = value.trim().toLowerCase()
          if (!["verdadeiro", "verdadeiro.", "v", "falso", "falso.", "f"].includes(v))
            return `Valor inválido para lógico: '${value}' (esperado: verdadeiro/falso)`
          return null
        }
        case "caractere":
          return null
        default:
          return null
      }
    }

    /** Converts an already validated input to the value its declared type holds. */
    private inputValue(raw: string, type: VarType): ExpressionValue {
      switch (type) {
        case "inteiro":
        case "real":
          return Number(raw.trim())
        case "logico":
          return parseLogical(raw) ?? false
        case "caractere":
          return raw
      }
    }

    /** Executes one block and returns the UI-facing step/snapshot data for it. */
    private exec(node: IParserNode, input?: string): IExecutionStep | null {
        const frame = this.requireActiveFrame()
        const base = (): IExecutionStep => ({
            nodeId: node.id, nodeLabel: node.label ?? "", nodeType: node.type,
            variables: frame.memory.snapshot(), log: "", output: undefined,
            waitingForInput: false, inputPrompt: undefined, inputType: undefined,
            explanation: "", changes: [], nextHint: "",
            callStack: this.callStack(),
        });

        switch (node.type) {
            case "startEnd": {
                if (node.variant !== "start" && node.variant !== "end") return null;
                if (frame.routineName !== "Principal") {
                    const log = node.variant === "start"
                        ? `Iniciando sub-rotina ${frame.routineName}.`
                        : `Sub-rotina ${frame.routineName} finalizada.`
                    return {
                        ...base(),
                        log,
                        explanation: log,
                        changes: [],
                        nextHint: node.variant === "start" ? "Avançar." : "Retornando."
                    };
                }
                const text = this.explanations.generate({
                    nodeType: node.type,
                    variant: node.variant,
                    nodeLabel: node.label ?? "",
                });
                return { ...base(), ...text };
            }

            case "memory": {
                const changes = this.processMemory(node)
                return {
                    ...base(),
                    variables: frame.memory.snapshot(),
                    log: "Definição das variáveis.",
                    explanation: "As variáveis do algoritmo foram declaradas.",
                    changes,
                    nextHint: "Avançar.",
                }
            }

            case "input": {
                const varNames = (node.label ?? "").split(",").map(s => s.trim()).filter(Boolean)
                if (!frame.pendingInput || frame.pendingInput.nodeId !== node.id) {
                    frame.pendingInput = { nodeId: node.id, names: varNames, index: 0 }
                }
                const pi = frame.pendingInput
                const name = pi.names[pi.index]

                if (input === undefined) {
                    const type = frame.expr.typeOf(name) ?? "caractere"
                    const text = this.explanations.generate({
                        nodeType: node.type,
                        nodeLabel: name,
                        inputValue: undefined,
                    });
                    return {
                        ...base(),
                        waitingForInput: true,
                        inputEntered: false,
                        inputPrompt: `Valor para '${name}':`,
                        inputVariable: name,
                        inputType: type,
                        ...text,
                    };
                }

                // RN09: an input only fills a variable the memory block declared.
                const declaredType = frame.expr.typeOf(name)
                if (!declaredType) {
                    throw new ExecutionError(ERROR_TYPES.UNDECLARED_VARIABLE, `Variável '${name}' não declarada`, node.id)
                }
                const validationError = this.validateInput(input, declaredType)
                if (validationError) throw new ExecutionError(ERROR_TYPES.TYPE_MISMATCH, validationError, node.id)
                frame.expr.store(name, this.inputValue(input, declaredType), node.id)

                const remaining = pi.index + 1 < pi.names.length
                pi.index += 1
                const text = this.explanations.generate({
                    nodeType: node.type,
                    nodeLabel: name,
                    inputValue: input,
                });

                if (remaining) {
                    const nextName = pi.names[pi.index]
                    return {
                        ...base(),
                        variables: frame.memory.snapshot(),
                        waitingForInput: true,
                        inputEntered: true,
                        inputPrompt: `Valor para '${nextName}':`,
                        inputVariable: nextName,
                        inputType: frame.expr.typeOf(nextName) ?? "caractere",
                        ...text,
                    };
                }

                frame.pendingInput = null
                return {
                    ...base(),
                    variables: frame.memory.snapshot(),
                    waitingForInput: false,
                    inputEntered: true,
                    inputType: declaredType,
                    ...text,
                };
            }

            case "output": {
                const v = frame.expr.output(node.label ?? "", node.id);
                this.outputs.push(v);
                const text = this.explanations.generate({
                    nodeType: node.type,
                    nodeLabel: node.label ?? "",
                    expressionResult: v,
                });
                return { ...base(), output: v, ...text };
            }

            case "process": {
                // Classroom rule: one instruction per process block, so each
                // change gets its own row in the desk check.
                const label = node.label ?? ""
                if (frame.expr.splitStatements(label, node.id).length > 1) {
                    throw new ExecutionError(
                        ERROR_TYPES.INVALID_EXPRESSION,
                        `Um bloco de processo aceita uma única instrução. Separe '${label}' em um bloco para cada instrução.`,
                        node.id,
                    )
                }
                const changes = frame.expr.assign(label, node.id);
                const text = this.explanations.generate({
                    nodeType: node.type,
                    nodeLabel: node.label ?? "",
                    changes,
                });
                return { ...base(), variables: frame.memory.snapshot(), ...text };
            }

            case "decision": {
                const cond = node.label ?? "";
                const ok = frame.expr.condition(cond, node.id);
                if (frame.graph.getNextNode(node.id, ok ? "yes" : "no") === null) {
                    throw new ExecutionError(
                        ERROR_TYPES.MISSING_CONNECTION,
                        `Decisão '${cond}': caso ${ok ? "Verdadeiro" : "Falso"} sem ligação`,
                        node.id,
                    );
                }
                const text = this.explanations.generate({
                    nodeType: node.type,
                    nodeLabel: cond,
                    conditionResult: ok,
                });
                frame.pendingDecision = {
                    nodeId: node.id,
                    nodeLabel: cond,
                    handle: ok ? "yes" : "no",
                }
                this.shouldAdvanceCurrent = false
                return { ...base(), ...text };
            }

            case "selection": {
                const expression = node.label ?? "";
                const value = frame.expr.value(expression, node.id);
                this.checkSelectionType(expression, value, node.id);
                const cases = node.cases ?? [];
                const caseValues = this.selectionCaseValues(node, cases, value);
                const index = caseValues.findIndex(caseValue => sameValue(caseValue, value));
                const handle = index === -1 ? "default" : `case-${index}`;
                const selectedCase = index === -1 ? undefined : cases[index].trim();
                if (frame.graph.getNextNode(node.id, handle) === null) {
                    const branch = selectedCase === undefined ? "Falso" : `'${selectedCase}'`;
                    throw new ExecutionError(ERROR_TYPES.MISSING_CONNECTION, `Escolha: caso ${branch} sem ligação`, node.id);
                }
                const text = this.explanations.generate({
                    nodeType: node.type,
                    nodeLabel: expression,
                    expressionResult: formatValue(value),
                    selectedCase,
                });
                frame.pendingDecision = {
                    nodeId: node.id,
                    nodeLabel: expression,
                    handle,
                    ...(selectedCase !== undefined ? { branchLabel: selectedCase } : {}),
                }
                this.shouldAdvanceCurrent = false
                return { ...base(), ...text };
            }

            case "connector": {
                return {
                    ...base(),
                    log: "Conector.",
                    explanation: "O fluxo segue pelo conector até o próximo bloco.",
                    changes: [],
                    nextHint: "Avançar.",
                }
            }

            case "subroutine": {
                const sub = node.label ?? "sub-rotina";
                this.enterSubroutine(node)
                const text = this.explanations.generate({
                    nodeType: node.type,
                    nodeLabel: sub,
                    subroutineName: sub,
                });
                this.shouldAdvanceCurrent = false
                return { ...base(), callStack: this.callStack(), ...text };
            }

            default: throw new Error(`Bloco desconhecido: '${node.type}'`);
        }
    }

    private processMemory(node: IParserNode): string[] {
        const frame = this.requireActiveFrame()
        const changes: string[] = []
        node.rows?.forEach(row => {
            // Classroom rule: the memory block declares; values are given in
            // process blocks, where the desk check shows them.
            if (row.initialValue !== undefined && row.initialValue.trim() !== "") {
                const [first = "variavel"] = row.variables.split(",").map(variable => variable.trim()).filter(Boolean)
                throw new ExecutionError(
                    ERROR_TYPES.INVALID_EXPRESSION,
                    `A memória só declara variáveis. Inicialize '${first}' em um bloco de processo, como '${first} = ${row.initialValue.trim()}'.`,
                    node.id,
                )
            }
            row.variables
                .split(",")
                .map(variable => variable.trim())
                .filter(Boolean)
                .forEach(variable => {
                    this.declare(frame, variable, row.type, node.id)
                    changes.push(`Declarada: ${variable}`)
                })
        })
        return changes
    }

    /** Declares a variable, pointing a refused name or type at the block that declared it. */
    private declare(frame: ExecutionFrame, name: string, type: string, blockId: string | null): void {
        try {
            frame.memory.declare(name, type)
        } catch (error) {
            const classified = classifyError(error, blockId)
            throw new ExecutionError(classified.type, classified.message, blockId)
        }
    }

    /** Evaluates each case value once and rejects a selection that repeats one. */
    /**
     * The escolha/caso compares against a finite list of options, so it takes
     * integers and characters only. A declared variable answers by its type,
     * so a real holding 2 is still refused; anything else by its value.
     */
    private checkSelectionType(expression: string, value: ExpressionValue, blockId: string): void {
        const declared = this.requireActiveFrame().expr.typeOf(expression)
        const kind = declared ?? (
            typeof value === "boolean" ? "logico"
                : typeof value === "number" ? (Number.isInteger(value) ? "inteiro" : "real")
                    : "caractere"
        )
        if (kind === "inteiro" || kind === "caractere") return
        const name = kind === "logico" ? "lógico" : kind
        throw new ExecutionError(
            ERROR_TYPES.INVALID_SELECTION,
            `A escolha só compara valores inteiros ou caracteres, e '${expression.trim()}' é ${name}.`,
            blockId,
        )
    }

    private selectionCaseValues(node: IParserNode, cases: string[], value: ExpressionValue): ExpressionValue[] {
        const frame = this.requireActiveFrame()
        const values = cases.map(source => frame.expr.value(source, node.id))
        values.forEach((caseValue) => {
            const mismatch = comparisonMismatch(value, caseValue)
            if (mismatch) throw new ExecutionError(ERROR_TYPES.TYPE_MISMATCH, `Tipo incompatível: ${mismatch}`, node.id)
        })
        values.forEach((value, index) => {
            if (values.findIndex(other => sameValue(other, value)) !== index) {
                throw new ExecutionError(ERROR_TYPES.INVALID_SELECTION, `Escolha: valor '${cases[index].trim()}' repetido`, node.id)
            }
        })
        return values
    }

    private next(node: IParserNode): string | null {
        const frame = this.requireActiveFrame()
        if (node.type === "decision") return frame.graph.getNextNode(node.id, frame.expr.condition(node.label ?? "", node.id) ? "yes" : "no")
        return frame.graph.getNextNode(node.id)
    }

    private advancePendingDecision(): IExecutionStep | null {
        const frame = this.activeFrame()
        const pending = frame?.pendingDecision
        if (!frame || !pending) return null

        frame.pendingDecision = null
        frame.current = frame.graph.getNextNode(pending.nodeId, pending.handle)
        return {
            nodeId: pending.nodeId,
            nodeLabel: pending.nodeLabel,
            nodeType: "branch",
            variables: frame.memory.snapshot(),
            ...this.branchText(pending),
            nextHint: "Avançar.",
            callStack: this.callStack(),
        }
    }

    private branchText(pending: IPendingDecisionCheckpoint): Pick<IExecutionStep, "log" | "explanation" | "changes"> {
        if (pending.handle.startsWith("case-")) {
            const value = pending.branchLabel ?? ""
            return {
                log: `Caso ${value}.`,
                explanation: `O fluxo segue pelo caso ${value}.`,
                changes: [`Ramo: ${value}`],
            }
        }
        if (pending.handle === "default") {
            return {
                log: "Caso Falso.",
                explanation: "Nenhum valor coincidiu; o fluxo segue pelo caso falso.",
                changes: ["Ramo: FALSO"],
            }
        }
        const isTrue = pending.handle === "yes"
        return {
            log: `Caso ${isTrue ? "Verdadeiro" : "Falso"}.`,
            explanation: `O fluxo segue pelo caso ${isTrue ? "verdadeiro" : "falso"}.`,
            changes: [`Ramo: ${isTrue ? "VERDADEIRO" : "FALSO"}`],
        }
    }

    /**
     * Records the step and moves past its block. A block with no way out
     * still gets its step in the desk check, since it ran; the error comes
     * after, and the flow stops there instead of running the block twice.
     */
    private finishStep(node: IParserNode, step: IExecutionStep | null): void {
        try {
            if (this.shouldAdvanceCurrent) this.moveAfter(node)
        } catch (error) {
            if (step) this.snapshots.store(step, this.checkpoint())
            throw error
        }
        if (step) this.snapshots.store(step, this.checkpoint())
    }

    private moveAfter(node: IParserNode): void {
        const frame = this.requireActiveFrame()
        const next = this.next(node)
        if (next === null && node.type === "startEnd" && node.variant === "end") {
            frame.current = null
            if (this.frames.length > 1) {
                this.completeSubroutine()
                return
            }
            this._done = true
            return
        }
        // Only the end block may lead nowhere; anywhere else the flow would
        // stall with the student pressing Avançar to no effect.
        frame.current = next
        if (next === null) throw this.missingExit(node)
    }

    private missingExit(node: IParserNode): ExecutionError {
        const name = node.label?.trim() || node.type
        return new ExecutionError(ERROR_TYPES.MISSING_CONNECTION, `O bloco '${name}' não tem ligação de saída`, node.id)
    }

    private enterSubroutine(node: IParserNode): void {
        const caller = this.requireActiveFrame()
        const call = this.parseSubroutineCall(node.label ?? "")
        const routine = this.rootGraph.subroutines?.get(call.name)
        if (!routine) throw this.subroutineContract(`Sub-rotina '${call.name}' não encontrada`, node.id)
        if (call.args.length !== routine.parameters.length) {
            throw this.subroutineContract(`Sub-rotina '${call.name}' esperava ${routine.parameters.length} argumento(s), recebeu ${call.args.length}`, node.id)
        }

        const localMemory = new MemoryManager()
        const localExpr = new ExprEvaluator(localMemory)
        routine.parameters.forEach((parameter, index) => {
            const value = caller.expr.value(call.args[index], node.id)
            // A variable passed in keeps its declared type, and a whole number
            // is an inteiro, so the parameter is not just "any number".
            const type = caller.expr.typeOf(call.args[index])
                ?? (typeof value === "number" && Number.isInteger(value) ? "inteiro" : typeOfValue(value))
            localMemory.declare(parameter, type)
            localExpr.store(parameter, value, node.id)
        })

        this.frames.push({
            routineName: routine.name,
            graphName: routine.name,
            graph: routine.graph,
            memory: localMemory,
            expr: localExpr,
            current: routine.graph.startNodeId,
            pendingInput: null,
            pendingDecision: null,
            returnTarget: call.returnTarget,
            returnToNode: this.returnPoint(caller, node),
            returnVariable: routine.returnVariable,
        })
    }

    private returnPoint(caller: ExecutionFrame, node: IParserNode): string {
        const next = caller.graph.getNextNode(node.id)
        if (next === null) throw this.missingExit(node)
        return next
    }

    private completeSubroutine(): void {
        const finished = this.frames.pop()
        const caller = this.activeFrame()
        if (!finished || !caller) return
        if (finished.returnTarget) {
            if (!finished.returnVariable) throw this.subroutineContract(`Sub-rotina '${finished.routineName}' não possui variável de retorno`, null)
            if (finished.memory.get(finished.returnVariable) === null) {
                throw this.subroutineContract(`Retorno da sub-rotina '${finished.routineName}' não inicializado`, null)
            }
            // RN09: the caller declares the variable that receives the result.
            caller.expr.store(finished.returnTarget, finished.expr.value(finished.returnVariable, null), null)
        }
        caller.current = finished.returnToNode ?? null
    }

    private parseSubroutineCall(label: string): SubroutineCall {
        const match = label.trim().match(/^(?:(?<target>[a-zA-Z_]\w*)\s*=\s*)?(?<name>[a-zA-Z_]\w*)\s*\((?<args>.*)\)\s*$/)
        if (!match?.groups?.name) throw this.subroutineContract(`Chamada de sub-rotina inválida: '${label}'`, null)
        return {
            returnTarget: match.groups.target,
            name: match.groups.name,
            args: this.splitArguments(match.groups.args ?? ""),
        }
    }

    private splitArguments(source: string): string[] {
        const trimmed = source.trim()
        if (!trimmed) return []

        const args: string[] = []
        let current = ""
        let quote: string | null = null
        let depth = 0

        for (let i = 0; i < source.length; i++) {
            const ch = source[i]
            if (quote) {
                current += ch
                if (ch === "\\") {
                    current += source[++i] ?? ""
                    continue
                }
                if (ch === quote) quote = null
                continue
            }
            if (ch === "'" || ch === '"') {
                quote = ch
                current += ch
                continue
            }
            if (ch === "(" || ch === "[") depth++
            if (ch === ")" || ch === "]") depth--
            if (ch === "," && depth === 0) {
                args.push(current.trim())
                current = ""
                continue
            }
            current += ch
        }

        if (current.trim()) args.push(current.trim())
        return args
    }

    private activeFrame(): ExecutionFrame | undefined {
        return this.frames[this.frames.length - 1]
    }

    private requireActiveFrame(): ExecutionFrame {
        const frame = this.activeFrame()
        if (!frame) throw new Error("Execução não iniciada")
        return frame
    }

    private createFrame(routineName: string, graphName: string, graph: IParserData, current: string | null): ExecutionFrame {
        const memory = new MemoryManager()
        return {
            routineName,
            graphName,
            graph,
            memory,
            expr: new ExprEvaluator(memory),
            current,
            pendingInput: null,
            pendingDecision: null,
        }
    }

    private restoreFrame(checkpoint: IExecutionFrameCheckpoint): ExecutionFrame {
        const graph = this.graphByName(checkpoint.graphName)
        const frame = this.createFrame(checkpoint.routineName, checkpoint.graphName, graph, checkpoint.nextNodeId)
        frame.memory.restore(checkpoint.memory)
        frame.pendingInput = checkpoint.pendingInput
            ? { ...checkpoint.pendingInput, names: [...checkpoint.pendingInput.names] }
            : null
        frame.pendingDecision = checkpoint.pendingDecision ? { ...checkpoint.pendingDecision } : null
        frame.returnTarget = checkpoint.returnTarget
        frame.returnToNode = checkpoint.returnToNode
        frame.returnVariable = checkpoint.returnVariable
        return frame
    }

    private graphByName(name: string): IParserData {
        if (name === "Principal") return this.rootGraph
        const routine = this.rootGraph.subroutines?.get(name)
        if (!routine) throw this.subroutineContract(`Sub-rotina '${name}' não encontrada`, null)
        return routine.graph
    }

    private callStack(): ICallStackFrame[] {
        return this.frames.map((frame) => ({ routineName: frame.routineName, nodeId: frame.current }))
    }

    private subroutineContract(message: string, blockId: string | null): ExecutionError {
        return new ExecutionError(ERROR_TYPES.SUBROUTINE_CONTRACT, message, blockId)
    }

    private checkpoint(): IExecutionCheckpoint {
        const root = this.frames[0]
        return {
            memory: root?.memory.createCheckpoint() ?? { entries: [] },
            outputs: [...this.outputs],
            nextNodeId: this.activeFrame()?.current ?? null,
            pendingInput: this.activeFrame()?.pendingInput
                ? { ...this.activeFrame()!.pendingInput!, names: [...this.activeFrame()!.pendingInput!.names] }
                : null,
            pendingDecision: this.activeFrame()?.pendingDecision
                ? { ...this.activeFrame()!.pendingDecision! }
                : null,
            finished: this._done,
            frames: this.frames.map((frame) => ({
                routineName: frame.routineName,
                graphName: frame.graphName,
                memory: frame.memory.createCheckpoint(),
                nextNodeId: frame.current,
                pendingInput: frame.pendingInput
                    ? { ...frame.pendingInput, names: [...frame.pendingInput.names] }
                    : null,
                pendingDecision: frame.pendingDecision ? { ...frame.pendingDecision } : null,
                returnTarget: frame.returnTarget,
                returnToNode: frame.returnToNode,
                returnVariable: frame.returnVariable,
            })),
        }
    }

}
