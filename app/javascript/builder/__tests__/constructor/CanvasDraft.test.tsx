import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"
import { render, screen, fireEvent, waitFor } from "@testing-library/react"
import { BuilderProviders } from "../test-utils"
import { useConstructor } from "../../components/constructor/ConstructorProvider"
import { useAlgorithmNameField } from "../../components/constructor/AlgorithmNameProvider"
import { useDiagramOrigin } from "../../components/constructor/DiagramOrigin"
import { CanvasDraft, CANVAS_DRAFT_KEY, DRAFT_DELAY_MS } from "../../components/constructor/CanvasDraft"

// Closing the tab by mistake threw the diagram away. What is on the canvas is
// kept in this browser as the student works, and comes back the next time
// the builder opens, still counted as unsaved where it was.
function Probe() {
  const { nodes, isDirty, addNode, clearCanvas } = useConstructor()
  const { algorithmName, onAlgorithmNameChange } = useAlgorithmNameField()
  const { origin, markSaved } = useDiagramOrigin()
  return (
    <div>
      <input aria-label="Nome do algoritmo" value={algorithmName} onChange={(event) => onAlgorithmNameChange(event.target.value)} />
      <span data-testid="nodes">{nodes.length}</span>
      <span data-testid="dirty">{String(isDirty)}</span>
      <span data-testid="origin">{origin.kind === "saved" ? `saved:${origin.id}` : origin.kind}</span>
      <button type="button" onClick={() => addNode("process", { x: 10, y: 20 })}>bloco</button>
      <button type="button" onClick={() => markSaved(4)}>conta</button>
      <button type="button" onClick={clearCanvas}>limpar</button>
    </div>
  )
}

function renderDraft() {
  return render(
    <BuilderProviders signedIn={false}>
      <Probe />
      <CanvasDraft />
    </BuilderProviders>,
  )
}

let stored: Record<string, string>

beforeEach(() => {
  stored = {}
  vi.stubGlobal("localStorage", {
    getItem: (key: string) => stored[key] ?? null,
    setItem: (key: string, value: string) => {
      stored[key] = value
    },
    removeItem: (key: string) => {
      delete stored[key]
    },
  })
  vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: true, status: 200, json: async () => [] }))
})

afterEach(() => {
  vi.unstubAllGlobals()
})

const wait = { timeout: DRAFT_DELAY_MS + 1000 }

function draft() {
  return stored[CANVAS_DRAFT_KEY] ? JSON.parse(stored[CANVAS_DRAFT_KEY]) : null
}

describe("rascunho do canvas", () => {
  it("guarda o que está no canvas enquanto a pessoa trabalha", async () => {
    renderDraft()

    fireEvent.change(screen.getByLabelText("Nome do algoritmo"), { target: { value: "Contador" } })
    fireEvent.click(screen.getByRole("button", { name: "bloco" }))

    await waitFor(() => expect(draft()?.diagram.nodes).toHaveLength(1), wait)
    expect(draft()).toMatchObject({ name: "Contador", origin: { kind: "blank" }, dirty: true })
  })

  it("traz o diagrama de volta ao abrir de novo, ainda como não salvo", async () => {
    stored[CANVAS_DRAFT_KEY] = JSON.stringify({
      name: "Contador",
      origin: { kind: "saved", id: 4 },
      dirty: true,
      diagram: { nodes: [{ id: "n1", type: "process", position: { x: 10, y: 20 }, data: { label: "x = 1" } }], edges: [] },
    })

    renderDraft()

    await waitFor(() => expect(screen.getByTestId("nodes")).toHaveTextContent("1"))
    expect(screen.getByLabelText("Nome do algoritmo")).toHaveValue("Contador")
    expect(screen.getByTestId("origin")).toHaveTextContent("saved:4")
    expect(screen.getByTestId("dirty")).toHaveTextContent("true")
    expect(await screen.findByText(/recuperado/i)).toBeInTheDocument()
  })

  it("não marca como alterado o que já estava salvo", async () => {
    stored[CANVAS_DRAFT_KEY] = JSON.stringify({
      name: "Contador",
      origin: { kind: "saved", id: 4 },
      dirty: false,
      diagram: { nodes: [{ id: "n1", type: "process", position: { x: 10, y: 20 }, data: { label: "x = 1" } }], edges: [] },
    })

    renderDraft()

    await waitFor(() => expect(screen.getByTestId("nodes")).toHaveTextContent("1"))
    expect(screen.getByTestId("dirty")).toHaveTextContent("false")
  })

  it("apaga o rascunho quando o canvas fica vazio e sem nome", async () => {
    renderDraft()
    fireEvent.click(screen.getByRole("button", { name: "bloco" }))
    await waitFor(() => expect(draft()).not.toBeNull(), wait)

    fireEvent.click(screen.getByRole("button", { name: "limpar" }))

    await waitFor(() => expect(draft()).toBeNull(), wait)
  })

  it("segue funcionando quando o navegador não deixa guardar", async () => {
    vi.stubGlobal("localStorage", {
      getItem: () => {
        throw new Error("bloqueado")
      },
      setItem: () => {
        throw new Error("bloqueado")
      },
      removeItem: () => {
        throw new Error("bloqueado")
      },
    })
    renderDraft()

    fireEvent.click(screen.getByRole("button", { name: "bloco" }))

    await new Promise((resolve) => setTimeout(resolve, DRAFT_DELAY_MS + 100))
    expect(screen.getByTestId("nodes")).toHaveTextContent("1")
  })
})
