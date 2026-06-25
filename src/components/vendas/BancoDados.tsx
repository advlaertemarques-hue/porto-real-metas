'use client'

import { useState, useEffect } from 'react'
import { VendasCliente, VendasPesquisa } from '@/lib/types'
import { getVendasClientes, getVendasPesquisas } from '@/lib/api'
import { ETAPAS, TIPO_CFG, PERFIS } from '@/lib/constants'
import { Database, Search, Filter, Phone, Mail, MapPin, DollarSign, UserCheck, Star, ThumbsDown } from 'lucide-react'

export default function BancoDados() {
  const [clientes, setClientes] = useState<VendasCliente[]>([])
  const [pesquisas, setPesquisas] = useState<VendasPesquisa[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'leads' | 'pesquisas'>('leads')
  const [filterTipo, setFilterTipo] = useState<string>('todos')
  const [searchQuery, setSearchQuery] = useState('')

  useEffect(() => {
    async function loadData() {
      try {
        const [clis, psqs] = await Promise.all([
          getVendasClientes(),
          getVendasPesquisas()
        ])
        setClientes(clis)
        setPesquisas(psqs)
      } catch (err) {
        console.error("Erro ao buscar dados do banco:", err)
      } finally {
        setLoading(false)
      }
    }
    loadData()
  }, [])

  // KPI Calculations
  const pesqComNotaAtend = pesquisas.filter(p => p.nota_atend !== null && p.nota_atend !== undefined)
  const avgAtend = pesqComNotaAtend.length > 0
    ? (pesqComNotaAtend.reduce((acc, p) => acc + (p.nota_atend || 0), 0) / pesqComNotaAtend.length).toFixed(1)
    : 'N/A'

  const pesqComNotaCorretor = pesquisas.filter(p => p.nota_corretor !== null && p.nota_corretor !== undefined)
  const avgCorretor = pesqComNotaCorretor.length > 0
    ? (pesqComNotaCorretor.reduce((acc, p) => acc + (p.nota_corretor || 0), 0) / pesqComNotaCorretor.length).toFixed(1)
    : 'N/A'

  const pesqComNotaSite = pesquisas.filter(p => p.nota_site !== null && p.nota_site !== undefined)
  const avgSite = pesqComNotaSite.length > 0
    ? (pesqComNotaSite.reduce((acc, p) => acc + (p.nota_site || 0), 0) / pesqComNotaSite.length).toFixed(1)
    : 'N/A'

  const totalNaoComprou = pesquisas.filter(p => p.tipo === 'naocomprou').length

  // Motivos de Não Compra Aggregation
  const motivosCount: Record<string, number> = {}
  pesquisas.forEach(p => {
    if (p.motivo && p.motivo.trim() !== '') {
      motivosCount[p.motivo.trim()] = (motivosCount[p.motivo.trim()] || 0) + 1
    }
  })
  const sortedMotivos = Object.entries(motivosCount)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5) // Top 5
  
  const maxMotivosCount = sortedMotivos.length > 0 ? Math.max(...sortedMotivos.map(m => m[1])) : 1

  // Filter Leads
  const filteredLeads = clientes.filter(c => {
    const q = searchQuery.toLowerCase().trim()
    if (q === '') return true
    return (
      c.nome.toLowerCase().includes(q) ||
      (c.email && c.email.toLowerCase().includes(q)) ||
      (c.contato && c.contato.includes(q)) ||
      (c.local && c.local.toLowerCase().includes(q)) ||
      (c.perfil && c.perfil.toLowerCase().includes(q))
    );
  })

  // Filter Surveys
  const filteredSurveys = pesquisas.filter(p => {
    const matchesTipo = filterTipo === 'todos' || p.tipo === filterTipo
    if (!matchesTipo) return false

    const q = searchQuery.toLowerCase().trim()
    if (q === '') return true
    return (
      p.nome.toLowerCase().includes(q) ||
      (p.motivo && p.motivo.toLowerCase().includes(q)) ||
      (p.perfil && p.perfil.toLowerCase().includes(q))
    );
  })

  if (loading) {
    return (
      <div className="flex h-[85vh] items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-3">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-[#33415C] border-t-transparent"></div>
          <span className="text-sm font-semibold text-slate-600">Carregando Banco de Dados...</span>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6 animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-md">
        <div>
          <h2 className="text-xl md:text-2xl font-black text-[#33415C] tracking-tight flex items-center gap-2">
            <Database className="text-[#eb3238]" size={24} />
            Banco de Dados Geral
          </h2>
          <p className="text-xs text-slate-500 font-semibold mt-1">
            Consulte todos os leads qualificados do funil e as respostas das pesquisas de opinião recebidas.
          </p>
        </div>
        
        <div className="bg-slate-100 p-1 rounded-xl flex border border-slate-200/50 shadow-xs">
          <button
            onClick={() => {
              setActiveTab('leads')
              setSearchQuery('')
            }}
            className={`px-4 py-2 rounded-lg text-xs font-extrabold uppercase tracking-wide transition-all ${
              activeTab === 'leads'
                ? 'bg-white text-[#33415C] shadow-xs'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            Leads do Funil ({clientes.length})
          </button>
          <button
            onClick={() => {
              setActiveTab('pesquisas')
              setSearchQuery('')
            }}
            className={`px-4 py-2 rounded-lg text-xs font-extrabold uppercase tracking-wide transition-all ${
              activeTab === 'pesquisas'
                ? 'bg-white text-[#33415C] shadow-xs'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            Pesquisas &amp; Satisfação ({pesquisas.length})
          </button>
        </div>
      </div>

      {/* KPI Row (Survey specific but useful general summary) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-sm space-y-1">
          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Média Atendimento</span>
          <div className="flex items-baseline gap-1 text-[#1c9c69] font-black text-2xl">
            {avgAtend} <span className="text-xs font-bold text-slate-400">/ 10</span>
          </div>
          <span className="text-[9px] text-slate-400 block font-semibold">Avaliação geral de suporte</span>
        </div>

        <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-sm space-y-1">
          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Média Corretores</span>
          <div className="flex items-baseline gap-1 text-[#33415C] font-black text-2xl">
            {avgCorretor} <span className="text-xs font-bold text-slate-400">/ 10</span>
          </div>
          <span className="text-[9px] text-slate-400 block font-semibold">Performance de consultoria</span>
        </div>

        <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-sm space-y-1">
          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Média Site</span>
          <div className="flex items-baseline gap-1 text-blue-600 font-black text-2xl">
            {avgSite} <span className="text-xs font-bold text-slate-400">/ 10</span>
          </div>
          <span className="text-[9px] text-slate-400 block font-semibold">Usabilidade da plataforma</span>
        </div>

        <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-sm space-y-1">
          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Não compraram</span>
          <div className="flex items-baseline gap-1 text-[#eb3238] font-black text-2xl">
            {totalNaoComprou}
          </div>
          <span className="text-[9px] text-slate-400 block font-semibold">Leads perdidos registrados</span>
        </div>
      </div>

      {/* Main Content Areas */}
      <div className="space-y-4">
        {/* Controls & Search */}
        <div className="flex flex-col md:flex-row justify-between gap-4 items-stretch md:items-center">
          {/* Search bar */}
          <div className="relative flex-1 bg-white border border-slate-200/80 rounded-2xl shadow-xs overflow-hidden px-4 flex items-center gap-2 focus-within:border-[#33415C] transition-all">
            <Search className="text-slate-400" size={16} />
            <input
              type="text"
              placeholder={activeTab === 'leads' ? "Buscar leads por nome, telefone, email, cidade ou perfil..." : "Buscar pesquisas por nome, perfil ou motivo de perda..."}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full py-3.5 text-xs md:text-sm font-semibold text-slate-700 placeholder-slate-400 outline-none"
            />
          </div>

          {/* Filters for surveys */}
          {activeTab === 'pesquisas' && (
            <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-1">
              {[
                { k: 'todos', label: 'Todos' },
                { k: 'comprou', label: 'Comprou' },
                { k: 'naocomprou', label: 'Não Comprou' },
                { k: 'proprietario', label: 'Proprietários' },
                { k: 'visitante', label: 'Visitante' }
              ].map(opt => (
                <button
                  key={opt.k}
                  onClick={() => setFilterTipo(opt.k)}
                  className={`px-3.5 py-2.5 rounded-xl text-xs font-extrabold transition-all border whitespace-nowrap shadow-xs ${
                    filterTipo === opt.k
                      ? 'bg-[#33415C] border-[#33415C] text-white'
                      : 'bg-white border-slate-200 text-slate-500 hover:text-slate-800'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* TAB: LEADS DO FUNIL */}
        {activeTab === 'leads' && (
          <div className="space-y-4">
            <div className="bg-slate-100 rounded-xl px-4 py-3.5 border border-slate-200/50 flex flex-col md:flex-row md:items-center justify-between gap-2">
              <span className="text-xs font-black text-[#33415C] uppercase tracking-wider">
                Leads Qualificados Cadastrados ({filteredLeads.length})
              </span>
              <p className="text-[10px] text-slate-500 font-semibold leading-none">
                Exibe todos os contatos que já entraram no funil de vendas dos corretores.
              </p>
            </div>

            {filteredLeads.length === 0 ? (
              <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center text-slate-400 font-semibold text-sm shadow-sm">
                Nenhum lead encontrado com o termo de busca pesquisado.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredLeads.map(c => {
                  const perfilInfo = c.perfil ? PERFIS[c.perfil.toLowerCase()] : null
                  const etapaNome = ETAPAS[c.etapa]?.nome || `Etapa ${c.etapa + 1}`

                  return (
                    <div
                      key={c.id}
                      className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm hover:border-[#33415C]/40 transition-colors duration-200 flex flex-col justify-between gap-4"
                    >
                      <div className="space-y-2.5">
                        {/* Title & tags */}
                        <div className="flex items-start justify-between gap-2">
                          <div className="space-y-0.5">
                            <span className="text-sm font-black text-slate-800 block leading-tight">{c.nome}</span>
                            <span className="text-[10px] text-slate-400 font-bold block">{c.created_at ? new Date(c.created_at).toLocaleDateString('pt-BR') : 'Sem data'}</span>
                          </div>
                          <div className="flex flex-wrap gap-1.5 justify-end">
                            {perfilInfo && (
                              <span className="text-[9px] font-extrabold uppercase tracking-wide bg-blue-50 text-blue-700 px-2 py-0.5 rounded-md border border-blue-200/50">
                                {perfilInfo.emo} {perfilInfo.nome}
                              </span>
                            )}
                            <span className="text-[9px] font-extrabold uppercase tracking-wide bg-[#EEF4FA] text-[#33415C] px-2 py-0.5 rounded-md border border-slate-200/50">
                              {etapaNome}
                            </span>
                            {c.expressa && (
                              <span className="text-[9px] font-extrabold uppercase tracking-wide bg-amber-50 text-amber-700 px-2 py-0.5 rounded-md border border-amber-200/40">
                                Via Expressa
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Details grid */}
                        <div className="grid grid-cols-2 gap-3 text-xs pt-1 border-t border-slate-100">
                          <div className="space-y-0.5">
                            <span className="text-[9px] font-bold text-slate-400 uppercase block tracking-wider">Objetivo</span>
                            <span className="font-semibold text-slate-700">{c.objetivo}</span>
                          </div>
                          <div className="space-y-0.5">
                            <span className="text-[9px] font-bold text-slate-400 uppercase block tracking-wider">Faixa Estimada</span>
                            <span className="font-semibold text-slate-700">{c.faixa || 'Não especificada'}</span>
                          </div>
                          <div className="space-y-0.5">
                            <span className="text-[9px] font-bold text-slate-400 uppercase block tracking-wider">Localização</span>
                            <span className="font-semibold text-slate-700 truncate block max-w-full" title={c.local || ''}>
                              {c.local || 'Não especificada'}
                            </span>
                          </div>
                          <div className="space-y-0.5">
                            <span className="text-[9px] font-bold text-slate-400 uppercase block tracking-wider">Temperatura</span>
                            <span className="font-bold flex items-center gap-1.5">
                              <span className={`w-2 h-2 rounded-full ${
                                c.temp === 'quente' ? 'bg-red-500' : c.temp === 'morno' ? 'bg-amber-500' : 'bg-blue-500'
                              }`} />
                              <span className="capitalize text-slate-700">{c.temp}</span>
                            </span>
                          </div>
                        </div>

                        {c.preferencia && (
                          <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100 text-[11px] text-slate-600 leading-normal">
                            <b className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block mb-0.5">Preferencia Declarada</b>
                            {c.preferencia}
                          </div>
                        )}
                      </div>

                      {/* Contact Footer */}
                      <div className="flex items-center justify-between border-t border-slate-50 pt-3 text-[11px] font-bold text-slate-500">
                        <div className="flex items-center gap-1">
                          <Phone size={12} className="text-slate-400" />
                          <span>{c.contato || 'N/A'}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Mail size={12} className="text-slate-400" />
                          <span className="truncate max-w-[150px]" title={c.email || ''}>{c.email || 'N/A'}</span>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )}

        {/* TAB: PESQUISAS & SATISFAÇÃO */}
        {activeTab === 'pesquisas' && (
          <div className="space-y-6">
            {/* Top metrics: Motivos mais citados para não fechar */}
            {sortedMotivos.length > 0 && (
              <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-4">
                <div>
                  <h3 className="text-xs font-black uppercase tracking-widest text-[#33415C] flex items-center gap-1.5">
                    <ThumbsDown size={14} className="text-[#eb3238]" />
                    Motivos mais citados para não comprar
                  </h3>
                  <p className="text-[10px] text-slate-400 font-semibold mt-0.5">Dados agregados das pesquisas de leads catalogados como "Não comprou".</p>
                </div>

                <div className="space-y-2.5">
                  {sortedMotivos.map(([motivo, qtd]) => {
                    const pct = (qtd / maxMotivosCount) * 100
                    return (
                      <div key={motivo} className="space-y-1">
                        <div className="flex justify-between items-center text-xs font-bold text-slate-700">
                          <span className="truncate pr-4">{motivo}</span>
                          <span className="text-[10px] text-slate-400 font-black">{qtd} {qtd === 1 ? 'menção' : 'menções'}</span>
                        </div>
                        <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden border border-slate-200/50">
                          <div
                            className="h-full bg-gradient-to-r from-red-400 to-[#eb3238] rounded-full transition-all duration-500"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            {/* List */}
            <div className="space-y-4">
              <div className="bg-slate-100 rounded-xl px-4 py-3.5 border border-slate-200/50 flex flex-col md:flex-row md:items-center justify-between gap-2">
                <span className="text-xs font-black text-[#33415C] uppercase tracking-wider">
                  Opiniões e Respostas Registradas ({filteredSurveys.length})
                </span>
                <p className="text-[10px] text-slate-500 font-semibold leading-none">
                  Respostas enviadas de forma direta pelos clientes e proprietários.
                </p>
              </div>

              {filteredSurveys.length === 0 ? (
                <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center text-slate-400 font-semibold text-sm shadow-sm">
                  Nenhuma pesquisa encontrada nesta categoria ou com este filtro.
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredSurveys.map((p, idx) => {
                    const cfg = TIPO_CFG[p.tipo] || { l: p.tipo, bg: '#f1f5f9', c: '#475569' }
                    const perfInfo = p.perfil ? PERFIS[p.perfil.toLowerCase()] : null

                    return (
                      <div
                        key={p.id || idx}
                        className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm hover:border-[#33415C]/40 transition-all duration-200 space-y-4"
                      >
                        {/* Top row */}
                        <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-50">
                          <div className="space-y-0.5">
                            <span className="text-sm font-black text-slate-800 block">{p.nome}</span>
                            <span className="text-[10px] text-slate-400 font-bold block">{p.data || 'Sem data'}</span>
                          </div>
                          
                          <div className="flex flex-wrap items-center gap-2">
                            <span
                              className="text-[9px] font-extrabold uppercase tracking-wide px-2 py-0.5 rounded-md"
                              style={{ backgroundColor: cfg.bg, color: cfg.c }}
                            >
                              {cfg.l}
                            </span>
                            {perfInfo && (
                              <span className="text-[9px] font-extrabold uppercase tracking-wide bg-blue-50 text-blue-700 px-2 py-0.5 rounded-md border border-blue-200/50">
                                {perfInfo.emo} {perfInfo.nome} (SPIN)
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Ratings */}
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 rounded-xl p-3 border border-slate-100">
                          {[
                            { val: p.nota_imovel, label: 'Imóvel' },
                            { val: p.nota_corretor, label: 'Corretor' },
                            { val: p.nota_atend, label: 'Atendimento' },
                            { val: p.nota_site, label: 'Site' }
                          ].map((rating, rIdx) => (
                            <div key={rIdx} className="space-y-0.5">
                              <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">{rating.label}</span>
                              <div className="flex items-center gap-1">
                                <Star size={12} className={rating.val !== null ? 'text-amber-500 fill-amber-500' : 'text-slate-300'} />
                                <span className={`text-xs font-extrabold ${rating.val !== null ? 'text-slate-700' : 'text-slate-400'}`}>
                                  {rating.val !== null ? `${rating.val}/10` : '—'}
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>

                        {/* Mapped Interests */}
                        {p.interesse && Object.keys(p.interesse).length > 0 && (
                          <div className="grid grid-cols-2 md:grid-cols-5 gap-3 text-xs pt-1">
                            {p.interesse.op && (
                              <div className="space-y-0.5">
                                <span className="text-[9px] font-bold text-slate-400 uppercase block tracking-wider">Operação</span>
                                <span className="font-semibold text-slate-700 capitalize">{p.interesse.op}</span>
                              </div>
                            )}
                            {p.interesse.tipoImovel && (
                              <div className="space-y-0.5">
                                <span className="text-[9px] font-bold text-slate-400 uppercase block tracking-wider">Imóvel</span>
                                <span className="font-semibold text-slate-700">{p.interesse.tipoImovel}</span>
                              </div>
                            )}
                            {p.interesse.quartos && (
                              <div className="space-y-0.5">
                                <span className="text-[9px] font-bold text-slate-400 uppercase block tracking-wider">Quartos</span>
                                <span className="font-semibold text-slate-700">{p.interesse.quartos} q</span>
                              </div>
                            )}
                            {p.interesse.local && (
                              <div className="space-y-0.5">
                                <span className="text-[9px] font-bold text-slate-400 uppercase block tracking-wider">Localização</span>
                                <span className="font-semibold text-slate-700 truncate block" title={p.interesse.local}>{p.interesse.local}</span>
                              </div>
                            )}
                            {p.interesse.valor && (
                              <div className="space-y-0.5">
                                <span className="text-[9px] font-bold text-slate-400 uppercase block tracking-wider">Valor Faixa</span>
                                <span className="font-semibold text-slate-700">{p.interesse.valor}</span>
                              </div>
                            )}
                          </div>
                        )}

                        {/* Motivo da perda */}
                        {p.motivo && (
                          <div className="bg-red-50/20 p-3 rounded-xl border border-red-200/30 text-xs text-slate-650 leading-relaxed">
                            <b className="text-[9px] font-black text-red-500 uppercase tracking-widest block mb-0.5">Por que não fechou / Justificativa</b>
                            <span className="italic">"{p.motivo}"</span>
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
