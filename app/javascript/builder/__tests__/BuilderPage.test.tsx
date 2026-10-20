import { describe, it, expect, beforeEach, vi } from "vitest"
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

  // The four corner groups crowded a 390px canvas; on a phone they share one
  // bar along the bottom, within thumb reach.
  it("reúne as ações do canvas numa barra inferior", () => {
    render(<BuilderPage />)
    const bar = screen.getByTestId("canvas-toolbar-mobile")

    for (const name of [/desfazer/i, /refazer/i, /salvar algoritmo/i, /exportar algoritmo/i, /executar/i, /mostrar depurador/i]) {
      expect(within(bar).getByRole("button", { name })).toBeInTheDocument()
    }
    expect(screen.queryByTestId("canvas-toolbar-save")).not.toBeInTheDocument()
    expect(screen.queryByTestId("canvas-toolbar-export")).not.toBeInTheDocument()
  })

  it("só mostra o botão do depurador na barra, sem a faixa lateral", () => {
    render(<BuilderPage />)

    expect(screen.getAllByRole("button", { name: /mostrar depurador/i })).toHaveLength(1)
  })

  it("abre o depurador pela barra inferior", () => {
    render(<BuilderPage />)
    fireEvent.click(within(screen.getByTestId("canvas-toolbar-mobile")).getByRole("button", { name: /mostrar depurador/i }))

    expect(screen.getAllByText(/iniciar execução/i).length).toBeGreaterThan(0)
    expect(within(screen.getByTestId("canvas-toolbar-mobile")).getByRole("button", { name: /esconder depurador/i })).toBeInTheDocument()
  })

  it("deixa o zoom para o gesto de pinça", () => {
    const { container } = render(<BuilderPage />)

    expect(container.querySelector(".react-flow__controls")).toBeNull()
  })

  it("mostra só o ícone do Blade no cabeçalho, deixando espaço para o nome", () => {
    render(<BuilderPage />)

    expect(screen.getByText("Blade")).toHaveClass("hidden", "sm:inline")
  })

  // The drawer covers the canvas, so picking something to open closes it and
  // shows what was picked.
  it("fecha a gaveta depois de abrir um exemplo", () => {
    render(<BuilderPage />)
    fireEvent.click(screen.getByRole("button", { name: /abrir menu de blocos/i }))
    fireEvent.click(screen.getByRole("button", { name: /^Exemplos/i }))
    fireEvent.click(screen.getByRole("button", { name: /^Par ou Ímpar,/ }))

    expect(document.getElementById("workspace-sidebar")).toHaveClass("-translate-x-full")
  })

  it("tem o botão hamburguer para abrir os blocos", () => {
    render(<BuilderPage />)

    expect(
      screen.getByRole("button", { name: /abrir menu de blocos/i }),
    ).toBeInTheDocument()
  })

  it("abre os blocos e os exemplos ao clicar no botão", () => {
    render(<BuilderPage signedIn />)

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

  it("logado, Meus algoritmos no menu da conta abre a lista de algoritmos", async () => {
    vi.stubGlobal("fetch", vi.fn(() => Promise.resolve({ ok: true, status: 200, json: async () => [] })))
    try {
      render(<BuilderPage userName="Ana Souza" signedIn />)
      fireEvent.click(screen.getByRole("button", { name: /conta de ana souza/i }))
      fireEvent.click(screen.getByRole("menuitem", { name: /meus algoritmos/i }))

      expect(await screen.findByRole("dialog", { name: /meus algoritmos/i })).toBeInTheDocument()
    } finally {
      vi.unstubAllGlobals()
    }
  })

  it("num exemplo, os blocos podem ser movidos mas não apagados", () => {
    const { container } = render(<BuilderPage />)
    fireEvent.click(screen.getByRole("button", { name: /abrir menu de blocos/i }))
    fireEvent.click(screen.getByRole("button", { name: /^Exemplos/i }))
    fireEvent.click(screen.getByRole("button", { name: /^Par ou Ímpar/i }))

    const nodes = container.querySelectorAll(".react-flow__node")
    expect(nodes.length).toBeGreaterThan(0)
    nodes.forEach((node) => expect(node).toHaveClass("draggable"))

    fireEvent.contextMenu(nodes[0], { clientX: 100, clientY: 100 })
    expect(screen.queryByText("Excluir")).not.toBeInTheDocument()

    fireEvent.click(nodes[0])
    fireEvent.keyDown(document.body, { key: "Delete" })
    expect(container.querySelectorAll(".react-flow__node")).toHaveLength(nodes.length)
  })
})
