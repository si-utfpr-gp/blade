import type { BlockNodeData } from "../constructor/ConstructorProvider"

export interface HandleSpec {
  id?: string
}

export interface BlockCapabilities {
  allowsIncoming: boolean
  outgoingHandles: HandleSpec[]
}

export const SELECTION_DEFAULT_HANDLE = "default"

export function selectionCaseHandle(index: number): string {
  return `case-${index}`
}

/** Index of the case a selection handle stands for, or null for "default" and any other handle. */
export function selectionCaseIndex(handle?: string | null): number | null {
  const match = handle?.match(/^case-(\d+)$/)
  return match ? Number(match[1]) : null
}

export function getBlockCapabilities(
  data: Pick<BlockNodeData, "blockType" | "variant" | "cases">,
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

    case "selection":
      return {
        allowsIncoming: true,
        outgoingHandles: [
          ...(data.cases ?? []).map((_, index) => ({ id: selectionCaseHandle(index) })),
          { id: SELECTION_DEFAULT_HANDLE },
        ],
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
