import { describe, it, expect } from "vitest";
import { SnapshotManager } from "../../engine/SnapshotManager";
import type { IExecutionStep } from "../../interfaces/execution";

function makeStep(overrides?: Partial<IExecutionStep>): IExecutionStep {
    return {
        nodeId: "n1",
        nodeLabel: "Início",
        nodeType: "startEnd",
        variables: [],
        log: "Iniciando o algoritmo.",
        explanation: "Iniciando o algoritmo.",
        changes: [],
        nextHint: "Avançar.",
        ...overrides,
    };
}

describe("SnapshotManager", () => {
    it("store adiciona passo e atualiza índices", () => {
        const sm = new SnapshotManager();
        sm.store(makeStep());
        sm.store(makeStep());
        sm.store(makeStep());
        expect(sm.size).toBe(3);
        expect(sm.currentIndex).toBe(2);
    });

    it("currentStep reflete último store", () => {
        const sm = new SnapshotManager();
        const s1 = makeStep({ nodeId: "n1" });
        const s2 = makeStep({ nodeId: "n2" });
        sm.store(s1);
        sm.store(s2);
        expect(sm.currentStep?.nodeId).toBe("n2");
    });

    it("currentStep undefined quando vazio", () => {
        const sm = new SnapshotManager();
        expect(sm.currentStep).toBeUndefined();
    });

    it("goTo navega para índice válido", () => {
        const sm = new SnapshotManager();
        const s1 = makeStep({ nodeId: "n1" });
        const s2 = makeStep({ nodeId: "n2" });
        const s3 = makeStep({ nodeId: "n3" });
        sm.store(s1);
        sm.store(s2);
        sm.store(s3);
        sm.goTo(1);
        expect(sm.currentIndex).toBe(1);
        expect(sm.currentStep?.nodeId).toBe("n2");
    });

    it("goTo ignora índice negativo", () => {
        const sm = new SnapshotManager();
        sm.store(makeStep());
        sm.goTo(-1);
        expect(sm.currentIndex).toBe(0);
    });

    it("goTo ignora índice >= size", () => {
        const sm = new SnapshotManager();
        sm.store(makeStep());
        sm.goTo(999);
        expect(sm.currentIndex).toBe(0);
    });

    it("getStep retorna step correto", () => {
        const sm = new SnapshotManager();
        const s1 = makeStep({ nodeId: "n1" });
        const s2 = makeStep({ nodeId: "n2" });
        sm.store(s1);
        sm.store(s2);
        expect(sm.getStep(0)?.nodeId).toBe("n1");
        expect(sm.getStep(1)?.nodeId).toBe("n2");
    });

    it("getStep retorna undefined para índice inválido", () => {
        const sm = new SnapshotManager();
        expect(sm.getStep(-1)).toBeUndefined();
        expect(sm.getStep(0)).toBeUndefined();
    });

    it("getSnapshot retorna ISnapshot com campos corretos", () => {
        const sm = new SnapshotManager();
        sm.store(makeStep({
            nodeId: "n3",
            nodeLabel: "x = 10",
            nodeType: "process",
            variables: [{ name: "x", value: "10", type: "inteiro", scope: "global" }],
            output: undefined,
            explanation: "Atribuindo 10 a x.",
            changes: ["x = 10"],
            nextHint: "Avançar.",
        }));
        const snap = sm.getSnapshot(0);
        expect(snap).not.toBeUndefined();
        expect(snap!.step).toBe(0);
        expect(snap!.blockId).toBe("n3");
        expect(snap!.blockLabel).toBe("x = 10");
        expect(snap!.blockType).toBe("process");
        expect(snap!.variables).toHaveLength(1);
        expect(snap!.variables[0].name).toBe("x");
        expect(snap!.explanation).toBe("Atribuindo 10 a x.");
        expect(snap!.changes).toEqual(["x = 10"]);
        expect(snap!.nextHint).toBe("Avançar.");
    });

    it("getSnapshot retorna undefined para índice inválido", () => {
        const sm = new SnapshotManager();
        expect(sm.getSnapshot(999)).toBeUndefined();
    });

    it("getSnapshot é imutável", () => {
        const sm = new SnapshotManager();
        sm.store(makeStep({
            nodeId: "n1",
            nodeLabel: "Início",
            nodeType: "startEnd",
            variables: [],
            explanation: "Iniciando.",
            changes: [],
            nextHint: "Avançar.",
        }));
        const snap = sm.getSnapshot(0)!;
        const originalLabel = snap.blockLabel;
        (snap as Record<string, unknown>).blockLabel = "Mutado";
        const snapAgain = sm.getSnapshot(0)!;
        expect(snapAgain.blockLabel).toBe(originalLabel);
    });

    it("allSteps é readonly array", () => {
        const sm = new SnapshotManager();
        sm.store(makeStep());
        const steps = sm.allSteps;
        expect(Array.isArray(steps)).toBe(true);
        expect(steps.length).toBe(1);
    });

    it("reset limpa tudo", () => {
        const sm = new SnapshotManager();
        sm.store(makeStep());
        sm.store(makeStep());
        sm.reset();
        expect(sm.size).toBe(0);
        expect(sm.currentIndex).toBe(-1);
        expect(sm.currentStep).toBeUndefined();
    });

    it("Store após reset funciona", () => {
        const sm = new SnapshotManager();
        sm.store(makeStep({ nodeId: "n1" }));
        sm.reset();
        sm.store(makeStep({ nodeId: "n2" }));
        expect(sm.size).toBe(1);
        expect(sm.currentIndex).toBe(0);
        expect(sm.currentStep?.nodeId).toBe("n2");
    });
});
