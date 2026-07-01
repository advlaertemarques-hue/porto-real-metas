'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { getMetricasAvancadas } from '@/lib/api'
import {
  VendasMTempoResposta,
  VendasMFunil,
  VendasMNoShow,
  VendasMHandoff,
  VendasMOndeTreinar,
  VendasMLaisVsHumano,
  VendasMTravasPagamento,
  VendasMCicloTotal,
  VendasMClienteEtapas
} from '@/lib/types'
import PainelMetricas from '@/components/vendas/PainelMetricas'

export default function AuditoriaPage() {
  const { user, loading: authLoading } = useAuth()
  const router = useRouter()
  const [metricsTempo, setMetricsTempo] = useState<VendasMTempoResposta[]>([])
  const [metricsFunil, setMetricsFunil] = useState<VendasMFunil[]>([])
  const [metricsNoShow, setMetricsNoShow] = useState<VendasMNoShow[]>([])
  const [metricsHandoff, setMetricsHandoff] = useState<VendasMHandoff[]>([])
  const [metricsTreinar, setMetricsTreinar] = useState<VendasMOndeTreinar[]>([])
  const [metricsLaisVsHumano, setMetricsLaisVsHumano] = useState<VendasMLaisVsHumano[]>([])
  const [metricsTravas, setMetricsTravas] = useState<VendasMTravasPagamento[]>([])
  const [metricsCiclo, setMetricsCiclo] = useState<VendasMCicloTotal[]>([])
  const [metricsPorCliente, setMetricsPorCliente] = useState<VendasMClienteEtapas[]>([])
  const [dataLoading, setDataLoading] = useState(true)

  useEffect(() => {
    if (authLoading) return
    if (!user) {
      router.replace('/login')
      return
    }

    if (user.role === 'vendas') {
      router.replace('/gestao-geral')
      return
    }

    async function loadData() {
      try {
        const m = await getMetricasAvancadas()
        setMetricsTempo(m.tempo)
        setMetricsFunil(m.funil)
        setMetricsNoShow(m.noShow)
        setMetricsHandoff(m.handoff)
        setMetricsTreinar(m.treinar)
        setMetricsLaisVsHumano(m.laisVsHumano)
        setMetricsTravas(m.travas)
        setMetricsCiclo(m.ciclo)
        setMetricsPorCliente(m.porCliente)
      } catch (err) {
        console.error("Erro ao carregar dados de auditoria/métricas:", err)
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
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-[#33415C] border-t-transparent"></div>
          <span className="text-sm font-semibold text-slate-600">Carregando métricas avançadas...</span>
        </div>
      </div>
    )
  }

  if (user?.role !== 'superadmin') return null

  return (
    <div className="bg-slate-50 min-h-screen">
      <PainelMetricas
        metricsTempo={metricsTempo}
        metricsNoShow={metricsNoShow}
        metricsHandoff={metricsHandoff}
        metricsFunil={metricsFunil}
        metricsTreinar={metricsTreinar}
        metricsLaisVsHumano={metricsLaisVsHumano}
        metricsTravas={metricsTravas}
        metricsCiclo={metricsCiclo}
        metricsPorCliente={metricsPorCliente}
      />
    </div>
  )
}
