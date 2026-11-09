import { describe, it, expect } from "vitest"
import { caseTurnY } from "../../components/constructor/edges/FlowStepEdge"

// Case arrows leave the selection side by side and all turn sideways in the
// gap above their targets. Turning at the same height made neighbours overlap,
// so the farther an arrow goes, the earlier it turns: arrows on one side then
// nest instead of sharing a segment.
describe("caseTurnY", () => {
  const from = { sourceX: 600, sourceY: 100, targetY: 160 }

  it("só vale para as saídas de caso", () => {
    expect(caseTurnY({ ...from, sourceHandleId: "yes", targetX: 900 })).toBeUndefined()
    expect(caseTurnY({ ...from, sourceHandleId: "default", targetX: 900 })).toBeUndefined()
    expect(caseTurnY({ ...from, sourceHandleId: null, targetX: 900 })).toBeUndefined()
  })

  it("dobra mais cedo quanto mais longe está o destino", () => {
    const near = caseTurnY({ ...from, sourceHandleId: "case-1", targetX: 740 }) as number
    const far = caseTurnY({ ...from, sourceHandleId: "case-2", targetX: 1060 }) as number

    expect(far).toBeLessThan(near)
  })

  it("dobra sempre entre a saída e o destino", () => {
    for (const targetX of [600, 620, 900, 3000]) {
      const y = caseTurnY({ ...from, sourceHandleId: "case-0", targetX }) as number
      expect(y).toBeGreaterThan(from.sourceY)
      expect(y).toBeLessThan(from.targetY)
    }
  })

  it("deixa o caminho padrão quando o destino não está abaixo", () => {
    expect(caseTurnY({ sourceX: 600, sourceY: 100, targetY: 80, sourceHandleId: "case-0", targetX: 900 })).toBeUndefined()
  })
})
