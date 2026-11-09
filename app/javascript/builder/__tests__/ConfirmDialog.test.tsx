import { describe, it, expect, vi } from "vitest"
import { render, screen, fireEvent } from "@testing-library/react"
import { useState } from "react"
import { ConfirmDialog } from "../components/ui/ConfirmDialog"

function Harness({
  onConfirm,
  onCancel,
}: {
  onConfirm: () => void
  onCancel?: () => void
}) {
  const [open, setOpen] = useState(false)
  return (
    <>
      <button type="button" onClick={() => setOpen(true)}>
        abrir
      </button>
      <ConfirmDialog
        open={open}
        title="Descartar alterações?"
        description="Você tem trabalho não salvo neste algoritmo."
        confirmLabel="Descartar"
        cancelLabel="Cancelar"
        onConfirm={() => {
          onConfirm()
          setOpen(false)
        }}
        onCancel={() => {
          onCancel?.()
          setOpen(false)
        }}
      />
    </>
  )
}

function openDialog() {
  fireEvent.click(screen.getByRole("button", { name: "abrir" }))
}

describe("ConfirmDialog", () => {
  it("não aparece enquanto está fechado", () => {
    render(<Harness onConfirm={vi.fn()} />)

    expect(
      screen.queryByRole("alertdialog"),
    ).not.toBeInTheDocument()
  })

  it("aparece com o título e a descrição informados", () => {
    render(<Harness onConfirm={vi.fn()} />)

    openDialog()

    expect(screen.getByRole("alertdialog")).toBeInTheDocument()
    expect(
      screen.getByText("Descartar alterações?"),
    ).toBeInTheDocument()
    expect(
      screen.getByText("Você tem trabalho não salvo neste algoritmo."),
    ).toBeInTheDocument()
  })

  it("usa alertdialog, para que a leitura não soe como uma janela comum", () => {
    render(<Harness onConfirm={vi.fn()} />)

    openDialog()

    expect(screen.getByRole("alertdialog")).toHaveAttribute(
      "aria-labelledby",
      expect.any(String),
    )
  })

  it("confirma pelo botão de ação", () => {
    const onConfirm = vi.fn()
    render(<Harness onConfirm={onConfirm} />)

    openDialog()
    fireEvent.click(screen.getByRole("button", { name: "Descartar" }))

    expect(onConfirm).toHaveBeenCalledTimes(1)
  })

  it("cancela sem confirmar", () => {
    const onConfirm = vi.fn()
    const onCancel = vi.fn()
    render(<Harness onConfirm={onConfirm} onCancel={onCancel} />)

    openDialog()
    fireEvent.click(screen.getByRole("button", { name: "Cancelar" }))

    expect(onCancel).toHaveBeenCalledTimes(1)
    expect(onConfirm).not.toHaveBeenCalled()
  })

  it("cancelar com Esc não confirma", () => {
    const onConfirm = vi.fn()
    const onCancel = vi.fn()
    render(<Harness onConfirm={onConfirm} onCancel={onCancel} />)

    openDialog()
    fireEvent.keyDown(document.activeElement!, { key: "Escape" })

    expect(onCancel).toHaveBeenCalled()
    expect(onConfirm).not.toHaveBeenCalled()
  })

  it("volta a fechar depois de confirmar", () => {
    render(<Harness onConfirm={vi.fn()} />)

    openDialog()
    fireEvent.click(screen.getByRole("button", { name: "Descartar" }))

    expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument()
  })

  it("aponta a ação destrutiva para quem vai ler por leitor de tela", () => {
    render(<Harness onConfirm={vi.fn()} />)

    openDialog()

    expect(screen.getByRole("button", { name: "Descartar" })).toHaveAccessibleName(
      "Descartar",
    )
  })
})