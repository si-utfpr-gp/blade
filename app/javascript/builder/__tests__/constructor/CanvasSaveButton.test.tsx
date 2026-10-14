import { ToastProvider } from "../../components/ui/Toast"
import { describe, it, expect } from "vitest"
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
      <AlgorithmsProvider>
        <DiagramOriginProvider><AlgorithmNameProvider>
          <ConstructorProvider>
            <HeaderNameInput />
            <CanvasSaveButton />
          </ConstructorProvider>
        </AlgorithmNameProvider></DiagramOriginProvider>
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
      <ToastProvider>
        <AlgorithmsProvider>
          <DiagramOriginProvider><AlgorithmNameProvider>
            <ConstructorProvider>
              <HeaderNameInput />
              <CanvasActions />
            </ConstructorProvider>
          </AlgorithmNameProvider></DiagramOriginProvider>
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
        <AlgorithmsProvider>
          <DiagramOriginProvider><AlgorithmNameProvider>
            <ConstructorProvider>
              <HeaderNameInput />
              <ExamplesSection />
            </ConstructorProvider>
          </AlgorithmNameProvider></DiagramOriginProvider>
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
        <AlgorithmsProvider>
          <DiagramOriginProvider><AlgorithmNameProvider>
            <ConstructorProvider>
              <HeaderNameInput />
              <ExamplesSection />
            </ConstructorProvider>
          </AlgorithmNameProvider></DiagramOriginProvider>
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
      screen.getByRole("button", { name: /Meu algoritmo salvo/i }),
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
          <AlgorithmsProvider>
            <DiagramOriginProvider>
              <AlgorithmNameProvider>
                <ConstructorProvider>
                  <HeaderNameInput />
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

  function renderIcon() {
    mockFetch(jsonResponse([]))
    return render(
      <SimulatorProvider>
        <ToastProvider>
          <AlgorithmsProvider>
            <DiagramOriginProvider>
              <AlgorithmNameProvider>
                <ConstructorProvider>
                  <HeaderNameInput />
                  <CanvasSaveButton />
                </ConstructorProvider>
              </AlgorithmNameProvider>
            </DiagramOriginProvider>
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
          <AlgorithmsProvider>
            <DiagramOriginProvider>
              <AlgorithmNameProvider>
                <ConstructorProvider>
                  <HeaderNameInput />
                  <ExamplesSection />
                  <CanvasSaveButton />
                </ConstructorProvider>
              </AlgorithmNameProvider>
            </DiagramOriginProvider>
          </AlgorithmsProvider>
        </ToastProvider>
      </SimulatorProvider>,
    )

    fireEvent.click(
      screen.getByRole("button", { name: /^Meus algoritmos: nenhum selecionado/i }),
    )
    // A lista chega por fetch, então o item precisa ser esperado.
    fireEvent.click(await screen.findByRole("button", { name: /Meu algoritmo/i }))

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
          <AlgorithmsProvider>
            <DiagramOriginProvider>
              <AlgorithmNameProvider>
                <ConstructorProvider>
                  <HeaderNameInput />
                  <CanvasSaveButton />
                </ConstructorProvider>
              </AlgorithmNameProvider>
            </DiagramOriginProvider>
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
