import { describe, it, expect } from "vitest"
import { render, screen, fireEvent, within } from "@testing-library/react"
import BuilderPage from "../BuilderPage"

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
    const nodeEl = container.querySelector(".react-flow__node")
    expect(nodeEl).not.toBeNull()
    fireEvent.contextMenu(nodeEl as Element, { clientX: 120, clientY: 150 })
    const menu = screen.getByText("Excluir").closest("div.absolute") as HTMLElement
    expect(menu).toHaveStyle({ left: "120px", top: "150px" })
    expect(within(menu).getByText("Início")).toBeInTheDocument()
  })

  it("abre o painel do simulador ao clicar em Executar", () => {
    render(<BuilderPage />)
    fireEvent.click(screen.getByRole("button", { name: /executar/i }))
    expect(
      screen.getByRole("button", { name: /iniciar execução/i }),
    ).toBeInTheDocument()
    expect(
      screen.queryByRole("button", { name: /mostrar depurador/i }),
    ).not.toBeInTheDocument()
  })
})
