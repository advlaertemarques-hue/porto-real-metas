'use client'

import { Video } from 'lucide-react'

export default function ReunioesPage() {
  return (
    <div>
      <div className="mb-6">
        <h1 className="text-xl font-bold text-gray-900">Reuniões</h1>
        <p className="text-sm text-gray-400 mt-0.5">Agenda e histórico de reuniões da equipe</p>
      </div>

      <div className="bg-white border border-gray-100 rounded-xl p-12 text-center">
        <Video size={48} className="text-gray-200 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-gray-400">Nenhuma reunião agendada</h3>
        <p className="text-sm text-gray-300 mt-1">
          Reuniões semanais de acompanhamento aparecerão aqui.
        </p>
      </div>
    </div>
  )
}
