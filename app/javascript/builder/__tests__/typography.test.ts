import { describe, it, expect } from "vitest"
import { readFileSync, readdirSync } from "node:fs"
import { join } from "node:path"

/**
 * Arbitrary pixel font sizes bypass the type scale: they do not respond to the
 * browser's default font size and produced 9px text, which is unreadable.
 * This guards the whole builder directory at once, which per-file unit tests
 * cannot do.
 */
const COMPONENTS_DIR = join(process.cwd(), "app/javascript/builder")

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
    const offenders = tsxFiles(COMPONENTS_DIR)
      .filter((file) => ARBITRARY_FONT_SIZE.test(readFileSync(file, "utf8")))
      .map((file) => file.replace(`${COMPONENTS_DIR}/`, ""))

    expect(offenders).toEqual([])
  })

  it("não usa larguras em porcentagem no layout principal", () => {
    const layout = readFileSync(
      join(COMPONENTS_DIR, "components/layout/WorkspaceLayout.tsx"),
      "utf8",
    )

    // Largura percentual fazia a sidebar ir de 154px a 384px na mesma app.
    expect(layout).not.toMatch(/w-\[\d+%\]/)
  })
})