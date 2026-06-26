'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import {
  getVendasClientes,
  getVendasAlertas,
  resolveVendasAlerta,
  getVendasMetasDefinicoes,
  getVendasCorretores,
  getVendasEquipes
} from '@/lib/api'
import { VendasCliente, VendasAlerta, VendasMetasDefinicao, VendasCorretor, VendasEquipe } from '@/lib/types'
import { fmtBRL, ETAPAS } from '@/lib/constants'
import { 
  DollarSign, 
  TrendingUp, 
  Target, 
  AlertTriangle, 
  CheckCircle2, 
  Clock, 
  ShieldAlert, 
  ArrowUpRight, 
  ChevronRight,
  RefreshCw
} from 'lucide-react'

export default function VendasVgvPage() {
  const { user, loading: authLoading } = useAuth()
  const router = useRouter()
  
  const [clientesAll, setClientesAll] = useState<VendasCliente[]>([])
  const [alertas, setAlertas] = useState<VendasAlerta[]>([])
  const [metas, setMetas] = useState<VendasMetasDefinicao[]>([])
  const [corretores, setCorretores] = useState<VendasCorretor[]>([])
  const [equipes, setEquipes] = useState<VendasEquipe[]>([])

  // Escopo da meta/painel: todos | uma equipe | um vendedor
  const [escopoTipo, setEscopoTipo] = useState<'todos' | 'equipe' | 'vendedor'>('todos')
  const [escopoId, setEscopoId] = useState<string>('')

  const [dataLoading, setDataLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [resolvingId, setResolvingId] = useState<string | null>(null)
  
  // Chart period state (Last 6 Months or Last 12 Months)
  const [chartPeriod, setChartPeriod] = useState<6 | 12>(6)

  const loadData = async () => {
    try {
      const [cls, alts, mts, corrs, eqps] = await Promise.all([
        getVendasClientes(),
        getVendasAlertas(),
        getVendasMetasDefinicoes(),
        getVendasCorretores(),
        getVendasEquipes()
      ])
      setClientesAll(cls)
      setAlertas(alts.filter(a => !a.resolvido)) // only unresolved alerts
      setMetas(mts)
      setCorretores(corrs)
      setEquipes(eqps)
    } catch (err) {
      console.error("Erro ao carregar dados do painel VGV:", err)
    }
  }

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

    async function init() {
      setDataLoading(true)
      await loadData()
      setDataLoading(false)
    }
    init()
  }, [user, authLoading, router])

  const handleRefresh = async () => {
    setRefreshing(true)
    await loadData()
    setRefreshing(false)
  }

  const handleResolveAlert = async (alertId: string) => {
    setResolvingId(alertId)
    const success = await resolveVendasAlerta(alertId)
    if (success) {
      setAlertas(prev => prev.filter(a => a.id !== alertId))
    }
    setResolvingId(null)
  }

  if (authLoading || dataLoading) {
    return (
      <div className="flex h-[80vh] items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-3">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-[#33415C] border-t-transparent"></div>
          <span className="text-sm font-semibold text-slate-600 font-sans">Carregando painel de VGV...</span>
        </div>
      </div>
    )
  }

  if (user?.role !== 'superadmin') return null

  // --- ESCOPO (todos | equipe | vendedor) -------------------------------
  const equipeDoCorretor = (cid?: string | null) =>
    corretores.find(c => c.id === cid)?.equipe_id || null

  const clientes = escopoTipo === 'todos'
    ? clientesAll
    : escopoTipo === 'vendedor'
      ? clientesAll.filter(c => c.corretor_id === escopoId)
      : clientesAll.filter(c => equipeDoCorretor(c.corretor_id) === escopoId)

  // Meta-alvo conforme o escopo selecionado
  const somaMetas = metas.reduce((s, m) => s + Number(m.vgv_anual_movel || 0), 0)
  const metaDaEquipe = (eqId: string) =>
    Number(metas.find(m => m.equipe_id === eqId)?.vgv_anual_movel || 0)

  let targetMetaVgv = 0
  if (escopoTipo === 'todos') {
    targetMetaVgv = somaMetas > 0 ? somaMetas : 5000000
  } else if (escopoTipo === 'equipe') {
    targetMetaVgv = metaDaEquipe(escopoId)
  } else {
    // vendedor → parte proporcional da meta da equipe dele
    const eq = equipeDoCorretor(escopoId)
    const metaEq = eq ? metaDaEquipe(eq) : 0
    const nVend = eq ? corretores.filter(c => c.equipe_id === eq).length : 0
    targetMetaVgv = nVend > 0 ? metaEq / nVend : 0
  }

  const escopoLabel = escopoTipo === 'todos'
    ? 'Soma das metas de todas as equipes'
    : escopoTipo === 'equipe'
      ? `Equipe: ${equipes.find(e => e.id === escopoId)?.nome || '—'}`
      : `Vendedor: ${corretores.find(c => c.id === escopoId)?.nome || '—'} (cota proporcional)`

  // --- METRICS CALCULATION ---
  // 1. Total VGV Closed (Sucesso finalizado)
  const vgvClosed = clientes
    .filter(c => c.finalizado && c.status_finalizacao === 'sucesso')
    .reduce((sum, c) => sum + (c.valor_fechado || 0), 0)

  // 2. Active VGV in funnel (non-finalized)
  const vgvActive = clientes
    .filter(c => !c.finalizado)
    .reduce((sum, c) => sum + (c.valor || 0), 0)

  // 3. Projected weighted VGV (multiplying each deal by its stage conversion rate)
  //    Calibrado para o funil REAL de 6 etapas (constants.ts → vendas_clientes.etapa 0..5),
  //    não para o modelo E1-E9 (que não é o que o CRM grava).
  const getStageProbability = (etapa: number) => {
    switch (etapa) {
      case 0: return 0.05 // Triagem
      case 1: return 0.10 // Atendimento & Match
      case 2: return 0.25 // Visita
      case 3: return 0.50 // Proposta
      case 4: return 0.75 // Negociação
      case 5: return 0.90 // Fechamento
      default: return 0.05
    }
  }

  const vgvProjectedWeighted = clientes
    .filter(c => !c.finalizado)
    .reduce((sum, c) => sum + (c.valor * getStageProbability(c.etapa)), 0)

  // (targetMetaVgv já calculado acima conforme o escopo)

  // Target percent achievement
  const metaPercentage = targetMetaVgv > 0 ? (vgvClosed / targetMetaVgv) * 100 : 0

  // --- CHART DATA PREPARATION ---
  // We want to generate data for the last N months.
  const getMonthName = (monthIndex: number) => {
    const months = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez']
    return months[monthIndex]
  }

  const generateChartData = () => {
    const dataPoints = []
    const now = new Date()
    
    // Create array of last N months
    for (let i = chartPeriod - 1; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
      const monthStart = new Date(d.getFullYear(), d.getMonth(), 1)
      const monthEnd = new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59)
      
      // VGV closed strictly within or before this month to calculate cumulative sum
      const vgvUpToMonth = clientes
        .filter(c => {
          if (!c.finalizado || c.status_finalizacao !== 'sucesso' || !c.updated_at) return false
          const updateDate = new Date(c.updated_at)
          return updateDate <= monthEnd
        })
        .reduce((sum, c) => sum + (c.valor_fechado || 0), 0)

      // Ideal target line at this month (proportional target increase)
      // Standard calculation: linearly scaling the annual target targetMetaVgv
      // If we assume a linear target, each month should accumulate 1/12th of annual target
      // We will place the baseline starting at a reasonable baseline or relative to current month offset
      // Since it's a moving annual target, we compare cumulative closed sales against the target.
      const elapsedMonthsFraction = (chartPeriod - i) / chartPeriod
      const targetValue = targetMetaVgv * elapsedMonthsFraction

      dataPoints.push({
        label: `${getMonthName(d.getMonth())}/${d.getFullYear().toString().substring(2)}`,
        realized: vgvUpToMonth,
        target: targetValue
      })
    }
    
    return dataPoints
  }

  const chartData = generateChartData()

  // Format alert type
  const getAlertBadgeConfig = (tipo: string) => {
    switch (tipo) {
      case 'loop_detectado':
        return { label: 'Loop de Conversa', color: 'bg-rose-50 text-rose-700 border-rose-100 ring-rose-500/20', desc: 'Lais detectou loops ou respostas idênticas na conversa.' }
      case 'imovel_fora_catalogo':
        return { label: 'Fora do Catálogo', color: 'bg-purple-50 text-purple-700 border-purple-100 ring-purple-500/20', desc: 'Cliente pediu imóvel indisponível ou fora do catálogo.' }
      case 'lead_quente_sem_resposta':
        return { label: 'Sem Resposta (Quente)', color: 'bg-amber-50 text-amber-700 border-amber-100 ring-amber-500/20', desc: 'Lead qualificado quente está aguardando retorno.' }
      case 'conversa_sem_avanco':
        return { label: 'Sem Avanço', color: 'bg-blue-50 text-blue-700 border-blue-100 ring-blue-500/20', desc: 'Múltiplas interações sem avanço de etapa.' }
      case 'pergunta_repetida':
        return { label: 'Perguntas Repetidas', color: 'bg-indigo-50 text-indigo-700 border-indigo-100 ring-indigo-500/20', desc: 'Lead fazendo a mesma pergunta repetidas vezes.' }
      case 'nao_encaminha_visita':
        return { label: 'Fase Fria', color: 'bg-slate-50 text-slate-700 border-slate-200 ring-slate-500/10', desc: 'Lead qualificado travado na fase inicial sem agendar visita.' }
      default:
        return { label: 'Alerta Operacional', color: 'bg-slate-50 text-slate-600 border-slate-200', desc: 'Verifique o lead no CRM.' }
    }
  }

  // Format date helper
  const formatAlertDate = (dateStr?: string) => {
    if (!dateStr) return ''
    const d = new Date(dateStr)
    return d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }) + ' às ' + d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
  }

  return (
    <div className="space-y-6 p-6 bg-slate-50/50 min-h-screen">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <h1 className="text-xl md:text-2xl font-black text-[#33415C] flex items-center gap-2 tracking-tight">
            💰 Metas &amp; Evolução de VGV
          </h1>
          <p className="text-xs text-slate-500 mt-1">Consolidado analítico de fechamentos de contratos, projeções financeiras e alertas em tempo real.</p>
        </div>
        
        <div className="flex items-center gap-3 flex-wrap">
          {/* Escopo da meta: todos | equipe | vendedor */}
          <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-xl px-3 py-1.5 shadow-sm">
            <span className="text-[10px] font-black text-slate-500 uppercase tracking-wider">Meta:</span>
            <select
              value={escopoTipo}
              onChange={(e) => {
                const t = e.target.value as 'todos' | 'equipe' | 'vendedor'
                setEscopoTipo(t)
                setEscopoId(t === 'equipe' ? (equipes[0]?.id || '') : t === 'vendedor' ? (corretores[0]?.id || '') : '')
              }}
              className="border-none rounded-lg p-1 text-xs font-semibold bg-white cursor-pointer outline-none focus:ring-0 text-slate-700"
            >
              <option value="todos">Todos</option>
              <option value="equipe">Por equipe</option>
              <option value="vendedor">Por vendedor</option>
            </select>
            {escopoTipo === 'equipe' && (
              <select
                value={escopoId}
                onChange={(e) => setEscopoId(e.target.value)}
                className="border-l border-slate-200 pl-2 rounded-lg p-1 text-xs font-semibold bg-white cursor-pointer outline-none focus:ring-0 text-slate-700 max-w-[160px]"
              >
                {equipes.length === 0 && <option value="">Sem equipes</option>}
                {equipes.map((eq) => <option key={eq.id} value={eq.id}>{eq.nome}</option>)}
              </select>
            )}
            {escopoTipo === 'vendedor' && (
              <select
                value={escopoId}
                onChange={(e) => setEscopoId(e.target.value)}
                className="border-l border-slate-200 pl-2 rounded-lg p-1 text-xs font-semibold bg-white cursor-pointer outline-none focus:ring-0 text-slate-700 max-w-[160px]"
              >
                {corretores.length === 0 && <option value="">Sem vendedores</option>}
                {corretores.map((co) => <option key={co.id} value={co.id}>{co.nome}</option>)}
              </select>
            )}
          </div>

          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="flex items-center gap-2 bg-white border border-slate-200 hover:bg-slate-50 hover:border-slate-300 text-slate-700 rounded-xl px-4 py-2 text-xs font-bold shadow-sm transition-all cursor-pointer disabled:opacity-50"
          >
            <RefreshCw size={14} className={refreshing ? 'animate-spin' : ''} />
            Sincronizar
          </button>
        </div>
      </div>

      {/* Grid de KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        
        {/* KPI 1: VGV Realizado */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-2 relative overflow-hidden bg-gradient-to-br from-emerald-50/10 to-white">
          <div className="flex justify-between items-start">
            <span className="text-[10px] text-emerald-600 font-extrabold uppercase tracking-widest block">VGV Realizado (Fechado)</span>
            <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl">
              <DollarSign size={18} />
            </div>
          </div>
          <h3 className="text-2xl font-black text-slate-800 tracking-tight">{fmtBRL(vgvClosed)}</h3>
          <p className="text-[10px] text-slate-500 font-medium flex items-center gap-1">
            <span className="text-emerald-600 font-extrabold flex items-center">
              <TrendingUp size={12} className="inline mr-0.5" />
              {metaPercentage.toFixed(1)}%
            </span>
            da meta anual móvel atingido
          </p>
        </div>

        {/* KPI 2: VGV Ativo Funil */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-2 relative overflow-hidden bg-gradient-to-br from-blue-50/10 to-white">
          <div className="flex justify-between items-start">
            <span className="text-[10px] text-blue-600 font-extrabold uppercase tracking-widest block">Pipeline no Funil (Bruto)</span>
            <div className="p-2 bg-blue-50 text-blue-600 rounded-xl">
              <ArrowUpRight size={18} />
            </div>
          </div>
          <h3 className="text-2xl font-black text-slate-800 tracking-tight">{fmtBRL(vgvActive)}</h3>
          <p className="text-[10px] text-slate-500 font-medium">
            Soma bruta de {clientes.filter(c => !c.finalizado).length} leads ativos no CRM
          </p>
        </div>

        {/* KPI 3: VGV Projetado Ponderado */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-2 relative overflow-hidden bg-gradient-to-br from-purple-50/10 to-white">
          <div className="flex justify-between items-start">
            <span className="text-[10px] text-purple-600 font-extrabold uppercase tracking-widest block">Pipeline Ponderado</span>
            <div className="p-2 bg-purple-50 text-purple-600 rounded-xl">
              <TrendingUp size={18} />
            </div>
          </div>
          <h3 className="text-2xl font-black text-purple-700 tracking-tight">{fmtBRL(vgvProjectedWeighted)}</h3>
          <p className="text-[10px] text-slate-500 font-medium">
            Ajustado pela probabilidade de cada etapa
          </p>
        </div>

        {/* KPI 4: Meta Anual Vigente */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-2 relative overflow-hidden bg-gradient-to-br from-indigo-50/10 to-white">
          <div className="flex justify-between items-start">
            <span className="text-[10px] text-indigo-600 font-extrabold uppercase tracking-widest block">Meta Anual Móvel</span>
            <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
              <Target size={18} />
            </div>
          </div>
          <h3 className="text-2xl font-black text-slate-800 tracking-tight">{fmtBRL(targetMetaVgv)}</h3>
          <p className="text-[10px] text-slate-500 font-medium">
            {escopoLabel}
          </p>
        </div>
      </div>

      {/* Bloco do Gráfico de Evolução e Progresso */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Gráfico SVG de Evolução do VGV vs Meta */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm lg:col-span-2 space-y-4">
          <div className="flex justify-between items-center pb-2 border-b border-slate-100">
            <div>
              <h3 className="text-sm font-extrabold text-[#33415C] uppercase tracking-wide">Evolução do VGV vs Linha de Metas</h3>
              <p className="text-[10px] text-slate-400 font-medium mt-0.5">Visão cumulativa de fechamentos reais vs escalonamento proporcional do alvo anual.</p>
            </div>
            
            <div className="flex bg-slate-100 rounded-lg p-0.5 border border-slate-200/50">
              <button
                onClick={() => setChartPeriod(6)}
                className={`px-2.5 py-1 text-[10px] font-bold rounded-md transition-all cursor-pointer ${chartPeriod === 6 ? 'bg-[#33415C] text-white shadow-xs' : 'text-slate-500 hover:text-[#33415C]'}`}
              >
                6 Meses
              </button>
              <button
                onClick={() => setChartPeriod(12)}
                className={`px-2.5 py-1 text-[10px] font-bold rounded-md transition-all cursor-pointer ${chartPeriod === 12 ? 'bg-[#33415C] text-white shadow-xs' : 'text-slate-500 hover:text-[#33415C]'}`}
              >
                12 Meses
              </button>
            </div>
          </div>

          {/* Gráfico customizado SVG */}
          <div className="relative w-full h-[320px] bg-gradient-to-b from-slate-50/50 to-white border border-slate-100 rounded-xl p-4 flex flex-col justify-between">
            {/* SVG Plot */}
            <div className="w-full flex-1 relative">
              <svg viewBox="0 0 500 200" className="w-full h-full overflow-visible">
                {/* Defs para gradientes */}
                <defs>
                  <linearGradient id="realizedGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#10b981" stopOpacity="0.2" />
                    <stop offset="100%" stopColor="#10b981" stopOpacity="0.0" />
                  </linearGradient>
                  <linearGradient id="targetGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#1f4e79" stopOpacity="0.1" />
                    <stop offset="100%" stopColor="#1f4e79" stopOpacity="0.0" />
                  </linearGradient>
                </defs>

                {/* Grid Lines */}
                <line x1="0" y1="40" x2="500" y2="40" stroke="#f1f5f9" strokeWidth="1" />
                <line x1="0" y1="90" x2="500" y2="90" stroke="#f1f5f9" strokeWidth="1" />
                <line x1="0" y1="140" x2="500" y2="140" stroke="#f1f5f9" strokeWidth="1" />
                <line x1="0" y1="190" x2="500" y2="190" stroke="#e2e8f0" strokeWidth="1" />

                {/* Math for mapping coordinates */}
                {(() => {
                  const maxVal = Math.max(...chartData.map(d => Math.max(d.realized, d.target, 100000))) * 1.15
                  const xStep = 500 / (chartData.length - 1 || 1)
                  
                  // Compute points
                  const pointsRealized = chartData.map((d, i) => ({
                    x: i * xStep,
                    y: 190 - (d.realized / maxVal) * 150
                  }))

                  const pointsTarget = chartData.map((d, i) => ({
                    x: i * xStep,
                    y: 190 - (d.target / maxVal) * 150
                  }))

                  const realizedPathStr = pointsRealized.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ')
                  const targetPathStr = pointsTarget.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ')

                  const realizedAreaStr = realizedPathStr ? `${realizedPathStr} L ${pointsRealized[pointsRealized.length - 1].x} 190 L 0 190 Z` : ''
                  const targetAreaStr = targetPathStr ? `${targetPathStr} L ${pointsTarget[pointsTarget.length - 1].x} 190 L 0 190 Z` : ''

                  return (
                    <>
                      {/* Areas */}
                      {targetAreaStr && <path d={targetAreaStr} fill="url(#targetGrad)" />}
                      {realizedAreaStr && <path d={realizedAreaStr} fill="url(#realizedGrad)" />}

                      {/* Target Line */}
                      {targetPathStr && <path d={targetPathStr} fill="none" stroke="#94a3b8" strokeWidth="2" strokeDasharray="4 3" />}
                      
                      {/* Realized Line */}
                      {realizedPathStr && <path d={realizedPathStr} fill="none" stroke="#10b981" strokeWidth="3.5" />}

                      {/* Data dots */}
                      {pointsRealized.map((p, idx) => (
                        <g key={`real-${idx}`}>
                          <circle cx={p.x} cy={p.y} r="5" fill="#10b981" className="cursor-pointer" />
                          <circle cx={p.x} cy={p.y} r="2" fill="#fff" />
                          {/* Label value */}
                          <text 
                            x={p.x} 
                            y={p.y - 10} 
                            textAnchor="middle" 
                            fontSize="8" 
                            fontWeight="bold" 
                            fill="#1e293b"
                          >
                            {fmtBRL(chartData[idx].realized).replace(',00', '').replace('R$', '').trim()}
                          </text>
                        </g>
                      ))}

                      {/* X Axis Labels */}
                      {chartData.map((d, i) => (
                        <text
                          key={`lbl-${i}`}
                          x={i * xStep}
                          y="205"
                          textAnchor="middle"
                          fontSize="9"
                          fontWeight="bold"
                          fill="#64748b"
                        >
                          {d.label}
                        </text>
                      ))}
                    </>
                  )
                })()}
              </svg>
            </div>

            {/* Legend */}
            <div className="flex gap-4 items-center justify-center text-[10px] font-bold text-slate-500 pt-3 border-t border-slate-100">
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-0.5 bg-[#94a3b8] border-t border-dashed border-[#94a3b8]"></span>
                <span>Projeção de Meta Acumulada</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-1 bg-[#10b981] rounded"></span>
                <span className="text-[#10b981]">VGV Acumulado Realizado ({fmtBRL(vgvClosed)})</span>
              </div>
            </div>
          </div>
        </div>

        {/* Funil Visual Rápido */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-4">
          <div>
            <h3 className="text-sm font-extrabold text-[#33415C] uppercase tracking-wide">Fases do Pipeline Ativo</h3>
            <p className="text-[10px] text-slate-400 font-medium mt-0.5">Distribuição do volume financeiro ativo do CRM pelas principais fases.</p>
          </div>

          <div className="space-y-3.5">
            {[
              // Fases agregadas sobre o funil real de 6 etapas (0..5) — antes usava
              // faixas E1-E12 que não existem nos dados (baldes ficavam vazios/trocados).
              { label: 'Qualificação (Triagem + Match)', color: 'bg-blue-500', value: clientes.filter(c => !c.finalizado && c.etapa <= 1).reduce((sum, c) => sum + (c.valor || 0), 0), count: clientes.filter(c => !c.finalizado && c.etapa <= 1).length },
              { label: 'Visita', color: 'bg-amber-500', value: clientes.filter(c => !c.finalizado && c.etapa === 2).reduce((sum, c) => sum + (c.valor || 0), 0), count: clientes.filter(c => !c.finalizado && c.etapa === 2).length },
              { label: 'Proposta + Negociação', color: 'bg-indigo-500', value: clientes.filter(c => !c.finalizado && c.etapa >= 3 && c.etapa <= 4).reduce((sum, c) => sum + (c.valor || 0), 0), count: clientes.filter(c => !c.finalizado && c.etapa >= 3 && c.etapa <= 4).length },
              { label: 'Fechamento', color: 'bg-emerald-500', value: clientes.filter(c => !c.finalizado && c.etapa >= 5).reduce((sum, c) => sum + (c.valor || 0), 0), count: clientes.filter(c => !c.finalizado && c.etapa >= 5).length },
            ].map((f, i) => {
              const pct = vgvActive > 0 ? (f.value / vgvActive) * 100 : 0
              return (
                <div key={i} className="space-y-1 text-xs">
                  <div className="flex justify-between items-center font-bold text-slate-700">
                    <span className="flex items-center gap-1.5">
                      <span className={`w-2.5 h-2.5 rounded-full ${f.color}`}></span>
                      {f.label}
                    </span>
                    <span className="text-[10px] text-slate-400 font-extrabold">{f.count} lead(s)</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="flex-1 bg-slate-50 h-2 border border-slate-100 rounded overflow-hidden">
                      <div className={`h-full ${f.color}`} style={{ width: `${pct}%` }}></div>
                    </div>
                    <span className="font-extrabold text-[10px] text-slate-700 w-20 text-right">{fmtBRL(f.value).replace(',00', '')}</span>
                  </div>
                </div>
              )
            })}
          </div>

          <div className="pt-4 border-t border-slate-100 flex flex-col justify-end h-full">
            <div className="bg-slate-50/80 rounded-xl p-3.5 border border-slate-100 space-y-2">
              <span className="text-[9px] text-[#33415C] font-black uppercase tracking-wider block">Inspeção da Carteira</span>
              <p className="text-[11px] text-slate-500 font-medium leading-relaxed">
                O funil conta hoje com <strong className="text-[#33415C]">{clientes.filter(c => !c.finalizado && c.temp === 'quente').length} leads quentes</strong>, representando <strong className="text-[#33415C]">{fmtBRL(clientes.filter(c => !c.finalizado && c.temp === 'quente').reduce((sum, c) => sum + c.valor, 0))}</strong> de receita potencial imediata.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Painel de Alertas em Tempo Real */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-4">
        <div className="flex justify-between items-center pb-3 border-b border-slate-100">
          <div>
            <h3 className="text-sm font-extrabold text-rose-600 uppercase tracking-wide flex items-center gap-2">
              <ShieldAlert size={18} />
              Alertas Operacionais Ativos (Lais × CRM)
            </h3>
            <p className="text-[10px] text-slate-400 font-medium mt-0.5">Alertas automáticos gerados por inatividade, desvios no funil ou loops de conversação com o bot.</p>
          </div>
          
          <span className="bg-rose-50 text-rose-700 text-[10px] font-black px-2.5 py-1 rounded-full border border-rose-100">
            {alertas.length} pendentes
          </span>
        </div>

        <div className="divide-y divide-slate-100">
          {alertas.map(alert => {
            const config = getAlertBadgeConfig(alert.tipo)
            return (
              <div 
                key={alert.id} 
                className="py-4 flex flex-col md:flex-row md:items-center justify-between gap-4 animate-fadeIn transition-all"
              >
                <div className="flex items-start gap-3">
                  <div className="mt-0.5 p-1.5 bg-rose-50 text-rose-600 rounded-lg">
                    <AlertTriangle size={15} />
                  </div>
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className={`px-2 py-0.5 border rounded-full text-[9px] font-extrabold tracking-wide uppercase ${config.color}`}>
                        {config.label}
                      </span>
                      <span className="text-xs font-black text-slate-800">
                        Lead: {alert.lead_nome || 'Desconhecido'}
                      </span>
                      <span className="text-[9px] text-slate-400 font-bold flex items-center gap-0.5">
                        <Clock size={10} />
                        Disparado {formatAlertDate(alert.created_at)}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 font-medium">
                      {alert.detalhe?.mensagem || config.desc}
                    </p>
                    
                    {/* Exibe detalhes extras se houver */}
                    {alert.detalhe?.codigo_imovel && (
                      <span className="inline-block bg-purple-50 text-purple-700 text-[9px] font-bold px-2 py-0.5 rounded border border-purple-100">
                        Código Imóvel: {alert.detalhe.codigo_imovel}
                      </span>
                    )}
                    {alert.detalhe?.horas_sem_resposta && (
                      <span className="inline-block bg-amber-50 text-amber-700 text-[9px] font-bold px-2 py-0.5 rounded border border-amber-100">
                        Horas sem resposta: {alert.detalhe.horas_sem_resposta}h
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  {alert.acao_disparada && (
                    <span className="text-[10px] text-slate-400 font-bold bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-100">
                      Ação: {alert.acao_disparada}
                    </span>
                  )}
                  <button
                    onClick={() => handleResolveAlert(alert.id)}
                    disabled={resolvingId === alert.id}
                    className="flex items-center gap-1 bg-white border border-slate-200 hover:bg-emerald-50 hover:border-emerald-200 hover:text-emerald-700 text-slate-600 rounded-xl px-3 py-1.5 text-xs font-extrabold shadow-xs transition-all cursor-pointer disabled:opacity-50"
                  >
                    <CheckCircle2 size={13} />
                    {resolvingId === alert.id ? 'Resolvendo...' : 'Marcar Resolvido'}
                  </button>
                </div>
              </div>
            )
          })}

          {alertas.length === 0 && (
            <div className="text-center py-8 space-y-2">
              <CheckCircle2 size={36} className="text-emerald-400 mx-auto" />
              <h4 className="text-xs font-bold text-slate-600">Sem alertas pendentes!</h4>
              <p className="text-[10px] text-slate-400">Excelente! Toda a operação de leads e atendimentos está rodando dentro do prazo.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
