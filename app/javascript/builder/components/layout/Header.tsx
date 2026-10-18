import { useState } from "react"
import { ChevronDown, LogIn, LogOut, FolderOpen, Menu } from "lucide-react"

import { useDrawer } from "./DrawerContext"
import { csrfToken } from "../../lib/csrf"

interface IHeaderProps {
  title: string
  userName?: string | null
  // Without an account the builder still works, so the header offers signing
  // in where the account menu would be.
  signedIn?: boolean
  algorithmName?: string
  onAlgorithmNameChange?: (name: string) => void
  isNameLocked?: boolean
  isNameMissing?: boolean
}

export default function Header({
  title,
  userName,
  signedIn = false,
  algorithmName = "",
  onAlgorithmNameChange,
  isNameLocked = false,
  isNameMissing = false,
}: IHeaderProps) {
  const [menuOpen, setMenuOpen] = useState(false)
  // Null when the header is rendered outside WorkspaceLayout, in which case
  // there is no drawer to open and the button has nothing to control.
  const drawer = useDrawer()

  return (
    <header className="flex items-center justify-between h-12 px-4 border-b bg-white relative">
      <div className="flex items-center gap-2">
        {drawer && (
          <button
            type="button"
            onClick={drawer.toggle}
            aria-label="Abrir menu de blocos"
            aria-expanded={drawer.isOpen}
            aria-controls="workspace-sidebar"
            className="rounded-md p-1 text-muted-foreground transition-colors hover:bg-muted md:hidden"
          >
            <Menu className="h-5 w-5" />
          </button>
        )}
        <a href="/" className="flex items-center gap-2" aria-label="Blade, página inicial">
          <svg
            className="w-5 h-5 text-blue-600"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
            aria-hidden="true"
          >
            <path d="M12 14l9-5-9-5-9 5 9 5z" />
            <path d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" />
          </svg>
          <span className="font-bold text-2xl">Blade</span>
        </a>
      </div>

      {/* Narrow screens keep the field in the flex flow so it shrinks with the
          available width; from sm up it is centred over the canvas. */}
      <div className="flex-1 min-w-0 px-2 sm:flex-none sm:absolute sm:left-1/2 sm:-translate-x-1/2 sm:px-0">
        {onAlgorithmNameChange ? (
          <input
            type="text"
            aria-label="Nome do algoritmo"
            value={algorithmName}
            placeholder="Sem título"
            disabled={isNameLocked}
            aria-invalid={isNameMissing || undefined}
            aria-describedby={isNameMissing ? "algorithm-name-error" : undefined}
            title={
              isNameLocked
                ? "O nome de um exemplo não pode ser alterado"
                : undefined
            }
            onChange={(event) => onAlgorithmNameChange(event.target.value)}
            className={`w-full min-w-0 rounded-lg border bg-background px-3 py-1.5 text-sm text-foreground placeholder:text-muted-foreground/70 focus:outline-none sm:w-64 ${
              // Highlight on attempt only, so an untouched empty field does not
              // look like an error.
              isNameMissing
                ? "border-destructive focus:border-destructive"
                : "border-border focus:border-primary"
            }`}
          />
        ) : (
          title && <span className="text-xs text-gray-500">{title}</span>
        )}
        {isNameMissing && (
          <p id="algorithm-name-error" role="alert" className="sr-only">
            Nome do algoritmo obrigatório.
          </p>
        )}
      </div>

      {signedIn ? (
      <div className="relative z-50">
        <button
          type="button"
          onClick={() => setMenuOpen((v) => !v)}
          aria-expanded={menuOpen}
          aria-label={`Conta de ${userName ?? "usuário"}`}
          className="flex items-center gap-1.5 rounded-full px-2 py-1 text-xs text-gray-600 hover:bg-gray-100"
        >
          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-600 text-xs font-bold text-white">
            {userName?.charAt(0).toUpperCase() ?? "?"}
          </span>
          <span className="hidden max-w-24 truncate sm:inline">{userName ?? "Usuário"}</span>
          <ChevronDown className={`h-3 w-3 transition-transform ${menuOpen ? "rotate-180" : ""}`} />
        </button>

        {menuOpen && (
          <div
            role="menu"
            className="absolute right-0 top-full z-50 mt-1 w-48 rounded-lg border border-border bg-card p-1 shadow-lg"
          >
            <a
              role="menuitem"
              href="/builder"
              onClick={() => setMenuOpen(false)}
              className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-xs hover:bg-muted/50"
            >
              <FolderOpen className="h-3.5 w-3.5" />
              Meus algoritmos
            </a>

            {/* A real form, not a button: Rails needs a POST carrying the CSRF
                token to end the session, and data-turbo="false" keeps Turbo
                from intercepting the submission. */}
            <form
              action="/logout"
              method="post"
              data-turbo="false"
              onSubmit={() => setMenuOpen(false)}
            >
              <input
                type="hidden"
                name="authenticity_token"
                value={csrfToken()}
              />
              <button
                type="submit"
                role="menuitem"
                className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-xs text-destructive hover:bg-muted/50"
              >
                <LogOut className="h-3.5 w-3.5" />
                Sair
              </button>
            </form>
          </div>
        )}
      </div>
      ) : (
        // OmniAuth only accepts a POST carrying the CSRF token, and Turbo
        // would follow the redirect to Google with fetch, so this is a real
        // form with data-turbo="false", like the one on the landing page.
        <form action="/auth/google_oauth2" method="post" data-turbo="false">
          <input type="hidden" name="authenticity_token" value={csrfToken()} />
          <button
            type="submit"
            className="flex items-center gap-1.5 rounded-full bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-blue-500"
          >
            <LogIn className="h-3.5 w-3.5" />
            Entrar com Google
          </button>
        </form>
      )}
    </header>
  )
}