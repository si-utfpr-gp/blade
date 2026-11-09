import { describe, it, expect } from "vitest"
import {
  loopBodyIds,
  loopReturnLaneX,
  loopReturnPath,
} from "../../components/constructor/edges/loopReturn"

// The arrow that closes a loop runs from the last block of the body back to
// the side of the connector above the condition. Drawn as a plain step it
// climbed right beside the condition, crossing the Verdadeiro branch; it now
// goes around the whole body on the side it enters.
describe("loopBodyIds", () => {
  // conector -> decisão -> corpo1 -> corpo2 -> (volta ao conector)
  //                   \-> saída (Falso)
  const edges = [
    { id: "e0", source: "antes", target: "con" },
    { id: "e1", source: "con", target: "dec" },
    { id: "e2", source: "dec", target: "corpo1" },
    { id: "e3", source: "corpo1", target: "corpo2" },
    { id: "volta", source: "corpo2", target: "con" },
    { id: "e4", source: "dec", target: "saida" },
  ]

  it("reúne os blocos entre o conector e o bloco que fecha o laço", () => {
    const body = loopBodyIds(edges[4], edges)

    expect([...body].sort()).toEqual(["con", "corpo1", "corpo2", "dec"])
  })

  it("deixa vazio quando a seta lateral não fecha um laço", () => {
    expect(loopBodyIds({ id: "x", source: "antes", target: "con" }, edges).size).toBe(0)
  })

  // enquanto { se (cond) { ramoV } ; fimSe -> incremento } : o fim do se é
  // alcançável dando a volta pelo laço, mas não fecha laço nenhum.
  const nested = [
    { id: "a", source: "inicio", target: "laco" },
    { id: "b", source: "laco", target: "enq" },
    { id: "c", source: "enq", target: "se" },
    { id: "d", source: "se", target: "ramoV" },
    { id: "verdadeiro", source: "ramoV", target: "fimSe" },
    { id: "falso", source: "se", target: "fimSe" },
    { id: "f", source: "fimSe", target: "inc" },
    { id: "volta", source: "inc", target: "laco" },
    { id: "g", source: "enq", target: "fim" },
  ]

  it("o fim de um se dentro de um laço não é tratado como volta de laço", () => {
    expect(loopBodyIds(nested[4], nested).size).toBe(0)
    expect(loopBodyIds(nested[5], nested).size).toBe(0)
  })

  it("a volta do laço externo continua reconhecida com um se dentro", () => {
    expect([...loopBodyIds(nested[7], nested)].sort()).toEqual(["enq", "fimSe", "inc", "laco", "ramoV", "se"])
  })
})

describe("loopReturnLaneX", () => {
  const body = [
    { x: 700, y: 450, width: 40, height: 40 }, // conector
    { x: 680, y: 520, width: 80, height: 60 }, // decisão
    { x: 840, y: 610, width: 120, height: 30 }, // corpo à direita
  ]

  it("passa à direita de todo o corpo quando entra pela direita", () => {
    expect(loopReturnLaneX("right", body)).toBeGreaterThan(960)
  })

  it("passa à esquerda de todo o corpo quando entra pela esquerda", () => {
    expect(loopReturnLaneX("left", body)).toBeLessThan(680)
  })
})

describe("loopReturnPath", () => {
  it("desce, contorna pela faixa, sobe e entra pela lateral do conector", () => {
    const [path, labelX, labelY] = loopReturnPath({
      sourceX: 900,
      sourceY: 700,
      targetX: 750,
      targetY: 470,
      laneX: 990,
    })

    expect(path).toBe("M 900,700 L 900,720 L 990,720 L 990,470 L 750,470")
    expect(labelX).toBe(990)
    expect(labelY).toBe(595)
  })

  it("sai reto para a faixa quando a seta deixa a lateral de uma decisão", () => {
    const [path] = loopReturnPath({
      sourceX: 850,
      sourceY: 640,
      targetX: 820,
      targetY: 396,
      laneX: 895,
      fromSide: true,
    })

    expect(path).toBe("M 850,640 L 895,640 L 895,396 L 820,396")
  })
})
