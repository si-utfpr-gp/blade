import { describe, it, expect } from "vitest"
import { render, screen, fireEvent } from "@testing-library/react"
import { SimulatorProvider } from "../../components/simulator/SimulatorContext"
import { ConstructorProvider } from "../../components/constructor/ConstructorProvider"
import BlocksPanel from "../../components/blocks/BlocksPanel"
import {
  BLOCK_DEFINITIONS,
  DRAG_DATA_KEY,
  DRAG_VARIANT_KEY,
} from "../../components/blocks/blockDefinitions"

function renderPanel() {
  return render(
    <SimulatorProvider>
      <ConstructorProvider>
        <BlocksPanel errors={[]} />
      </ConstructorProvider>
    </SimulatorProvider>,
  )
}

describe("BlocksPanel (visual palette)", () => {
  it("renderiza uma miniatura de forma para cada entrada da paleta", () => {
    renderPanel()
    for (const block of BLOCK_DEFINITIONS) {
      const expected = BLOCK_DEFINITIONS.filter((item) => item.type === block.type).length
      expect(screen.getAllByTestId(`block-shape-${block.type}`)).toHaveLength(expected)
    }
  })

  it("exibe a legenda curta de cada bloco", () => {
    renderPanel()
    for (const block of BLOCK_DEFINITIONS) {
      expect(screen.getByText(block.label)).toBeInTheDocument()
    }
  })

  it("usa a cor de Fim no tile de Fim e a de Início no de Início", () => {
    renderPanel()
    const strokes = screen
      .getAllByTestId("block-shape-startEnd")
      .map((svg) => svg.querySelector("ellipse")?.getAttribute("stroke"))
    expect(strokes).toContain("hsl(var(--node-start))")
    expect(strokes).toContain("hsl(var(--node-end))")
  })

  it("organiza os blocos lado a lado em grade", () => {
    renderPanel()
    const grid = screen.getByTestId("blocks-grid")
    expect(grid).toHaveClass("grid", "grid-cols-3")
  })

  it("inicia o arrasto com o tipo do bloco", () => {
    renderPanel()
    const data: Record<string, string> = {}
    const tile = screen.getByTestId("block-tile-process")
    fireEvent.dragStart(tile, {
      dataTransfer: {
        setData: (key: string, value: string) => {
          data[key] = value
        },
        effectAllowed: "",
      },
    })
    expect(data[DRAG_DATA_KEY]).toBe("process")
  })

  it("oferece tiles separados de Início e Fim com a variante no arrasto", () => {
    renderPanel()
    const data: Record<string, string> = {}
    const endTile = screen.getByTestId("block-tile-startEnd-end")
    fireEvent.dragStart(endTile, {
      dataTransfer: {
        setData: (key: string, value: string) => {
          data[key] = value
        },
        effectAllowed: "",
      },
    })
    expect(data[DRAG_DATA_KEY]).toBe("startEnd")
    expect(data[DRAG_VARIANT_KEY]).toBe("end")
    expect(screen.getByTestId("block-tile-startEnd-start")).toBeInTheDocument()
  })
})
