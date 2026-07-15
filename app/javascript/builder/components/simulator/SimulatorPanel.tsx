import { useState } from "react"
import type { Node, Edge } from "@xyflow/react"

export interface SimulatorPanelProps {
  nodes: Node[]
  edges: Edge[]
}

type Tab = "trace" | "explain" | "code"

export default function SimulatorPanel(_props: SimulatorPanelProps) {
  const [activeTab, setActiveTab] = useState<Tab>("trace")

  const tabs: { id: Tab; label: string }[] = [
    { id: "trace", label: "Teste de Mesa" },
    { id: "explain", label: "Explicação" },
    { id: "code", label: "Código" },
  ]

  return (
    <div className="flex flex-col h-full">
      <div className="flex border-b shrink-0">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex-1 py-3 text-xs font-semibold uppercase tracking-widest transition-colors ${
              activeTab === tab.id
                ? "text-blue-600 border-b-2 border-blue-600"
                : "text-gray-400 hover:text-gray-600"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="flex-1 relative min-h-0">
        {activeTab === "trace" && (
          <div className="absolute inset-0 p-4">
            <div className="h-full border border-dashed border-gray-300 rounded-lg flex items-center justify-center">
              <div className="text-center">
                <p className="text-sm text-gray-400">Nenhum passo executado</p>
                <p className="text-xs text-gray-300 mt-1">Clique em "Iniciar Execução" para começar</p>
              </div>
            </div>
          </div>
        )}

        {activeTab === "explain" && (
          <div className="absolute inset-0 p-4">
            <div className="h-full border border-dashed border-gray-300 rounded-lg flex items-center justify-center">
              <p className="text-sm text-gray-400">Aguardando execução...</p>
            </div>
          </div>
        )}

        {activeTab === "code" && (
          <div className="absolute inset-0 p-4">
            <div className="h-full border border-dashed border-gray-300 rounded-lg flex items-center justify-center">
              <p className="text-sm text-gray-400">O código será gerado aqui</p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
