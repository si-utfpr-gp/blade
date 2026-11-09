import { describe, it, expect, vi, afterEach } from "vitest"
import { render, screen, fireEvent, waitFor } from "@testing-library/react"
import { ToastProvider } from "../../components/ui/Toast"
import {
  LocalAlgorithmsProvider,
  useLocalAlgorithms,
} from "../../components/constructor/LocalAlgorithmsProvider"
import { LOCAL_ALGORITHMS_KEY } from "../../components/constructor/localAlgorithms"

const diagram = {
  nodes: [
    {
      id: "n1",
      type: "process",
      position: { x: 1, y: 2 },
      data: { label: "x = 1" },
    },
  ],
  edges: [],
}

function Probe() {
  const { algorithms, saveDiagram, deleteAlgorithm, getAlgorithm, renameAlgorithm, updateAlgorithm } =
    useLocalAlgorithms()
  return (
    <div>
      <span data-testid="count">{algorithms.length}</span>
      <span data-testid="names">{algorithms.map((a) => a.name).join(",")}</span>
      <button type="button" onClick={() => saveDiagram("Contador", diagram)}>
        salvar
      </button>
      <button
        type="button"
        onClick={() => deleteAlgorithm(algorithms[0]?.id ?? "")}
      >
        apagar
      </button>
      <button
        type="button"
        onClick={async () => {
          const found = await getAlgorithm(algorithms[0]?.id ?? "")
          document.title = found ? found.name : "nada"
        }}
      >
        ler
      </button>
      <button type="button" onClick={() => renameAlgorithm(algorithms[0]?.id ?? "", "Renomeado")}>
        renomear
      </button>
      <button
        type="button"
        onClick={() => updateAlgorithm(algorithms[0]?.id ?? "", "Contador", { nodes: [], edges: [] })}
      >
        atualizar
      </button>
      <span data-testid="first-nodes">{algorithms[0]?.diagram.nodes.length ?? "-"}</span>
    </div>
  )
}

function renderProvider() {
  return render(
    <ToastProvider>
      <LocalAlgorithmsProvider>
        <Probe />
      </LocalAlgorithmsProvider>
    </ToastProvider>,
  )
}

function useMemoryStorage(initial: string | null = null) {
  let value = initial
  const storage = {
    getItem: vi.fn(() => value),
    setItem: vi.fn((_: string, next: string) => {
      value = next
    }),
    removeItem: vi.fn(),
  }
  vi.stubGlobal("localStorage", storage)
  return storage
}

describe("LocalAlgorithmsProvider", () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it("começa com o que já estava guardado", async () => {
    useMemoryStorage(
      JSON.stringify([
        { id: "a", name: "Contador", diagram, created_at: "2026-10-14" },
      ]),
    )

    renderProvider()

    await waitFor(() =>
      expect(screen.getByTestId("names").textContent).toBe("Contador"),
    )
  })

  it("grava o diagrama e passa a listar", async () => {
    useMemoryStorage()

    renderProvider()
    fireEvent.click(screen.getByRole("button", { name: "salvar" }))

    await waitFor(() =>
      expect(screen.getByTestId("names").textContent).toBe("Contador"),
    )
  })

  it("avisa quando o navegador não deixa guardar", async () => {
    vi.stubGlobal("localStorage", {
      getItem: () => null,
      setItem: () => {
        throw new Error("bloqueado")
      },
      removeItem: vi.fn(),
    })

    renderProvider()
    fireEvent.click(screen.getByRole("button", { name: "salvar" }))

    expect(
      await screen.findByText(/não foi possível guardar|armazenamento/i),
    ).toBeInTheDocument()
  })

  it("diz que a cota estourou, que se resolve de outro jeito", async () => {
    vi.stubGlobal("localStorage", {
      getItem: () => null,
      setItem: () => {
        throw new DOMException("full", "QuotaExceededError")
      },
      removeItem: vi.fn(),
    })

    renderProvider()
    fireEvent.click(screen.getByRole("button", { name: "salvar" }))

    expect(
      await screen.findByText(/espaço.*navegador|cheio/i),
    ).toBeInTheDocument()
  })

  it("some da lista ao apagar", async () => {
    useMemoryStorage()

    renderProvider()
    fireEvent.click(screen.getByRole("button", { name: "salvar" }))
    await waitFor(() =>
      expect(screen.getByTestId("count").textContent).toBe("1"),
    )

    fireEvent.click(screen.getByRole("button", { name: "apagar" }))

    await waitFor(() =>
      expect(screen.getByTestId("count").textContent).toBe("0"),
    )
  })

  it("avisa quando apagar falha, em vez de sumir com o item na tela", async () => {
    useMemoryStorage()

    renderProvider()
    fireEvent.click(screen.getByRole("button", { name: "salvar" }))
    await waitFor(() =>
      expect(screen.getByTestId("count").textContent).toBe("1"),
    )

    vi.stubGlobal("localStorage", {
      getItem: () => JSON.stringify([
        { id: "x", name: "Contador", diagram, created_at: "2026-10-14" },
      ]),
      setItem: () => {
        throw new Error("bloqueado")
      },
      removeItem: vi.fn(),
    })
    fireEvent.click(screen.getByRole("button", { name: "apagar" }))

    expect(
      await screen.findByText(/não foi possível|armazenamento/i),
    ).toBeInTheDocument()
  })

  it("lê um registro pelo id", async () => {
    useMemoryStorage(
      JSON.stringify([
        { id: "a", name: "Contador", diagram, created_at: "2026-10-14" },
      ]),
    )

    renderProvider()
    await waitFor(() =>
      expect(screen.getByTestId("count").textContent).toBe("1"),
    )

    fireEvent.click(screen.getByRole("button", { name: "ler" }))

    await waitFor(() => expect(document.title).toBe("Contador"))
  })

  it("devolve nada quando o registro não existe mais", async () => {
    useMemoryStorage()

    renderProvider()

    fireEvent.click(screen.getByRole("button", { name: "ler" }))

    await waitFor(() => expect(document.title).toBe("nada"))
  })

  it("não reclama de armazenamento bloqueado ao abrir a tela", async () => {
    vi.stubGlobal("localStorage", {
      getItem: () => {
        throw new Error("SecurityError")
      },
      setItem: vi.fn(),
      removeItem: vi.fn(),
    })

    renderProvider()

    await waitFor(() =>
      expect(screen.getByTestId("count").textContent).toBe("0"),
    )
    // The reason comes when a write is attempted, which is when it is
    // something the student can act on.
    expect(
      screen.queryByText(/armazenamento deste navegador/i),
    ).not.toBeInTheDocument()
  })

  it("guarda sob uma chave versionada, para uma lista antiga não ser lida torta", async () => {
    const storage = useMemoryStorage()

    renderProvider()
    fireEvent.click(screen.getByRole("button", { name: "salvar" }))

    await waitFor(() => expect(storage.setItem).toHaveBeenCalled())
    expect(storage.setItem.mock.calls[0][0]).toBe(LOCAL_ALGORITHMS_KEY)
  })

  it("devolve o arquivo guardado, para o canvas apontar para ele", () => {
    useMemoryStorage()
    let saved: unknown
    function SaveProbe() {
      const { saveDiagram } = useLocalAlgorithms()
      return (
        <button type="button" onClick={() => { saved = saveDiagram("Contador", diagram) }}>
          guardar
        </button>
      )
    }
    render(
      <ToastProvider>
        <LocalAlgorithmsProvider>
          <SaveProbe />
        </LocalAlgorithmsProvider>
      </ToastProvider>,
    )

    fireEvent.click(screen.getByRole("button", { name: "guardar" }))

    expect(saved).toMatchObject({ name: "Contador", id: expect.any(String) })
  })

  it("renomeia um arquivo guardado", () => {
    useMemoryStorage()
    renderProvider()
    fireEvent.click(screen.getByRole("button", { name: "salvar" }))

    fireEvent.click(screen.getByRole("button", { name: "renomear" }))

    expect(screen.getByTestId("names")).toHaveTextContent("Renomeado")
    expect(screen.getByTestId("count")).toHaveTextContent("1")
  })

  it("salva por cima de um arquivo guardado, sem criar outro", () => {
    useMemoryStorage()
    renderProvider()
    fireEvent.click(screen.getByRole("button", { name: "salvar" }))

    fireEvent.click(screen.getByRole("button", { name: "atualizar" }))

    expect(screen.getByTestId("count")).toHaveTextContent("1")
    expect(screen.getByTestId("first-nodes")).toHaveTextContent("0")
  })
})
