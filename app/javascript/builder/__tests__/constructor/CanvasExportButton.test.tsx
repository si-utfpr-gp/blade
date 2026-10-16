import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"
import { render, screen, fireEvent } from "@testing-library/react"
import { SimulatorProvider } from "../../components/simulator/SimulatorContext"
import { ToastProvider } from "../../components/ui/Toast"
import {
  ConstructorProvider,
  useConstructor,
} from "../../components/constructor/ConstructorProvider"
import { AlgorithmsProvider } from "../../components/constructor/AlgorithmsProvider"
import {
  AlgorithmNameProvider,
  useAlgorithmNameField,
} from "../../components/constructor/AlgorithmNameProvider"
import { DiagramOriginProvider } from "../../components/constructor/DiagramOrigin"
import { CanvasExportButton } from "../../components/constructor/CanvasExportButton"

function NameInput() {
  const { algorithmName, onAlgorithmNameChange } = useAlgorithmNameField()
  return (
    <input
      aria-label="Nome do algoritmo"
      value={algorithmName}
      onChange={(event) => onAlgorithmNameChange(event.target.value)}
    />
  )
}

function WithBlocks() {
  const { addNode } = useConstructor()
  return (
    <button type="button" onClick={() => addNode("process", { x: 12, y: 34 })}>
      add
    </button>
  )
}

// The download is triggered through a link that is never appended to the
// document, so the only way to see it is to catch the element as it is made.
function captureDownloads(): HTMLAnchorElement[] {
  const created: HTMLAnchorElement[] = []
  vi.spyOn(document, "createElement").mockImplementation((tag: string) => {
    // NOT document.createElement: that is the spy itself, and calling it here
    // would recurse forever.
    const element = originalCreateElement.call(document, tag)
    if (tag === "a") created.push(element as HTMLAnchorElement)
    return element
  })
  return created
}

function renderExport() {
  return render(
    <SimulatorProvider>
      <ToastProvider>
        <AlgorithmsProvider signedIn>
          <DiagramOriginProvider>
            <AlgorithmNameProvider>
              <ConstructorProvider>
                <NameInput />
                <WithBlocks />
                <CanvasExportButton />
              </ConstructorProvider>
            </AlgorithmNameProvider>
          </DiagramOriginProvider>
        </AlgorithmsProvider>
      </ToastProvider>
    </SimulatorProvider>,
  )
}

const originalCreateElement = document.createElement

// The export asks before downloading, so the tests that care about the file
// itself confirm and then assert on what came out.
function exportar() {
  fireEvent.click(screen.getByRole("button", { name: /exportar/i }))
  fireEvent.click(screen.getByRole("button", { name: /baixar/i }))
}

describe("CanvasExportButton", () => {
  let createObjectURL: ReturnType<typeof vi.fn>
  let revokeObjectURL: ReturnType<typeof vi.fn>

  beforeEach(() => {
    createObjectURL = vi.fn(() => "blob:algoritmo")
    revokeObjectURL = vi.fn()
    vi.stubGlobal("URL", { ...URL, createObjectURL, revokeObjectURL })
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: true, status: 200, json: async () => [] }))
  })

  afterEach(() => {
    vi.unstubAllGlobals()
    vi.restoreAllMocks()
  })

  it("oferece a exportação mesmo sem conta, porque exportar não precisa de conta", () => {
    renderExport()

    expect(
      screen.getByRole("button", { name: /exportar/i }),
    ).toBeEnabled()
  })

  it("baixa um arquivo JSON", () => {
    renderExport()
    exportar()

    expect(createObjectURL).toHaveBeenCalled()
  })

  it("preserva as posições dos blocos", () => {
    let payload = ""
    vi.stubGlobal("Blob", class {
      constructor(parts: string[]) {
        payload = parts.join("")
      }
    })

    renderExport()
    fireEvent.click(screen.getByRole("button", { name: "add" }))
    exportar()

    expect(JSON.parse(payload).nodes[0].position).toEqual({ x: 12, y: 34 })
  })

  it("não guarda o estado que só pertence à tela", () => {
    let payload = ""
    vi.stubGlobal("Blob", class {
      constructor(parts: string[]) {
        payload = parts.join("")
      }
    })

    renderExport()
    fireEvent.click(screen.getByRole("button", { name: "add" }))
    exportar()

    const node = JSON.parse(payload).nodes[0]
    expect(node.selected).toBeUndefined()
    expect(node.dragging).toBeUndefined()
  })

  it("usa o nome do algoritmo no arquivo", () => {
    const downloads = captureDownloads()

    renderExport()
    fireEvent.change(screen.getByLabelText(/nome do algoritmo/i), {
      target: { value: "Contador" },
    })
    exportar()

    expect(downloads.map((link) => link.download)).toEqual([ "Contador.json" ])
  })

  it("usa um nome genérico quando o algoritmo ainda não tem nome", () => {
    const downloads = captureDownloads()

    renderExport()
    exportar()

    expect(downloads.map((link) => link.download)).toEqual([
      "blade-algoritmo.json",
    ])
  })

  it("tira do nome os caracteres que o navegador rejeitaria", () => {
    const downloads = captureDownloads()

    renderExport()
    fireEvent.change(screen.getByLabelText(/nome do algoritmo/i), {
      target: { value: "a/b:c" },
    })
    exportar()

    expect(downloads.map((link) => link.download)).toEqual([ "abc.json" ])
  })

  it("libera o blob depois de baixar, para não segurar memória", () => {
    renderExport()
    exportar()

    expect(revokeObjectURL).toHaveBeenCalledWith("blob:algoritmo")
  })
})
describe("CanvasExportButton — confirmação antes de baixar", () => {
  let createObjectURL: ReturnType<typeof vi.fn>
  let revokeObjectURL: ReturnType<typeof vi.fn>

  beforeEach(() => {
    createObjectURL = vi.fn(() => "blob:algoritmo")
    revokeObjectURL = vi.fn()
    vi.stubGlobal("URL", { ...URL, createObjectURL, revokeObjectURL })
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({ ok: true, status: 200, json: async () => [] }),
    )
  })

  afterEach(() => {
    vi.unstubAllGlobals()
    vi.restoreAllMocks()
  })

  it("pergunta antes de baixar", () => {
    renderExport()

    fireEvent.click(screen.getByRole("button", { name: /exportar/i }))

    expect(screen.getByRole("alertdialog")).toBeInTheDocument()
  })

  it("nomeia o arquivo que vai ser baixado", () => {
    renderExport()
    fireEvent.change(screen.getByLabelText(/nome do algoritmo/i), {
      target: { value: "Contador" },
    })

    fireEvent.click(screen.getByRole("button", { name: /exportar/i }))

    expect(screen.getByText(/Contador\.json/)).toBeInTheDocument()
  })

  it("não baixa nada enquanto a pergunta está aberta", () => {
    renderExport()

    fireEvent.click(screen.getByRole("button", { name: /exportar/i }))

    expect(createObjectURL).not.toHaveBeenCalled()
  })

  it("baixa quando o aluno confirma", () => {
    renderExport()

    fireEvent.click(screen.getByRole("button", { name: /exportar/i }))
    fireEvent.click(screen.getByRole("button", { name: /baixar/i }))

    expect(createObjectURL).toHaveBeenCalled()
  })

  it("não baixa quando o aluno cancela", () => {
    renderExport()

    fireEvent.click(screen.getByRole("button", { name: /exportar/i }))
    fireEvent.click(screen.getByRole("button", { name: /cancelar/i }))

    expect(createObjectURL).not.toHaveBeenCalled()
  })

  it("pergunta de novo na segunda tentativa, porque cancelar não é responder", () => {
    renderExport()

    fireEvent.click(screen.getByRole("button", { name: /exportar/i }))
    fireEvent.click(screen.getByRole("button", { name: /cancelar/i }))
    fireEvent.click(screen.getByRole("button", { name: /exportar/i }))

    expect(screen.getByRole("alertdialog")).toBeInTheDocument()
  })

  it("avisa que o download foi concluído", () => {
    renderExport()

    fireEvent.click(screen.getByRole("button", { name: /exportar/i }))
    fireEvent.click(screen.getByRole("button", { name: /baixar/i }))

    expect(screen.getByRole("status")).toHaveTextContent(/exportado/i)
  })
})
