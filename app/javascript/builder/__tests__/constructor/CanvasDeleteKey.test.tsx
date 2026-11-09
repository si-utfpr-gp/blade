import { describe, it, expect, vi, afterEach } from "vitest"
import { render, screen, fireEvent, waitFor } from "@testing-library/react"
import { ReactFlowProvider } from "@xyflow/react"
import { BuilderProviders } from "../test-utils"
import { useConstructor } from "../../components/constructor/ConstructorProvider"
import { useAlgorithmNameField } from "../../components/constructor/AlgorithmNameProvider"
import ConstructorCanvas from "../../components/constructor/ConstructorCanvas"

function Probe() {
  const { nodes, addNode, selectedNodeId } = useConstructor()
  const { algorithmName, onAlgorithmNameChange } = useAlgorithmNameField()
  return (
    <div>
      <span data-testid="count">{nodes.length}</span>
      <span data-testid="selected">{selectedNodeId ?? "nenhum"}</span>
      <input
        aria-label="Nome do algoritmo"
        value={algorithmName}
        onChange={(event) => onAlgorithmNameChange(event.target.value)}
      />
      <button type="button" onClick={() => addNode("process", { x: 0, y: 0 })}>
        add
      </button>
    </div>
  )
}

function renderCanvas() {
  vi.stubGlobal(
    "fetch",
    vi.fn().mockResolvedValue({ ok: true, status: 200, json: async () => [] }),
  )
  return render(
    <ReactFlowProvider>
      <BuilderProviders>
        <Probe />
        <div style={{ width: 800, height: 600 }}>
          <ConstructorCanvas />
        </div>
      </BuilderProviders>
    </ReactFlowProvider>,
  )
}

function flowNodes(container: HTMLElement) {
  return container.querySelectorAll(".react-flow__node")
}

describe("DEL apaga o bloco selecionado", () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it("remove o bloco ao pressionar Delete", async () => {
    const { container } = renderCanvas()
    fireEvent.click(screen.getByRole("button", { name: "add" }))
    await waitFor(() => expect(flowNodes(container)).toHaveLength(1))

    fireEvent.click(flowNodes(container)[0])
    expect(screen.getByTestId("selected").textContent).not.toBe("nenhum")

    fireEvent.keyDown(document, { key: "Delete", code: "Delete" })

    await waitFor(() => expect(flowNodes(container)).toHaveLength(0))
    expect(screen.getByTestId("count").textContent).toBe("0")
  })

  it("remove o bloco ao pressionar Backspace", async () => {
    const { container } = renderCanvas()
    fireEvent.click(screen.getByRole("button", { name: "add" }))
    await waitFor(() => expect(flowNodes(container)).toHaveLength(1))

    fireEvent.click(flowNodes(container)[0])
    fireEvent.keyDown(document, { key: "Backspace", code: "Backspace" })

    await waitFor(() => expect(flowNodes(container)).toHaveLength(0))
  })

  it("solta a seleção junto com o bloco", async () => {
    const { container } = renderCanvas()
    fireEvent.click(screen.getByRole("button", { name: "add" }))
    await waitFor(() => expect(flowNodes(container)).toHaveLength(1))

    fireEvent.click(flowNodes(container)[0])
    fireEvent.keyDown(document, { key: "Delete", code: "Delete" })

    await waitFor(() =>
      expect(screen.getByTestId("selected").textContent).toBe("nenhum"),
    )
  })

  it("conta como alteração, então dá para desfazer", async () => {
    const { container } = renderCanvas()
    fireEvent.click(screen.getByRole("button", { name: "add" }))
    await waitFor(() => expect(flowNodes(container)).toHaveLength(1))

    fireEvent.click(flowNodes(container)[0])
    fireEvent.keyDown(document, { key: "Delete", code: "Delete" })
    await waitFor(() => expect(flowNodes(container)).toHaveLength(0))

    fireEvent.click(screen.getByRole("button", { name: /desfazer/i }))

    await waitFor(() => expect(flowNodes(container)).toHaveLength(1))
  })

  it("não apaga nada enquanto o foco está no nome do algoritmo", async () => {
    const { container } = renderCanvas()
    fireEvent.click(screen.getByRole("button", { name: "add" }))
    await waitFor(() => expect(flowNodes(container)).toHaveLength(1))

    fireEvent.click(flowNodes(container)[0])
    const field = screen.getByLabelText("Nome do algoritmo")
    fireEvent.change(field, { target: { value: "Contador" } })
    field.focus()
    fireEvent.keyDown(field, { key: "Backspace", code: "Backspace" })

    // jsdom does not perform the native text deletion, but that is the
    // browser's job. What matters here is that the keystroke never reaches
    // the canvas: the block stays exactly where it was.
    expect(field).toHaveValue("Contador")
    expect(flowNodes(container)).toHaveLength(1)
  })
})
