import { describe, it, expect } from "vitest"
import { render, screen, fireEvent, act } from "@testing-library/react"

import WorkspaceLayout from "../../components/layout/WorkspaceLayout"
import Header from "../../components/layout/Header"

// jsdom has no viewport, so the md breakpoint has to be simulated.
function setViewport(viewport: "mobile" | "desktop") {
  const listeners = new Set<(event: MediaQueryListEvent) => void>()
  const state = { matches: viewport === "desktop" }

  window.matchMedia = ((query: string) => ({
    matches: query.includes("min-width") ? state.matches : !state.matches,
    media: query,
    addEventListener: (_: string, listener: (event: MediaQueryListEvent) => void) =>
      listeners.add(listener),
    removeEventListener: (
      _: string,
      listener: (event: MediaQueryListEvent) => void,
    ) => listeners.delete(listener),
    addListener: () => {},
    removeListener: () => {},
    dispatchEvent: () => false,
    onchange: null,
  })) as unknown as typeof window.matchMedia

  return {
    resize(next: "mobile" | "desktop") {
      state.matches = next === "desktop"
      for (const listener of listeners) {
        listener({ matches: state.matches } as MediaQueryListEvent)
      }
    },
  }
}

const MENU_BUTTON = /abrir menu de blocos/i

function renderLayout(viewport: "mobile" | "desktop" = "desktop") {
  setViewport(viewport)
  return render(
    <WorkspaceLayout
      header={<Header title="" userName="Ana" />}
      sidebar={<div data-testid="sidebar-content">blocos</div>}
      canvas={<div data-testid="canvas-content">canvas</div>}
      inspector={<div data-testid="inspector-content">simulador</div>}
    />,
  )
}

describe("WorkspaceLayout — larguras", () => {
  it("usa largura fixa na sidebar, sem porcentagem", () => {
    renderLayout()
    const sidebar = screen.getByTestId("sidebar-content").parentElement

    // Percentual de viewport fazia a largura variar de 154px a 384px na mesma
    // aplicação, estreitando demais os dropdowns.
    expect(sidebar).toHaveClass("w-64")
    expect(sidebar?.className).not.toContain("[15%]")
    expect(sidebar?.className).not.toContain("min-w-35")
    expect(sidebar?.className).not.toContain("max-w-62.5")
  })

  it("mantém a sidebar no fluxo em telas grandes", () => {
    renderLayout()
    const sidebar = screen.getByTestId("sidebar-content").parentElement

    // Antes sumia inteira abaixo de md, levando junto o menu de exemplos.
    expect(sidebar?.className).not.toContain("max-md:hidden")
    expect(sidebar?.className).toContain("md:relative")
  })

  it("dá ao canvas o espaço restante", () => {
    renderLayout()
    const canvas = screen.getByTestId("canvas-content").parentElement

    expect(canvas).toHaveClass("flex-1")
    expect(canvas).toHaveClass("min-w-0")
  })
})

describe("WorkspaceLayout — gaveta em telas pequenas", () => {
  it("começa fechada, com o botão do menu disponível", () => {
    renderLayout("mobile")

    const trigger = screen.getByRole("button", { name: MENU_BUTTON })
    expect(trigger).toHaveAttribute("aria-expanded", "false")
    expect(trigger).toHaveAttribute("aria-controls", "workspace-sidebar")

    const sidebar = screen.getByTestId("sidebar-content").closest(
      "#workspace-sidebar",
    )
    expect(sidebar).toHaveClass("-translate-x-full")
  })

  it("abre a gaveta ao clicar no botão", () => {
    renderLayout("mobile")

    const trigger = screen.getByRole("button", { name: MENU_BUTTON })
    fireEvent.click(trigger)

    expect(trigger).toHaveAttribute("aria-expanded", "true")
    const sidebar = document.getElementById("workspace-sidebar")
    expect(sidebar).not.toHaveClass("-translate-x-full")
    expect(sidebar).toHaveClass("translate-x-0")
    // Aberta, a gaveta é conteúdo legítimo: nada é escondido da navegação.
    expect(sidebar).not.toHaveAttribute("aria-hidden")
  })

  it("mostra um backdrop que fecha a gaveta", () => {
    renderLayout("mobile")

    fireEvent.click(screen.getByRole("button", { name: MENU_BUTTON }))
    const backdrop = screen.getByTestId("sidebar-backdrop")
    fireEvent.click(backdrop)

    expect(screen.getByRole("button", { name: MENU_BUTTON })).toHaveAttribute(
      "aria-expanded",
      "false",
    )
  })

  it("fecha a gaveta ao pressionar Escape", () => {
    renderLayout("mobile")

    fireEvent.click(screen.getByRole("button", { name: MENU_BUTTON }))
    expect(
      screen.getByRole("button", { name: MENU_BUTTON }),
    ).toHaveAttribute("aria-expanded", "true")

    fireEvent.keyDown(document, { key: "Escape" })

    expect(screen.getByRole("button", { name: MENU_BUTTON })).toHaveAttribute(
      "aria-expanded",
      "false",
    )
  })

  it("esconde a gaveta fechada da navegação por teclado em tela pequena", () => {
    setViewport("mobile")
    render(
      <WorkspaceLayout
        header={<Header title="" userName="Ana" />}
        sidebar={<div data-testid="sidebar-content">blocos</div>}
        canvas={<div>canvas</div>}
        inspector={<div>simulador</div>}
      />,
    )

    // Fechada em tela pequena ela está fora da tela; sem inert o teclado
    // ainda entraria nos blocos invisíveis.
    const sidebar = document.getElementById("workspace-sidebar")
    expect(sidebar).toHaveAttribute("aria-hidden", "true")
  })

  it("não esconde a sidebar em telas grandes", () => {
    renderLayout()

    // No desktop a coluna está sempre visível, então nada pode ficar inerte.
    const sidebar = document.getElementById("workspace-sidebar")
    expect(sidebar).not.toHaveAttribute("aria-hidden")
    expect(sidebar).not.toHaveAttribute("inert")
  })

  it("sai do estado de gaveta ao alargar a janela", () => {
    const viewport = setViewport("mobile")
    render(
      <WorkspaceLayout
        header={<Header title="" userName="Ana" />}
        sidebar={<div data-testid="sidebar-content">blocos</div>}
        canvas={<div>canvas</div>}
        inspector={<div>simulador</div>}
      />,
    )

    fireEvent.click(screen.getByRole("button", { name: MENU_BUTTON }))
    expect(screen.getByRole("button", { name: MENU_BUTTON })).toHaveAttribute(
      "aria-expanded",
      "true",
    )

    // A mudança de viewport chega por um listener de media query, fora do ciclo
    // normal de eventos do React.
    act(() => viewport.resize("desktop"))

    // Alargar a janela precisa devolver a coluna ao lugar, e não deixá-la
    // presa fora da tela com o estado do botão ainda ligado.
    const sidebar = document.getElementById("workspace-sidebar")
    expect(sidebar).toHaveClass("translate-x-0")
    expect(sidebar).not.toHaveAttribute("aria-hidden")
  })
})

describe("botão do menu", () => {
  it("não aparece quando o header está fora do WorkspaceLayout", () => {
    // Sem gaveta para controlar, o botão não teria efeito nenhum.
    render(
      <Header
        title=""
        userName="Ana"
        algorithmName="x"
        onAlgorithmNameChange={() => undefined}
      />,
    )

    expect(
      screen.queryByRole("button", { name: MENU_BUTTON }),
    ).not.toBeInTheDocument()
  })
})

describe("header em telas estreitas", () => {
  it("tira o campo do nome do posicionamento absoluto abaixo de sm", () => {
    renderHeaderWithName()

    const nameWrapper = screen.getByLabelText("Nome do algoritmo")
      .parentElement

    // Com w-64 fixo e centralizado a 50%, o campo cobria a logo e o menu de
    // conta em telas com menos de ~640px.
    expect(nameWrapper).toHaveClass("sm:absolute")
    expect(nameWrapper).not.toHaveClass("absolute")
    // No fluxo flex ele encolhe em vez de transbordar.
    expect(nameWrapper).toHaveClass("flex-1", "min-w-0")
    expect(nameWrapper).not.toHaveClass("w-64")
  })

  it("mantém o campo com largura total apenas nas telas grandes", () => {
    renderHeaderWithName()

    expect(screen.getByLabelText("Nome do algoritmo")).toHaveClass("sm:w-64")
  })

  it("encolhe o nome do usuário antes de quebrar o header", () => {
    renderHeaderWithName()

    // A conta ocupa o mínimo possível para o campo do nome ter espaço.
    expect(screen.getByText("Ana")).toHaveClass("hidden", "sm:inline")
  })
})

function renderHeaderWithName() {
  return render(
    <Header
      title=""
      userName="Ana"
      algorithmName="Contador"
      onAlgorithmNameChange={() => undefined}
    />,
  )
}
/**
 * The real builder renders its header through a wrapper component that pulls
 * the name state from context. The menu button must survive that indirection,
 * otherwise it only exists in tests that mount Header directly.
 */
function WrappedHeader() {
  return (
    <Header title="" userName="Ana" algorithmName="x" onAlgorithmNameChange={() => undefined} />
  )
}

describe("botão do menu com header embrulhado", () => {
  it("aparece e abre a gaveta mesmo através de um componente intermediário", () => {
    setViewport("mobile")
    render(
      <WorkspaceLayout
        header={<WrappedHeader />}
        sidebar={<div data-testid="sidebar-content">blocos</div>}
        canvas={<div>canvas</div>}
        inspector={<div>simulador</div>}
      />,
    )

    const trigger = screen.getByRole("button", { name: MENU_BUTTON })
    expect(trigger).toHaveAttribute("aria-expanded", "false")

    fireEvent.click(trigger)

    expect(trigger).toHaveAttribute("aria-expanded", "true")
    expect(document.getElementById("workspace-sidebar")).toHaveClass(
      "translate-x-0",
    )
  })
})
