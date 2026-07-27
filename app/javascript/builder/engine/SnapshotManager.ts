import type { IExecutionStep, ISnapshot } from "../interfaces/execution";

export class SnapshotManager {
    private steps: IExecutionStep[] = [];
    private _idx: number = -1;

    public get size(): number {
        return this.steps.length;
    }

    public get currentIndex(): number {
        return this._idx;
    }

    public get allSteps(): readonly IExecutionStep[] {
        return this.steps;
    }

    public get currentStep(): IExecutionStep | undefined {
        if (this._idx < 0 || this._idx >= this.steps.length) return undefined;
        return this.steps[this._idx];
    }

    public store(step: IExecutionStep): void {
        this.steps.push(step);
        this._idx = this.steps.length - 1;
    }

    public goTo(index: number): void {
        if (index < 0 || index >= this.steps.length) return;
        this._idx = index;
    }

    public getStep(index: number): IExecutionStep | undefined {
        if (index < 0 || index >= this.steps.length) return undefined;
        return this.steps[index];
    }

    public getSnapshot(index: number): ISnapshot | undefined {
        if (index < 0 || index >= this.steps.length) return undefined;
        const step = this.steps[index];
        return {
            step: index,
            blockId: step.nodeId,
            blockLabel: step.nodeLabel,
            blockType: step.nodeType,
            variables: step.variables,
            output: step.output,
            explanation: step.explanation,
            changes: step.changes,
            nextHint: step.nextHint,
        };
    }

    public reset(): void {
        this.steps = [];
        this._idx = -1;
    }
}
