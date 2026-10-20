import { describe, it, expect } from "vitest"
import { render, screen, fireEvent, within } from "@testing-library/react"
import BuilderPage from "../../BuilderPage"

/*
 * The escolha/caso block draws each case as an exit hanging from the diamond,
 * with its value written once. Editing and removing a case, and adding one,
 * only show up when asked for: hovering a value, or tapping it on a phone,
 * and hovering or selecting the block for the "+".
 */

// React Flow keeps a node invisible until it has measured it, which jsdom
// never does; an invisible element gets no accessible name, so the controls
// are found by their aria-label instead of by role and name.
function placeSelection(container: HTMLElement): HTMLElement {
  fireEvent.click(screen.getByTestId("block-tile-selection"))
  const pane = container.querySelector(".react-flow__pane") as Element
  fireEvent.click(pane, { clientX: 300, clientY: 200 })
  return container.querySelector(".react-flow__node-selection") as HTMLElement
}

describe("bloco Escolha", () => {
  it("mostra cada caso só como o valor na saída, sem campo de edição", () => {
    const { container } = render(<BuilderPage />)
    const node = placeSelection(container)

    expect(within(node).getByLabelText("Caso 1: 1")).toBeInTheDocument()
    expect(within(node).getByLabelText("Caso 2: 2")).toBeInTheDocument()
    expect(within(node).queryByLabelText(/valor do caso/i)).toBeNull()
    expect(within(node).queryByTitle("Remover caso")).toBeNull()
  })

  it("abre a caixinha de editar e remover ao passar o mouse no valor", () => {
    const { container } = render(<BuilderPage />)
    const node = placeSelection(container)

    fireEvent.mouseEnter(within(node).getByTestId("case-0"))

    expect(within(node).getByLabelText("Valor do caso 1")).toHaveValue("1")
    expect(within(node).getByTitle("Remover caso")).toBeInTheDocument()

    fireEvent.mouseLeave(within(node).getByTestId("case-0"))
    expect(within(node).queryByLabelText(/valor do caso/i)).toBeNull()
  })

  // A phone has no hover: a tap on the value opens the same box.
  it("abre a caixinha com um toque no valor", () => {
    const { container } = render(<BuilderPage />)
    const node = placeSelection(container)

    fireEvent.click(within(node).getByLabelText("Caso 2: 2"))

    expect(within(node).getByLabelText("Valor do caso 2")).toBeInTheDocument()
  })

  it("edita e remove um caso pela caixinha", () => {
    const { container } = render(<BuilderPage />)
    const node = placeSelection(container)

    fireEvent.click(within(node).getByLabelText("Caso 1: 1"))
    fireEvent.change(within(node).getByLabelText("Valor do caso 1"), { target: { value: "7" } })
    expect(within(node).getByLabelText("Caso 1: 7")).toBeInTheDocument()

    fireEvent.click(within(node).getByTitle("Remover caso"))
    expect(within(node).queryByLabelText(/^Caso 1: 7$/)).toBeNull()
    expect(within(node).getByLabelText("Caso 1: 2")).toBeInTheDocument()
  })

  it("só mostra o + com o mouse sobre o bloco", () => {
    const { container } = render(<BuilderPage />)
    const node = placeSelection(container)

    expect(within(node).queryByTitle("Adicionar caso")).toBeNull()

    fireEvent.mouseEnter(within(node).getByTestId("selection-block"))
    fireEvent.click(within(node).getByTitle("Adicionar caso"))

    expect(within(node).getByLabelText("Caso 3: 3")).toBeInTheDocument()
  })
})
