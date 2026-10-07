import { describe, it, expect } from "vitest"
import { render, screen, fireEvent, waitFor } from "@testing-library/react"
import { SimulatorProvider } from "../../components/simulator/SimulatorContext"
import { ConstructorProvider } from "../../components/constructor/ConstructorProvider"
import { AlgorithmsProvider } from "../../components/constructor/AlgorithmsProvider"
import { CanvasActions } from "../../components/constructor/CanvasActions"

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

function renderActions() {
  return render(
    <SimulatorProvider>
      <AlgorithmsProvider>
        <ConstructorProvider>
          <CanvasActions />
        </ConstructorProvider>
      </AlgorithmsProvider>
    </SimulatorProvider>,
  )
}

describe("CanvasActions — salvar algoritmo", () => {
  it("exige um nome antes de salvar", async () => {
    const fetchMock = mockFetch(jsonResponse([]))

    renderActions()
    await waitFor(() => expect(fetchMock).toHaveBeenCalled())

    fireEvent.click(screen.getByRole("button", { name: /salvar/i }))

    // Only the initial GET happened; no POST was issued.
    expect(fetchMock).toHaveBeenCalledTimes(1)
    expect(screen.getByText(/informe um nome/i)).toBeInTheDocument()
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

    renderActions()
    await waitFor(() => expect(fetchMock).toHaveBeenCalled())

    fireEvent.change(screen.getByLabelText(/nome do algoritmo/i), {
      target: { value: "Meu algoritmo" },
    })
    fireEvent.click(screen.getByRole("button", { name: /salvar/i }))

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

  it("confirma o salvamento e limpa o campo", async () => {
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

    renderActions()
    await waitFor(() => expect(screen.getByLabelText(/nome do algoritmo/i)).toBeInTheDocument())

    fireEvent.change(screen.getByLabelText(/nome do algoritmo/i), {
      target: { value: "Meu algoritmo" },
    })
    fireEvent.click(screen.getByRole("button", { name: /salvar/i }))

    await waitFor(() =>
      expect(screen.getByText(/salvo\./i)).toBeInTheDocument(),
    )
    expect(screen.getByLabelText(/nome do algoritmo/i)).toHaveValue("")
  })

  it("mostra o erro devolvido pela API", async () => {
    mockFetch(
      jsonResponse([]),
      jsonResponse({ errors: [ "Nome não pode ficar em branco" ] }, 422),
    )

    renderActions()
    await waitFor(() => expect(screen.getByLabelText(/nome do algoritmo/i)).toBeInTheDocument())

    fireEvent.change(screen.getByLabelText(/nome do algoritmo/i), {
      target: { value: "x" },
    })
    fireEvent.click(screen.getByRole("button", { name: /salvar/i }))

    await waitFor(() =>
      expect(screen.getByText(/nome não pode ficar em branco/i)).toBeInTheDocument(),
    )
  })
})