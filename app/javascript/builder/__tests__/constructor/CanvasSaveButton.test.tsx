import { ToastProvider } from "../../components/ui/Toast"
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"
import { render, screen, fireEvent, waitFor } from "@testing-library/react"
import { SimulatorProvider } from "../../components/simulator/SimulatorContext"
import { ConstructorProvider, useConstructor } from "../../components/constructor/ConstructorProvider"
import { LocalAlgorithmsProvider, useLocalAlgorithms } from "../../components/constructor/LocalAlgorithmsProvider"
import { AlgorithmsProvider } from "../../components/constructor/AlgorithmsProvider"
import {
  AlgorithmNameProvider,
  useAlgorithmNameField,
} from "../../components/constructor/AlgorithmNameProvider"
import { DiagramOriginProvider, useDiagramOrigin } from "../../components/constructor/DiagramOrigin"
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
      <ToastProvider>
      <AlgorithmsProvider signedIn>
<LocalAlgorithmsProvider>
        <DiagramOriginProvider><AlgorithmNameProvider>
          <ConstructorProvider>
            <HeaderNameInput />
            <CanvasSaveButton />
          </ConstructorProvider>
        </AlgorithmNameProvider></DiagramOriginProvider>
      </LocalAlgorithmsProvider>
</AlgorithmsProvider>
    </ToastProvider>
    </SimulatorProvider>,
  )
}

describe("CanvasSaveButton — salvar algoritmo", () => {
  it("não salva sem nome e avisa o motivo", async () => {
    const fetchMock = mockFetch(jsonResponse([]))

    renderSave()
    await waitFor(() => expect(fetchMock).toHaveBeenCalled())

    // The button stays clickable: a disabled one gives no explanation, so the
    // refusal has to be reported when the student tries to save.
    const button = screen.getByRole("button", { name: /salvar algoritmo/i })
    expect(button).toBeEnabled()

    fireEvent.click(button)

    expect(
      await screen.findByText(/informe um nome para o algoritmo/i),
    ).toBeInTheDocument()
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
    fireEvent.click(screen.getByRole("button", { name: /salvar mesmo/i }))

    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(2))

    const [url, options] = fetchMock.mock.calls[1]
    expect(url).toBe("/algorithms")
    expect(options.method).toBe("POST")
    const payload = JSON.parse(options.body)
    expect(payload.name).toBe("Meu algoritmo")
    // The canvas opens empty; a placed block keeps its position through the
    // round trip.
    expect(payload.diagram.nodes).toHaveLength(0)
    expect(payload.diagram.edges).toEqual([])
  })

  it("mantém o nome no campo depois de salvar", async () => {
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
    await waitFor(() =>
      expect(screen.getByLabelText(/nome do algoritmo/i)).toBeInTheDocument(),
    )

    fireEvent.change(screen.getByLabelText(/nome do algoritmo/i), {
      target: { value: "Meu algoritmo" },
    })
    fireEvent.click(screen.getByRole("button", { name: /salvar algoritmo/i }))
    fireEvent.click(screen.getByRole("button", { name: /salvar mesmo/i }))

    // Wait for the POST to resolve, otherwise the assertion below would match
    // the value still present before the save handler runs.
    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(2))

    // Clearing the field made the name vanish right after saving, which reads
    // as the save having failed.
    expect(screen.getByLabelText(/nome do algoritmo/i)).toHaveValue(
      "Meu algoritmo",
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
    fireEvent.click(screen.getByRole("button", { name: /salvar mesmo/i }))

    // Scoped to the toast, since a screen reader only element carries the same
    // text for assistive tech.
    const toast = await screen.findByRole("status")
    expect(toast).toHaveTextContent(/nome não pode ficar em branco/i)
  })
})
describe("CanvasActions — novo algoritmo", () => {
  it("limpa o nome do header junto com a tela", async () => {
    const fetchMock = mockFetch(jsonResponse([]))

    render(
      <SimulatorProvider>
      <ToastProvider>
        <AlgorithmsProvider signedIn>
<LocalAlgorithmsProvider>
          <DiagramOriginProvider><AlgorithmNameProvider>
            <ConstructorProvider>
              <HeaderNameInput />
              <CanvasActions />
            </ConstructorProvider>
          </AlgorithmNameProvider></DiagramOriginProvider>
        </LocalAlgorithmsProvider>
</AlgorithmsProvider>
      </ToastProvider>
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

    // A new algorithm starts unnamed, unlike saving which must keep the name.
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
      <ToastProvider>
        <AlgorithmsProvider signedIn>
<LocalAlgorithmsProvider>
          <DiagramOriginProvider><AlgorithmNameProvider>
            <ConstructorProvider>
              <HeaderNameInput />
              <ExamplesSection />
            </ConstructorProvider>
          </AlgorithmNameProvider></DiagramOriginProvider>
        </LocalAlgorithmsProvider>
</AlgorithmsProvider>
      </ToastProvider>
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
      <ToastProvider>
        <AlgorithmsProvider signedIn>
<LocalAlgorithmsProvider>
          <DiagramOriginProvider><AlgorithmNameProvider>
            <ConstructorProvider>
              <HeaderNameInput />
              <ExamplesSection />
            </ConstructorProvider>
          </AlgorithmNameProvider></DiagramOriginProvider>
        </LocalAlgorithmsProvider>
</AlgorithmsProvider>
      </ToastProvider>
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
      screen.getByRole("button", { name: "Meu algoritmo salvo" }),
    )

    await waitFor(() =>
      expect(screen.getByLabelText(/nome do algoritmo/i)).toHaveValue(
        "Meu algoritmo salvo",
      ),
    )
  })
})

/**
 * The save button is icon only, to free canvas space on small screens. The
 * accessible name has to carry the whole meaning, since there is no visible
 * text left, and a phone has no hover for the tooltip to appear.
 */
describe("CanvasSaveButton — somente ícone", () => {
  function renderIconWithExamples() {
    mockFetch(jsonResponse([]))
    return render(
      <SimulatorProvider>
        <ToastProvider>
          <AlgorithmsProvider signedIn>
<LocalAlgorithmsProvider>
            <DiagramOriginProvider>
              <AlgorithmNameProvider>
                <ConstructorProvider>
                  <HeaderNameInput />
                  <ExamplesSection />
                  <CanvasSaveButton />
                </ConstructorProvider>
              </AlgorithmNameProvider>
            </DiagramOriginProvider>
          </LocalAlgorithmsProvider>
</AlgorithmsProvider>
        </ToastProvider>
      </SimulatorProvider>,
    )
  }

  function renderIcon() {
    mockFetch(jsonResponse([]))
    return render(
      <SimulatorProvider>
        <ToastProvider>
          <AlgorithmsProvider signedIn>
<LocalAlgorithmsProvider>
            <DiagramOriginProvider>
              <AlgorithmNameProvider>
                <ConstructorProvider>
                  <HeaderNameInput />
                  <CanvasSaveButton />
                </ConstructorProvider>
              </AlgorithmNameProvider>
            </DiagramOriginProvider>
          </LocalAlgorithmsProvider>
</AlgorithmsProvider>
        </ToastProvider>
      </SimulatorProvider>,
    )
  }

  it("não exibe texto, só o ícone", () => {
    renderIcon()

    const button = screen.getByRole("button", { name: /salvar algoritmo/i })
    expect(button.textContent?.trim()).toBe("")
  })

  it("mantém o nome acessível para leitores de tela", () => {
    renderIcon()

    // Sem isso o botão viraria um ícone sem rótulo para quem usa teclado ou
    // leitor de tela.
    expect(
      screen.getByRole("button", { name: /salvar algoritmo/i }),
    ).toHaveAttribute("aria-label", expect.stringMatching(/salvar/i))
  })

  it("mantém o title para o tooltip no desktop", () => {
    renderIcon()

    const button = screen.getByRole("button", { name: /salvar algoritmo/i })
    expect(button).toHaveAttribute("title")
  })

  it("o rótulo acompanha a ação quando um algoritmo salvo está carregado", async () => {
    const diagram = { nodes: [], edges: [] }
    mockFetch(
      jsonResponse([
        { id: 7, name: "Meu algoritmo", diagram, created_at: "2026-10-07" },
      ]),
      jsonResponse({ id: 7, name: "Meu algoritmo", diagram, created_at: "2026-10-07" }),
    )

    render(
      <SimulatorProvider>
        <ToastProvider>
          <AlgorithmsProvider signedIn>
<LocalAlgorithmsProvider>
            <DiagramOriginProvider>
              <AlgorithmNameProvider>
                <ConstructorProvider>
                  <HeaderNameInput />
                  <ExamplesSection />
                  <CanvasSaveButton />
                </ConstructorProvider>
              </AlgorithmNameProvider>
            </DiagramOriginProvider>
          </LocalAlgorithmsProvider>
</AlgorithmsProvider>
        </ToastProvider>
      </SimulatorProvider>,
    )

    fireEvent.click(
      screen.getByRole("button", { name: /^Meus algoritmos: nenhum selecionado/i }),
    )
    // A lista chega por fetch, então o item precisa ser esperado.
    fireEvent.click(await screen.findByRole("button", { name: "Meu algoritmo" }))

    const button = await screen.findByRole("button", { name: /atualizar algoritmo/i })
    // Sem texto visível, o nome acessível precisa distinguir salvar de atualizar.
    expect(button.textContent?.trim()).toBe("")
    expect(button).toHaveAttribute("title", expect.stringMatching(/atualizar/i))
  })

  it("o exemplo bloqueado mantém o motivo no nome acessível", async () => {
    renderIconWithExamples()

    fireEvent.click(
      screen.getByRole("button", { name: /^Exemplos: nenhum selecionado/i }),
    )
    fireEvent.click(screen.getByRole("button", { name: /Par ou Ímpar/i }))

    // O motivo da recusa não pode depender de texto visível nem de hover.
    const button = await screen.findByRole("button", {
      name: /exemplo não pode ser salvo/i,
    })
    expect(button).toBeDisabled()
    expect(button).toHaveAttribute("title", expect.stringMatching(/exemplo/i))
  })

})

/**
 * Icon only shrinks the button, which on a touch screen means a small target.
 * WCAG 2.5.8 sets 24px as the floor and the Apple HIG asks for 44px, so the
 * target grows back on the sizes where the button is actually tapped.
 */
describe("CanvasSaveButton — alvo de toque por tamanho de tela", () => {
  function renderButton() {
    mockFetch(jsonResponse([]))
    return render(
      <SimulatorProvider>
        <ToastProvider>
          <AlgorithmsProvider signedIn>
<LocalAlgorithmsProvider>
            <DiagramOriginProvider>
              <AlgorithmNameProvider>
                <ConstructorProvider>
                  <HeaderNameInput />
                  <CanvasSaveButton />
                </ConstructorProvider>
              </AlgorithmNameProvider>
            </DiagramOriginProvider>
          </LocalAlgorithmsProvider>
</AlgorithmsProvider>
        </ToastProvider>
      </SimulatorProvider>,
    )
  }

  it("tem alvo maior por padrão, para o dedo", () => {
    renderButton()
    const className =
      screen.getByRole("button", { name: /salvar algoritmo/i }).className

    // Tailwind's spacing unit is 0.25rem, so h-N is 4*N pixels. 24px is the
    // WCAG 2.5.8 floor; the exact size is a design call, so only the floor and
    // the square shape are pinned here.
    const px = Number(className.match(/(?:^|\s)h-(\d+)/)?.[1] ?? 0) * 4
    expect(px).toBeGreaterThanOrEqual(24)
  })

  it("compensa nas telas a partir de sm, onde há espaço", () => {
    renderButton()
    const button = screen.getByRole("button", { name: /salvar algoritmo/i })

    expect(button).toHaveClass("sm:h-8", "sm:w-8")
  })

  it("mantém o ícone no centro em qualquer tamanho", () => {
    renderButton()
    const button = screen.getByRole("button", { name: /salvar algoritmo/i })

    expect(button).toHaveClass("items-center", "justify-center")
  })

  it("o alvo continua sendo quadrado, para não parecer dois botões", () => {
    renderButton()
    const className =
      screen.getByRole("button", { name: /salvar algoritmo/i }).className

    const baseHeight = className.match(/(?:^|\s)h-(\d+)/)?.[1]
    const baseWidth = className.match(/(?:^|\s)w-(\d+)/)?.[1]
    expect(baseHeight).toBe(baseWidth)
  })
})

function DirtyProbe() {
  const { isDirty, addNode } = useConstructor()
  return (
    <div>
      <span data-testid="dirty">{String(isDirty)}</span>
      <button type="button" onClick={() => addNode("process", { x: 0, y: 0 })}>
        sujar
      </button>
    </div>
  )
}

function renderSaveWithDirtyProbe() {
  return render(
    <SimulatorProvider>
      <ToastProvider>
      <AlgorithmsProvider signedIn>
<LocalAlgorithmsProvider>
        <DiagramOriginProvider><AlgorithmNameProvider>
          <ConstructorProvider>
            <HeaderNameInput />
            <CanvasSaveButton />
            <DirtyProbe />
          </ConstructorProvider>
        </AlgorithmNameProvider></DiagramOriginProvider>
      </LocalAlgorithmsProvider>
</AlgorithmsProvider>
    </ToastProvider>
    </SimulatorProvider>,
  )
}

describe("CanvasSaveButton — estado sujo depois de salvar", () => {
  it("deixa de contar como alteração depois de salvar", async () => {
    const fetchMock = mockFetch(
      jsonResponse([]),
      jsonResponse(
        { id: 5, name: "Meu algoritmo", diagram: { nodes: [], edges: [] }, created_at: "2026-10-07" },
        201,
      ),
    )

    renderSaveWithDirtyProbe()
    await waitFor(() => expect(fetchMock).toHaveBeenCalled())

    fireEvent.click(screen.getByRole("button", { name: "sujar" }))
    expect(screen.getByTestId("dirty").textContent).toBe("true")

    fireEvent.change(screen.getByLabelText(/nome do algoritmo/i), {
      target: { value: "Meu algoritmo" },
    })
    fireEvent.click(screen.getByRole("button", { name: /salvar algoritmo/i }))

    await waitFor(() =>
      expect(screen.getByTestId("dirty").textContent).toBe("false"),
    )
  })

  it("continua contando como alteração quando a API recusa", async () => {
    const fetchMock = mockFetch(
      jsonResponse([]),
      jsonResponse({ errors: [ "Nome já utilizado" ] }, 422),
    )

    renderSaveWithDirtyProbe()
    await waitFor(() => expect(fetchMock).toHaveBeenCalled())

    fireEvent.click(screen.getByRole("button", { name: "sujar" }))
    fireEvent.change(screen.getByLabelText(/nome do algoritmo/i), {
      target: { value: "Meu algoritmo" },
    })
    fireEvent.click(screen.getByRole("button", { name: /salvar algoritmo/i }))

    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(2))
    await waitFor(() =>
      expect(screen.getAllByText(/nome já utilizado/i).length).toBeGreaterThan(0),
    )
    expect(screen.getByTestId("dirty").textContent).toBe("true")
  })
})

function EmptyCanvasProbe() {
  const { nodes } = useConstructor()
  const { origin, markSaved } = useDiagramOrigin()
  return (
    <div>
      <span data-testid="node-count">{nodes.length}</span>
      <span data-testid="origin-kind">{origin.kind}</span>
      <button type="button" onClick={() => markSaved(3)}>
        marcar-salvo
      </button>
    </div>
  )
}

function renderSaveWithProbe() {
  return render(
    <SimulatorProvider>
      <ToastProvider>
      <AlgorithmsProvider signedIn>
<LocalAlgorithmsProvider>
        <DiagramOriginProvider><AlgorithmNameProvider>
          <ConstructorProvider>
            <HeaderNameInput />
            <CanvasSaveButton />
            <EmptyCanvasProbe />
          </ConstructorProvider>
        </AlgorithmNameProvider></DiagramOriginProvider>
      </LocalAlgorithmsProvider>
</AlgorithmsProvider>
    </ToastProvider>
    </SimulatorProvider>,
  )
}

describe("CanvasSaveButton — canvas vazio", () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it("não salva sozinho um algoritmo sem nenhum bloco", async () => {
    const fetchMock = mockFetch(jsonResponse([]))

    renderSaveWithProbe()
    await waitFor(() => expect(fetchMock).toHaveBeenCalled())

    fireEvent.change(screen.getByLabelText(/nome do algoritmo/i), {
      target: { value: "Meu algoritmo" },
    })
    fireEvent.click(screen.getByRole("button", { name: /salvar algoritmo/i }))

    expect(screen.getByRole("alertdialog")).toBeInTheDocument()
    // Only the initial list request; nothing was written.
    expect(fetchMock).toHaveBeenCalledTimes(1)
  })

  it("avisa que o diagrama guardado será substituído por um vazio", async () => {
    mockFetch(jsonResponse([]))

    renderSaveWithProbe()
    await waitFor(() => expect(screen.getByTestId("origin-kind")).toBeInTheDocument())

    fireEvent.click(screen.getByRole("button", { name: "marcar-salvo" }))
    fireEvent.change(screen.getByLabelText(/nome do algoritmo/i), {
      target: { value: "Contador" },
    })
    // On a saved algorithm the button reads "Atualizar", which is what the
    // overwrite would actually do.
    fireEvent.click(screen.getByRole("button", { name: /atualizar algoritmo/i }))

    expect(screen.getByText(/guardado em "Contador" será substituído/i)).toBeInTheDocument()
  })

  it("avisa que um algoritmo novo ficaria sem nenhum bloco", async () => {
    mockFetch(jsonResponse([]))

    renderSaveWithProbe()
    await waitFor(() => expect(screen.getByTestId("origin-kind")).toBeInTheDocument())

    fireEvent.change(screen.getByLabelText(/nome do algoritmo/i), {
      target: { value: "Contador" },
    })
    fireEvent.click(screen.getByRole("button", { name: /salvar algoritmo/i }))

    expect(screen.getByText(/não terá nenhum bloco/i)).toBeInTheDocument()
  })

  it("salva assim mesmo quando o aluno confirma", async () => {
    const fetchMock = mockFetch(
      jsonResponse([]),
      jsonResponse(
        { id: 9, name: "Meu algoritmo", diagram: { nodes: [], edges: [] }, created_at: "2026-10-07" },
        201,
      ),
    )

    renderSaveWithProbe()
    await waitFor(() => expect(fetchMock).toHaveBeenCalled())

    fireEvent.change(screen.getByLabelText(/nome do algoritmo/i), {
      target: { value: "Meu algoritmo" },
    })
    fireEvent.click(screen.getByRole("button", { name: /salvar algoritmo/i }))
    fireEvent.click(screen.getByRole("button", { name: /salvar mesmo/i }))

    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(2))
  })

  it("não grava nada quando o aluno cancela", async () => {
    const fetchMock = mockFetch(jsonResponse([]))

    renderSaveWithProbe()
    await waitFor(() => expect(fetchMock).toHaveBeenCalled())

    fireEvent.change(screen.getByLabelText(/nome do algoritmo/i), {
      target: { value: "Meu algoritmo" },
    })
    fireEvent.click(screen.getByRole("button", { name: /salvar algoritmo/i }))
    fireEvent.click(screen.getByRole("button", { name: /cancelar/i }))

    expect(fetchMock).toHaveBeenCalledTimes(1)
  })

  it("pergunta de novo na próxima tentativa, porque a resposta não foi dada", async () => {
    const fetchMock = mockFetch(jsonResponse([]))

    renderSaveWithProbe()
    await waitFor(() => expect(fetchMock).toHaveBeenCalled())

    fireEvent.change(screen.getByLabelText(/nome do algoritmo/i), {
      target: { value: "Meu algoritmo" },
    })
    fireEvent.click(screen.getByRole("button", { name: /salvar algoritmo/i }))
    fireEvent.click(screen.getByRole("button", { name: /cancelar/i }))
    fireEvent.click(screen.getByRole("button", { name: /salvar algoritmo/i }))

    expect(screen.getByRole("alertdialog")).toBeInTheDocument()
  })

  it("não pergunta quando o diagrama tem blocos", async () => {
    const fetchMock = mockFetch(jsonResponse([]), jsonResponse([]))

    render(
      <SimulatorProvider>
      <ToastProvider>
        <AlgorithmsProvider signedIn>
<LocalAlgorithmsProvider>
          <DiagramOriginProvider><AlgorithmNameProvider>
            <ConstructorProvider>
              <HeaderNameInput />
              <CanvasSaveButton />
              <WithNode />
            </ConstructorProvider>
          </AlgorithmNameProvider></DiagramOriginProvider>
        </LocalAlgorithmsProvider>
</AlgorithmsProvider>
      </ToastProvider>
      </SimulatorProvider>,
    )
    await waitFor(() => expect(fetchMock).toHaveBeenCalled())

    fireEvent.click(screen.getByRole("button", { name: "add-node" }))
    fireEvent.change(screen.getByLabelText(/nome do algoritmo/i), {
      target: { value: "Meu algoritmo" },
    })
    fireEvent.click(screen.getByRole("button", { name: /salvar algoritmo/i }))

    expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument()
    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(2))
  })
})

function WithNode() {
  const { addNode } = useConstructor()
  return (
    <button type="button" onClick={() => addNode("process", { x: 0, y: 0 })}>
      add-node
    </button>
  )
}

function LocalOriginProbe() {
  const { origin, markLocal } = useDiagramOrigin()
  const { saveDiagram } = useLocalAlgorithms()
  return (
    <div>
      <span data-testid="origin-kind">{origin.kind}</span>
      <button
        type="button"
        onClick={() => {
          // The real id, since that is what the save has to look up. Marking
          // an invented one would never match anything in the store.
          saveDiagram("Contador", { nodes: [], edges: [] })
        }}
      >
        guardar-local
      </button>
      <button type="button" onClick={() => markLocal(localId)}>
        marcar-local
      </button>
    </div>
  )
}

// Filled in by the stubbed store on the next write, so the test can point the
// origin at the record that actually exists.
let localId = ""

let localCount = 0

function renderSaveWithLocal() {
  return render(
    <SimulatorProvider>
      <ToastProvider>
        <AlgorithmsProvider signedIn>
          <LocalAlgorithmsProvider>
            <DiagramOriginProvider>
              <AlgorithmNameProvider>
                <ConstructorProvider>
                  <HeaderNameInput />
                  <CanvasSaveButton />
                  <LocalOriginProbe />
                </ConstructorProvider>
              </AlgorithmNameProvider>
            </DiagramOriginProvider>
          </LocalAlgorithmsProvider>
        </AlgorithmsProvider>
      </ToastProvider>
    </SimulatorProvider>,
  )
}

describe("CanvasSaveButton — mover um algoritmo do navegador para a conta", () => {
  beforeEach(() => {
    localCount = 0
    let value = "[]"
    vi.stubGlobal("localStorage", {
      getItem: () => value,
      setItem: (_: string, next: string) => {
        value = next
        localCount = JSON.parse(next).length
        localId = JSON.parse(next)[0]?.id ?? ""
      },
      removeItem: vi.fn(),
    })
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  async function setup() {
    const fetchMock = mockFetch(
      jsonResponse([]),
      jsonResponse(
        { id: 5, name: "Contador", diagram: { nodes: [], edges: [] }, created_at: "2026-10-07" },
        201,
      ),
    )
    renderSaveWithLocal()
    await waitFor(() => expect(fetchMock).toHaveBeenCalled())

    fireEvent.click(screen.getByRole("button", { name: "guardar-local" }))
    fireEvent.click(screen.getByRole("button", { name: "marcar-local" }))
    fireEvent.change(screen.getByLabelText(/nome do algoritmo/i), {
      target: { value: "Contador" },
    })
    fireEvent.click(screen.getByRole("button", { name: /salvar algoritmo/i }))
    fireEvent.click(screen.getByRole("button", { name: /salvar mesmo/i }))
    // A file from this machine asks; these tests are about sending it.
    fireEvent.click(screen.getByRole("button", { name: /enviar para minha conta/i }))
    return fetchMock
  }

  it("cria o registro na conta", async () => {
    const fetchMock = await setup()

    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(2))
    expect(fetchMock.mock.calls[1][0]).toBe("/algorithms")
  })

  it("some do navegador, para o mesmo diagrama não ficar em dois lugares", async () => {
    const fetchMock = await setup()

    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(2))
    expect(localCount).toBe(0)
  })

  it("passa a apontar para o algoritmo da conta", async () => {
    await setup()

    await waitFor(() =>
      expect(screen.getByTestId("origin-kind").textContent).toBe("saved"),
    )
  })

  it("mantém o local quando a conta recusa, para nada se perder", async () => {
    const fetchMock = mockFetch(jsonResponse([]), jsonResponse({ errors: [ "Nome já utilizado" ] }, 422))

    renderSaveWithLocal()
    await waitFor(() => expect(fetchMock).toHaveBeenCalled())

    fireEvent.click(screen.getByRole("button", { name: "guardar-local" }))
    fireEvent.click(screen.getByRole("button", { name: "marcar-local" }))
    fireEvent.change(screen.getByLabelText(/nome do algoritmo/i), {
      target: { value: "Contador" },
    })
    fireEvent.click(screen.getByRole("button", { name: /salvar algoritmo/i }))
    fireEvent.click(screen.getByRole("button", { name: /salvar mesmo/i }))
    // A file from this machine asks; these tests are about sending it.
    fireEvent.click(screen.getByRole("button", { name: /enviar para minha conta/i }))

    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(2))
    expect(localCount).toBe(1)
    expect(screen.getByTestId("origin-kind").textContent).toBe("local")
  })
})
