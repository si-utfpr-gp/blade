import { describe, it, expect } from "vitest"
import type { Connection, Edge } from "@xyflow/react"
import {
  validateConnection,
  CONNECTION_REJECTION_MESSAGE,
} from "../../components/constructor/connectionRules"
import type { AlgorithmNode } from "../../components/constructor/ConstructorProvider"

function node(
  id: string,
  blockType: AlgorithmNode["data"]["blockType"],
  extra: Partial<AlgorithmNode["data"]> = {},
): AlgorithmNode {
  return {
    id,
    type: blockType,
    position: { x: 0, y: 0 },
    data: { blockType, label: id, ...extra },
  }
}

function connection(
  source: string,
  target: string,
  sourceHandle: string | null = null,
  targetHandle: string | null = null,
): Connection {
  return { source, target, sourceHandle, targetHandle }
}

describe("validateConnection", () => {
  it("accepts a straightforward connection between two simple blocks", () => {
    const nodes = [node("n1", "process"), node("n2", "output")]

    const result = validateConnection({
      connection: connection("n1", "n2"),
      nodes,
      edges: [],
    })

    expect(result).toEqual({ valid: true })
  })

  it("rejects when the source or target node cannot be found ('unknown-node')", () => {
    const nodes = [node("n1", "process")]

    const result = validateConnection({
      connection: connection("n1", "does-not-exist"),
      nodes,
      edges: [],
    })

    expect(result).toEqual({ valid: false, reason: "unknown-node" })
    expect(CONNECTION_REJECTION_MESSAGE["unknown-node"]).toBeTruthy()
  })

  it("rejects a block connecting to itself ('self-connection')", () => {
    const nodes = [node("n1", "process")]

    const result = validateConnection({
      connection: connection("n1", "n1"),
      nodes,
      edges: [],
    })

    expect(result).toEqual({ valid: false, reason: "self-connection" })
  })

  it("rejects an outgoing handle the source block doesn't have ('source-handle-not-allowed')", () => {
    const nodes = [
      node("n1", "startEnd", { variant: "end" }),
      node("n2", "process"),
    ]

    // A "Fim" (end) block has no outgoing handles at all.
    const result = validateConnection({
      connection: connection("n1", "n2"),
      nodes,
      edges: [],
    })

    expect(result).toEqual({
      valid: false,
      reason: "source-handle-not-allowed",
    })
  })

  it("rejects a decision connecting through a handle it doesn't declare", () => {
    const nodes = [node("n1", "decision"), node("n2", "process")]

    const result = validateConnection({
      connection: connection("n1", "n2", "maybe"),
      nodes,
      edges: [],
    })

    expect(result).toEqual({
      valid: false,
      reason: "source-handle-not-allowed",
    })
  })

  it("accepts both 'yes' and 'no' handles from a decision block", () => {
    const nodes = [
      node("n1", "decision"),
      node("n2", "process"),
      node("n3", "process"),
    ]

    expect(
      validateConnection({
        connection: connection("n1", "n2", "yes"),
        nodes,
        edges: [],
      }),
    ).toEqual({ valid: true })

    expect(
      validateConnection({
        connection: connection("n1", "n3", "no"),
        nodes,
        edges: [],
      }),
    ).toEqual({ valid: true })
  })

  it("rejects a target that doesn't accept incoming connections ('target-does-not-accept-incoming')", () => {
    const nodes = [
      node("n1", "process"),
      node("n2", "startEnd", { variant: "start" }),
    ]

    // "Início" (start) never accepts incoming edges.
    const result = validateConnection({
      connection: connection("n1", "n2"),
      nodes,
      edges: [],
    })

    expect(result).toEqual({
      valid: false,
      reason: "target-does-not-accept-incoming",
    })
  })

  it("rejects a second connection into an already-occupied target handle ('target-handle-taken')", () => {
    const nodes = [
      node("n1", "process"),
      node("n2", "process"),
      node("n3", "output"),
    ]
    const edges: Edge[] = [{ id: "e1", source: "n1", target: "n3" }]

    const result = validateConnection({
      connection: connection("n2", "n3"),
      nodes,
      edges,
    })

    expect(result).toEqual({ valid: false, reason: "target-handle-taken" })
  })

  it("allows two decision branches to land on different handles of the same connector", () => {
    const nodes = [node("n1", "decision"), node("n2", "connector")]
    const edges: Edge[] = [
      {
        id: "e1",
        source: "n1",
        target: "n2",
        sourceHandle: "yes",
        targetHandle: "left-in",
      },
    ]

    const result = validateConnection({
      connection: connection("n1", "n2", "no", "right-in"),
      nodes,
      edges,
    })

    expect(result).toEqual({ valid: true })
  })

  it("rejects a connector combination not covered by the notation ('invalid-connector-role')", () => {
    const nodes = [node("n1", "process"), node("n2", "connector")]
    const edges: Edge[] = [
      { id: "e1", source: "src-a", target: "n2", targetHandle: "top-in" },
      { id: "e2", source: "src-b", target: "n2", targetHandle: "left-in" },
    ]

    // Adding a third incoming side (top + left + right) is not a valid connector role.
    const result = validateConnection({
      connection: connection("n1", "n2", null, "right-in"),
      nodes,
      edges,
    })

    expect(result).toEqual({ valid: false, reason: "invalid-connector-role" })
  })

  it("accepts a connector forming a valid 'loopStart' role (top + one lateral)", () => {
    const nodes = [node("n1", "process"), node("n2", "connector")]
    const edges: Edge[] = [
      { id: "e1", source: "src-a", target: "n2", targetHandle: "top-in" },
    ]

    const result = validateConnection({
      connection: connection("n1", "n2", null, "right-in"),
      nodes,
      edges,
    })

    expect(result).toEqual({ valid: true })
  })

  describe("reconnection (ignoreEdgeId)", () => {
    it("does not count the edge being replaced against 'target-handle-taken'", () => {
      const nodes = [
        node("n1", "process"),
        node("n2", "process"),
        node("n3", "output"),
      ]
      const edges: Edge[] = [{ id: "e1", source: "n1", target: "n3" }]

      // Reconnecting e1 to a different source should not be blocked by itself.
      const result = validateConnection({
        connection: connection("n2", "n3"),
        nodes,
        edges,
        ignoreEdgeId: "e1",
      })

      expect(result).toEqual({ valid: true })
    })

    it("still rejects if another edge occupies the target handle", () => {
      const nodes = [
        node("n1", "process"),
        node("n2", "process"),
        node("n3", "output"),
      ]
      const edges: Edge[] = [
        { id: "e1", source: "n1", target: "n3" },
        { id: "e2", source: "n2", target: "n3" },
      ]

      const result = validateConnection({
        connection: connection("n1", "n3"),
        nodes,
        edges,
        ignoreEdgeId: "e1",
      })

      expect(result).toEqual({ valid: false, reason: "target-handle-taken" })
    })

    it("excludes the replaced edge from connector role validation", () => {
      const nodes = [node("n1", "process"), node("n2", "connector")]
      const edges: Edge[] = [
        { id: "e1", source: "src-a", target: "n2", targetHandle: "top-in" },
        { id: "e2", source: "src-b", target: "n2", targetHandle: "left-in" },
      ]

      // Reconnecting e1 onto the right side should still be a valid decisionJoin,
      // since e1 itself (currently on top-in) is excluded from the check.
      const result = validateConnection({
        connection: connection("n1", "n2", null, "right-in"),
        nodes,
        edges,
        ignoreEdgeId: "e1",
      })

      expect(result).toEqual({ valid: true })
    })
  })

  it("exposes a human-readable message for every rejection reason", () => {
    const reasons = Object.keys(CONNECTION_REJECTION_MESSAGE)

    expect(reasons).toEqual([
      "unknown-node",
      "self-connection",
      "source-handle-not-allowed",
      "target-does-not-accept-incoming",
      "target-handle-taken",
      "invalid-connector-role",
    ])

    reasons.forEach((reason) => {
      expect(
        CONNECTION_REJECTION_MESSAGE[
          reason as keyof typeof CONNECTION_REJECTION_MESSAGE
        ],
      ).toMatch(/\S/)
    })
  })
})
