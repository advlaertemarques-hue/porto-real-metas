'use client'

import { Corretor } from '@/lib/types'
import { Mail, Hash, Clock } from 'lucide-react'

interface CorretorCardProps {
  corretor: Corretor
}

export default function CorretorCard({ corretor }: CorretorCardProps) {
  const iniciais = corretor.nome
    .split(' ')
    .map((n) => n[0])
    .join('')
    .substring(0, 2)
    .toUpperCase()

  const equipeLabel = corretor.equipe || 'SEM EQUIPE'
  const equipeColor = corretor.equipe ? 'bg-red-50 text-porto-red' : 'bg-blue-50 text-porto-blue'

  return (
    <div className="bg-white border border-gray-100 rounded-xl overflow-hidden hover:shadow-lg transition-shadow group">
      {/* Color bar top */}
      <div className="h-1" style={{ backgroundColor: corretor.cor_barra }} />

      <div className="p-5">
        {/* Avatar */}
        <div
          className="w-14 h-14 rounded-xl flex items-center justify-center text-white text-lg font-bold mb-4"
          style={{ backgroundColor: corretor.cor_barra }}
        >
          {iniciais}
        </div>

        {/* Nome */}
        <h4 className="text-base font-bold text-gray-900 mb-2">{corretor.nome}</h4>

        {/* Info */}
        <div className="space-y-1.5 mb-4">
          <div className="flex items-center gap-2 text-xs text-gray-500">
            <Mail size={12} />
            <span className="truncate">{corretor.email}</span>
          </div>
          {corretor.creci && (
            <div className="flex items-center gap-2 text-xs text-gray-500">
              <Hash size={12} />
              <span>{corretor.creci}</span>
            </div>
          )}
        </div>

        {/* Equipe + Status */}
        <div className="flex items-center justify-between mb-4">
          <span className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full ${equipeColor}`}>
            {equipeLabel}
          </span>
          <div className="flex items-center gap-1.5">
            <div className={`w-2 h-2 rounded-full ${corretor.status === 'ativo' ? 'bg-green-400' : 'bg-gray-300'}`} />
            <span className="text-xs text-gray-500 capitalize">{corretor.status}</span>
          </div>
        </div>

        {/* Nível */}
        <div className="flex items-center justify-between pt-3 border-t border-gray-100">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-gray-400">
            Nível Atual
          </span>
          <div className="flex items-center gap-1.5">
            <span className="text-xl font-bold text-porto-blue">{corretor.nivel_atual}%</span>
            <Clock size={14} className="text-gray-300" />
          </div>
        </div>
      </div>
    </div>
  )
}
