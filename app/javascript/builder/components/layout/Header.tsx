export interface HeaderProps {
  title: string
}

export default function Header({ title }: HeaderProps) {
  return (
    <header className="flex items-center justify-between h-12 px-4 border-b bg-white">
      <div className="flex items-center gap-2">
        <svg className="w-5 h-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path d="M12 14l9-5-9-5-9 5 9 5z" />
          <path d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" />
        </svg>
        <span className="font-bold text-sm">Blade</span>
        <span className="text-gray-400 text-xs">·</span>
        <span className="text-xs text-gray-500">{title}</span>
      </div>
    </header>
  )
}
