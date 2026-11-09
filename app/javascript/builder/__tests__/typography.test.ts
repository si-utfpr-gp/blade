import { describe, it, expect } from "vitest"
import { readFileSync, readdirSync } from "node:fs"
import { join } from "node:path"

/**
 * Arbitrary pixel font sizes bypass the type scale: they do not respond to the
 * browser's default font size and produced 9px text, which is unreadable.
 *
 * Scope is the header, canvas and sidebar only. The simulator panel keeps its
 * dense sizing for now, so it is excluded rather than silently relaxed.
 */
const COMPONENTS_DIR = join(process.cwd(), "app/javascript/builder")

const IN_SCOPE_DIRS = ["components/layout", "components/blocks", "components/constructor"]

function tsxFiles(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const path = join(dir, entry.name)
    if (entry.isDirectory()) return tsxFiles(path)
    return entry.name.endsWith(".tsx") ? [path] : []
  })
}

const ARBITRARY_FONT_SIZE = /text-\[\d+px\]/g

describe("escala tipográfica", () => {
  it("não usa tamanhos de fonte arbitrários em px", () => {
    const offenders = IN_SCOPE_DIRS.flatMap((dir) =>
      tsxFiles(join(COMPONENTS_DIR, dir))
        .filter((file) => ARBITRARY_FONT_SIZE.test(readFileSync(file, "utf8")))
        .map((file) => file.replace(`${COMPONENTS_DIR}/`, "")),
    )

    expect(offenders).toEqual([])
  })

  it("não usa larguras em porcentagem na sidebar", () => {
    const layout = readFileSync(
      join(COMPONENTS_DIR, "components/layout/WorkspaceLayout.tsx"),
      "utf8",
    )

    // Only the sidebar is in scope here; the simulator panel keeps its own
    // percentage width, so the check is limited to the first aside, which is
    // the one holding the blocks and examples.
    const sidebarAside = layout.match(/<aside[\s\S]*?>/)?.[0] ?? ""

    // A percentage of the viewport made the sidebar range from 154px to
    // 384px for the same app, which squeezed the dropdowns shut.
    expect(sidebarAside).not.toMatch(/w-\[\d+%\]/)
    expect(sidebarAside).toContain("w-64")
  })

  it("deixa a largura do simulador como estava", () => {
    const layout = readFileSync(
      join(COMPONENTS_DIR, "components/layout/WorkspaceLayout.tsx"),
      "utf8",
    )

    // O depurador está fora do escopo desta passada; travar o valor evita que
    // ele mude de novo por engano.
    expect(layout).toContain("w-[40%] min-w-[240px] max-w-[900px]")
  })
})