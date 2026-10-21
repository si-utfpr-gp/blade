import { describe, it, expect, vi, afterEach } from "vitest"
import { render, screen, waitFor } from "@testing-library/react"
import BlocksPanel from "../../components/blocks/BlocksPanel"
import { BuilderProviders } from "../test-utils"

// Every message goes through the one notice system. The account's errors
// used to be written under the sidebar as well, raw, as "Failed to fetch".
afterEach(() => {
  vi.unstubAllGlobals()
})

describe("um só sistema de avisos", () => {
  it("avisa quando a lista de algoritmos não carrega, sem escrever o erro na barra lateral", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new TypeError("Failed to fetch")))

    render(
      <BuilderProviders signedIn>
        <BlocksPanel errors={[]} />
      </BuilderProviders>,
    )

    const notice = await screen.findByRole("alert")
    expect(notice).toHaveTextContent(/sem conexão com o servidor/i)
    // A notice, not text left in the sidebar.
    expect(notice.closest("[aria-live]")).not.toBeNull()
    await waitFor(() => expect(screen.getAllByText(/sem conexão com o servidor/i)).toHaveLength(1))
  })
})
