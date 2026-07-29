import { describe, it, expect } from "vitest";
import { ExplanationGenerator } from "../../engine/ExplanationGenerator";

describe("ExplanationGenerator", () => {
    const g = new ExplanationGenerator();

    it("startEnd start", () => {
        const r = g.generate({ nodeType: "startEnd", variant: "start", nodeLabel: "Início" });
        expect(r.log).toBe("Iniciando o algoritmo.");
        expect(r.explanation).toBe("Iniciando o algoritmo.");
        expect(r.changes).toEqual([]);
        expect(r.nextHint).toBe("Avançar.");
    });

    it("startEnd end", () => {
        const r = g.generate({ nodeType: "startEnd", variant: "end", nodeLabel: "Fim" });
        expect(r.log).toBe("Algoritmo finalizado.");
        expect(r.explanation).toBe("Algoritmo finalizado.");
        expect(r.changes).toEqual([]);
        expect(r.nextHint).toBe("Concluído.");
    });

    it("input waiting", () => {
        const r = g.generate({ nodeType: "input", nodeLabel: "x" });
        expect(r.log).toBe("Solicitando x.");
        expect(r.explanation).toBe("Aguardando valor para 'x'.");
        expect(r.changes).toEqual([]);
        expect(r.nextHint).toBe("Informe o valor.");
    });

    it("input received", () => {
        const r = g.generate({ nodeType: "input", nodeLabel: "x", inputValue: "42" });
        expect(r.log).toBe("Lendo x.");
        expect(r.explanation).toBe("Armazenando '42' em 'x'.");
        expect(r.changes).toEqual(["x = 42"]);
        expect(r.nextHint).toBe("Avançar.");
    });

    it("output", () => {
        const r = g.generate({ nodeType: "output", nodeLabel: "soma", expressionResult: "20" });
        expect(r.log).toBe("Exibindo soma.");
        expect(r.explanation).toBe("Resultado: 20.");
        expect(r.changes).toEqual(["Saída: 20"]);
        expect(r.nextHint).toBe("Avançar.");
    });

    it("process single assignment", () => {
        const r = g.generate({ nodeType: "process", nodeLabel: "x = 10", changes: ["x = 10"] });
        expect(r.log).toBe("x = 10");
        expect(r.explanation).toBe("x = 10.");
        expect(r.changes).toEqual(["x = 10"]);
        expect(r.nextHint).toBe("Avançar.");
    });

    it("process multiple statements", () => {
        const r = g.generate({ nodeType: "process", nodeLabel: "soma = 0; i = 1", changes: ["soma = 0", "i = 1"] });
        expect(r.log).toBe("soma = 0; i = 1");
        expect(r.explanation).toBe("Múltiplos: soma = 0; i = 1.");
        expect(r.changes).toEqual(["soma = 0", "i = 1"]);
        expect(r.nextHint).toBe("Avançar.");
    });

    it("process empty changes", () => {
        const r = g.generate({ nodeType: "process", nodeLabel: "x = 10", changes: [] });
        expect(r.explanation).toBe("Múltiplos: .");
    });

    it("decision true", () => {
        const r = g.generate({ nodeType: "decision", nodeLabel: "n > 5", conditionResult: true });
        expect(r.log).toBe("n > 5 → V");
        expect(r.changes).toEqual(["Decisão: VERDADEIRO"]);
        expect(r.explanation).toBe("'n > 5' é verdadeiro.");
        expect(r.nextHint).toBe("Seguindo VERDADEIRO.");
    });

    it("decision false", () => {
        const r = g.generate({ nodeType: "decision", nodeLabel: "n > 5", conditionResult: false });
        expect(r.log).toBe("n > 5 → F");
        expect(r.changes).toEqual(["Decisão: FALSO"]);
        expect(r.explanation).toBe("'n > 5' é falso.");
        expect(r.nextHint).toBe("Seguindo FALSO.");
    });

    it("subroutine", () => {
        const r = g.generate({ nodeType: "subroutine", nodeLabel: "fatorial(n)", subroutineName: "fatorial(n)" });
        expect(r.log).toBe("Chamando fatorial(n).");
        expect(r.explanation).toBe("Chamando 'fatorial(n)'.");
        expect(r.changes).toEqual(["Chamada: fatorial(n)"]);
        expect(r.nextHint).toBe("Retornando.");
    });

    it("subroutine uses nodeLabel when subroutineName is empty", () => {
        const r = g.generate({ nodeType: "subroutine", nodeLabel: "calc" });
        expect(r.log).toBe("Chamando calc.");
    });

    it("memory returns empty", () => {
        const r = g.generate({ nodeType: "memory", nodeLabel: "" });
        expect(r.log).toBe("");
        expect(r.explanation).toBe("");
        expect(r.changes).toEqual([]);
        expect(r.nextHint).toBe("");
    });

    it("connector returns empty", () => {
        const r = g.generate({ nodeType: "connector", nodeLabel: "" });
        expect(r.log).toBe("");
        expect(r.explanation).toBe("");
        expect(r.changes).toEqual([]);
        expect(r.nextHint).toBe("");
    });
});
