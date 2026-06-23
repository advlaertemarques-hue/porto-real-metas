'use client'

import Link from 'next/link'
import { AcessoRapidoItem } from '@/lib/types'
import { ChevronRight } from 'lucide-react'

interface AcessoRapidoProps {
  items: AcessoRapidoItem[]
}

export default function AcessoRapido({ items }: AcessoRapidoProps) {
  return (
    <div className="bg-white border border-gray-100 rounded-xl p-6">
      <h3 className="text-[11px] font-semibold uppercase tracking-wider text-gray-400 mb-5">
        Acesso Rápido — Gestão
      </h3>
      <div className="space-y-0">
        {items.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="flex items-center justify-between py-4 border-b border-gray-50 last:border-0 group hover:bg-gray-50/50 -mx-2 px-2 rounded-lg transition-colors"
          >
            <div>
              <p className="text-sm font-semibold text-gray-800 group-hover:text-porto-blue transition-colors">
                {item.titulo}
              </p>
              <p className="text-xs text-gray-400">{item.descricao}</p>
            </div>
            <ChevronRight
              size={16}
              className="text-gray-300 group-hover:text-porto-blue transition-colors"
            />
          </Link>
        ))}
      </div>
    </div>
  )
}
