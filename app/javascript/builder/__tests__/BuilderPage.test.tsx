import { describe, it, expect, beforeEach } from "vitest"
import { render, screen, fireEvent, within } from "@testing-library/react"
import BuilderPage from "../BuilderPage"

/**
 * The canvas opens empty, so tests that need something to work with place the
 * start block the way a student does: tap the tile, then tap the canvas.
 */
function placeStartBlock(container: HTMLElement) {
  fireEvent.click(screen.getByTestId("block-tile-startEnd-start"))
  const canvas = container.querySelector(".react-flow__pane") as Element
  fireEvent.click(canvas, { clientX: 200, clientY: 200 })
}

describe("BuilderPage", () => {
  it("inicia com o painel do simulador fechado", () => {
    render(<BuilderPage />)
    expect(
      screen.getByRole("button", { name: /mostrar depurador/i }),
    ).toBeInTheDocument()
    expect(screen.queryByText(/iniciar execução/i)).not.toBeInTheDocument()
  })

  it("exibe o botão Executar dentro do canvas", () => {
    render(<BuilderPage />)
    const toolbar = screen.getByTestId("canvas-toolbar")
    expect(
      within(toolbar).getByRole("button", { name: /executar/i }),
    ).toBeInTheDocument()
  })

  it("abre o menu de contexto junto ao ponto clicado no bloco", () => {
    const { container } = render(<BuilderPage />)
    placeStartBlock(container)
    const nodeEl = container.querySelector(".react-flow__node")
    expect(nodeEl).not.toBeNull()
    fireEvent.contextMenu(nodeEl as Element, { clientX: 120, clientY: 150 })
    const menu = screen.getByText("Excluir").closest("div.absolute") as HTMLElement
    expect(menu).toHaveStyle({ left: "120px", top: "150px" })
    expect(within(menu).getByText("Início")).toBeInTheDocument()
  })

  it("abre o painel do simulador ao clicar em Executar", () => {
    const { container } = render(<BuilderPage />)
    placeStartBlock(container)
    fireEvent.click(screen.getByRole("button", { name: /executar/i }))
    expect(
      screen.getByRole("button", { name: /próximo passo/i }),
    ).toBeInTheDocument()
    expect(screen.getByText(/Histórico — Passo 1/)).toBeInTheDocument()
    expect(
      screen.queryByRole("button", { name: /mostrar depurador/i }),
    ).not.toBeInTheDocument()
  })
})

/**
 * A pessoa no celular só consegue usar o menu de blocos se este botão existir.
 * O cabeçalho real é um wrapper em volta do Header, então este teste cobre a
 * estrutura de verdade, não o Header isolado.
 */
describe("BuilderPage — menu de blocos no celular", () => {
  beforeEach(() => {
    window.matchMedia = ((query: string) => ({
      matches: query.includes("min-width") ? false : true,
      media: query,
      addEventListener: () => {},
      removeEventListener: () => {},
      addListener: () => {},
      removeListener: () => {},
      dispatchEvent: () => false,
      onchange: null,
    })) as unknown as typeof window.matchMedia
  })

  it("tem o botão hamburguer para abrir os blocos", () => {
    render(<BuilderPage />)

    expect(
      screen.getByRole("button", { name: /abrir menu de blocos/i }),
    ).toBeInTheDocument()
  })

  it("abre os blocos e os exemplos ao clicar no botão", () => {
    render(<BuilderPage />)

    fireEvent.click(
      screen.getByRole("button", { name: /abrir menu de blocos/i }),
    )

    const sidebar = document.getElementById("workspace-sidebar")
    expect(sidebar).not.toHaveClass("-translate-x-full")
    expect(
      screen.getByRole("button", { name: /^Meus algoritmos/i }),
    ).toBeInTheDocument()
    expect(screen.getByRole("button", { name: /^Exemplos/i })).toBeInTheDocument()
  })
})
