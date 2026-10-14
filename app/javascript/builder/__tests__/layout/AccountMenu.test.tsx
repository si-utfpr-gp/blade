import { describe, it, expect } from "vitest"
import { render, screen, fireEvent } from "@testing-library/react"

import Header from "../../components/layout/Header"

/**
 * The account menu lives inside React, but signing out has to be a real form
 * submission: Turbo would otherwise intercept it, and a fetch would not carry
 * the CSRF token the Rails session expects.
 */
function renderHeader(props: Partial<Parameters<typeof Header>[0]> = {}) {
  return render(
    <Header title="" userName="Ana Souza" {...props} />,
  )
}

async function openMenu() {
  fireEvent.click(screen.getByRole("button", { name: /conta de ana souza/i }))
}

describe("menu de conta", () => {
  it("fica fechado até o usuário pedir", () => {
    renderHeader()

    const trigger = screen.getByRole("button", { name: /conta de ana souza/i })
    expect(trigger).toHaveAttribute("aria-expanded", "false")
    expect(screen.queryByRole("menu")).not.toBeInTheDocument()
  })

  it("abre e mostra as opções", async () => {
    renderHeader()
    await openMenu()

    expect(screen.getByRole("menu")).toBeInTheDocument()
    expect(screen.getByRole("menuitem", { name: /meus algoritmos/i })).toBeInTheDocument()
    expect(screen.getByRole("menuitem", { name: /sair/i })).toBeInTheDocument()
  })

  it("meus algoritmos leva ao construtor", async () => {
    renderHeader()
    await openMenu()

    const item = screen.getByRole("menuitem", { name: /meus algoritmos/i })
    const link = item.closest("a") ?? item.querySelector("a")

    expect(link).toHaveAttribute("href", "/")
  })

  // data-turbo="false" keeps Turbo from swallowing the submission.
  it("sair é um formulário de verdade, com POST e sem Turbo", async () => {
    renderHeader()
    await openMenu()

    const form = screen.getByRole("menuitem", { name: /sair/i }).closest("form")

    expect(form).toBeInTheDocument()
    expect(form).toHaveAttribute("action", "/logout")
    expect(form).toHaveAttribute("method", "post")
    expect(form).toHaveAttribute("data-turbo", "false")
  })

  it("sair envia o token de CSRF", async () => {
    renderHeader()
    await openMenu()

    const form = screen.getByRole("menuitem", { name: /sair/i }).closest("form")
    const token = form?.querySelector("input[name=authenticity_token]")

    expect(token).toBeInTheDocument()
  })

  it("funciona mesmo sem o token disponível", async () => {
    document.head.querySelectorAll('meta[name="csrf-token"]').forEach((el) => el.remove())

    renderHeader()
    await openMenu()

    // A missing token must not remove the option and trap the user in the app.
    const form = screen.getByRole("menuitem", { name: /sair/i }).closest("form")
    expect(form).toHaveAttribute("action", "/logout")
  })

  it("não mostra o nome quando o usuário não está identificado", () => {
    renderHeader({ userName: null })

    expect(
      screen.getByRole("button", { name: /conta de usuário/i }),
    ).toBeInTheDocument()
  })
})