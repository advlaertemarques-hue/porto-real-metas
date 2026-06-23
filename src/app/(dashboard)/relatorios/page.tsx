'use client'

import { BarChart3 } from 'lucide-react'

export default function RelatoriosPage() {
  return (
    <div>
      <div className="mb-6">
        <h1 className="text-xl font-bold text-gray-900">Relatórios</h1>
        <p className="text-sm text-gray-400 mt-0.5">Análises detalhadas do desempenho</p>
      </div>

      <div className="bg-white border border-gray-100 rounded-xl p-12 text-center">
        <BarChart3 size={48} className="text-gray-200 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-gray-400">Relatórios em desenvolvimento</h3>
        <p className="text-sm text-gray-300 mt-1">
          Relatórios de performance individual e de equipe serão exibidos aqui.
        </p>
      </div>
    </div>
  )
}
