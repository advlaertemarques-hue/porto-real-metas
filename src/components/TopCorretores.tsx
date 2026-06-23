'use client'

import { TopCorretor } from '@/lib/types'

interface TopCorretoresProps {
  corretores: TopCorretor[]
  title?: string
}

export default function TopCorretores({ corretores, title = 'TOP CORRETORES — VGV 12 MESES' }: TopCorretoresProps) {
  return (
    <div className="bg-white border border-gray-100 rounded-xl p-6">
      <h3 className="text-[11px] font-semibold uppercase tracking-wider text-gray-400 mb-5">
        {title}
      </h3>
      <div className="space-y-0">
        {corretores.map((c) => (
          <div
            key={c.posicao}
            className="flex items-center justify-between py-4 border-b border-gray-50 last:border-0"
          >
            <div className="flex items-center gap-3">
              <span className="text-xs text-gray-300 w-5">#{c.posicao}</span>
              <div>
                <p className="text-sm font-semibold text-gray-800">{c.nome}</p>
                <p className="text-[11px] text-gray-400 uppercase tracking-wide">
                  {c.meses_validos} meses válidos
                </p>
              </div>
            </div>
            <span className="text-sm font-bold text-gray-700">
              R$ {(c.vgv / 1000000).toFixed(1)}M
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}
