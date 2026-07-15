export interface BlocksPanelProps {
  errors: string[]
}

export default function BlocksPanel({ errors: _errors }: BlocksPanelProps) {
  return (
    <div className="flex flex-col h-full">
      <div className="p-4 border-b text-center">
        <h2 className="text-sm text-[20px] font-bold text-gray-800 uppercase tracking-widest mb-40">
          Blocos de Algoritmo
        </h2>
      </div>

      <div className="px-3 pb-3">
        <h3 className="p-4 text-[20px] font-semibold text-gray-400 uppercase tracking-widest text-center mb-2">
          Exemplo de Algoritmo
        </h3>
      </div>
    </div>
  )
}
