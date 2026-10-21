export type TokenKind = "plain" | "comment" | "string" | "number" | "keyword" | "type" | "builtin" | "function"

export interface Token {
  kind: TokenKind
  text: string
}

const KEYWORDS = new Set([
  "let", "const", "var", "if", "else", "while", "do", "for", "of", "in",
  "function", "return", "new", "break", "continue", "switch", "case", "default",
  "typeof", "true", "false", "null", "undefined",
])
const TYPES = new Set(["number", "string", "boolean", "void", "any"])
const BUILTINS = new Set(["console", "Math", "Number", "String", "Boolean", "Array", "parseInt", "parseFloat"])

/**
 * Splits generated JavaScript or TypeScript into coloured pieces. It covers
 * what the CodeGenerator writes, not the whole language: a full parser would
 * be a dependency for code we control. Joining the texts gives back the code.
 */
export function highlightCode(code: string): Token[] {
  const tokens: Token[] = []
  const push = (kind: TokenKind, text: string) => {
    const last = tokens[tokens.length - 1]
    if (kind === "plain" && last?.kind === "plain") last.text += text
    else tokens.push({ kind, text })
  }

  let i = 0
  while (i < code.length) {
    const char = code[i]
    const rest = code.slice(i)

    if (rest.startsWith("//")) {
      const end = code.indexOf("\n", i)
      const stop = end === -1 ? code.length : end
      push("comment", code.slice(i, stop))
      i = stop
    } else if (rest.startsWith("/*")) {
      const end = code.indexOf("*/", i + 2)
      const stop = end === -1 ? code.length : end + 2
      push("comment", code.slice(i, stop))
      i = stop
    } else if (char === "'" || char === '"' || char === "`") {
      let j = i + 1
      while (j < code.length && code[j] !== char) j += code[j] === "\\" ? 2 : 1
      const stop = Math.min(j + 1, code.length)
      push("string", code.slice(i, stop))
      i = stop
    } else if (/\d/.test(char)) {
      const match = /^\d+(\.\d+)?/.exec(rest)!
      push("number", match[0])
      i += match[0].length
    } else if (/[A-Za-z_$]/.test(char)) {
      const word = /^[\w$]+/.exec(rest)![0]
      const calls = /^\s*\(/.test(code.slice(i + word.length))
      const kind: TokenKind = KEYWORDS.has(word)
        ? "keyword"
        : TYPES.has(word)
          ? "type"
          : BUILTINS.has(word)
            ? "builtin"
            : calls
              ? "function"
              : "plain"
      push(kind, word)
      i += word.length
    } else {
      push("plain", char)
      i += 1
    }
  }

  return tokens
}
