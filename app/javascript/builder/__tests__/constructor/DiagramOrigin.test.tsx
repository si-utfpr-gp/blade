import { describe, it, expect, vi, beforeEach } from "vitest"
import { render, screen, fireEvent, waitFor } from "@testing-library/react"
import { SimulatorProvider } from "../../components/simulator/SimulatorContext"
import { ConstructorProvider } from "../../components/constructor/ConstructorProvider"
import { AlgorithmsProvider } from "../../components/constructor/AlgorithmsProvider"
import {
  AlgorithmNameProvider,
  useAlgorithmNameField,
} from "../../components/constructor/AlgorithmNameProvider"
import { DiagramOriginProvider } from "../../components/constructor/DiagramOrigin"
import { CanvasSaveButton } from "../../components/constructor/CanvasSaveButton"
import { ExamplesSection } from "../../components/constructor/ExamplesSection"
import { CanvasActions } from "../../components/constructor/CanvasActions"

function jsonResponse(body: unknown, status = 200) {
  return { ok: status >= 200 && status < 300, status, json: async () => body }
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

function HeaderNameInput() {
  const { algorithmName, onAlgorithmNameChange, isNameLocked } =
    useAlgorithmNameField()
  return (
    <input
      aria-label="Nome do algoritmo"
      value={algorithmName}
      disabled={isNameLocked}
      onChange={(event) => onAlgorithmNameChange(event.target.value)}
    />
  )
}

function renderBuilder() {
  return render(
    <SimulatorProvider>
      <ToastProvider>
      <AlgorithmsProvider>
        <DiagramOriginProvider>
          <AlgorithmNameProvider>
            <ConstructorProvider>
            <HeaderNameInput />
            <ExamplesSection />
            <CanvasSaveButton />
            <CanvasActions />
            <CanvasLockProbe />
            </ConstructorProvider>
          </AlgorithmNameProvider>
        </DiagramOriginProvider>
      </AlgorithmsProvider>
      </ToastProvider>
    </SimulatorProvider>,
  )
}

// Surfaces the read-only flag the canvas consults, without mounting ReactFlow.
function CanvasLockProbe() {
  const { isReadOnly } = useCanvasLock()
  return (
    <span data-testid="canvas-lock">
      {isReadOnly ? "locked" : "editable"}
    </span>
  )
}

import { ToastProvider } from "../../components/ui/Toast"
import { useCanvasLock } from "../../components/constructor/CanvasLock"

async function pickExample(name: RegExp | string) {
  fireEvent.click(
    screen.getByRole("button", { name: /^Exemplos: nenhum selecionado/i }),
  )
  fireEvent.click(screen.getByRole("button", { name }))
}

async function pickSaved(name: RegExp | string) {
  fireEvent.click(
    screen.getByRole("button", {
      name: /^Meus algoritmos: nenhum selecionado/i,
    }),
  )
  fireEvent.click(screen.getByRole("button", { name }))
}

describe("diagrama de exemplo é somente leitura", () => {
  beforeEach(() => {
    mockFetch(jsonResponse([]))
  })

  it("trava o canvas e o nome ao carregar um exemplo", async () => {
    renderBuilder()
    await waitFor(() =>
      expect(
        screen.getByRole("button", {
          name: /^Exemplos: nenhum selecionado/i,
        }),
      ).toBeInTheDocument(),
    )

    expect(screen.getByTestId("canvas-lock")).toHaveTextContent("editable")

    await pickExample(/Par ou Ímpar/i)

    await waitFor(() =>
      expect(screen.getByTestId("canvas-lock")).toHaveTextContent("locked"),
    )
    expect(screen.getByLabelText(/nome do algoritmo/i)).toBeDisabled()
  })

  it("não permite salvar o exemplo", async () => {
    renderBuilder()
    await waitFor(() =>
      expect(
        screen.getByRole("button", {
          name: /^Exemplos: nenhum selecionado/i,
        }),
      ).toBeInTheDocument(),
    )

    await pickExample(/Par ou Ímpar/i)

    const button = await screen.findByRole("button", {
      name: /exemplo não pode ser salvo/i,
    })
    expect(button).toBeDisabled()
  })

  it("destrava ao limpar a tela", async () => {
    renderBuilder()
    await waitFor(() =>
      expect(
        screen.getByRole("button", {
          name: /^Exemplos: nenhum selecionado/i,
        }),
      ).toBeInTheDocument(),
    )

    await pickExample(/Par ou Ímpar/i)
    await waitFor(() =>
      expect(screen.getByTestId("canvas-lock")).toHaveTextContent("locked"),
    )

    fireEvent.click(screen.getByRole("button", { name: /limpar/i }))

    await waitFor(() =>
      expect(screen.getByTestId("canvas-lock")).toHaveTextContent("editable"),
    )
  })

  it("algoritmo salvo não é somente leitura e o nome é editável", async () => {
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

    renderBuilder()
    await waitFor(() =>
      expect(
        screen.getByRole("button", {
          name: /^Meus algoritmos: nenhum selecionado/i,
        }),
      ).toBeInTheDocument(),
    )

    await pickSaved(/Meu algoritmo salvo/i)

    await waitFor(() =>
      expect(screen.getByLabelText(/nome do algoritmo/i)).toHaveValue(
        "Meu algoritmo salvo",
      ),
    )
    expect(screen.getByTestId("canvas-lock")).toHaveTextContent("editable")
    expect(screen.getByLabelText(/nome do algoritmo/i)).toBeEnabled()
  })
})

describe("salvar atualiza o algoritmo selecionado", () => {
  it("envia PATCH quando há algoritmo salvo selecionado", async () => {
    const savedDiagram = {
      nodes: [
        {
          id: "s1",
          type: "startEnd",
          position: { x: 10, y: 20 },
          data: { label: "Início", variant: "start" },
        },
      ],
      edges: [],
    }

    const fetchMock = mockFetch(
      jsonResponse([
        {
          id: 7,
          name: "Meu algoritmo salvo",
          diagram: savedDiagram,
          created_at: "2026-10-07",
        },
      ]),
      jsonResponse({
        id: 7,
        name: "Meu algoritmo salvo",
        diagram: savedDiagram,
        created_at: "2026-10-07",
      }),
      jsonResponse({
        id: 7,
        name: "Meu algoritmo salvo",
        diagram: savedDiagram,
        created_at: "2026-10-07",
      }),
    )

    renderBuilder()
    await waitFor(() =>
      expect(
        screen.getByRole("button", {
          name: /^Meus algoritmos: nenhum selecionado/i,
        }),
      ).toBeInTheDocument(),
    )

    await pickSaved(/Meu algoritmo salvo/i)
    await waitFor(() =>
      expect(screen.getByLabelText(/nome do algoritmo/i)).toHaveValue(
        "Meu algoritmo salvo",
      ),
    )

    fireEvent.change(screen.getByLabelText(/nome do algoritmo/i), {
      target: { value: "Meu algoritmo salvo" },
    })
    fireEvent.click(screen.getByRole("button", { name: /atualizar algoritmo/i }))

    await waitFor(() =>
      expect(
        fetchMock.mock.calls.some(([, init]) => init?.method === "PATCH"),
      ).toBe(true),
    )

    const patchCall = fetchMock.mock.calls.find(
      ([, init]) => init?.method === "PATCH",
    )
    expect(String(patchCall?.[0])).toBe("/algorithms/7")
    expect(fetchMock.mock.calls.some(([, init]) => init?.method === "POST")).toBe(
      false,
    )
  })
})
describe("salvar duas vezes não duplica", () => {
  it("cria no primeiro clique e atualiza no segundo", async () => {
    const savedDiagram = {
      nodes: [
        {
          id: "s1",
          type: "startEnd",
          position: { x: 10, y: 20 },
          data: { label: "Início", variant: "start" },
        },
      ],
      edges: [],
    }
    const fetchMock = mockFetch(
      jsonResponse([]),
      jsonResponse({
        id: 9,
        name: "Contador",
        diagram: savedDiagram,
        created_at: "2026-10-07",
      }),
      jsonResponse({
        id: 9,
        name: "Contador",
        diagram: savedDiagram,
        created_at: "2026-10-07",
      }),
    )

    renderBuilder()
    await waitFor(() =>
      expect(
        screen.getByRole("button", {
          name: /^Exemplos: nenhum selecionado/i,
        }),
      ).toBeInTheDocument(),
    )

    fireEvent.change(screen.getByLabelText(/nome do algoritmo/i), {
      target: { value: "Contador" },
    })

    fireEvent.click(screen.getByRole("button", { name: /salvar algoritmo/i }))
    await waitFor(() =>
      expect(
        fetchMock.mock.calls.some(([, init]) => init?.method === "POST"),
      ).toBe(true),
    )

    // After the first save the algorithm is known, so the button updates it.
    const updateButton = await screen.findByRole("button", {
      name: /atualizar algoritmo/i,
    })
    expect(screen.getByLabelText(/nome do algoritmo/i)).toHaveValue("Contador")

    fireEvent.click(updateButton)
    await waitFor(() =>
      expect(
        fetchMock.mock.calls.some(([, init]) => init?.method === "PATCH"),
      ).toBe(true),
    )

    // Still exactly one POST: the second click never created a new record.
    expect(
      fetchMock.mock.calls.filter(([, init]) => init?.method === "POST"),
    ).toHaveLength(1)
  })
})

describe("aviso ao salvar", () => {
  it("confirma o salvamento, a atualização e a recusa", async () => {
    const savedDiagram = {
      nodes: [
        {
          id: "s1",
          type: "startEnd",
          position: { x: 10, y: 20 },
          data: { label: "Início", variant: "start" },
        },
      ],
      edges: [],
    }

    // 1. creating an algorithm
    const createFetch = mockFetch(
      jsonResponse([]),
      jsonResponse({
        id: 9,
        name: "Contador",
        diagram: savedDiagram,
        created_at: "2026-10-07",
      }),
    )
    renderBuilder()
    await waitFor(() => expect(createFetch).toHaveBeenCalled())

    fireEvent.change(screen.getByLabelText(/nome do algoritmo/i), {
      target: { value: "Contador" },
    })
    fireEvent.click(screen.getByRole("button", { name: /salvar algoritmo/i }))
    expect(
      await screen.findByText(/algoritmo "contador" salvo/i),
    ).toBeInTheDocument()
  })

  it("confirma a atualização de um algoritmo já salvo", async () => {
    const savedDiagram = { nodes: [], edges: [] }
    const fetchMock = mockFetch(
      jsonResponse([
        {
          id: 7,
          name: "Meu algoritmo salvo",
          diagram: savedDiagram,
          created_at: "2026-10-07",
        },
      ]),
      jsonResponse({
        id: 7,
        name: "Meu algoritmo salvo",
        diagram: savedDiagram,
        created_at: "2026-10-07",
      }),
      jsonResponse({
        id: 7,
        name: "Meu algoritmo salvo",
        diagram: savedDiagram,
        created_at: "2026-10-07",
      }),
    )

    renderBuilder()
    await waitFor(() =>
      expect(
        screen.getByRole("button", {
          name: /^Meus algoritmos: nenhum selecionado/i,
        }),
      ).toBeInTheDocument(),
    )

    await pickSaved(/Meu algoritmo salvo/i)
    await waitFor(() =>
      expect(screen.getByLabelText(/nome do algoritmo/i)).toHaveValue(
        "Meu algoritmo salvo",
      ),
    )

    fireEvent.click(screen.getByRole("button", { name: /atualizar algoritmo/i }))
    // The notice is only raised once the PATCH resolves, so waiting for it
    // also proves the request completed rather than merely being fired.
    expect(
      await screen.findByText(/algoritmo "meu algoritmo salvo" atualizado/i),
    ).toBeInTheDocument()
    expect(
      fetchMock.mock.calls.filter(([, init]) => init?.method === "PATCH"),
    ).toHaveLength(1)
  })

  it("avisa quando a API recusa o salvamento", async () => {
    mockFetch(
      jsonResponse([]),
      jsonResponse({ errors: ["Nome não pode ficar em branco"] }, 422),
    )

    renderBuilder()
    await waitFor(() =>
      expect(
        screen.getByRole("button", { name: /salvar algoritmo/i }),
      ).toBeInTheDocument(),
    )

    fireEvent.change(screen.getByLabelText(/nome do algoritmo/i), {
      target: { value: "x" },
    })
    fireEvent.click(screen.getByRole("button", { name: /salvar algoritmo/i }))

    // The API message is surfaced instead of a generic failure, so the student
    // knows what to change.
    const toast = await screen.findByRole("status")
    expect(toast).toHaveTextContent(/nome não pode ficar em branco/i)
  })
})
