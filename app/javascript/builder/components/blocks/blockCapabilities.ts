import type { BlockNodeData } from "../constructor/ConstructorProvider"

export interface HandleSpec {
  id?: string
}

export interface BlockCapabilities {
  allowsIncoming: boolean
  outgoingHandles: HandleSpec[]
}

export function getBlockCapabilities(
  data: Pick<BlockNodeData, "blockType" | "variant">,
): BlockCapabilities {
  switch (data.blockType) {
    case "startEnd":
      return data.variant === "end"
        ? { allowsIncoming: true, outgoingHandles: [] }
        : { allowsIncoming: false, outgoingHandles: [{ id: undefined }] }

    case "decision":
      return {
        allowsIncoming: true,
        outgoingHandles: [{ id: "yes" }, { id: "no" }],
      }

    case "connector":
      return { allowsIncoming: true, outgoingHandles: [{ id: "bottom-out" }] }
    case "memory":
    case "input":
    case "output":
    case "process":
    case "subroutine":
      return { allowsIncoming: true, outgoingHandles: [{ id: undefined }] }

    default:
      return { allowsIncoming: false, outgoingHandles: [] }
  }
}
