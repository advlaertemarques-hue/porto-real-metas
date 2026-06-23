'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { getMetricsOndeTreinar } from '@/lib/api'
import { VendasMOndeTreinar } from '@/lib/types'
import { Award } from 'lucide-react'

function formatInterval(intervalStr: any) {
  if (!intervalStr) return '—'
  
  if (typeof intervalStr === 'object') {
    const obj = intervalStr as any
    const parts = []
    if (obj.days) parts.push(`${obj.days}d`)
    if (obj.hours) parts.push(`${obj.hours}h`)
    if (obj.minutes) parts.push(`${obj.minutes}m`)
    if (obj.seconds && !obj.minutes && !obj.hours) parts.push(`${obj.seconds}s`)
    return parts.join(' ') || '0m'
  }
  
  const str = String(intervalStr)
  if (str.includes(':')) {
    const timeParts = str.split(':')
    const hours = parseInt(timeParts[0])
    const minutes = parseInt(timeParts[1])
    const seconds = Math.round(parseFloat(timeParts[2]))
    
    const parts = []
    if (hours > 0) {
      if (hours >= 24) {
        const days = Math.floor(hours / 24)
        const remainingHours = hours % 24
        parts.push(`${days}d`)
        if (remainingHours > 0) parts.push(`${remainingHours}h`)
      } else {
        parts.push(`${hours}h`)
      }
    }
    if (minutes > 0) parts.push(`${minutes}m`)
    if (seconds > 0 && parts.length === 0) parts.push(`${seconds}s`)
    return parts.join(' ') || '0m'
  }
  
  return str
}

export default function TreinamentosPage() {
  const { user, loading: authLoading } = useAuth()
  const router = useRouter()
  const [metricsTreinar, setMetricsTreinar] = useState<VendasMOndeTreinar[]>([])
  const [dataLoading, setDataLoading] = useState(true)

  useEffect(() => {
    if (authLoading) return
    if (!user) {
      router.replace('/login')
      return
    }

    async function loadData() {
      try {
        const mTreinar = await getMetricsOndeTreinar()
        setMetricsTreinar(mTreinar)
      } catch (err) {
        console.error("Erro ao carregar dados de treinamento:", err)
      } finally {
        setDataLoading(false)
      }
    }
    loadData()
  }, [user, authLoading, router])

  if (authLoading || dataLoading) {
    return (
      <div className="flex h-[80vh] items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-3">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-[#1F4E79] border-t-transparent"></div>
          <span className="text-sm font-semibold text-slate-600">Carregando painel de treinamentos...</span>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6 animate-fadeIn">
      {/* Header section */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-md">
        <h2 className="text-xl md:text-2xl font-black text-[#1F4E79] tracking-tight flex items-center gap-2">
          <Award className="text-[#eb3238]" size={24} />
          Treinamentos &amp; Diagnóstico de Gargalos
        </h2>
        <p className="text-xs text-slate-500 font-semibold mt-1">
          Identifique as etapas do funil onde os corretores encontram maior dificuldade e planeje capacitações focadas.
        </p>
      </div>

      {/* Onde treinar list */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-md overflow-hidden space-y-4 p-5">
        <div>
          <h3 className="text-sm font-extrabold uppercase tracking-wide text-[#1F4E79]">Prioridades de Capacitação</h3>
          <p className="text-[11px] text-slate-400 mt-0.5 font-medium">Etapas críticas ordenadas por urgência de atenção (taxa de queda e tempo de conversão).</p>
        </div>

        <div className="space-y-3 pr-1">
          {metricsTreinar.map((t, idx) => {
            let badgeBg = 'bg-slate-50 text-slate-600 border-slate-100'
            let badgeText = 'Sem Urgência'
            if (t.indice_atencao > 10) {
              badgeBg = 'bg-rose-50 text-rose-700 border-rose-100'
              badgeText = 'Atenção Máxima'
            } else if (t.indice_atencao > 2) {
              badgeBg = 'bg-amber-50 text-amber-700 border-amber-100'
              badgeText = 'Atenção Média'
            } else if (t.indice_atencao > 0) {
              badgeBg = 'bg-emerald-50 text-emerald-700 border-emerald-100'
              badgeText = 'Etapa Saudável'
            }

            return (
              <div key={idx} className="bg-slate-50/50 border border-slate-200/70 p-4 rounded-xl space-y-3 text-xs font-semibold">
                <div className="flex justify-between items-center">
                  <span className="font-extrabold text-sm text-slate-800 flex items-center gap-1.5">
                    <span className="bg-[#1F4E79] text-white px-2 py-0.5 rounded text-[10px] font-black">{t.codigo}</span>
                    {t.nome}
                  </span>
                  <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-extrabold border ${badgeBg}`}>
                    {badgeText}
                  </span>
                </div>

                <div className="grid grid-cols-3 text-slate-500 gap-4 text-xs font-bold pt-1">
                  <div>
                    <span className="text-[9px] text-slate-400 uppercase block">Tempo Médio na Etapa</span>
                    <span className="text-slate-700 text-sm">{formatInterval(t.tempo_medio)}</span>
                  </div>
                  <div>
                    <span className="text-[9px] text-slate-400 uppercase block">Taxa de Queda (Leads Perdidos)</span>
                    <span className="text-slate-700 text-sm">{t.taxa_queda_pct}%</span>
                  </div>
                  <div>
                    <span className="text-[9px] text-slate-400 uppercase block">Índice de Atenção</span>
                    <span className="text-slate-700 text-sm font-extrabold">{t.indice_atencao}</span>
                  </div>
                </div>
              </div>
            )
          })}

          {metricsTreinar.length === 0 && (
            <div className="text-center italic text-slate-400 py-8 text-xs font-semibold">
              Sem dados de treinamento coletados ainda.
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
