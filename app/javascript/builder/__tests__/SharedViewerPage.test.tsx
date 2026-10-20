import { describe, it, expect } from "vitest"
import { render, screen, fireEvent } from "@testing-library/react"
import { ReactFlowProvider } from "@xyflow/react"
import SharedViewerPage from "../SharedViewerPage"

/*
 * The page behind a public link (/s/:token) and its embeddable version
 * (/embed/:token): the diagram, read only, with the debugger to run it. No
 * blocks to add, nothing to save.
 */

const diagram = JSON.stringify({
  nodes: [
    { id: "n1", type: "startEnd", position: { x: 0, y: 0 }, data: { label: "Início", variant: "start" } },
    { id: "n2", type: "output", position: { x: 0, y: 100 }, data: { label: "'Olá'" } },
    { id: "n3", type: "startEnd", position: { x: 0, y: 200 }, data: { label: "Fim", variant: "end" } },
  ],
  edges: [
    { id: "e1", source: "n1", target: "n2" },
    { id: "e2", source: "n2", target: "n3" },
  ],
})

function renderViewer(mode: "shared" | "embed", diagramJson = diagram) {
  return render(
    <ReactFlowProvider>
      <SharedViewerPage mode={mode} name="Olá mundo" diagramJson={diagramJson} />
    </ReactFlowProvider>,
  )
}

describe("SharedViewerPage", () => {
  it("abre o diagrama compartilhado no canvas", () => {
    const { container } = renderViewer("shared")

    expect(container.querySelectorAll(".react-flow__node")).toHaveLength(3)
  })

  it("não oferece blocos, salvar, exportar nem desfazer", () => {
    renderViewer("shared")

    expect(screen.queryByTestId("blocks-grid")).toBeNull()
    expect(screen.queryByLabelText(/salvar algoritmo/i)).toBeNull()
    expect(screen.queryByLabelText(/exportar algoritmo/i)).toBeNull()
    expect(screen.queryByLabelText(/desfazer/i)).toBeNull()
  })

  it("executa o diagrama com o depurador", () => {
    renderViewer("shared")
    fireEvent.click(screen.getByRole("button", { name: /executar/i }))
    fireEvent.click(screen.getByRole("button", { name: /próximo passo/i }))
    fireEvent.click(screen.getByRole("button", { name: /próximo passo/i }))

    expect(screen.getAllByText("Olá").length).toBeGreaterThan(0)
  })

  it("na página própria, mostra o nome e convida a criar no Blade", () => {
    renderViewer("shared")

    expect(screen.getByRole("heading", { name: "Olá mundo" })).toBeInTheDocument()
    expect(screen.getByRole("link", { name: /criar no blade/i })).toHaveAttribute("href", "/builder")
  })

  // Inside someone else's page the viewer stays lean: no header, just a
  // small mark that opens Blade in a new tab.
  it("no embed, troca o cabeçalho por um selo que abre o Blade em outra aba", () => {
    renderViewer("embed")

    expect(screen.queryByRole("heading", { name: "Olá mundo" })).toBeNull()
    const mark = screen.getByRole("link", { name: /feito no blade/i })
    expect(mark).toHaveAttribute("target", "_blank")
    expect(mark).toHaveAttribute("rel", expect.stringContaining("noopener"))
  })

  it("avisa quando o diagrama não pode ser aberto", () => {
    renderViewer("shared", "{ isso não é json")

    expect(screen.getByRole("alert")).toHaveTextContent(/não foi possível abrir/i)
  })
})
