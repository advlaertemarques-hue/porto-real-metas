'use client'

import { Activity } from 'lucide-react'
import {
  VendasMTempoResposta,
  VendasMNoShow,
  VendasMHandoff,
  VendasMFunil,
  VendasMOndeTreinar,
  VendasMLaisVsHumano,
  VendasMTravasPagamento,
  VendasMCicloTotal,
  VendasMClienteEtapas
} from '@/lib/types'

interface PainelMetricasProps {
  metricsTempo: VendasMTempoResposta[]
  metricsNoShow: VendasMNoShow[]
  metricsHandoff: VendasMHandoff[]
  metricsFunil: VendasMFunil[]
  metricsTreinar: VendasMOndeTreinar[]
  metricsLaisVsHumano: VendasMLaisVsHumano[]
  metricsTravas: VendasMTravasPagamento[]
  metricsCiclo: VendasMCicloTotal[]
  metricsPorCliente: VendasMClienteEtapas[]
}

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

export default function PainelMetricas({
  metricsTempo,
  metricsNoShow,
  metricsHandoff,
  metricsFunil,
  metricsTreinar,
  metricsLaisVsHumano,
  metricsTravas,
  metricsCiclo,
  metricsPorCliente
}: PainelMetricasProps) {
  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6 animate-fadeIn">
      {/* Header section */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-md">
        <h2 className="text-xl md:text-2xl font-black text-[#33415C] tracking-tight flex items-center gap-2">
          <Activity className="text-[#eb3238]" size={24} />
          Métricas Avançadas &amp; Diagnóstico (V5)
        </h2>
        <p className="text-xs text-slate-500 font-semibold mt-1">
          Acompanhe o desempenho do processo de vendas com base em eventos reais de transição de etapas, handoffs e travas.
        </p>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Tempo de Resposta */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-md space-y-3">
          <span className="text-[10px] text-slate-400 font-extrabold uppercase tracking-widest block">Tempo Médio de Atendimento (E1)</span>
          <div className="divide-y divide-slate-100">
            <div className="py-2 flex justify-between items-center">
              <span className="text-xs font-bold text-slate-600 flex items-center gap-1.5">🤖 Lais (Porta A)</span>
              <span className="font-extrabold text-sm text-emerald-600">
                {formatInterval(metricsTempo.find(t => t.porta === 'A' && t.dono_tipo === 'lais')?.tempo_medio || null)}
              </span>
            </div>
            <div className="py-2 flex justify-between items-center">
              <span className="text-xs font-bold text-slate-600 flex items-center gap-1.5">🏠 Corretor (Porta B)</span>
              <span className="font-extrabold text-sm text-[#33415C]">
                {formatInterval(metricsTempo.find(t => t.porta === 'B' && t.dono_tipo === 'humano')?.tempo_medio || null)}
              </span>
            </div>
          </div>
        </div>

        {/* No Show */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-md space-y-2">
          <span className="text-[10px] text-slate-400 font-extrabold uppercase tracking-widest block">Taxa de No-Show (Visitas)</span>
          {metricsNoShow.length > 0 ? (
            <div className="flex justify-between items-end">
              <div>
                <h3 className="text-2xl font-black text-rose-500">{metricsNoShow[0].taxa_no_show_pct}%</h3>
                <p className="text-[10px] text-slate-400 font-bold mt-1 uppercase">
                  {metricsNoShow[0].realizadas} realizadas / {metricsNoShow[0].agendadas} agendadas
                </p>
              </div>
              <div className="w-12 h-1.5 bg-rose-100 rounded-full overflow-hidden mb-1">
                <div className="h-full bg-rose-500" style={{ width: `${metricsNoShow[0].taxa_no_show_pct}%` }}></div>
              </div>
            </div>
          ) : (
            <span className="text-xs text-slate-400 italic">Sem dados registrados.</span>
          )}
        </div>

        {/* Handoff */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-md space-y-2">
          <span className="text-[10px] text-slate-400 font-extrabold uppercase tracking-widest block">Tempo Morto de Handoff</span>
          <div className="divide-y divide-slate-100">
            {metricsHandoff.map((h, i) => (
              <div key={i} className="py-2 flex justify-between items-center text-xs">
                <span className="font-bold text-slate-600 truncate max-w-[170px]" title={h.tipo}>
                  {h.tipo === 'qualificador_corretor' ? '👉 Qualif. para Corretor' : h.tipo === 'lais_humano' ? '🤖 Lais para Humano' : h.tipo}
                </span>
                <span className="font-extrabold text-[#33415C]">{formatInterval(h.tempo_morto_medio)}</span>
              </div>
            ))}
            {metricsHandoff.length === 0 && (
              <span className="text-xs text-slate-400 italic">Nenhum handoff registrado.</span>
            )}
          </div>
        </div>
      </div>

      {/* Funnel and Training diagnosis grid */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_450px] gap-6 items-start">
        
        {/* Funnel Conversão V5 */}
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-md overflow-hidden space-y-4 p-5">
          <div>
            <h3 className="text-sm font-extrabold uppercase tracking-wide text-[#33415C]">Conversão do Funil de Vendas</h3>
            <p className="text-[11px] text-slate-400 mt-0.5 font-medium">Leads que passaram por cada etapa do funil (entraram × avançaram).</p>
          </div>

          <div className="space-y-3.5 pr-2 max-h-[580px] overflow-y-auto">
            {metricsFunil.map((etapa, idx) => {
              const barPct = etapa.entraram > 0 ? (etapa.avancaram / etapa.entraram) * 100 : 0
              return (
                <div key={idx} className="space-y-1 text-xs">
                  <div className="flex justify-between items-center font-bold text-slate-700">
                    <span className="flex items-center gap-1.5">
                      <span className="bg-slate-100 text-[#33415C] px-2 py-0.5 rounded text-[10px] font-black">{etapa.codigo}</span>
                      {etapa.nome}
                    </span>
                    <span className="text-slate-500">{etapa.taxa_avanco_pct}% conv.</span>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <div className="flex-1 bg-slate-50 h-3 border border-slate-100 rounded overflow-hidden relative">
                      <div className="h-full bg-emerald-400 rounded transition-all" style={{ width: `${barPct}%` }}></div>
                    </div>
                    <div className="text-[10px] text-slate-400 font-bold w-32 text-right">
                      {etapa.entraram} entraram / {etapa.avancaram} avanç.
                    </div>
                  </div>
                </div>
              )
            })}
            {metricsFunil.length === 0 && (
              <div className="text-center italic text-slate-400 py-8 text-xs font-semibold">
                Sem dados de funil registrados. Movimente leads no CRM para começar a medir!
              </div>
            )}
          </div>
        </div>

        {/* Onde treinar */}
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-md overflow-hidden space-y-4 p-5">
          <div>
            <h3 className="text-sm font-extrabold uppercase tracking-wide text-[#33415C]">Diagnóstico de Gargalos ("Onde Treinar")</h3>
            <p className="text-[11px] text-slate-400 mt-0.5 font-medium">Etapas críticas do funil ordenadas por urgência de atenção.</p>
          </div>

          <div className="space-y-3 max-h-[580px] overflow-y-auto pr-1">
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
                <div key={idx} className="bg-slate-50/50 border border-slate-200/70 p-3 rounded-xl space-y-2.5 text-xs font-semibold">
                  <div className="flex justify-between items-center">
                    <span className="font-extrabold text-slate-800 flex items-center gap-1.5">
                      <span className="bg-[#33415C] text-white px-1.5 py-0.5 rounded text-[9px] font-black">{t.codigo}</span>
                      {t.nome}
                    </span>
                    <span className={`px-2 py-0.5 rounded-full text-[9px] font-extrabold border ${badgeBg}`}>
                      {badgeText}
                    </span>
                  </div>

                  <div className="grid grid-cols-3 text-slate-500 gap-1 text-[11px] font-bold">
                    <div>
                      <span className="text-[9px] text-slate-400 uppercase block">Tempo Médio</span>
                      <span className="text-slate-700">{formatInterval(t.tempo_medio)}</span>
                    </div>
                    <div>
                      <span className="text-[9px] text-slate-400 uppercase block">Taxa Queda</span>
                      <span className="text-slate-700">{t.taxa_queda_pct}%</span>
                    </div>
                    <div>
                      <span className="text-[9px] text-slate-400 uppercase block">Índice</span>
                      <span className="text-slate-700 font-extrabold">{t.indice_atencao}</span>
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

      {/* Novas Métricas Analíticas */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Ciclo de Vendas */}
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-md overflow-hidden space-y-4 p-5">
          <div>
            <h3 className="text-sm font-extrabold uppercase tracking-wide text-[#33415C]">⏱️ Ciclo de Venda Médio (entrada → fechamento)</h3>
            <p className="text-[11px] text-slate-400 mt-0.5 font-medium">Tempo médio acumulado do primeiro contato até a assinatura do contrato (Sucesso).</p>
          </div>

          <div className="space-y-4">
            {metricsCiclo.length > 0 ? (
              <>
                <div className="bg-slate-50 border border-slate-100 rounded-xl p-4 text-center">
                  <span className="text-[10px] text-slate-400 font-extrabold uppercase tracking-widest block">Duração Média Geral</span>
                  <span className="text-3xl font-black text-[#33415C] block mt-1">
                    {(() => {
                      const days = metricsCiclo.map(c => {
                        if (!c.ciclo_total) return 0
                        const str = String(c.ciclo_total)
                        if (str.includes('day')) {
                          const m = str.match(/(\d+)\s+day/)
                          if (m) return parseInt(m[1])
                        }
                        if (str.includes(':')) {
                          const h = parseInt(str.split(':')[0]) || 0
                          return h / 24
                        }
                        return parseFloat(str) || 0
                      })
                      const totalDays = days.reduce((sum, d) => sum + d, 0)
                      return (totalDays / metricsCiclo.length).toFixed(1)
                    })()} dias
                  </span>
                </div>

                <div className="space-y-2 max-h-[160px] overflow-y-auto pr-1">
                  <span className="text-[9px] text-slate-400 font-black uppercase tracking-wider block">Histórico Recente</span>
                  {metricsCiclo.map((c, i) => (
                    <div key={i} className="flex justify-between items-center text-xs font-semibold py-1.5 border-b border-slate-50 last:border-b-0">
                      <span className="text-slate-700 truncate max-w-[120px]">{c.nome}</span>
                      <span className="text-slate-500 text-[11px] font-bold">
                        {formatInterval(c.ciclo_total)}
                      </span>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div className="text-center italic text-slate-400 py-12 text-xs font-semibold">
                Sem negócios fechados com sucesso no período para cálculo de ciclo.
              </div>
            )}
          </div>
        </div>

        {/* Lais vs Humano */}
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-md overflow-hidden space-y-4 p-5">
          <div>
            <h3 className="text-sm font-extrabold uppercase tracking-wide text-[#33415C]">🤖 Comparativo Lais × Humano (Agendamentos)</h3>
            <p className="text-[11px] text-slate-400 mt-0.5 font-medium">Comparativo da taxa de agendamento de visita (E3) por canal de atendimento.</p>
          </div>

          <div className="space-y-4">
            {metricsLaisVsHumano.length > 0 ? (
              <div className="divide-y divide-slate-100">
                {metricsLaisVsHumano.map((m, i) => {
                  const isLais = m.porta === 'A'
                  return (
                    <div key={i} className="py-3 flex justify-between items-center gap-4">
                      <div>
                        <span className="text-xs font-bold text-slate-700 block">
                          {isLais ? '🤖 Porta A (Bot Lais)' : '🏠 Porta B (Humano Direct)'}
                        </span>
                        <span className="text-[10px] text-slate-400 font-extrabold">
                          {m.leads} leads recebidos · {m.agendaram_visita} agendaram
                        </span>
                      </div>
                      <div className="text-right">
                        <span className={`text-sm font-black block ${isLais ? 'text-emerald-600' : 'text-[#33415C]'}`}>
                          {m.taxa_agendamento_pct}%
                        </span>
                        <span className="text-[8px] text-slate-400 font-extrabold uppercase tracking-wider">
                          agendou visita
                        </span>
                      </div>
                    </div>
                  )
                })}
              </div>
            ) : (
              <div className="text-center italic text-slate-400 py-12 text-xs font-semibold">
                Aguardando fluxo de leads para comparar canais.
              </div>
            )}
          </div>
        </div>

        {/* Travas e Gargalos de Pagamento */}
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-md overflow-hidden space-y-4 p-5">
          <div>
            <h3 className="text-sm font-extrabold uppercase tracking-wide text-[#33415C]">🔒 Travas de Pagamento / Financiamento</h3>
            <p className="text-[11px] text-slate-400 mt-0.5 font-medium">Fatores burocráticos que mais geram gargalo no fechamento de contratos.</p>
          </div>

          <div className="space-y-3.5 max-h-[220px] overflow-y-auto pr-1">
            {metricsTravas.length > 0 ? (
              metricsTravas.map((t, i) => (
                <div key={i} className="space-y-1 text-xs">
                  <div className="flex justify-between items-center font-bold text-slate-700">
                    <span className="flex items-center gap-1.5 truncate">
                      <span className="bg-slate-100 text-slate-700 px-1.5 py-0.5 rounded text-[9px] font-black uppercase">
                        {t.tipo_bloqueio.replace('_', ' ')}
                      </span>
                      <span className="text-[10px] text-slate-400 lowercase">({t.ramo.replace('_', ' ')})</span>
                    </span>
                    <span className="text-slate-600 text-[10px] font-black">{t.ocorrencias} ocorr.</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 bg-slate-50 h-1.5 border border-slate-100 rounded overflow-hidden">
                      <div className="h-full bg-indigo-500" style={{ width: `${Math.min(t.ocorrencias * 20, 100)}%` }}></div>
                    </div>
                    <span className="text-[9px] text-slate-400 font-extrabold">
                      TMA: {formatInterval(t.tempo_medio_aberto)}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center italic text-slate-400 py-12 text-xs font-semibold">
                Nenhuma trava de formalização ativa no momento.
              </div>
            )}
          </div>
        </div>

      </div>

      {/* Tempo por cliente em cada etapa */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-md overflow-hidden space-y-4 p-5">
        <div>
          <h3 className="text-sm font-extrabold uppercase tracking-wide text-[#33415C]">⏳ Tempo por Cliente em Cada Etapa</h3>
          <p className="text-[11px] text-slate-400 mt-0.5 font-medium">Quanto tempo cada cliente ficou (ou está) em cada etapa do funil.</p>
        </div>

        <div className="space-y-3 max-h-[480px] overflow-y-auto pr-1">
          {metricsPorCliente.map((c) => (
            <div key={c.cliente_id} className="bg-slate-50/50 border border-slate-200/70 p-3 rounded-xl space-y-2 text-xs font-semibold">
              <div className="flex justify-between items-center gap-2">
                <span className="font-extrabold text-slate-800 truncate">{c.nome}</span>
                <div className="flex items-center gap-1.5 shrink-0">
                  <span className="text-[9px] text-slate-400 font-bold uppercase">{c.corretor_nome}</span>
                  <span className={`px-2 py-0.5 rounded-full text-[9px] font-extrabold border ${
                    c.ativo ? 'bg-amber-50 text-amber-700 border-amber-100' : 'bg-slate-100 text-slate-500 border-slate-200'
                  }`}>
                    {c.ativo ? 'Ativo' : 'Finalizado'}
                  </span>
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                {c.etapas.map((et, i) => (
                  <div key={i} className={`px-2 py-1 rounded-lg border text-[10px] font-bold flex items-center gap-1 ${
                    et.em_andamento ? 'bg-emerald-50 border-emerald-100 text-emerald-700' : 'bg-white border-slate-100 text-slate-600'
                  }`}>
                    <span className="text-slate-400 font-black">{et.ordem}.</span> {et.etapa_nome}
                    <span className="font-extrabold">{formatInterval(et.tempo)}</span>
                    {et.em_andamento && <span className="italic">(em andamento)</span>}
                  </div>
                ))}
              </div>
            </div>
          ))}

          {metricsPorCliente.length === 0 && (
            <div className="text-center italic text-slate-400 py-8 text-xs font-semibold">
              Sem eventos de etapa registrados ainda.
            </div>
          )}
        </div>
      </div>

    </div>
  )
}
