import type { ICallStackFrame, IExecutionCheckpoint, IExecutionFrameCheckpoint, IExecutionStep, IPendingDecisionCheckpoint, IPendingInputCheckpoint } from "../interfaces/execution";
import type { IParserData, IParserNode } from "../parser/types";
import { ExprEvaluator } from "./ExprEvaluator";
import { MemoryManager } from "./MemoryManager";
import { SnapshotManager } from "./SnapshotManager";
import { ExplanationGenerator } from "./ExplanationGenerator";
import { classifyError, ERROR_TYPES, ExecutionError } from "./errors";

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
            this._err = "Limite de passos excedido"
            return null
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
            this._err = `Bloco '${active.current}' não encontrado`
            return null
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

            if (this.shouldAdvanceCurrent) this.moveAfter(node)
            if (step) this.snapshots.store(step, this.checkpoint())
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
            if (this.shouldAdvanceCurrent) this.moveAfter(node)
            if (step) this.snapshots.store(step, this.checkpoint())
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
                this.processMemory(node)
                const names = frame.memory.snapshot().map((variable) => variable.name)
                return {
                    ...base(),
                    variables: frame.memory.snapshot(),
                    log: "Definição das variáveis.",
                    explanation: "As variáveis do algoritmo foram declaradas.",
                    changes: names.map((name) => `Declarada: ${name}`),
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
                    const type = frame.memory.getType(name) ?? "caractere"
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

                const declaredType = frame.memory.getType(name) ?? "caractere"
                if (!frame.memory.has(name)) frame.memory.declare(name, "caractere")
                const validationError = this.validateInput(input, declaredType)
                if (validationError) throw new Error(validationError)
                frame.memory.set(name, input)

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
                        inputType: frame.memory.getType(nextName) ?? "caractere",
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
                const changes = frame.expr.assign(node.label ?? "", node.id);
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

    private processMemory(node: IParserNode): void {
        const frame = this.requireActiveFrame()
        node.rows?.forEach(row => {
            row.variables
                .split(",")
                .map(variable => variable.trim())
                .filter(Boolean)
                .forEach(variable => frame.memory.declare(variable, row.type))
        })
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
        const isTrue = pending.handle === "yes"
        return {
            nodeId: pending.nodeId,
            nodeLabel: pending.nodeLabel,
            nodeType: "branch",
            variables: frame.memory.snapshot(),
            log: `Caso ${isTrue ? "Verdadeiro" : "Falso"}.`,
            explanation: `O fluxo segue pelo caso ${isTrue ? "verdadeiro" : "falso"}.`,
            changes: [`Ramo: ${isTrue ? "VERDADEIRO" : "FALSO"}`],
            nextHint: "Avançar.",
            callStack: this.callStack(),
        }
    }

    private moveAfter(node: IParserNode): void {
        const frame = this.requireActiveFrame()
        frame.current = this.next(node)
        if (frame.current === null && node.type === "startEnd" && node.variant === "end") {
            if (this.frames.length > 1) {
                this.completeSubroutine()
                return
            }
            this._done = true
        }
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
            localMemory.declare(parameter, "caractere")
            localMemory.set(parameter, caller.expr.output(call.args[index], node.id))
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
            returnToNode: caller.graph.getNextNode(node.id),
            returnVariable: routine.returnVariable,
        })
    }

    private completeSubroutine(): void {
        const finished = this.frames.pop()
        const caller = this.activeFrame()
        if (!finished || !caller) return
        if (finished.returnTarget) {
            if (!finished.returnVariable) throw this.subroutineContract(`Sub-rotina '${finished.routineName}' não possui variável de retorno`, null)
            const value = finished.memory.get(finished.returnVariable)
            if (value === null) throw this.subroutineContract(`Retorno da sub-rotina '${finished.routineName}' não inicializado`, null)
            if (!caller.memory.has(finished.returnTarget)) caller.memory.declare(finished.returnTarget, "caractere")
            caller.memory.set(finished.returnTarget, value)
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
