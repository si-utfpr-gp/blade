import { describe, it, expect } from "vitest"
import {
  getBlockCapabilities,
  selectionCaseIndex,
} from "../../components/blocks/blockCapabilities"

describe("getBlockCapabilities — escolha", () => {
  it("abre uma saída por caso e a saída Falso", () => {
    const capabilities = getBlockCapabilities({
      blockType: "selection",
      cases: ["1", "2", "3"],
    })

    expect(capabilities).toEqual({
      allowsIncoming: true,
      outgoingHandles: [
        { id: "case-0" },
        { id: "case-1" },
        { id: "case-2" },
        { id: "default" },
      ],
    })
  })

  it("sem casos, só sobra a saída Falso", () => {
    expect(
      getBlockCapabilities({ blockType: "selection" }).outgoingHandles,
    ).toEqual([{ id: "default" }])
  })
})

describe("selectionCaseIndex", () => {
  it("lê o índice de um handle de caso", () => {
    expect(selectionCaseIndex("case-0")).toBe(0)
    expect(selectionCaseIndex("case-12")).toBe(12)
  })

  it("devolve null para os demais handles", () => {
    expect(selectionCaseIndex("default")).toBeNull()
    expect(selectionCaseIndex("yes")).toBeNull()
    expect(selectionCaseIndex(undefined)).toBeNull()
  })
})
