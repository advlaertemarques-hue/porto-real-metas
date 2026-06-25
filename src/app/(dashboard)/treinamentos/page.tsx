'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { getVendasClientes } from '@/lib/api'
import { VendasCliente } from '@/lib/types'
import { fmtBRL } from '@/lib/constants'
import { 
  Target, 
  MapPin, 
  TrendingUp, 
  ClipboardList, 
  DollarSign, 
  Users
} from 'lucide-react'

export default function PrioridadesCaptacaoPage() {
  const { user, loading: authLoading } = useAuth()
  const router = useRouter()
  const [clientes, setClientes] = useState<VendasCliente[]>([])
  const [dataLoading, setDataLoading] = useState(true)

  useEffect(() => {
    if (authLoading) return
    if (!user) {
      router.replace('/login')
      return
    }

    async function loadData() {
      try {
        const cls = await getVendasClientes()
        setClientes(cls)
      } catch (err) {
        console.error("Erro ao carregar dados de captação:", err)
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
          <span className="text-sm font-semibold text-slate-600">Carregando prioridades de captação...</span>
        </div>
      </div>
    )
  }

  // Filter clients who are archived as interested (Interessados)
  const interessados = clientes.filter(c => c.status_finalizacao === 'interessado')

  // Aggregate demand by neighborhood
  const localDemanda = interessados.reduce((acc: Record<string, { count: number; totalValor: number; buyers: string[] }>, c) => {
    const loc = c.local ? c.local.trim() : 'Não Informado'
    if (!acc[loc]) {
      acc[loc] = { count: 0, totalValor: 0, buyers: [] }
    }
    acc[loc].count += 1
    acc[loc].totalValor += c.valor || 0
    acc[loc].buyers.push(c.nome)
    return acc
  }, {})

  const localDemandaSorted = Object.entries(localDemanda)
    .map(([local, data]) => ({
      local,
      count: data.count,
      avgBudget: data.count > 0 ? data.totalValor / data.count : 0,
      buyers: data.buyers
    }))
    .sort((a, b) => b.count - a.count)

  const totalDemandas = interessados.length

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6 animate-fadeIn">
      {/* Header section */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <h2 className="text-xl md:text-2xl font-black text-[#33415C] tracking-tight flex items-center gap-2.5">
            <Target className="text-[#eb3238]" size={24} />
            Prioridades de Captação
          </h2>
          <p className="text-xs text-slate-500 font-semibold max-w-2xl leading-relaxed">
            Monitore as preferências de compradores ativos arquivados como <b>Interessados</b>. O sistema calcula a demanda por bairro e centraliza especificações para guiar a captação de novos imóveis.
          </p>
        </div>
        <div className="bg-[#EEF4FA] border border-[#D6E4F0] px-4 py-3 rounded-xl flex items-center gap-3 self-start md:self-auto flex-shrink-0">
          <Users className="text-[#33415C]" size={20} />
          <div>
            <span className="text-[10px] text-slate-450 uppercase font-black tracking-wider block">Interessados Ativos</span>
            <span className="text-lg font-black text-[#33415C]">{totalDemandas} compradores</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_1.8fr] gap-6">
        {/* Left Column: Bairros mais Procurados */}
        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-5 space-y-4">
            <div className="border-b border-slate-100 pb-3 flex items-center gap-2">
              <TrendingUp className="text-[#33415C]" size={18} />
              <h3 className="text-xs font-black uppercase tracking-wider text-slate-700">Média de Demanda por Bairro</h3>
            </div>

            {localDemandaSorted.length > 0 ? (
              <div className="space-y-3.5">
                {localDemandaSorted.map((d, idx) => {
                  const pct = totalDemandas ? Math.round((d.count / totalDemandas) * 100) : 0
                  return (
                    <div key={idx} className="bg-slate-50/50 border border-slate-150 rounded-xl p-3.5 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-extrabold text-xs text-slate-800 flex items-center gap-1.5">
                          <MapPin size={14} className="text-[#eb3238]" />
                          {d.local}
                        </span>
                        <span className="text-[10px] font-black text-slate-450 uppercase bg-slate-100 border border-slate-200 px-2 py-0.5 rounded-md">
                          {d.count} {d.count === 1 ? 'pedido' : 'pedidos'}
                        </span>
                      </div>
                      
                      {/* Bar indicator */}
                      <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-gradient-to-r from-[#33415C] to-[#eb3238]" 
                          style={{ width: `${pct}%` }}
                        ></div>
                      </div>

                      <div className="flex items-center justify-between text-[10px] text-slate-500 font-semibold pt-1">
                        <span>Ticket Médio: <b className="text-slate-700">{d.avgBudget > 0 ? fmtBRL(d.avgBudget) : 'A definir'}</b></span>
                        <span className="text-[#33415C] font-bold">{pct}% da fila</span>
                      </div>
                    </div>
                  )
                })}
              </div>
            ) : (
              <div className="text-center py-10 space-y-2">
                <p className="text-xs text-slate-400 font-medium italic">Nenhum bairro com demanda acumulada.</p>
              </div>
            )}
          </div>

          {/* Quick Guidance Box */}
          <div className="bg-[#EEF4FA]/50 border border-[#D6E4F0] rounded-2xl p-5 space-y-3">
            <h4 className="text-xs font-black uppercase text-[#33415C] tracking-wider flex items-center gap-1.5">
              💡 Dica de Captação Externa
            </h4>
            <p className="text-xs text-slate-650 leading-relaxed font-semibold">
              Ao visitar construtoras, proprietários ou prospectar na rua, utilize a lista ao lado como um roteiro prático. Captar imóveis alinhados a esta lista reduz drasticamente o ciclo de venda (Time-to-Match).
            </p>
          </div>
        </div>

        {/* Right Column: Demandas Específicas por Comprador */}
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-5 space-y-4">
          <div className="border-b border-slate-100 pb-3 flex justify-between items-center">
            <div className="flex items-center gap-2">
              <ClipboardList className="text-[#33415C]" size={18} />
              <h3 className="text-xs font-black uppercase tracking-wider text-slate-700">Demandas Específicas de Interessados</h3>
            </div>
            <span className="text-[10px] text-slate-400 font-bold uppercase">Lista Automatizada</span>
          </div>

          <div className="space-y-4">
            {interessados.length > 0 ? (
              interessados.map((c) => {
                return (
                  <div key={c.id} className="border border-slate-200 rounded-xl p-4 hover:border-slate-300 transition-all space-y-3 shadow-2xs">
                    {/* Header info */}
                    <div className="flex justify-between items-start gap-3.5 flex-wrap">
                      <div>
                        <h4 className="font-extrabold text-sm text-slate-800">{c.nome}</h4>
                        <span className="text-[10px] text-slate-450 font-semibold block">
                          {c.contato ? `📞 ${c.contato}` : 'Sem telefone registrado'}
                        </span>
                      </div>
                      
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {c.perfil && (
                          <span className="bg-[#EEF4FA] text-[#33415C] text-[9.5px] font-black px-2 py-0.5 rounded border border-[#D6E4F0] uppercase">
                            🧠 {c.perfil}
                          </span>
                        )}
                        <span className="bg-rose-50 text-[#eb3238] text-[9.5px] font-black px-2 py-0.5 rounded border border-rose-100 uppercase">
                          Interessado
                        </span>
                      </div>
                    </div>

                    {/* Target specs */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 bg-slate-50/70 border border-slate-100 rounded-lg p-3 text-xs font-semibold">
                      <div>
                        <span className="text-[9px] text-slate-400 uppercase block">Localização Desejada</span>
                        <span className="text-slate-800 font-bold flex items-center gap-1 mt-0.5">
                          <MapPin size={12} className="text-slate-400" />
                          {c.local || 'Qualquer Bairro'}
                        </span>
                      </div>
                      <div>
                        <span className="text-[9px] text-slate-400 uppercase block">Orçamento Máximo</span>
                        <span className="text-[#33415C] font-black flex items-center gap-1 mt-0.5">
                          <DollarSign size={12} className="text-[#33415C]" />
                          {c.valor ? fmtBRL(c.valor) : (c.faixa || 'A definir')}
                        </span>
                      </div>
                    </div>

                    {/* Description preferences */}
                    <div className="space-y-1 bg-white border border-slate-150 rounded-lg p-3">
                      <span className="text-[9px] text-slate-400 uppercase block font-bold">Preferências do Comprador</span>
                      <p className="text-xs text-slate-700 leading-relaxed font-semibold italic">
                        {c.preferencia || '“Buscando imóvel na região com o perfil cadastrado.”'}
                      </p>
                    </div>

                    {/* Date card footer */}
                    {c.updated_at && (
                      <div className="flex justify-end text-[9px] text-slate-400 font-bold">
                        <span>Finalizado em: {new Date(c.updated_at).toLocaleDateString('pt-BR')}</span>
                      </div>
                    )}
                  </div>
                )
              })
            ) : (
              <div className="text-center py-12 space-y-3">
                <div className="mx-auto w-12 h-12 bg-slate-50 border border-slate-100 text-slate-400 rounded-full flex items-center justify-center text-lg">
                  📭
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-slate-500 font-bold">Nenhum comprador na fila de captação</p>
                  <p className="text-[10px] text-slate-400 max-w-sm mx-auto leading-relaxed">
                    Quando finalizar um atendimento no CRM como <b>"Lista de Interessados (Arquivar)"</b>, os critérios de busca do lead preencherão esta lista de prioridades automaticamente.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
