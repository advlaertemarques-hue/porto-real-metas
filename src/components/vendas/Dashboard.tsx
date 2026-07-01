'use client'

import { useState } from 'react'
import { VendasCliente, VendasCorretor, VendasEquipe } from '@/lib/types'
import { ETAPAS, I_VISITA, I_FECHAMENTO, fmtBRL } from '@/lib/constants'
import { Users, TrendingUp, Award, Flame } from 'lucide-react'

interface DashboardProps {
  clientes: VendasCliente[]
  corretores: VendasCorretor[]
  equipes: VendasEquipe[]
  setActiveId: (id: string | null) => void
  setActiveView: (view: any) => void
}

function getInitials(nome: string) {
  if (!nome) return '?'
  const parts = nome.trim().split(/\s+/)
  if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase()
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
}

export default function Dashboard({
  clientes,
  corretores,
  equipes,
  setActiveId,
  setActiveView
}: DashboardProps) {
  const [dashEtapaFiltro, setDashEtapaFiltro] = useState<string>('todas')

  const filteredDashboardClientes = dashEtapaFiltro === 'todas'
    ? clientes
    : clientes.filter(c => c.etapa === parseInt(dashEtapaFiltro))

  // Calculated for last 30 days (monthly)
  const isWithin30Days = (dateStr?: string) => {
    if (!dateStr) return false
    const date = new Date(dateStr)
    const now = new Date()
    const diffTime = Math.abs(now.getTime() - date.getTime())
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    return diffDays <= 30
  }

  const realCaptados = clientes.filter(c => 
    (c.objetivo === 'Vender' || c.objetivo === 'Deixar para alugar') && 
    c.finalizado && 
    c.status_finalizacao === 'sucesso' &&
    isWithin30Days(c.updated_at)
  ).length

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl md:text-2xl font-black text-slate-800 flex items-center gap-2">
            📈 Dashboard de Processos
          </h2>
          <p className="text-xs text-slate-500 mt-1">Acompanhamento visual da jornada dos clientes de toda a equipe de corretores.</p>
        </div>
      
        <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-xl px-3 py-1.5 shadow-sm flex-shrink-0">
          <span className="text-[10px] font-black text-slate-500 uppercase tracking-wider">Filtrar Etapa:</span>
          <select
            value={dashEtapaFiltro}
            onChange={(e) => setDashEtapaFiltro(e.target.value)}
            className="border-none rounded-lg p-1 text-xs font-semibold bg-white cursor-pointer outline-none focus:ring-0 text-slate-700"
          >
            <option value="todas">Todas as Etapas</option>
            {ETAPAS.map((etapa, idx) => (
              <option key={idx} value={idx}>{idx + 1}. {etapa.nome}</option>
            ))}
          </select>
        </div>
      </div>

      {/* KPI Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200 border-l-4 border-l-blue-500 rounded-2xl p-5 shadow-xs space-y-2 relative overflow-hidden bg-gradient-to-br from-blue-50/10 to-white hover:shadow-sm transition-all duration-300">
          <div className="flex justify-between items-start">
            <span className="text-[10px] text-blue-600 font-extrabold uppercase tracking-widest block">Processos Ativos</span>
            <div className="p-1.5 bg-blue-50 text-blue-600 rounded-lg">
              <Users size={16} />
            </div>
          </div>
          <h3 className="text-3xl font-black text-slate-800">{filteredDashboardClientes.filter(c => !c.finalizado).length}</h3>
          <p className="text-[10px] text-slate-500">
            {filteredDashboardClientes.filter(c => !c.finalizado && c.temp === 'quente').length} quentes · {filteredDashboardClientes.filter(c => !c.finalizado && c.temp === 'morno').length} mornos
          </p>
        </div>

        <div className="bg-white border border-slate-200 border-l-4 border-l-emerald-500 rounded-2xl p-5 shadow-xs space-y-2 relative overflow-hidden bg-gradient-to-br from-emerald-50/10 to-white hover:shadow-sm transition-all duration-300">
          <div className="flex justify-between items-start">
            <span className="text-[10px] text-emerald-600 font-extrabold uppercase tracking-widest block">Vendas Fechadas (Sucesso)</span>
            <div className="p-1.5 bg-emerald-50 text-emerald-600 rounded-lg">
              <TrendingUp size={16} />
            </div>
          </div>
          <h3 className="text-3xl font-black text-emerald-600">
            {clientes.filter(c => c.objetivo === 'Comprar' && c.finalizado && c.status_finalizacao === 'sucesso').length}
          </h3>
          <p className="text-[10px] text-slate-500">
            VGV Fechado: {fmtBRL(clientes.filter(c => c.objetivo === 'Comprar' && c.finalizado && c.status_finalizacao === 'sucesso').reduce((sum, c) => sum + (c.valor_fechado || 0), 0))}
          </p>
        </div>

        <div className="bg-white border border-slate-200 border-l-4 border-l-indigo-500 rounded-2xl p-5 shadow-xs space-y-2 relative overflow-hidden bg-gradient-to-br from-indigo-50/10 to-white hover:shadow-sm transition-all duration-300">
          <div className="flex justify-between items-start">
            <span className="text-[10px] text-indigo-600 font-extrabold uppercase tracking-widest block">Captações Concluídas</span>
            <div className="p-1.5 bg-indigo-50 text-indigo-600 rounded-lg">
              <Award size={16} />
            </div>
          </div>
          <h3 className="text-3xl font-black text-[#33415C]">{realCaptados}</h3>
          <p className="text-[10px] text-slate-500">Com exclusividade contratual (30 dias)</p>
        </div>

        <div className="bg-white border border-slate-200 border-l-4 border-l-amber-500 rounded-2xl p-5 shadow-xs space-y-2 relative overflow-hidden bg-gradient-to-br from-amber-50/10 to-white hover:shadow-sm transition-all duration-300">
          <div className="flex justify-between items-start">
            <span className="text-[10px] text-amber-600 font-extrabold uppercase tracking-widest block">Conversão de Visitas</span>
            <div className="p-1.5 bg-amber-50 text-amber-600 rounded-lg">
              <Flame size={16} />
            </div>
          </div>
          <h3 className="text-3xl font-black text-amber-600">
            {(() => {
              const vis = clientes.filter(c => c.etapa >= I_VISITA).length
              const fech = clientes.filter(c => c.etapa >= I_FECHAMENTO).length
              return vis ? `${Math.round((fech / vis) * 100)}%` : '0%'
            })()}
          </h3>
          <p className="text-[10px] text-slate-500">Visitas para fechamentos</p>
        </div>
      </div>

      {/* Corretores List */}
      <div className="space-y-6">
        {corretores.map(corr => {
          const corrClients = filteredDashboardClientes.filter(c => c.corretor_id === corr.id)
          // A lista mostra só processos em andamento; finalizados (ganho/perdido)
          // ou arquivados como interessado saem daqui, mas continuam contando no
          // placar (badges e KPIs do topo).
          const corrAtivos = corrClients.filter(c => !c.finalizado && c.status_finalizacao !== 'interessado')
          return (
            <div key={corr.id} className="bg-white border-2 border-slate-300 rounded-2xl p-5 shadow-md space-y-4 hover:shadow-lg hover:border-slate-400/80 transition-all duration-300">
              <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-200 bg-slate-50/70 -mx-5 -mt-5 p-5 rounded-t-2xl">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-[#EEF4FA] text-[#33415C] font-black text-sm flex items-center justify-center uppercase">
                    {getInitials(corr.nome)}
                  </div>
                  <div>
                    <h4 className="font-extrabold text-slate-800">{corr.nome}</h4>
                    <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">
                      CRECI {corr.creci || '—'} · Equipe: {equipes.find(e => e.id === corr.equipe_id)?.nome || 'Sem Equipe'}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="bg-[#EEF4FA] text-[#33415C] text-[10px] font-bold px-2.5 py-1 rounded-md">
                    {corrAtivos.length} Processo(s) Ativo(s)
                  </span>
                  <span className="bg-emerald-50 text-emerald-700 text-[10px] font-bold px-2.5 py-1 rounded-md">
                    {corrClients.filter(c => c.finalizado && c.status_finalizacao === 'sucesso').length} Ganho(s)
                  </span>
                </div>
              </div>

              {corrAtivos.length === 0 ? (
                <p className="text-xs text-slate-400 font-medium italic">Nenhum processo em andamento para este corretor.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="border-b border-slate-50 text-[10px] text-slate-400 font-black uppercase tracking-wider">
                        <th className="py-2.5">Cliente</th>
                        <th className="py-2.5">Objetivo</th>
                        <th className="py-2.5">Valor / Orçamento</th>
                        <th className="py-2.5 min-w-[280px]">Linha de Processo (Etapas 1-6)</th>
                        <th className="py-2.5 text-right">Ação</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {corrAtivos.map(c => {
                        const progPct = Math.round((c.etapa / (ETAPAS.length - 1)) * 100)
                        return (
                          <tr key={c.id} className="hover:bg-slate-50/50 transition-colors">
                            <td className="py-3 pr-2">
                              <div className="font-bold text-slate-700">{c.nome}</div>
                              <div className="text-[10px] text-slate-400 font-medium">{c.contato}</div>
                            </td>
                            <td className="py-3 pr-2">
                              <span className={`text-[9.5px] font-extrabold px-2 py-0.5 rounded-full ${
                                c.objetivo === 'Comprar' ? 'bg-[#EEF4FA] text-[#33415C]' :
                                c.objetivo === 'Alugar' ? 'bg-amber-50 text-amber-700' :
                                c.objetivo === 'Vender' ? 'bg-emerald-50 text-emerald-700' : 'bg-purple-50 text-purple-700'
                              }`}>
                                {c.objetivo}
                              </span>
                            </td>
                            <td className="py-3 pr-2 font-semibold text-slate-600">
                              {c.finalizado && c.status_finalizacao === 'sucesso' && c.valor_fechado ? (
                                <div>
                                  <div className="text-emerald-600 font-bold">{fmtBRL(Number(c.valor_fechado))}</div>
                                  <div className="text-[9px] text-slate-400">Procurado: {fmtBRL(c.valor || 0)}</div>
                                  {c.objetivo === 'Comprar' && c.valor_pedido && c.valor_vendido && (
                                    <div className="text-[8.5px] text-slate-500 font-medium mt-0.5">
                                      Prop: {fmtBRL(Number(c.valor_pedido))} → {fmtBRL(Number(c.valor_vendido))}
                                    </div>
                                  )}
                                </div>
                              ) : (
                                c.valor > 0 ? fmtBRL(c.valor) : (c.faixa || '—')
                              )}
                            </td>
                            <td className="py-3 pr-2">
                              <div className="bg-slate-50/70 border border-slate-200/50 rounded-xl p-3 shadow-[0_2px_5px_rgba(0,0,0,0.03),_inset_0_-1px_0_rgba(0,0,0,0.05)] space-y-2 max-w-[290px] hover:border-slate-300/60 hover:bg-slate-50 transition-colors duration-200">
                                <div className="flex items-center gap-1">
                                  {ETAPAS.map((etapa, idx) => {
                                    const isDone = idx < c.etapa
                                    const isCurrent = idx === c.etapa
                                    const isLost = c.finalizado && c.status_finalizacao === 'perdido'
                                    const isSuccess = c.finalizado && c.status_finalizacao === 'sucesso'
                                    
                                    let dotCls = 'bg-slate-200'
                                    let tooltipText = `${idx + 1}. ${etapa.nome} (Pendente)`

                                    if (isSuccess) {
                                      dotCls = 'bg-emerald-500'
                                      tooltipText = `${idx + 1}. ${etapa.nome} (Concluído - Sucesso)`
                                    } else if (isLost) {
                                      if (isCurrent) {
                                        dotCls = 'bg-rose-500 ring-2 ring-rose-200 animate-pulse'
                                        tooltipText = `${idx + 1}. ${etapa.nome} (Perdido aqui!)`
                                      } else if (isDone) {
                                        dotCls = 'bg-slate-300'
                                        tooltipText = `${idx + 1}. ${etapa.nome} (Passou)`
                                      } else {
                                        dotCls = 'bg-slate-100 opacity-60'
                                        tooltipText = `${idx + 1}. ${etapa.nome} (Não alcançado)`
                                      }
                                    } else {
                                      if (isCurrent) {
                                        dotCls = 'bg-[#eb3238] ring-2 ring-[#eb3238]/30 animate-pulse scale-115'
                                        tooltipText = `${idx + 1}. ${etapa.nome} (Etapa Atual)`
                                      } else if (isDone) {
                                        dotCls = 'bg-emerald-500'
                                        tooltipText = `${idx + 1}. ${etapa.nome} (Concluído)`
                                      }
                                    }

                                    return (
                                      <div
                                        key={idx}
                                        title={tooltipText}
                                        className={`w-3 h-3 rounded-full cursor-help transition-all ${dotCls}`}
                                      />
                                    )
                                  })}
                                </div>
                                <div className="flex justify-between text-[9px] font-bold">
                                  <span className={c.finalizado ? 'text-slate-400' : 'text-[#eb3238]'}>
                                    Etapa {c.etapa + 1}: {ETAPAS[c.etapa].nome}
                                  </span>
                                  <span className="text-slate-400">{progPct}%</span>
                                </div>
                              </div>
                            </td>
                            <td className="py-3 text-right">
                              <button
                                onClick={() => {
                                  setActiveId(c.id)
                                  setActiveView('funil')
                                }}
                                className="px-2.5 py-1 text-[10px] font-bold text-[#33415C] hover:text-white bg-[#EEF4FA] hover:bg-[#33415C] border border-[#47587A]/20 rounded-lg transition-all"
                              >
                                Ver no Funil
                              </button>
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )
        })}

        {/* Sem Corretor Group */}
        {clientes.filter(c => !c.corretor_id && !c.finalizado && c.status_finalizacao !== 'interessado').length > 0 && (
          <div className="bg-slate-50 border border-slate-200 border-dashed rounded-2xl p-5 space-y-4">
            <div className="flex items-center gap-3 pb-3 border-b border-slate-200/60">
              <div className="w-10 h-10 rounded-xl bg-slate-200 text-slate-600 font-black text-sm flex items-center justify-center">
                ❓
              </div>
              <div>
                <h4 className="font-extrabold text-slate-700">Não Distribuídos / Sem Corretor</h4>
                <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">
                  Processos pendentes de atribuição de responsabilidade
                </p>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-200/40 text-[10px] text-slate-400 font-black uppercase tracking-wider">
                    <th className="py-2.5">Cliente</th>
                    <th className="py-2.5">Objetivo</th>
                    <th className="py-2.5">Linha de Processo (Etapas 1-6)</th>
                    <th className="py-2.5 text-right">Ação</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {clientes.filter(c => !c.corretor_id && !c.finalizado && c.status_finalizacao !== 'interessado').map(c => {
                    const progPct = Math.round((c.etapa / (ETAPAS.length - 1)) * 100)
                    return (
                      <tr key={c.id} className="hover:bg-slate-100/30 transition-colors">
                        <td className="py-3 pr-2">
                          <div className="font-bold text-slate-700">{c.nome}</div>
                          <div className="text-[10px] text-slate-400 font-medium">{c.contato}</div>
                        </td>
                        <td className="py-3 pr-2">
                          <span className={`text-[9.5px] font-extrabold px-2 py-0.5 rounded-full ${
                            c.objetivo === 'Comprar' ? 'bg-[#EEF4FA] text-[#33415C]' : 'bg-emerald-50 text-emerald-700'
                          }`}>
                            {c.objetivo}
                          </span>
                        </td>
                        <td className="py-3 pr-2">
                          <div className="bg-slate-50/70 border border-slate-200/50 rounded-xl p-3 shadow-[0_2px_5px_rgba(0,0,0,0.03),_inset_0_-1px_0_rgba(0,0,0,0.05)] space-y-2 max-w-[290px] hover:border-slate-300/60 hover:bg-slate-50 transition-colors duration-200">
                            <div className="flex items-center gap-1">
                              {ETAPAS.map((etapa, idx) => (
                                <div
                                  key={idx}
                                  title={`${idx + 1}. ${etapa.nome}`}
                                  className={`w-3 h-3 rounded-full cursor-help transition-all ${
                                    idx === c.etapa ? 'bg-[#eb3238] ring-2 ring-[#eb3238]/30 animate-pulse scale-115' :
                                    idx < c.etapa ? 'bg-slate-400' : 'bg-slate-200'
                                  }`}
                                />
                              ))}
                            </div>
                            <div className="flex justify-between text-[9px] font-bold">
                              <span className="text-[#eb3238]">Etapa {c.etapa + 1}: {ETAPAS[c.etapa].nome}</span>
                              <span className="text-slate-400">{progPct}%</span>
                            </div>
                          </div>
                        </td>
                        <td className="py-3 text-right">
                          <button
                            onClick={() => {
                              setActiveId(c.id)
                              setActiveView('funil')
                              // Wait, this parent component should handle setting fichaOpen to true when setting the active id.
                              // So we can trigger that via a hook or by setting it in state. Let's make sure it's handled.
                            }}
                            className="px-2.5 py-1 text-[10px] font-bold text-slate-600 hover:text-slate-800 bg-white hover:bg-slate-100 border border-slate-200 rounded-lg transition-all"
                          >
                            Atribuir Corretor
                          </button>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

    </div>
  )
}
