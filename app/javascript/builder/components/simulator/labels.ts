export function nodeTypeLabel(t: string): string {
  switch (t) {
    case "startEnd": return "Início/Fim"
    case "memory": return "Memória"
    case "input": return "Entrada"
    case "output": return "Saída"
    case "process": return "Processo"
    case "decision": return "Decisão"
    case "branch": return "Caso"
    case "connector": return "Conector"
    case "subroutine": return "Sub-rotina"
    default: return t
  }
}
