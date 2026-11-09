import { describe, it, expect } from "vitest"
import { render, fireEvent } from "@testing-library/react"
import type { NodeProps } from "@xyflow/react"
import { ConstructorProvider, type AlgorithmNode } from "../../components/constructor/ConstructorProvider"
import InputNode from "../../components/constructor/nodes/InputNode"
import OutputNode from "../../components/constructor/nodes/OutputNode"

function propsFor(id: string, type: "input" | "output"): NodeProps<AlgorithmNode> {
  return {
    id,
    type,
    selected: false,
    zIndex: 0,
    isConnectable: true,
    draggable: true,
    selectable: true,
    deletable: true,
    positionAbsoluteX: 0,
    positionAbsoluteY: 0,
    data: { blockType: type, label: "n" },
  } as unknown as NodeProps<AlgorithmNode>
}

function renderNode(type: "input" | "output") {
  const Node = type === "input" ? InputNode : OutputNode
  return render(
    <ConstructorProvider>
      <Node {...propsFor("n1", type)} />
    </ConstructorProvider>,
  )
}

function isClippedByAncestor(svg: Element | null, root: Element): boolean {
  let el = svg?.parentElement ?? null
  while (el && el !== root) {
    if ((el as HTMLElement).style?.clipPath) return true
    el = el.parentElement
  }
  return false
}

describe.each(["input", "output"] as const)("seta do bloco %s", (type) => {
  it("fica fora do elemento com clip-path para não ser recortada", () => {
    const { container } = renderNode(type)
    const svg = container.querySelector("svg")
    expect(svg).not.toBeNull()
    expect(isClippedByAncestor(svg, container)).toBe(false)
  })
})

// A long message used to run past the slanted sides and get cut off, and
// Enter closed the editor, so there was no way to break it into lines.
describe.each(["input", "output"] as const)("texto do bloco %s", (type) => {
  function startEditing(container: HTMLElement) {
    fireEvent.doubleClick(container.querySelector(".node-base") as Element)
    return container.querySelector("textarea") as HTMLTextAreaElement
  }

  it("edita numa área de várias linhas, em que Enter quebra a linha", () => {
    const { container } = renderNode(type)
    const field = startEditing(container)

    expect(field).not.toBeNull()
    fireEvent.change(field, { target: { value: "n,\nm" } })
    fireEvent.keyDown(field, { key: "Enter" })

    expect(container.querySelector("textarea")).not.toBeNull()
  })

  it("confirma com Ctrl+Enter", () => {
    const { container } = renderNode(type)
    const field = startEditing(container)
    fireEvent.change(field, { target: { value: "n,\nm" } })
    fireEvent.keyDown(field, { key: "Enter", ctrlKey: true })

    expect(container.querySelector("textarea")).toBeNull()
  })

  it("mostra as linhas como a pessoa escreveu, quebrando o que passar da largura", () => {
    const Node = type === "input" ? InputNode : OutputNode
    const props = propsFor("n1", type)
    const { container } = render(
      <ConstructorProvider>
        <Node {...props} data={{ ...props.data, label: "n,\nm" }} />
      </ConstructorProvider>,
    )
    const text = container.querySelector(".node-base span") as HTMLElement

    expect(text.textContent).toBe("n,\nm")
    expect(text).toHaveStyle({ whiteSpace: "pre-wrap" })
  })

  it("cresce a área conforme as linhas digitadas", () => {
    const { container } = renderNode(type)
    const field = startEditing(container)
    fireEvent.change(field, { target: { value: "a\nb\nc" } })

    expect(field.rows).toBe(3)
  })

  it("inclina os lados por uma medida fixa, menor que o recuo do texto", () => {
    const { container } = renderNode(type)
    const shape = container.querySelector(".node-base") as HTMLElement

    expect(shape.style.clipPath).toMatch(/^polygon\(24px 0%, 100% 0%, calc\(100% - 24px\) 100%/)
  })
})
