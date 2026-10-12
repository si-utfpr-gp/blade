import { describe, it, expect } from "vitest"
import { render, screen, fireEvent, waitFor } from "@testing-library/react"
import { SimulatorProvider } from "../../components/simulator/SimulatorContext"
import { ConstructorProvider } from "../../components/constructor/ConstructorProvider"
import { AlgorithmsProvider } from "../../components/constructor/AlgorithmsProvider"
import {
  AlgorithmNameProvider,
  useAlgorithmNameField,
} from "../../components/constructor/AlgorithmNameProvider"
import { CanvasSaveButton } from "../../components/constructor/CanvasSaveButton"
import { CanvasActions } from "../../components/constructor/CanvasActions"
import { ExamplesSection } from "../../components/constructor/ExamplesSection"

// Stands in for the header input: same context, so the button under test
// consumes the name exactly as it does in the real layout.
function HeaderNameInput() {
  const { algorithmName, onAlgorithmNameChange } = useAlgorithmNameField()
  return (
    <input
      aria-label="Nome do algoritmo"
      value={algorithmName}
      onChange={(event) => onAlgorithmNameChange(event.target.value)}
    />
  )
}

function jsonResponse(body: unknown, status = 200) {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: async () => body,
  }
}

function mockFetch(...responses: unknown[]) {
  const fn = vi.fn()
  for (const response of responses) {
    fn.mockResolvedValueOnce(
      typeof response === "function" ? response() : response,
    )
  }
  vi.stubGlobal("fetch", fn)
  return fn
}

function renderSave() {
  return render(
    <SimulatorProvider>
      <AlgorithmsProvider>
        <AlgorithmNameProvider>
          <ConstructorProvider>
            <HeaderNameInput />
            <CanvasSaveButton />
          </ConstructorProvider>
        </AlgorithmNameProvider>
      </AlgorithmsProvider>
    </SimulatorProvider>,
  )
}

describe("CanvasSaveButton — salvar algoritmo", () => {
  it("não salva sem nome", async () => {
    const fetchMock = mockFetch(jsonResponse([]))

    renderSave()
    await waitFor(() => expect(fetchMock).toHaveBeenCalled())

    const button = screen.getByRole("button", { name: /salvar algoritmo/i })
    expect(button).toBeDisabled()

    fireEvent.click(button)
    // Only the initial GET happened; no POST was issued.
    expect(fetchMock).toHaveBeenCalledTimes(1)
  })

  it("salva o diagrama atual com o nome informado", async () => {
    const fetchMock = mockFetch(
      jsonResponse([]),
      jsonResponse(
        {
          id: 5,
          name: "Meu algoritmo",
          diagram: { nodes: [], edges: [] },
          created_at: "2026-10-07",
        },
        201,
      ),
    )

    renderSave()
    await waitFor(() => expect(fetchMock).toHaveBeenCalled())

    fireEvent.change(screen.getByLabelText(/nome do algoritmo/i), {
      target: { value: "Meu algoritmo" },
    })
    fireEvent.click(screen.getByRole("button", { name: /salvar algoritmo/i }))

    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(2))

    const [url, options] = fetchMock.mock.calls[1]
    expect(url).toBe("/algorithms")
    expect(options.method).toBe("POST")
    const payload = JSON.parse(options.body)
    expect(payload.name).toBe("Meu algoritmo")
    // The canvas starts with a single start node, serialized with its position.
    expect(payload.diagram.nodes).toHaveLength(1)
    expect(payload.diagram.nodes[0].position).toEqual({ x: 300, y: 80 })
    expect(payload.diagram.edges).toEqual([])
  })

  it("limpa o nome depois de salvar", async () => {
    mockFetch(
      jsonResponse([]),
      jsonResponse(
        {
          id: 5,
          name: "Meu algoritmo",
          diagram: { nodes: [], edges: [] },
          created_at: "2026-10-07",
        },
        201,
      ),
    )

    renderSave()
    await waitFor(() =>
      expect(screen.getByLabelText(/nome do algoritmo/i)).toBeInTheDocument(),
    )

    fireEvent.change(screen.getByLabelText(/nome do algoritmo/i), {
      target: { value: "Meu algoritmo" },
    })
    fireEvent.click(screen.getByRole("button", { name: /salvar algoritmo/i }))

    await waitFor(() =>
      expect(screen.getByLabelText(/nome do algoritmo/i)).toHaveValue(""),
    )
  })

  it("mostra o erro devolvido pela API", async () => {
    mockFetch(
      jsonResponse([]),
      jsonResponse({ errors: ["Nome não pode ficar em branco"] }, 422),
    )

    renderSave()
    await waitFor(() =>
      expect(screen.getByLabelText(/nome do algoritmo/i)).toBeInTheDocument(),
    )

    fireEvent.change(screen.getByLabelText(/nome do algoritmo/i), {
      target: { value: "x" },
    })
    fireEvent.click(screen.getByRole("button", { name: /salvar algoritmo/i }))

    await waitFor(() =>
      expect(
        screen.getByText(/nome não pode ficar em branco/i),
      ).toBeInTheDocument(),
    )
  })
})
describe("CanvasActions — novo algoritmo", () => {
  it("limpa o nome do header junto com a tela", async () => {
    const fetchMock = mockFetch(jsonResponse([]))

    render(
      <SimulatorProvider>
        <AlgorithmsProvider>
          <AlgorithmNameProvider>
            <ConstructorProvider>
              <HeaderNameInput />
              <CanvasActions />
            </ConstructorProvider>
          </AlgorithmNameProvider>
        </AlgorithmsProvider>
      </SimulatorProvider>,
    )
    await waitFor(() => expect(fetchMock).toHaveBeenCalled())

    fireEvent.change(screen.getByLabelText(/nome do algoritmo/i), {
      target: { value: "Meu algoritmo" },
    })
    expect(screen.getByLabelText(/nome do algoritmo/i)).toHaveValue(
      "Meu algoritmo",
    )

    fireEvent.click(screen.getByRole("button", { name: /novo algoritmo/i }))

    await waitFor(() =>
      expect(screen.getByLabelText(/nome do algoritmo/i)).toHaveValue(""),
    )
  })
})

describe("nome do algoritmo acompanha o diagrama carregado", () => {
  it("usa o título do exemplo selecionado", async () => {
    const fetchMock = mockFetch(jsonResponse([]))

    render(
      <SimulatorProvider>
        <AlgorithmsProvider>
          <AlgorithmNameProvider>
            <ConstructorProvider>
              <HeaderNameInput />
              <ExamplesSection />
            </ConstructorProvider>
          </AlgorithmNameProvider>
        </AlgorithmsProvider>
      </SimulatorProvider>,
    )
    await waitFor(() => expect(fetchMock).toHaveBeenCalled())

    fireEvent.click(
      screen.getByRole("button", { name: /^Exemplos: nenhum selecionado/i }),
    )
    fireEvent.click(screen.getByRole("button", { name: /Par ou Ímpar/i }))

    await waitFor(() =>
      expect(screen.getByLabelText(/nome do algoritmo/i)).toHaveValue(
        "Par ou Ímpar",
      ),
    )
  })

  it("usa o nome do algoritmo salvo", async () => {
    mockFetch(
      jsonResponse([
        {
          id: 7,
          name: "Meu algoritmo salvo",
          diagram: { nodes: [], edges: [] },
          created_at: "2026-10-07",
        },
      ]),
      jsonResponse({
        id: 7,
        name: "Meu algoritmo salvo",
        diagram: { nodes: [], edges: [] },
        created_at: "2026-10-07",
      }),
    )

    render(
      <SimulatorProvider>
        <AlgorithmsProvider>
          <AlgorithmNameProvider>
            <ConstructorProvider>
              <HeaderNameInput />
              <ExamplesSection />
            </ConstructorProvider>
          </AlgorithmNameProvider>
        </AlgorithmsProvider>
      </SimulatorProvider>,
    )
    await waitFor(() =>
      expect(
        screen.getByRole("button", {
          name: /^Meus algoritmos: nenhum selecionado/i,
        }),
      ).toBeInTheDocument(),
    )

    fireEvent.click(
      screen.getByRole("button", {
        name: /^Meus algoritmos: nenhum selecionado/i,
      }),
    )
    fireEvent.click(
      screen.getByRole("button", { name: /Meu algoritmo salvo/i }),
    )

    await waitFor(() =>
      expect(screen.getByLabelText(/nome do algoritmo/i)).toHaveValue(
        "Meu algoritmo salvo",
      ),
    )
  })
})
