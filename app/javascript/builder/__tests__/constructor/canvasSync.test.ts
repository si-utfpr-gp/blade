import { describe, it, expect } from "vitest"
import {
  canvasPermissions,
  getHighlightedNodeId,
  isCanvasLocked,
  getContextMenuPosition,
} from "../../components/constructor/canvasSync"
import type { IExecutionStep } from "../../interfaces/execution"

function step(nodeId: string): IExecutionStep {
  return {
    nodeId,
    nodeLabel: nodeId,
    nodeType: "process",
    variables: [],
    log: "",
    explanation: "",
    changes: [],
    nextHint: "",
  }
}

describe("getHighlightedNodeId", () => {
  it("retorna null quando não há passos", () => {
    expect(getHighlightedNodeId([], 0)).toBeNull()
  })

  it("retorna o nodeId do passo atual", () => {
    const steps = [step("n1"), step("n2"), step("n3")]
    expect(getHighlightedNodeId(steps, 1)).toBe("n2")
  })

  it("retorna null quando o índice está fora do histórico", () => {
    const steps = [step("n1")]
    expect(getHighlightedNodeId(steps, 5)).toBeNull()
    expect(getHighlightedNodeId(steps, -1)).toBeNull()
  })
})

describe("isCanvasLocked", () => {
  it("não trava antes de iniciar", () => {
    expect(isCanvasLocked(false, false)).toBe(false)
  })

  it("trava durante a execução", () => {
    expect(isCanvasLocked(true, false)).toBe(true)
  })

  it("destrava quando a execução termina", () => {
    expect(isCanvasLocked(true, true)).toBe(false)
  })
})

describe("getContextMenuPosition", () => {
  it("posiciona o menu relativo ao canvas", () => {
    expect(getContextMenuPosition(100, 200, { left: 10, top: 20 })).toEqual({
      x: 90,
      y: 180,
    })
  })

  it("posiciona na origem quando o canvas está no canto", () => {
    expect(getContextMenuPosition(50, 60, { left: 0, top: 0 })).toEqual({
      x: 50,
      y: 60,
    })
  })
})

describe("centerDropPosition", () => {
  it("centraliza o bloco sob o cursor", async () => {
    const { centerDropPosition } = await import(
      "../../components/constructor/canvasSync"
    )
    expect(centerDropPosition({ x: 100, y: 100 }, "process")).toEqual({
      x: 15,
      y: 72,
    })
    expect(centerDropPosition({ x: 100, y: 100 }, "connector")).toEqual({
      x: 76,
      y: 76,
    })
  })
})

// A bundled example can be rearranged to read it better, but its content
// stays as shipped; a running simulation freezes everything.
describe("canvasPermissions", () => {
  it("deixa tudo livre num diagrama próprio parado", () => {
    expect(canvasPermissions({ running: false, isExample: false })).toEqual({ canMove: true, canEdit: true })
  })

  it("num exemplo, deixa mover os blocos mas não editar nem apagar", () => {
    expect(canvasPermissions({ running: false, isExample: true })).toEqual({ canMove: true, canEdit: false })
  })

  it("com a execução em andamento, trava tudo", () => {
    expect(canvasPermissions({ running: true, isExample: false })).toEqual({ canMove: false, canEdit: false })
    expect(canvasPermissions({ running: true, isExample: true })).toEqual({ canMove: false, canEdit: false })
  })
})
