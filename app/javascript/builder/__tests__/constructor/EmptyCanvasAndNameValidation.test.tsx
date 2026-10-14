import { describe, it, expect, vi } from "vitest"
import { render, screen, fireEvent, waitFor } from "@testing-library/react"

import { ConstructorProvider, useConstructor } from "../../components/constructor/ConstructorProvider"
import { AlgorithmsProvider } from "../../components/constructor/AlgorithmsProvider"
import { AlgorithmNameProvider } from "../../components/constructor/AlgorithmNameProvider"
import { DiagramOriginProvider } from "../../components/constructor/DiagramOrigin"
import { BlockPlacementProvider } from "../../components/constructor/BlockPlacement"
import { SimulatorProvider } from "../../components/simulator/SimulatorContext"
import { ToastProvider } from "../../components/ui/Toast"
import { CanvasSaveButton } from "../../components/constructor/CanvasSaveButton"
import { CanvasActions } from "../../components/constructor/CanvasActions"
import { ExamplesSection } from "../../components/constructor/ExamplesSection"
import { BuilderHeader } from "../../components/layout/BuilderHeader"

/**
 * The canvas no longer seeds a start block: an algorithm the student has not
 * named is not saved, and a placeholder node made the first screen look like
 * work already in progress.
 */
function NodeCount() {
  const { nodes } = useConstructor()
  return <span data-testid="node-count">{nodes.length}</span>
}

function jsonResponse(body: unknown, status = 200) {
  return { ok: status >= 200 && status < 300, status, json: async () => body }
}

function renderBuilder({ withFetch = true } = {}) {
  if (withFetch) {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(jsonResponse([])))
  }
  return render(
    <SimulatorProvider>
      <ToastProvider>
        <AlgorithmsProvider signedIn>
          <AlgorithmNameProvider>
            <DiagramOriginProvider>
              <BlockPlacementProvider>
                <ConstructorProvider>
                  <NodeCount />
                  <BuilderHeader />
                  <CanvasSaveButton />
                  <CanvasActions />
                </ConstructorProvider>
              </BlockPlacementProvider>
            </DiagramOriginProvider>
          </AlgorithmNameProvider>
        </AlgorithmsProvider>
      </ToastProvider>
    </SimulatorProvider>,
  )
}

describe("canvas começa vazio", () => {
  it("não semeia nenhum bloco inicial", () => {
    renderBuilder()

    expect(screen.getByTestId("node-count")).toHaveTextContent("0")
  })

  it("Novo Algoritmo também esvazia o canvas", () => {
    renderBuilder()

    fireEvent.click(screen.getByRole("button", { name: /novo algoritmo/i }))

    expect(screen.getByTestId("node-count")).toHaveTextContent("0")
  })
})

describe("nome obrigatório", () => {
  it("o botão de salvar fica disponível mesmo sem nome", () => {
    renderBuilder()

    // Desabilitado o usuário só teria um botão cinza sem explicação; a validação
    // acontece ao clicar, com mensagem.
    expect(
      screen.getByRole("button", { name: /salvar algoritmo/i }),
    ).toBeEnabled()
  })

  it("mostra um erro ao tentar salvar sem nome", async () => {
    renderBuilder()

    fireEvent.click(screen.getByRole("button", { name: /salvar algoritmo/i }))

    expect(
      await screen.findByText(/informe um nome para o algoritmo/i),
    ).toBeInTheDocument()
  })

  it("não chama a API quando o nome está vazio", async () => {
    renderBuilder()
    const fetchMock = vi.mocked(globalThis.fetch)
    await waitFor(() => expect(fetchMock).toHaveBeenCalled())

    fireEvent.click(screen.getByRole("button", { name: /salvar algoritmo/i }))

    // Só a carga inicial; nenhum POST.
    expect(
      fetchMock.mock.calls.filter(([, init]) => init?.method === "POST"),
    ).toHaveLength(0)
  })

  it("destaca o campo do nome", async () => {
    renderBuilder()

    const nameInput = screen.getByLabelText("Nome do algoritmo")
    expect(nameInput).not.toHaveClass("border-destructive")

    fireEvent.click(screen.getByRole("button", { name: /salvar algoritmo/i }))

    await waitFor(() =>
      expect(screen.getByLabelText("Nome do algoritmo")).toHaveClass(
        "border-destructive",
      ),
    )
  })

  it("o destaque some assim que o usuário digita", async () => {
    const user = (await import("@testing-library/user-event")).default.setup()
    renderBuilder()

    fireEvent.click(screen.getByRole("button", { name: /salvar algoritmo/i }))
    await waitFor(() =>
      expect(screen.getByLabelText("Nome do algoritmo")).toHaveClass(
        "border-destructive",
      ),
    )

    await user.type(screen.getByLabelText("Nome do algoritmo"), "Contador")

    expect(screen.getByLabelText("Nome do algoritmo")).not.toHaveClass(
      "border-destructive",
    )
  })

  it("considera o nome em branco mesmo com espaços", async () => {
    renderBuilder()

    fireEvent.change(screen.getByLabelText("Nome do algoritmo"), {
      target: { value: "   " },
    })
    fireEvent.click(screen.getByRole("button", { name: /salvar algoritmo/i }))

    expect(
      await screen.findByText(/informe um nome para o algoritmo/i),
    ).toBeInTheDocument()
  })

  it("salva normalmente assim que houver um nome", async () => {
    const diagram = { nodes: [], edges: [] }
    const fetchMock = vi.fn()
    fetchMock
      .mockResolvedValueOnce(jsonResponse([]))
      .mockResolvedValueOnce(
        jsonResponse({ id: 1, name: "Contador", diagram, created_at: "2026-10-14" }),
      )
    // The stub has to be in place before mount: AlgorithmsProvider fetches the
    // saved list on mount, so swapping it afterwards shifts the queued answers.
    vi.stubGlobal("fetch", fetchMock)
    renderBuilder({ withFetch: false })

    fireEvent.change(screen.getByLabelText("Nome do algoritmo"), {
      target: { value: "Contador" },
    })
    fireEvent.click(screen.getByRole("button", { name: /salvar algoritmo/i }))

    await waitFor(() =>
      expect(
        fetchMock.mock.calls.some(([, init]) => init?.method === "POST"),
      ).toBe(true),
    )
    expect(
      await screen.findByText(/algoritmo "contador" salvo/i),
    ).toBeInTheDocument()
  })
})
/**
 * The API explains a refusal, for instance "já existe um algoritmo com esse
 * nome". Showing a generic "não foi possível salvar" threw that away and left
 * the student with no idea what to change.
 */
describe("mensagem da API na recusa", () => {
  function renderWithApi(responses: unknown[]) {
    const fetchMock = vi.fn()
    for (const response of responses) {
      fetchMock.mockResolvedValueOnce(
        typeof response === "function" ? response() : response,
      )
    }
    vi.stubGlobal("fetch", fetchMock)
    return render(
      <SimulatorProvider>
        <ToastProvider>
          <AlgorithmsProvider signedIn>
            <DiagramOriginProvider>
              <AlgorithmNameProvider>
                <ConstructorProvider>
                  <BuilderHeader />
                  <ExamplesSection />
                  <CanvasSaveButton />
                </ConstructorProvider>
              </AlgorithmNameProvider>
            </DiagramOriginProvider>
          </AlgorithmsProvider>
        </ToastProvider>
      </SimulatorProvider>,
    )
  }

  it("mostra o motivo devolvido pela API ao criar", async () => {
    renderWithApi([
      jsonResponse([]),
      jsonResponse({ errors: ["Nome já existe um algoritmo com esse nome"] }, 422),
    ])

    fireEvent.change(screen.getByLabelText("Nome do algoritmo"), {
      target: { value: "Contador" },
    })
    fireEvent.click(screen.getByRole("button", { name: /salvar algoritmo/i }))

    // Scoped to the toast: a screen reader only element carries the same text
    // and would make this pass without the student ever seeing it.
    const toast = await screen.findByRole("status")
    expect(toast).toHaveTextContent(/já existe um algoritmo com esse nome/i)
  })

  it("mostra o motivo devolvido pela API ao atualizar", async () => {
    const diagram = { nodes: [], edges: [] }
    renderWithApi([
      jsonResponse([
        { id: 7, name: "Meu algoritmo", diagram, created_at: "2026-10-14" },
      ]),
      jsonResponse({ id: 7, name: "Meu algoritmo", diagram, created_at: "2026-10-14" }),
      jsonResponse({ errors: ["Nome já existe um algoritmo com esse nome"] }, 422),
    ])

    fireEvent.click(
      await screen.findByRole("button", {
        name: /^Meus algoritmos: nenhum selecionado/i,
      }),
    )
    fireEvent.click(await screen.findByRole("button", { name: /Meu algoritmo/i }))

    fireEvent.click(
      await screen.findByRole("button", { name: /atualizar algoritmo/i }),
    )

    const toast = await screen.findByRole("status")
    expect(toast).toHaveTextContent(/já existe um algoritmo com esse nome/i)
  })

  it("mostra o motivo genérico quando a API não devolve nada", async () => {
    renderWithApi([jsonResponse([]), { ok: false, status: 500, json: async () => ({}) }])

    fireEvent.change(screen.getByLabelText("Nome do algoritmo"), {
      target: { value: "Contador" },
    })
    fireEvent.click(screen.getByRole("button", { name: /salvar algoritmo/i }))

    // The provider substitutes a message when the body carries none, so the
    // student still sees something instead of silence.
    const toast = await screen.findByRole("status")
    expect(toast).toHaveTextContent(/falha na requisição/i)
  })
})
