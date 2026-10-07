import { describe, it, expect } from "vitest"
import { render } from "@testing-library/react"
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
