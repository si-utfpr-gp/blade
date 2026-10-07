import { describe, it, expect } from "vitest"
import { getBlockDisplayName } from "../../components/blocks/blockDefinitions"

describe("getBlockDisplayName", () => {
  it("diferencia Início e Fim pela variante", () => {
    expect(getBlockDisplayName("startEnd", "start")).toBe("Início")
    expect(getBlockDisplayName("startEnd", "end")).toBe("Fim")
  })

  it("retorna o nome fixo dos demais blocos", () => {
    expect(getBlockDisplayName("input")).toBe("Entrada")
    expect(getBlockDisplayName("memory")).toBe("Memória")
    expect(getBlockDisplayName("process")).toBe("Processo")
    expect(getBlockDisplayName("decision")).toBe("Decisão")
    expect(getBlockDisplayName("output")).toBe("Saída")
    expect(getBlockDisplayName("connector")).toBe("Conector")
    expect(getBlockDisplayName("subroutine")).toBe("Subrotina")
  })
})
