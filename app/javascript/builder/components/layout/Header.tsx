import { useState } from "react"
import { ChevronDown, LogOut, FolderOpen } from "lucide-react"

interface IHeaderProps {
  title: string
  userName?: string | null
  algorithmName?: string
  onAlgorithmNameChange?: (name: string) => void
  isNameLocked?: boolean
}

export default function Header({
  title,
  userName,
  algorithmName = "",
  onAlgorithmNameChange,
  isNameLocked = false,
}: IHeaderProps) {
  const [menuOpen, setMenuOpen] = useState(false)

  return (
    <header className="flex items-center justify-between h-12 px-4 border-b bg-white relative">
      <div className="flex items-center gap-2">
        <svg
          className="w-5 h-5 text-blue-600"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path d="M12 14l9-5-9-5-9 5 9 5z" />
          <path d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" />
        </svg>
        <span className="font-bold text-2xl">Blade</span>
      </div>

      <div className="absolute left-1/2 -translate-x-1/2">
        {onAlgorithmNameChange ? (
          <input
            type="text"
            aria-label="Nome do algoritmo"
            value={algorithmName}
            placeholder="Sem título"
            disabled={isNameLocked}
            title={
              isNameLocked
                ? "O nome de um exemplo não pode ser alterado"
                : undefined
            }
            onChange={(event) => onAlgorithmNameChange(event.target.value)}
            className="w-64 rounded-lg border border-border bg-background px-3 py-1.5 text-sm text-foreground placeholder:text-muted-foreground/70 focus:border-primary focus:outline-none"
          />
        ) : (
          title && <span className="text-xs text-gray-500">{title}</span>
        )}
      </div>

      <div className="relative z-50">
        <button
          type="button"
          onClick={() => setMenuOpen((v) => !v)}
          aria-expanded={menuOpen}
          aria-label={`Conta de ${userName ?? "usuário"}`}
          className="flex items-center gap-1.5 rounded-full px-2 py-1 text-xs text-gray-600 hover:bg-gray-100"
        >
          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-600 text-[10px] font-bold text-white">
            {userName?.charAt(0).toUpperCase() ?? "?"}
          </span>
          <span className="max-w-24 truncate">{userName ?? "Usuário"}</span>
          <ChevronDown className={`h-3 w-3 transition-transform ${menuOpen ? "rotate-180" : ""}`} />
        </button>

        {menuOpen && (
          <div
            role="menu"
            className="absolute right-0 top-full z-50 mt-1 w-48 rounded-lg border border-border bg-card p-1 shadow-lg"
          >
            <button
              type="button"
              role="menuitem"
              onClick={() => setMenuOpen(false)}
              className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-xs hover:bg-muted/50"
            >
              <FolderOpen className="h-3.5 w-3.5" />
              Meus algoritmos
            </button>
            <button
              type="button"
              role="menuitem"
              onClick={() => setMenuOpen(false)}
              className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-xs text-destructive hover:bg-muted/50"
            >
              <LogOut className="h-3.5 w-3.5" />
              Sair
            </button>
          </div>
        )}
      </div>
    </header>
  )
}