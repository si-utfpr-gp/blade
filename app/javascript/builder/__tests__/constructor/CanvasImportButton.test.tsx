import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"
import { render, screen, fireEvent, waitFor } from "@testing-library/react"
import { SimulatorProvider } from "../../components/simulator/SimulatorContext"
import { ToastProvider } from "../../components/ui/Toast"
import {
  ConstructorProvider,
  useConstructor,
} from "../../components/constructor/ConstructorProvider"
import {
  AlgorithmNameProvider,
  useAlgorithmNameField,
} from "../../components/constructor/AlgorithmNameProvider"
import { DiagramOriginProvider, useDiagramOrigin } from "../../components/constructor/DiagramOrigin"
import { CanvasImportButton } from "../../components/constructor/CanvasImportButton"

const exported = {
  nodes: [
    {
      id: "i1",
      type: "startEnd",
      position: { x: 30, y: 40 },
      data: { label: "Início", variant: "start" },
    },
    {
      id: "i2",
      type: "process",
      position: { x: 30, y: 200 },
      data: { label: "x = 1" },
    },
  ],
  edges: [{ id: "e1", source: "i1", target: "i2" }],
}

function Probe() {
  const { nodes, addNode } = useConstructor()
  const { algorithmName } = useAlgorithmNameField()
  return (
    <div>
      <span data-testid="count">{nodes.length}</span>
      <span data-testid="labels">{nodes.map((n) => String(n.data.label)).join("|")}</span>
      <span data-testid="name">{algorithmName}</span>
      <button type="button" onClick={() => addNode("process", { x: 0, y: 0 })}>
        sujar
      </button>
    </div>
  )
}

function renderImport() {
  return render(
    <SimulatorProvider>
      <ToastProvider>
        <DiagramOriginProvider>
          <AlgorithmNameProvider>
            <ConstructorProvider>
              <Probe />
              <CanvasImportButton />
            </ConstructorProvider>
          </AlgorithmNameProvider>
        </DiagramOriginProvider>
      </ToastProvider>
    </SimulatorProvider>,
  )
}

function jsonFile(contents: string, name = "algoritmo.json") {
  return new File([contents], name, { type: "application/json" })
}

function pickFile(container: HTMLElement, file: File) {
  const input = container.querySelector(
    'input[data-testid="import-file-input"]',
  ) as HTMLInputElement
  fireEvent.change(input, { target: { files: [file] } })
  return input
}

describe("CanvasImportButton", () => {
  beforeEach(() => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({ ok: true, status: 200, json: async () => [] }),
    )
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it("oferece a importação na tela", () => {
    renderImport()

    expect(
      screen.getByRole("button", { name: /importar json/i }),
    ).toBeInTheDocument()
  })

  it("carrega o arquivo com as posições preservadas", async () => {
    const { container } = renderImport()
    pickFile(container, jsonFile(JSON.stringify(exported)))

    await waitFor(() =>
      expect(screen.getByTestId("count").textContent).toBe("2"),
    )
    expect(screen.getByTestId("labels").textContent).toBe("Início|x = 1")
  })

  it("avisa quando o arquivo é concluído", async () => {
    const { container } = renderImport()
    pickFile(container, jsonFile(JSON.stringify(exported)))

    expect(
      await screen.findByText(/algoritmo importado/i),
    ).toBeInTheDocument()
  })

  it("avisa e não toca no canvas quando o arquivo não é JSON", async () => {
    const { container } = renderImport()
    fireEvent.click(screen.getByRole("button", { name: "sujar" }))
    pickFile(container, jsonFile("isto não é json"))

    expect(
      await screen.findByText(/não parece um algoritmo/i),
    ).toBeInTheDocument()
    expect(screen.getByTestId("count").textContent).toBe("1")
  })

  it("avisa e não toca no canvas quando não há bloco aproveitável", async () => {
    const { container } = renderImport()
    pickFile(
      container,
      jsonFile(JSON.stringify({ nodes: [{ id: "x", type: "nada" }], edges: [] })),
    )

    expect(
      await screen.findByText(/não parece um algoritmo/i),
    ).toBeInTheDocument()
    expect(screen.getByTestId("count").textContent).toBe("0")
  })

  it("não pergunta quando o canvas está limpo", async () => {
    const { container } = renderImport()

    fireEvent.click(screen.getByRole("button", { name: /importar json/i }))
    pickFile(container, jsonFile(JSON.stringify(exported)))

    await waitFor(() =>
      expect(screen.getByTestId("count").textContent).toBe("2"),
    )
    expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument()
  })

  it("pergunta antes de substituir um diagrama alterado", () => {
    renderImport()
    fireEvent.click(screen.getByRole("button", { name: "sujar" }))

    fireEvent.click(screen.getByRole("button", { name: /importar json/i }))

    expect(screen.getByRole("alertdialog")).toBeInTheDocument()
    expect(screen.getByTestId("count").textContent).toBe("1")
  })

  it("mantém tudo quando o aluno cancela", () => {
    renderImport()
    fireEvent.click(screen.getByRole("button", { name: "sujar" }))
    fireEvent.click(screen.getByRole("button", { name: /importar json/i }))

    fireEvent.click(screen.getByRole("button", { name: /cancelar/i }))

    expect(screen.getByTestId("count").textContent).toBe("1")
  })

  it("abre o seletor quando o aluno confirma, e só então substitui", async () => {
    const { container } = renderImport()
    fireEvent.click(screen.getByRole("button", { name: "sujar" }))
    fireEvent.click(screen.getByRole("button", { name: /importar json/i }))

    const input = container.querySelector(
      'input[data-testid="import-file-input"]',
    ) as HTMLInputElement
    const clickSpy = vi.spyOn(input, "click").mockImplementation(() => {})
    fireEvent.click(screen.getByRole("button", { name: /descartar/i }))

    expect(clickSpy).toHaveBeenCalled()
    clickSpy.mockRestore()
    pickFile(container, jsonFile(JSON.stringify(exported)))

    await waitFor(() =>
      expect(screen.getByTestId("count").textContent).toBe("2"),
    )
  })

  it("não mistura o nome atual com o conteúdo importado", async () => {
    const { container } = renderImport()
    // The name field keeps whatever the student typed: the file carries no
    // name, and silently renaming would point the next save at the wrong
    // algorithm.
    pickFile(container, jsonFile(JSON.stringify(exported)))

    await waitFor(() =>
      expect(screen.getByTestId("count").textContent).toBe("2"),
    )
    expect(screen.getByTestId("name").textContent).toBe("")
  })

  it("marca a origem como nova, para o salvamento criar em vez de atualizar", async () => {
    const { container } = render(
      <SimulatorProvider>
        <ToastProvider>
          <DiagramOriginProvider>
            <AlgorithmNameProvider>
              <ConstructorProvider>
                <OriginProbe />
                <CanvasImportButton />
              </ConstructorProvider>
            </AlgorithmNameProvider>
          </DiagramOriginProvider>
        </ToastProvider>
      </SimulatorProvider>,
    )
    pickFile(container, jsonFile(JSON.stringify(exported)))

    await waitFor(() =>
      expect(screen.getByTestId("origin-kind").textContent).toBe("blank"),
    )
  })
})

function OriginProbe() {
  const { origin } = useDiagramOrigin()
  return <span data-testid="origin-kind">{origin.kind}</span>
}
