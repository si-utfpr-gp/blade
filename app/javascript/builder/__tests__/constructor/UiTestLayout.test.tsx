import { BuilderProviders } from "../test-utils"
import { render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { useState, type ReactNode } from "react"
import { useAlgorithmNameField } from "../../components/constructor/AlgorithmNameProvider"

import Header from "../../components/layout/Header"
import BlocksPanel from "../../components/blocks/BlocksPanel"
import { CanvasSaveButton } from "../../components/constructor/CanvasSaveButton"

function renderHeader(props: Parameters<typeof Header>[0]) {
  return render(
    <Header {...props} />,
  )
}

function ControlledHeader({
  initial,
  onChange,
}: {
  initial: string
  onChange: (value: string) => void
}) {
  const [name, setName] = useState(initial)
  return (
    <Header
      title=""
      userName="Ana Souza"
      algorithmName={name}
      onAlgorithmNameChange={(value) => {
        setName(value)
        onChange(value)
      }}
    />
  )
}

function CanvasNameInput() {
  const { algorithmName, onAlgorithmNameChange } = useAlgorithmNameField()
  return (
    <input
      aria-label="Nome do algoritmo"
      value={algorithmName}
      onChange={(event) => onAlgorithmNameChange(event.target.value)}
    />
  )
}

function wrap(ui: ReactNode) {
  return <BuilderProviders>{ui}</BuilderProviders>
}

describe("UI test layout", () => {
  describe("header", () => {
    it("shows only the product name, with no slogan beside it", () => {
      renderHeader({ title: "", userName: "Ana Souza" })

      expect(screen.getByText("Blade")).toBeInTheDocument()
      expect(
        screen.queryByText("Construa seu algoritmo"),
      ).not.toBeInTheDocument()
      expect(
        screen.queryByText(/Monte e execute algoritmos/i),
      ).not.toBeInTheDocument()
    })

    it("renders an editable algorithm name in the middle of the header", async () => {
      const user = userEvent.setup()
      const changes: string[] = []
      render(
        <ControlledHeader
          initial="Soma de dois números"
          onChange={(v) => changes.push(v)}
        />,
      )

      const input = screen.getByLabelText("Nome do algoritmo")
      expect(input).toHaveValue("Soma de dois números")

      await user.clear(input)
      await user.type(input, "Media")
      expect(changes.at(-1)).toBe("Media")
    })

    it("opens the account menu from the user icon", async () => {
      const user = userEvent.setup()
      renderHeader({ title: "", userName: "Ana Souza" })

      const trigger = screen.getByRole("button", { name: /conta de ana souza/i })
      expect(trigger).toHaveAttribute("aria-expanded", "false")

      await user.click(trigger)
      expect(trigger).toHaveAttribute("aria-expanded", "true")
      expect(screen.getByRole("menuitem", { name: /meus algoritmos/i })).toBeInTheDocument()
      expect(screen.getByRole("menuitem", { name: /sair/i })).toBeInTheDocument()
    })
  })

  describe("blocks panel", () => {
    it("lays the block tiles out in two columns", () => {
render(wrap(<BlocksPanel errors={[]} />))

      const grid = screen.getByTestId("blocks-grid")
      expect(grid.className).toContain("grid")
      expect(grid.className).toContain("grid-cols-2")
    })
  })

  describe("examples dropdown", () => {
    it("renders the open menu above the surrounding chrome", async () => {
      const user = userEvent.setup()
render(wrap(<BlocksPanel errors={[]} />))

      await user.click(
        screen.getByRole("button", { name: /^Exemplos: nenhum selecionado/i }),
      )

      const menu = await screen.findByRole("group", { name: "Exemplos" })
      expect(menu.className).toContain("z-50")
    })
  })

  describe("canvas save button", () => {
    beforeEach(() => {
      vi.stubGlobal(
        "fetch",
        vi.fn().mockResolvedValue({
          ok: true,
          json: async () => [],
        }),
      )
    })

    it("saves the algorithm from a button inside the canvas", async () => {
      const user = userEvent.setup()
      render(wrap(<><CanvasNameInput /><CanvasSaveButton /></>))

      const button = screen.getByRole("button", { name: /salvar algoritmo/i })

      const fetchMock = vi.mocked(globalThis.fetch)
      await user.type(screen.getByLabelText("Nome do algoritmo"), "Media")
      await user.click(button)
      await waitFor(() => expect(fetchMock).toHaveBeenCalled())

      const [url, init] = fetchMock.mock.calls.at(-1) as [string, RequestInit]
      expect(url).toBe("/algorithms")
      expect(init.method).toBe("POST")
      expect(JSON.parse(String(init.body))).toMatchObject({ name: "Media" })
    })
  })
})
/**
 * The save button is taller on small screens, so the toolbar framing it cannot
 * keep a fixed padding or the touch target gets clipped.
 */
describe("toolbar do botão salvar", () => {
  it("reduz o padding nas telas pequenas e restaura a partir de sm", async () => {
    const { default: BuilderPage } = await import("../../BuilderPage")
    render(<BuilderPage />)

    const toolbar = screen.getByTestId("canvas-toolbar-save")

    expect(toolbar).toHaveClass("px-1.5", "py-1")
    expect(toolbar).toHaveClass("sm:px-2", "sm:py-1.5")
  })
})
