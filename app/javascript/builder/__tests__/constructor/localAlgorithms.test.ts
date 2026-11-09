import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"
import {
  readLocalAlgorithms,
  writeLocalAlgorithms,
  removeLocalAlgorithm,
  saveLocalAlgorithm,
  updateLocalAlgorithm,
  LOCAL_ALGORITHMS_KEY,
  type LocalAlgorithm,
} from "../../components/constructor/localAlgorithms"

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

function stored(items: unknown) {
  return { getItem: () => JSON.stringify(items), setItem: vi.fn(), removeItem: vi.fn() }
}

describe("algoritmos locais", () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  describe("leitura", () => {
    it("começa vazia quando nada foi guardado", () => {
      vi.stubGlobal("localStorage", {
        getItem: () => null,
        setItem: vi.fn(),
        removeItem: vi.fn(),
      })

      expect(readLocalAlgorithms()).toEqual({ ok: true, value: [] })
    })

    it("lê o que foi guardado", () => {
      const items: LocalAlgorithm[] = [
        { id: "a", name: "Contador", diagram, created_at: "2026-10-14" },
      ]
      vi.stubGlobal("localStorage", stored(items))

      expect(readLocalAlgorithms()).toEqual({ ok: true, value: items })
    })

    it("ignora conteúdo que não é a lista esperada", () => {
      vi.stubGlobal("localStorage", {
        getItem: () => JSON.stringify({ nao_e_lista: true }),
        setItem: vi.fn(),
        removeItem: vi.fn(),
      })

      expect(readLocalAlgorithms()).toEqual({ ok: true, value: [] })
    })

    it("ignora registros que não bringam nome e diagrama", () => {
      vi.stubGlobal("localStorage", {
        getItem: () => JSON.stringify([ { id: "a" }, "lixo", null ]),
        setItem: vi.fn(),
        removeItem: vi.fn(),
      })

      expect(readLocalAlgorithms()).toEqual({ ok: true, value: [] })
    })

    it("avisa que o navegador bloqueou o armazenamento em vez de quebrar", () => {
      vi.stubGlobal("localStorage", {
        getItem: () => {
          throw new Error("SecurityError")
        },
        setItem: vi.fn(),
        removeItem: vi.fn(),
      })

      expect(readLocalAlgorithms()).toEqual({ ok: false, reason: "unavailable" })
    })

    it("avisa quando o conteúdo guardado não é JSON válido", () => {
      vi.stubGlobal("localStorage", {
        getItem: () => "{ isto não é json",
        setItem: vi.fn(),
        removeItem: vi.fn(),
      })

      expect(readLocalAlgorithms()).toEqual({ ok: true, value: [] })
    })
  })

  describe("escrita", () => {
    it("grava a lista", () => {
      const setItem = vi.fn()
      vi.stubGlobal("localStorage", {
        getItem: () => null,
        setItem,
        removeItem: vi.fn(),
      })
      const items: LocalAlgorithm[] = [
        { id: "a", name: "Contador", diagram, created_at: "2026-10-14" },
      ]

      expect(writeLocalAlgorithms(items)).toEqual({ ok: true, value: null })
      expect(setItem).toHaveBeenCalledWith(
        LOCAL_ALGORITHMS_KEY,
        JSON.stringify(items),
      )
    })

    it("distingue a cota estourada de um bloqueio, porque a resposta é outra", () => {
      vi.stubGlobal("localStorage", {
        getItem: () => null,
        setItem: () => {
          throw new DOMException("full", "QuotaExceededError")
        },
        removeItem: vi.fn(),
      })

      expect(writeLocalAlgorithms([])).toEqual({ ok: false, reason: "quota" })
    })

    it("trata qualquer outra falha como indisponibilidade", () => {
      vi.stubGlobal("localStorage", {
        getItem: () => null,
        setItem: () => {
          throw new Error("outro problema")
        },
        removeItem: vi.fn(),
      })

      expect(writeLocalAlgorithms([])).toEqual({
        ok: false,
        reason: "unavailable",
      })
    })
  })

  describe("remover", () => {
    it("some com o registro e regrava o resto", () => {
      const setItem = vi.fn()
      vi.stubGlobal("localStorage", {
        getItem: () =>
          JSON.stringify([
            { id: "a", name: "A", diagram, created_at: "2026-10-14" },
            { id: "b", name: "B", diagram, created_at: "2026-10-14" },
          ]),
        setItem,
        removeItem: vi.fn(),
      })

      expect(removeLocalAlgorithm("a")).toEqual({ ok: true, value: null })
      expect(JSON.parse(setItem.mock.calls[0][1]).map((i: { id: string }) => i.id)).toEqual(["b"])
    })

    it("não falha quando o registro já não existe", () => {
      vi.stubGlobal("localStorage", {
        getItem: () => "[]",
        setItem: vi.fn(),
        removeItem: vi.fn(),
      })

      expect(removeLocalAlgorithm("inexistente")).toEqual({ ok: true, value: null })
    })
  })

  describe("salvar", () => {
    beforeEach(() => {
      vi.stubGlobal("localStorage", {
        getItem: () => "[]",
        setItem: vi.fn(),
        removeItem: vi.fn(),
      })
    })

    it("devolve o registro guardado, com id e data", () => {
      const result = saveLocalAlgorithm("Contador", diagram)

      expect(result.ok).toBe(true)
      if (!result.ok) return
      expect(result.value.name).toBe("Contador")
      expect(result.value.id).toBeTruthy()
      expect(result.value.created_at).toBeTruthy()
    })

    it("guarda o diagrama com as posições", () => {
      const result = saveLocalAlgorithm("Contador", diagram)

      expect(result.ok).toBe(true)
      if (!result.ok) return
      expect(result.value.diagram).toEqual(diagram)
    })

    it("não guarda nada quando o navegador não deixa", () => {
      vi.stubGlobal("localStorage", {
        getItem: () => "[]",
        setItem: () => {
          throw new Error("bloqueado")
        },
        removeItem: vi.fn(),
      })

      expect(saveLocalAlgorithm("Contador", diagram)).toEqual({
        ok: false,
        reason: "unavailable",
      })
    })
  })

  // Renaming a file and saving over one both rewrite it in place, keeping its
  // id and its place in the list, so the canvas still points at it.
  describe("atualização", () => {
    const kept = [
      { id: "a", name: "Contador", diagram, created_at: "2026-10-14T12:00:00.000Z" },
      { id: "b", name: "Soma", diagram, created_at: "2026-10-15T12:00:00.000Z" },
    ]

    it("renomeia sem mexer no diagrama nem na ordem", () => {
      const storage = stored(kept)
      vi.stubGlobal("localStorage", storage)

      const result = updateLocalAlgorithm("b", { name: "Soma de dois" })

      expect(result.ok && result.value.name).toBe("Soma de dois")
      const written = JSON.parse(storage.setItem.mock.calls[0][1]) as LocalAlgorithm[]
      expect(written.map((item) => [item.id, item.name])).toEqual([["a", "Contador"], ["b", "Soma de dois"]])
      expect(written[1].diagram).toEqual(diagram)
    })

    it("troca o diagrama de um arquivo guardado", () => {
      const storage = stored(kept)
      vi.stubGlobal("localStorage", storage)
      const changed = { nodes: [], edges: [] }

      updateLocalAlgorithm("a", { name: "Contador", diagram: changed })

      const written = JSON.parse(storage.setItem.mock.calls[0][1]) as LocalAlgorithm[]
      expect(written[0].diagram).toEqual(changed)
    })

    it("avisa quando o arquivo não existe mais", () => {
      vi.stubGlobal("localStorage", stored(kept))

      expect(updateLocalAlgorithm("sumiu", { name: "x" })).toEqual({ ok: false, reason: "missing" })
    })
  })
})
