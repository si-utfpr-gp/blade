import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"
import { render, screen, fireEvent, waitFor, within } from "@testing-library/react"
import { SimulatorProvider } from "../../components/simulator/SimulatorContext"
import { ToastProvider } from "../../components/ui/Toast"
import { AlgorithmsProvider } from "../../components/constructor/AlgorithmsProvider"
import { LocalAlgorithmsProvider } from "../../components/constructor/LocalAlgorithmsProvider"
import {
  AlgorithmNameProvider,
  useAlgorithmNameField,
} from "../../components/constructor/AlgorithmNameProvider"
import { DiagramOriginProvider } from "../../components/constructor/DiagramOrigin"
import { ConstructorProvider } from "../../components/constructor/ConstructorProvider"
import { ExamplesSection } from "../../components/constructor/ExamplesSection"

const diagram = {
  nodes: [
    {
      id: "n1",
      type: "startEnd",
      position: { x: 10, y: 20 },
      data: { label: "Início", variant: "start" },
    },
  ],
  edges: [],
}

const saved = {
  id: 3,
  name: "Da conta",
  diagram,
  created_at: "2026-10-14",
}

function NameInput() {
  const { algorithmName } = useAlgorithmNameField()
  return <span data-testid="current-name">{algorithmName}</span>
}

function renderSection() {
  return render(
    <SimulatorProvider>
      <ToastProvider>
        <AlgorithmsProvider signedIn>
          <LocalAlgorithmsProvider>
            <DiagramOriginProvider>
              <AlgorithmNameProvider>
                <ConstructorProvider>
                  <NameInput />
                  <ExamplesSection />
                </ConstructorProvider>
              </AlgorithmNameProvider>
            </DiagramOriginProvider>
          </LocalAlgorithmsProvider>
        </AlgorithmsProvider>
      </ToastProvider>
    </SimulatorProvider>,
  )
}

function useMemoryStorage(initial: string | null = null) {
  let value = initial
  vi.stubGlobal("localStorage", {
    getItem: () => value,
    setItem: (_: string, next: string) => {
      value = next
    },
    removeItem: vi.fn(),
  })
}

function jsonResponse(body: unknown, status = 200) {
  return { ok: status >= 200 && status < 300, status, json: async () => body }
}

describe("ExamplesSection — excluir algoritmos", () => {
  let fetchMock: ReturnType<typeof vi.fn>

  beforeEach(() => {
    fetchMock = vi.fn()
    vi.stubGlobal("fetch", fetchMock)
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  describe("da conta", () => {
    beforeEach(() => {
      useMemoryStorage()
      fetchMock.mockResolvedValue(jsonResponse([ saved ]))
    })

    it("oferece a lixeira em cada item", async () => {
      renderSection()
      await waitFor(() => expect(fetchMock).toHaveBeenCalled())
      fireEvent.click(screen.getByRole("button", { name: /meus algoritmos/i }))

      expect(
        screen.getByRole("button", { name: /excluir "da conta"/i }),
      ).toBeInTheDocument()
    })

    it("não oferece a lixeira nos exemplos, que não são do aluno", async () => {
      renderSection()
      await waitFor(() => expect(fetchMock).toHaveBeenCalled())
      fireEvent.click(screen.getByRole("button", { name: /exemplos/i }))

      expect(
        screen.queryByRole("button", { name: /^excluir/i }),
      ).not.toBeInTheDocument()
    })

    it("não apaga sem perguntar", async () => {
      renderSection()
      await waitFor(() => expect(fetchMock).toHaveBeenCalled())
      fireEvent.click(screen.getByRole("button", { name: /meus algoritmos/i }))
      fireEvent.click(screen.getByRole("button", { name: /excluir "da conta"/i }))

      expect(screen.getByRole("alertdialog")).toBeInTheDocument()
      expect(
        fetchMock.mock.calls.filter(([, init]) => init?.method === "DELETE"),
      ).toHaveLength(0)
    })

    it("nomeia o que será perdido", async () => {
      renderSection()
      await waitFor(() => expect(fetchMock).toHaveBeenCalled())
      fireEvent.click(screen.getByRole("button", { name: /meus algoritmos/i }))
      fireEvent.click(screen.getByRole("button", { name: /excluir "da conta"/i }))

      // Scoped to the dialog: the same name is on the list item behind it.
      const dialog = within(screen.getByRole("alertdialog"))
      expect(dialog.getByText(/Da conta/)).toBeInTheDocument()
      expect(dialog.getByText(/não pode ser desfeita/i)).toBeInTheDocument()
    })

    it("apaga quando o aluno confirma", async () => {
      fetchMock.mockResolvedValueOnce(jsonResponse([ saved ]))
      fetchMock.mockResolvedValueOnce({ ok: true, status: 204, json: async () => null })

      renderSection()
      await waitFor(() => expect(fetchMock).toHaveBeenCalled())
      fireEvent.click(screen.getByRole("button", { name: /meus algoritmos/i }))
      fireEvent.click(screen.getByRole("button", { name: /excluir "da conta"/i }))
      fireEvent.click(screen.getByRole("button", { name: /^excluir$/i }))

      await waitFor(() =>
        expect(
          fetchMock.mock.calls.filter(([, init]) => init?.method === "DELETE"),
        ).toHaveLength(1),
      )
      await waitFor(() =>
        expect(
          screen.queryByRole("button", { name: /excluir "da conta"/i }),
        ).not.toBeInTheDocument(),
      )
    })

    it("mantém o item quando o aluno cancela", async () => {
      renderSection()
      await waitFor(() => expect(fetchMock).toHaveBeenCalled())
      fireEvent.click(screen.getByRole("button", { name: /meus algoritmos/i }))
      fireEvent.click(screen.getByRole("button", { name: /excluir "da conta"/i }))
      fireEvent.click(screen.getByRole("button", { name: /cancelar/i }))

      expect(
        screen.getByRole("button", { name: /excluir "da conta"/i }),
      ).toBeInTheDocument()
    })

    it("mantém o item e avisa quando a API recusa", async () => {
      fetchMock.mockResolvedValueOnce(jsonResponse([ saved ]))
      fetchMock.mockResolvedValueOnce(jsonResponse({ errors: [ "Falhou" ] }, 500))

      renderSection()
      await waitFor(() => expect(fetchMock).toHaveBeenCalled())
      fireEvent.click(screen.getByRole("button", { name: /meus algoritmos/i }))
      fireEvent.click(screen.getByRole("button", { name: /excluir "da conta"/i }))
      fireEvent.click(screen.getByRole("button", { name: /^excluir$/i }))

      await waitFor(() =>
        expect(
          screen.getByRole("button", { name: /excluir "da conta"/i }),
        ).toBeInTheDocument(),
      )
    })
  })

  describe("guardados no navegador", () => {
    beforeEach(() => {
      fetchMock.mockResolvedValue(jsonResponse([]))
      useMemoryStorage(
        JSON.stringify([
          { id: "l1", name: "Só aqui", diagram, created_at: "2026-10-14" },
        ]),
      )
    })

    it("oferece a lixeira também nos locais", () => {
      renderSection()
      fireEvent.click(screen.getByRole("button", { name: /meus arquivos/i }))

      expect(
        screen.getByRole("button", { name: /excluir "só aqui"/i }),
      ).toBeInTheDocument()
    })

    it("apaga do navegador sem chamar a API", async () => {
      renderSection()
      fireEvent.click(screen.getByRole("button", { name: /meus arquivos/i }))
      fireEvent.click(screen.getByRole("button", { name: /excluir "só aqui"/i }))
      fireEvent.click(screen.getByRole("button", { name: /^excluir$/i }))

      await waitFor(() =>
        expect(
          screen.queryByRole("button", { name: /excluir "só aqui"/i }),
        ).not.toBeInTheDocument(),
      )
      expect(
        fetchMock.mock.calls.filter(([, init]) => init?.method === "DELETE"),
      ).toHaveLength(0)
    })

    it("não deixa a lixeira abrir o diagrama junto", () => {
      renderSection()
      fireEvent.click(screen.getByRole("button", { name: /meus arquivos/i }))
      fireEvent.click(screen.getByRole("button", { name: /excluir "só aqui"/i }))

      expect(screen.getByTestId("current-name").textContent).toBe("")
    })

    it("avisa que o item continua aqui quando o navegador recusa", async () => {
      renderSection()
      fireEvent.click(screen.getByRole("button", { name: /meus arquivos/i }))
      fireEvent.click(screen.getByRole("button", { name: /excluir "só aqui"/i }))

      vi.stubGlobal("localStorage", {
        getItem: () =>
          JSON.stringify([
            { id: "l1", name: "Só aqui", diagram, created_at: "2026-10-14" },
          ]),
        setItem: () => {
          throw new Error("bloqueado")
        },
        removeItem: vi.fn(),
      })
      fireEvent.click(screen.getByRole("button", { name: /^excluir$/i }))

      expect(
        screen.getByRole("button", { name: /excluir "só aqui"/i }),
      ).toBeInTheDocument()
    })
  })
})