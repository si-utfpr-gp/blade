import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"
import { render, screen, waitFor, fireEvent, act } from "@testing-library/react"
import { useState } from "react"
import {
  AlgorithmsProvider,
  useAlgorithms,
} from "../../components/constructor/AlgorithmsProvider"

interface ISavedAlgorithm {
  id: number
  name: string
  diagram: { nodes: unknown[]; edges: unknown[] }
  created_at: string
}

function Probe() {
  const { algorithms, saveAlgorithm, deleteAlgorithm, status, error } =
    useAlgorithms()
  const [name, setName] = useState("Meu algoritmo")

  return (
    <div>
      <span data-testid="count">{algorithms.length}</span>
      <span data-testid="names">{algorithms.map((a) => a.name).join(",")}</span>
      <span data-testid="status">{status}</span>
      <span data-testid="error">{error ?? ""}</span>
      <input
        aria-label="nome"
        value={name}
        onChange={(e) => setName(e.target.value)}
      />
      <button
        type="button"
        onClick={() =>
          saveAlgorithm(name, {
            nodes: [{ id: "n1", type: "start", position: { x: 1, y: 2 }, data: {} }],
            edges: [],
          })
        }
      >
        salvar
      </button>
      <button
        type="button"
        onClick={() => deleteAlgorithm(algorithms[0]?.id ?? 0)}
      >
        apagar
      </button>
    </div>
  )
}

function renderProvider(signedIn = true) {
  return render(
    <AlgorithmsProvider signedIn={signedIn}>
      <Probe />
    </AlgorithmsProvider>,
  )
}

describe("AlgorithmsProvider", () => {
  let fetchMock: ReturnType<typeof vi.fn>

  beforeEach(() => {
    fetchMock = vi.fn()
    vi.stubGlobal("fetch", fetchMock)
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  function jsonResponse(body: unknown, status = 200) {
    return {
      ok: status >= 200 && status < 300,
      status,
      json: async () => body,
    }
  }

  it("loads the saved algorithms on mount", async () => {
    const saved: ISavedAlgorithm[] = [
      { id: 1, name: "Soma", diagram: { nodes: [], edges: [] }, created_at: "2026-10-07" },
    ]
    fetchMock.mockResolvedValue(jsonResponse(saved))

    renderProvider()

    await waitFor(() => {
      expect(screen.getByTestId("count")).toHaveTextContent("1")
    })
    expect(screen.getByTestId("names")).toHaveTextContent("Soma")
    expect(fetchMock).toHaveBeenCalledWith(
      "/algorithms",
      expect.objectContaining({ method: "GET" }),
    )
  })

  it("starts empty and reports the failure when the request fails", async () => {
    fetchMock.mockResolvedValue(jsonResponse({ error: "boom" }, 500))

    renderProvider()

    await waitFor(() => {
      expect(screen.getByTestId("status")).toHaveTextContent("error")
    })
    expect(screen.getByTestId("count")).toHaveTextContent("0")
    expect(screen.getByTestId("error")).toHaveTextContent("boom")
  })

  it("creates an algorithm and prepends it to the list", async () => {
    fetchMock
      .mockResolvedValueOnce(jsonResponse([]))
      .mockResolvedValueOnce(
        jsonResponse(
          { id: 9, name: "Meu algoritmo", diagram: { nodes: [], edges: [] }, created_at: "2026-10-07" },
          201,
        ),
      )

    renderProvider()

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledTimes(1)
    })

    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: "salvar" }))
    })

    await waitFor(() => {
      expect(screen.getByTestId("names")).toHaveTextContent("Meu algoritmo")
    })

    const [, options] = fetchMock.mock.calls[1]
    expect(options.method).toBe("POST")
    expect(JSON.parse(options.body)).toEqual({
      name: "Meu algoritmo",
      diagram: {
        nodes: [{ id: "n1", type: "start", position: { x: 1, y: 2 }, data: {} }],
        edges: [],
      },
    })
  })

  it("surfaces the error message when saving fails", async () => {
    fetchMock
      .mockResolvedValueOnce(jsonResponse([]))
      .mockResolvedValueOnce(
        jsonResponse({ errors: [ "Name não pode ficar em branco" ] }, 422),
      )

    renderProvider()

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledTimes(1)
    })

    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: "salvar" }))
    })

    await waitFor(() => {
      expect(screen.getByTestId("error")).toHaveTextContent(
        "Name não pode ficar em branco",
      )
    })
    expect(screen.getByTestId("status")).toHaveTextContent("error")
  })

  it("removes a deleted algorithm from the list", async () => {
    const saved: ISavedAlgorithm[] = [
      { id: 1, name: "Soma", diagram: { nodes: [], edges: [] }, created_at: "2026-10-07" },
    ]
    fetchMock
      .mockResolvedValueOnce(jsonResponse(saved))
      .mockResolvedValueOnce({ ok: true, status: 204, json: async () => null })

    renderProvider()

    await waitFor(() => {
      expect(screen.getByTestId("count")).toHaveTextContent("1")
    })

    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: "apagar" }))
    })

    await waitFor(() => {
      expect(screen.getByTestId("count")).toHaveTextContent("0")
    })
    expect(fetchMock).toHaveBeenLastCalledWith(
      "/algorithms/1",
      expect.objectContaining({ method: "DELETE" }),
    )
  })

  it("sends the CSRF token on mutating requests", async () => {
    const meta = document.createElement("meta")
    meta.setAttribute("name", "csrf-token")
    meta.setAttribute("content", "TOKEN123")
    document.head.appendChild(meta)

    fetchMock
      .mockResolvedValueOnce(jsonResponse([]))
      .mockResolvedValueOnce(
        jsonResponse(
          { id: 9, name: "Meu algoritmo", diagram: { nodes: [], edges: [] }, created_at: "2026-10-07" },
          201,
        ),
      )

    renderProvider()

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledTimes(1)
    })

    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: "salvar" }))
    })

    await waitFor(() => {
      expect(screen.getByTestId("names")).toHaveTextContent("Meu algoritmo")
    })

    const [, options] = fetchMock.mock.calls[1]
    expect(options.headers["X-CSRF-Token"]).toBe("TOKEN123")
    document.head.removeChild(meta)
  })

  describe("sem sessão", () => {
    it("não pede a lista, porque só receberia 401", async () => {
      renderProvider(false)

      await waitFor(() => {
        expect(screen.getByTestId("status")).toHaveTextContent("idle")
      })
      expect(fetchMock).not.toHaveBeenCalled()
    })

    it("não mostra erro, já que nada foi tentado", async () => {
      renderProvider(false)

      await waitFor(() => {
        expect(screen.getByTestId("count")).toHaveTextContent("0")
      })
      expect(screen.getByTestId("error")).toHaveTextContent("")
    })
  })
})