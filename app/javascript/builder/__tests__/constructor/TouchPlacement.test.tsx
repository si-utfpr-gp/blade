import { describe, it, expect } from "vitest"
import { render, screen, fireEvent } from "@testing-library/react"

import { BLOCK_DEFINITIONS } from "../../components/blocks/blockDefinitions"
import BlocksPanel from "../../components/blocks/BlocksPanel"
import { usePanePlacement } from "../../components/constructor/usePanePlacement"
import { PlacementHint } from "../../components/constructor/PlacementHint"
import { useConstructor } from "../../components/constructor/ConstructorProvider"
import {
  BlockPlacementProvider,
  useBlockPlacement,
} from "../../components/constructor/BlockPlacement"
import { BuilderProviders } from "../test-utils"

/** Reports what ended up on the canvas, in flow coordinates. */
function NodeProbe() {
  const { nodes } = useConstructor()
  return (
    <ul data-testid="nodes">
      {nodes.map((node) => (
        <li key={node.id} data-testid={`node-${node.id}`}>
          {String(node.type)}:{" "}
          {`${node.position.x},${node.position.y}`}
        </li>
      ))}
    </ul>
  )
}

function ArmedProbe() {
  const { pendingBlock } = useBlockPlacement()
  return (
    <span data-testid="armed">
      {pendingBlock ? `${pendingBlock.type}:${pendingBlock.variant ?? "-"}` : ""}
    </span>
  )
}

/**
 * Stands in for the ReactFlow pane: the same handler the canvas hands to
 * onPaneClick, fed flow coordinates instead of screen pixels.
 */
function PaneProbe({ point }: { point: { x: number; y: number } }) {
  const placeAt = usePanePlacement()
  return (
    <button
      type="button"
      data-testid="canvas-surface"
      onClick={() => placeAt(point)}
    >
      canvas
    </button>
  )
}

function renderBuilder() {
  return render(
    <BuilderProviders>
      <BlockPlacementProvider>
        <ArmedProbe />
        <BlocksPanel errors={[]} />
        <PlacementHint />
        <PaneProbe point={{ x: 240, y: 180 }} />
        <NodeProbe />
      </BlockPlacementProvider>
    </BuilderProviders>,
  )
}

function tapCanvas() {
  fireEvent.click(screen.getByTestId("canvas-surface"))
}

describe("adicionar bloco tocando", () => {
  it("tocar no bloco não cria nada sozinho", () => {
    renderBuilder()

    fireEvent.click(screen.getByTestId("block-tile-process"))

    // First tap arms; the second one decides where it lands.
    expect(screen.getByTestId("nodes").children).toHaveLength(0)
    expect(screen.getByTestId("armed")).toHaveTextContent("process:-")
  })

  it("o segundo toque posiciona o bloco no ponto tocado", () => {
    renderBuilder()

    fireEvent.click(screen.getByTestId("block-tile-process"))
    tapCanvas()

    const nodes = screen.getByTestId("nodes").children
    expect(nodes).toHaveLength(1)
    // The flow position is the one tapped, offset so the block is centred.
    expect(screen.getByTestId("nodes")).toHaveTextContent("process: 155,152")
    expect(screen.getByTestId("armed")).toHaveTextContent("")
  })

  it("preserva a variante ao posicionar", () => {
    renderBuilder()

    fireEvent.click(screen.getByTestId("block-tile-startEnd-end"))
    expect(screen.getByTestId("armed")).toHaveTextContent("startEnd:end")

    tapCanvas()
    expect(screen.getByTestId("nodes").children).toHaveLength(1)
  })

  it("cancelar com Escape descarta o bloco armado", () => {
    renderBuilder()

    fireEvent.click(screen.getByTestId("block-tile-process"))
    expect(screen.getByTestId("armed")).not.toHaveTextContent("")

    fireEvent.keyDown(document, { key: "Escape" })

    expect(screen.getByTestId("armed")).toHaveTextContent("")
    tapCanvas()
    expect(screen.getByTestId("nodes").children).toHaveLength(0)
  })

  it("não arma nada ao terminar um arrasto vindo do mouse", () => {
    renderBuilder()

    const tile = screen.getByTestId("block-tile-process")
    fireEvent.dragStart(tile, { dataTransfer: makeDataTransfer() })
    fireEvent.dragEnd(tile, { dataTransfer: makeDataTransfer() })

    // Arrastar já posiciona o bloco; armar também faria o próximo clique
    // criar um segundo.
    expect(screen.getByTestId("armed")).toHaveTextContent("")
  })

  it("marca o bloco armado na paleta", () => {
    renderBuilder()

    const tile = screen.getByTestId("block-tile-process")
    expect(tile).toHaveAttribute("aria-pressed", "false")

    fireEvent.click(tile)

    expect(tile).toHaveAttribute("aria-pressed", "true")
  })

  it("avisa onde tocar", () => {
    renderBuilder()
    expect(screen.queryByText(/toque no canvas/i)).not.toBeInTheDocument()

    fireEvent.click(screen.getByTestId("block-tile-process"))

    expect(screen.getByText(/toque no canvas/i)).toBeInTheDocument()
  })
})

function makeDataTransfer() {
  const store = new Map<string, string>()
  return {
    setData: (key: string, value: string) => void store.set(key, value),
    getData: (key: string) => store.get(key) ?? "",
    effectAllowed: "",
    dropEffect: "",
  }
}

describe("paleta mantém os blocos existentes", () => {
  it("mantém os 9 tipos disponíveis", () => {
    renderBuilder()
    for (const block of BLOCK_DEFINITIONS) {
      expect(
        screen.getByTestId(
          `block-tile-${block.type}${block.variant ? `-${block.variant}` : ""}`,
        ),
      ).toBeInTheDocument()
    }
  })
})
describe("aviso de posicionamento em tela estreita", () => {
  function armBlock() {
    render(
      <BuilderProviders>
        <PlacementHint />
        <BlocksPanel errors={[]} />
      </BuilderProviders>,
    )
    fireEvent.click(screen.getByTestId("block-tile-process"))
  }

  it("fica embaixo em telas pequenas, longe dos botões salvar e executar", () => {
    armBlock()

    const hint = screen.getByText(/toque no canvas/i)

    // Salvar e executar ficam em top-3, um de cada lado. Centralizado no topo
    // o aviso ficava atrás deles em canvas estreito.
    expect(hint.className).toContain("max-md:top-auto")
    expect(hint.className).toContain("max-md:bottom-4")
  })

  it("continua centralizado no topo a partir de md", () => {
    armBlock()

    const hint = screen.getByText(/toque no canvas/i)

    expect(hint.className).toContain("top-3")
    expect(hint.className).toContain("left-1/2")
  })

  it("não é clicável, para o toque ir para o canvas", () => {
    armBlock()

    const hint = screen.getByText(/toque no canvas/i)
    expect(hint).toHaveClass("pointer-events-none")
  })
})
