import type { IExecutionCheckpoint, IExecutionStep, ISnapshot } from "../interfaces/execution";

interface SnapshotRecord {
    step: IExecutionStep;
    checkpoint?: IExecutionCheckpoint;
}

function cloneStep(step: IExecutionStep): IExecutionStep {
    return {
        ...step,
        variables: step.variables.map((variable) => ({ ...variable })),
        changes: [...step.changes],
    };
}

function cloneCheckpoint(checkpoint: IExecutionCheckpoint): IExecutionCheckpoint {
    return {
        ...checkpoint,
        memory: {
            entries: checkpoint.memory.entries.map((entry) => ({
                ...entry,
                elements: [...entry.elements],
            })),
        },
        outputs: [...checkpoint.outputs],
        pendingInput: checkpoint.pendingInput
            ? { ...checkpoint.pendingInput, names: [...checkpoint.pendingInput.names] }
            : null,
        pendingDecision: checkpoint.pendingDecision ? { ...checkpoint.pendingDecision } : null,
        frames: checkpoint.frames?.map((frame) => ({
            ...frame,
            memory: {
                entries: frame.memory.entries.map((entry) => ({
                    ...entry,
                    elements: [...entry.elements],
                })),
            },
            pendingInput: frame.pendingInput
                ? { ...frame.pendingInput, names: [...frame.pendingInput.names] }
                : null,
            pendingDecision: frame.pendingDecision ? { ...frame.pendingDecision } : null,
        })),
    };
}

export class SnapshotManager {
    private records: SnapshotRecord[] = [];
    private _idx: number = -1;

    public get size(): number {
        return this.records.length;
    }

    public get currentIndex(): number {
        return this._idx;
    }

    public get allSteps(): readonly IExecutionStep[] {
        return this.records.map((record) => cloneStep(record.step));
    }

    public get currentStep(): IExecutionStep | undefined {
        const step = this.records[this._idx]?.step;
        return step ? cloneStep(step) : undefined;
    }

    public store(step: IExecutionStep, checkpoint?: IExecutionCheckpoint): void {
        this.records = this.records.slice(0, this._idx + 1);
        this.records.push({
            step: cloneStep(step),
            checkpoint: checkpoint ? cloneCheckpoint(checkpoint) : undefined,
        });
        this._idx = this.records.length - 1;
    }

    public goTo(index: number): void {
        if (index < 0 || index >= this.records.length) return;
        this._idx = index;
    }

    public getStep(index: number): IExecutionStep | undefined {
        const step = this.records[index]?.step;
        return step ? cloneStep(step) : undefined;
    }

    public getCheckpoint(index: number): IExecutionCheckpoint | undefined {
        const checkpoint = this.records[index]?.checkpoint;
        return checkpoint ? cloneCheckpoint(checkpoint) : undefined;
    }

    public getSnapshot(index: number): ISnapshot | undefined {
        const step = this.getStep(index);
        if (!step) return undefined;
        return {
            step: index,
            blockId: step.nodeId,
            blockLabel: step.nodeLabel,
            blockType: step.nodeType,
            variables: step.variables.map((variable) => ({ ...variable })),
            output: step.output,
            explanation: step.explanation,
            changes: [...step.changes],
            nextHint: step.nextHint,
        };
    }

    public reset(): void {
        this.records = [];
        this._idx = -1;
    }
}
