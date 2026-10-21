import { describe, it, expect, vi, afterEach } from "vitest"
import { render, screen, fireEvent, act } from "@testing-library/react"
import { ToastProvider, useToast } from "../../components/ui/Toast"

// No notice stays on screen: confirmations go in 3 seconds, and errors stay
// 5, long enough to read what went wrong.
function Trigger() {
  const { notify } = useToast()
  return (
    <>
      <button type="button" onClick={() => notify("Salvo.", "success")}>sucesso</button>
      <button type="button" onClick={() => notify("Deu errado.", "error")}>erro</button>
    </>
  )
}

afterEach(() => {
  vi.useRealTimers()
})

describe("avisos", () => {
  it("tira a confirmação depois de 3 segundos", () => {
    vi.useFakeTimers()
    render(<ToastProvider><Trigger /></ToastProvider>)

    fireEvent.click(screen.getByRole("button", { name: "sucesso" }))
    act(() => vi.advanceTimersByTime(2900))
    expect(screen.getByText("Salvo.")).toBeInTheDocument()
    act(() => vi.advanceTimersByTime(200))

    expect(screen.queryByText("Salvo.")).not.toBeInTheDocument()
  })

  it("deixa o erro 5 segundos, e então tira", () => {
    vi.useFakeTimers()
    render(<ToastProvider><Trigger /></ToastProvider>)

    fireEvent.click(screen.getByRole("button", { name: "erro" }))
    act(() => vi.advanceTimersByTime(4900))
    expect(screen.getByText("Deu errado.")).toBeInTheDocument()
    act(() => vi.advanceTimersByTime(200))

    expect(screen.queryByText("Deu errado.")).not.toBeInTheDocument()
  })
})
