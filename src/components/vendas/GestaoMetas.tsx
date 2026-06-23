'use client'

import { useState } from 'react'
import { VendasCliente, VendasPesquisa } from '@/lib/types'
import { ETAPAS, I_VISITA, I_PROPOSTA, I_FECHAMENTO, fmtBRL } from '@/lib/constants'
import { Award, Settings } from 'lucide-react'

interface GestaoMetasProps {
  clientes: VendasCliente[]
  pesquisas: VendasPesquisa[]
}

export default function GestaoMetas({
  clientes,
  pesquisas
}: GestaoMetasProps) {
  const [metaPeriodo, setMetaPeriodo] = useState<'mes' | 'tri' | 'sem' | 'ano'>('mes')
  const [showMetaSettings, setShowMetaSettings] = useState(false)
  const [metasAtivas, setMetasAtivas] = useState<string[]>([
    'captados', 'vgv', 'conversao', 'satisfacao', 'visitas', 'cadastro'
  ])

  const getPeriodDays = (period: 'mes' | 'tri' | 'sem' | 'ano') => {
    switch (period) {
      case 'mes': return 30
      case 'tri': return 90
      case 'sem': return 180
      case 'ano': return 365
    }
  }

  const isWithinDays = (dateStr?: string, days?: number) => {
    if (!dateStr) return false
    const date = new Date(dateStr)
    const now = new Date()
    const diffTime = Math.abs(now.getTime() - date.getTime())
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    return diffDays <= (days || 30)
  }

  const calcMetas = () => {
    const fechados = clientes.filter(c => c.etapa >= I_FECHAMENTO)
    const vgvFunil = fechados.reduce((s, c) => s + (c.valor || 0), 0)
    const visitasFunil = clientes.filter(c => c.etapa >= I_VISITA).length
    
    // Calc CRM completeness
    let totalPct = 0
    clientes.forEach(c => {
      let fieldsCount = 0
      let filledCount = 0
      
      // Nome
      fieldsCount++
      if (c.nome && c.nome.trim() !== '') filledCount++
      
      // Contato
      fieldsCount++
      if (c.contato && c.contato !== '—' && c.contato.trim() !== '') filledCount++
      
      // Email
      fieldsCount++
      if (c.email && c.email !== '—' && c.email.trim() !== '') filledCount++
      
      // Local
      fieldsCount++
      if (c.local && c.local.trim() !== '') filledCount++
      
      // Faixa
      fieldsCount++
      if (c.faixa && c.faixa.trim() !== '') filledCount++
      
      // Perfil
      fieldsCount++
      if (c.perfil) filledCount++
      
      totalPct += (filledCount / fieldsCount) * 100
    })
    const cadastroPct = clientes.length ? Math.round(totalPct / clientes.length) : 0

    const nVis = clientes.filter(c => c.etapa >= I_VISITA).length
    const nProp = clientes.filter(c => c.etapa >= I_PROPOSTA).length
    const nFech = fechados.length
    
    const conv = nVis ? Math.round((nFech / nVis) * 100) : 0
    const nt = pesquisas.filter(r => r.nota_atend !== null)
    const satisf = nt.length ? (nt.reduce((s, r) => s + (r.nota_atend || 0), 0) / nt.length) : 0
    
    return { vgvFunil, visitasFunil, cadastroPct, nVis, nProp, nFech, conv, satisf }
  }

  const metasValues = calcMetas()
  const vgvMetasPeriodo: Record<string, number> = { mes: 417000, tri: 1250000, sem: 2500000, ano: 5000000 }
  
  const currentVgvMeta = vgvMetasPeriodo[metaPeriodo]
  const periodDays = getPeriodDays(metaPeriodo)
  
  // Real VGV closed from CRM clients finalized as success in this period
  const currentVgvReal = clientes
    .filter(c => c.finalizado && c.status_finalizacao === 'sucesso' && isWithinDays(c.updated_at, periodDays))
    .reduce((sum, c) => sum + (c.valor_fechado || 0), 0)

  // Real captações (Vender/Deixar para alugar) finalized as success in this period
  const realCaptados = clientes.filter(c => 
    (c.objetivo === 'Vender' || c.objetivo === 'Deixar para alugar') && 
    c.finalizado && 
    c.status_finalizacao === 'sucesso' &&
    isWithinDays(c.updated_at, periodDays)
  ).length

  const capPct = Math.round((realCaptados / 1) * 100)
  const vgvPct = currentVgvMeta ? Math.round((currentVgvReal / currentVgvMeta) * 100) : 0
  const convPct = Math.round((metasValues.conv / 15) * 100)
  const satPct = metasValues.satisf > 0 ? Math.round((metasValues.satisf / 8.5) * 100) : 0
  
  // Real visits (without simulated +5)
  const visReal = metasValues.visitasFunil
  const visPct = Math.round((visReal / 10) * 100)
  const cadPct = Math.round((metasValues.cadastroPct / 90) * 100)

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <h1 className="text-xl md:text-2xl font-black text-[#1F4E79]">Acompanhamento de Metas</h1>
          <p className="text-xs text-slate-500 mt-1">Métricas medidas de forma consolidada e autônoma a partir do CRM e feedbacks.</p>
        </div>

        <div className="flex items-center gap-3">
          <div className="bg-white border border-slate-200 rounded-xl p-1 shadow-sm flex">
            {[
              { id: 'mes', label: 'Mês' },
              { id: 'tri', label: 'Trimestre' },
              { id: 'sem', label: 'Semestre' },
              { id: 'ano', label: 'Ano' }
            ].map(p => (
              <button
                key={p.id}
                onClick={() => setMetaPeriodo(p.id as any)}
                className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  metaPeriodo === p.id
                    ? 'bg-[#1F4E79] text-white shadow-sm'
                    : 'text-slate-500 hover:text-[#1F4E79]'
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>

          <button
            onClick={() => setShowMetaSettings(!showMetaSettings)}
            className="bg-white border border-slate-200 hover:bg-slate-50 p-2.5 rounded-xl text-slate-600 shadow-sm transition-colors"
            title="Configurar Metas"
          >
            <Settings size={16} />
          </button>
        </div>
      </div>

      {showMetaSettings && (
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-3 animate-fadeIn">
          <h3 className="text-xs font-extrabold uppercase tracking-widest text-[#1F4E79]">⚙ Escolher metas exibidas</h3>
          <p className="text-xs text-slate-500">Marque quais metas automáticas constam nos painéis.</p>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2.5 pt-2">
            {[
              { id: 'captados', label: 'Imóveis captados' },
              { id: 'vgv', label: 'VGV de venda' },
              { id: 'conversao', label: 'Conversão visita→venda' },
              { id: 'satisfacao', label: 'Satisfação do cliente' },
              { id: 'visitas', label: 'Visitas realizadas' },
              { id: 'cadastro', label: 'Cadastro completo no CRM' }
            ].map(meta => {
              const isActive = metasAtivas.includes(meta.id)
              return (
                <button
                  key={meta.id}
                  onClick={() => {
                    if (isActive) {
                      if (metasAtivas.length > 1) {
                        setMetasAtivas(prev => prev.filter(m => m !== meta.id))
                      }
                    } else {
                      setMetasAtivas(prev => [...prev, meta.id])
                    }
                  }}
                  className={`flex items-center gap-2 px-3.5 py-3 rounded-xl border text-left text-xs font-bold transition-all ${
                    isActive
                      ? 'border-[#1F4E79] bg-[#EEF4FA] text-[#1F4E79]'
                      : 'border-slate-100 hover:border-slate-200 bg-white text-slate-600'
                  }`}
                >
                  <span className={`w-4 h-4 rounded border flex items-center justify-center text-[10px] ${
                    isActive ? 'bg-[#1F4E79] border-[#1F4E79] text-white' : 'border-slate-300'
                  }`}>
                    {isActive && '✓'}
                  </span>
                  {meta.label}
                </button>
              )
            })}
          </div>
        </div>
      )}

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {metasAtivas.includes('captados') && (
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-4">
            <div className="flex justify-between items-start">
              <span className="text-[10px] text-slate-400 font-extrabold uppercase tracking-widest block">Imóveis Captados</span>
              <span className="bg-slate-100 text-slate-500 text-[8.5px] px-2 py-0.5 rounded font-black tracking-wide">MENSAL</span>
            </div>
            <div>
              <h3 className="text-3xl font-black text-slate-800">{realCaptados}</h3>
              <p className="text-[10px] text-slate-400 mt-1">Meta contratual: 1 exclusividade</p>
            </div>
            <div className="space-y-1.5">
              <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                <div className="h-full bg-emerald-500" style={{ width: `${Math.min(capPct, 100)}%` }}></div>
              </div>
              <div className="flex justify-between text-[10px] font-semibold text-slate-500">
                <span>Exclusividade no mês</span>
                <span className="text-emerald-600 font-extrabold">{capPct}% da meta</span>
              </div>
            </div>
          </div>
        )}

        {metasAtivas.includes('vgv') && (
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-4">
            <div className="flex justify-between items-start">
              <span className="text-[10px] text-slate-400 font-extrabold uppercase tracking-widest block">VGV de venda</span>
              <span className="bg-emerald-50 text-emerald-600 text-[8.5px] px-2 py-0.5 rounded font-black tracking-wide">AUTO</span>
            </div>
            <div>
              <h3 className="text-xl md:text-2xl font-black text-slate-800 line-clamp-1">{fmtBRL(currentVgvReal)}</h3>
              <p className="text-[10px] text-slate-400 mt-1">Meta: {fmtBRL(currentVgvMeta)} {metaPeriodo === 'mes' ? 'no mês' : `no ${metaPeriodo}`}</p>
            </div>
            <div className="space-y-1.5">
              <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                <div className="h-full bg-emerald-500" style={{ width: `${Math.min(vgvPct, 100)}%` }}></div>
              </div>
              <div className="flex justify-between text-[10px] font-semibold text-slate-500">
                <span>Fechados + simulated</span>
                <span className="text-emerald-600 font-extrabold">{vgvPct}% da meta</span>
              </div>
            </div>
          </div>
        )}

        {metasAtivas.includes('conversao') && (
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-4">
            <div className="flex justify-between items-start">
              <span className="text-[10px] text-slate-400 font-extrabold uppercase tracking-widest block">Conversão Visita→Venda</span>
              <span className="bg-emerald-50 text-emerald-600 text-[8.5px] px-2 py-0.5 rounded font-black tracking-wide">AUTO</span>
            </div>
            <div>
              <h3 className="text-3xl font-black text-slate-800">{metasValues.conv}%</h3>
              <p className="text-[10px] text-slate-400 mt-1">Meta contratual: 15%</p>
            </div>
            <div className="space-y-1.5">
              <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                <div className="h-full bg-[#2E6CA8]" style={{ width: `${Math.min(convPct, 100)}%` }}></div>
              </div>
              <div className="flex justify-between text-[10px] font-semibold text-slate-500">
                <span>Etapa 8 para 12</span>
                <span className="text-[#2E6CA8] font-extrabold">{convPct}% da meta</span>
              </div>
            </div>
          </div>
        )}

        {metasAtivas.includes('satisfacao') && (
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-4">
            <div className="flex justify-between items-start">
              <span className="text-[10px] text-slate-400 font-extrabold uppercase tracking-widest block">Satisfação do cliente</span>
              <span className="bg-emerald-50 text-emerald-600 text-[8.5px] px-2 py-0.5 rounded font-black tracking-wide">AUTO</span>
            </div>
            <div>
              <h3 className="text-2xl md:text-3xl font-black text-slate-800">
                {metasValues.satisf > 0 ? (
                  <>
                    {metasValues.satisf.toFixed(1)}
                    <span className="text-slate-400 text-xs font-semibold">/10</span>
                  </>
                ) : (
                  <span className="text-slate-400 text-sm font-semibold">N/A (Sem avaliações)</span>
                )}
              </h3>
              <p className="text-[10px] text-slate-400 mt-1">Meta de satisfação: 8.5/10</p>
            </div>
            <div className="space-y-1.5">
              <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                <div className="h-full bg-emerald-500" style={{ width: `${Math.min(satPct, 100)}%` }}></div>
              </div>
              <div className="flex justify-between text-[10px] font-semibold text-slate-500">
                <span>NPS médio pesquisas</span>
                <span className="text-emerald-600 font-extrabold">{satPct}% da meta</span>
              </div>
            </div>
          </div>
        )}

        {metasAtivas.includes('visitas') && (
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-4">
            <div className="flex justify-between items-start">
              <span className="text-[10px] text-slate-400 font-extrabold uppercase tracking-widest block">Visitas Realizadas</span>
              <span className="bg-emerald-50 text-emerald-600 text-[8.5px] px-2 py-0.5 rounded font-black tracking-wide">AUTO</span>
            </div>
            <div>
              <h3 className="text-3xl font-black text-slate-800">{visReal}</h3>
              <p className="text-[10px] text-slate-400 mt-1">Meta de visitas: 10 no mês</p>
            </div>
            <div className="space-y-1.5">
              <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                <div className="h-full bg-emerald-500" style={{ width: `${Math.min(visPct, 100)}%` }}></div>
              </div>
              <div className="flex justify-between text-[10px] font-semibold text-slate-500">
                <span>Base + funil atual</span>
                <span className="text-emerald-600 font-extrabold">{visPct}% da meta</span>
              </div>
            </div>
          </div>
        )}

        {metasAtivas.includes('cadastro') && (
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-4">
            <div className="flex justify-between items-start">
              <span className="text-[10px] text-slate-400 font-extrabold uppercase tracking-widest block">% Cadastro Completo</span>
              <span className="bg-emerald-50 text-emerald-600 text-[8.5px] px-2 py-0.5 rounded font-black tracking-wide">AUTO</span>
            </div>
            <div>
              <h3 className="text-3xl font-black text-slate-800">{metasValues.cadastroPct}%</h3>
              <p className="text-[10px] text-slate-400 mt-1">Exigência mínima: 90% completo</p>
            </div>
            <div className="space-y-1.5">
              <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                <div className="h-full bg-emerald-500" style={{ width: `${Math.min(cadPct, 100)}%` }}></div>
              </div>
              <div className="flex justify-between text-[10px] font-semibold text-slate-500">
                <span>Etapa 2 CRM completeness</span>
                <span className="text-emerald-600 font-extrabold">{cadPct}% da meta</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Metas Funil de Conversao Chart */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-5">
        <div>
          <h3 className="text-sm font-extrabold uppercase tracking-wide text-[#1F4E79]">Funil de Conversão (Clientes no Processo)</h3>
          <p className="text-xs text-slate-400 mt-1">Gráfico de conversão linear das etapas estratégicas do suporte de vendas.</p>
        </div>

        <div className="space-y-3.5">
          {[
            { label: "Visitaram (Etapa E3+)", count: metasValues.nVis, conv: "100%" },
            { label: "Propostas (Etapa E4+)", count: metasValues.nProp, conv: `${metasValues.nVis ? Math.round((metasValues.nProp / metasValues.nVis) * 100) : 0}%` },
            { label: "Fecharam (Etapa E6+)", count: metasValues.nFech, conv: `${metasValues.nVis ? Math.round((metasValues.nFech / metasValues.nVis) * 100) : 0}%` }
          ].map((row, idx) => {
            const maxCount = Math.max(metasValues.nVis, 1)
            const barPct = Math.max((row.count / maxCount) * 100, 8)
            return (
              <div key={idx} className="flex items-center gap-4 text-xs md:text-sm font-semibold text-slate-700">
                <div className="w-40 flex-shrink-0 text-slate-600">{row.label}</div>
                <div className="flex-1 bg-slate-50 h-8 rounded-xl overflow-hidden relative border border-slate-100 shadow-inner">
                  <div
                    className="h-full bg-gradient-to-r from-[#1F4E79] to-[#2E6CA8] flex items-center px-4 text-white font-bold transition-all text-xs rounded-xl shadow-md"
                    style={{ width: `${barPct}%` }}
                  >
                    {row.count}
                  </div>
                </div>
                <div className="w-16 text-right text-slate-500 font-bold">{row.conv}</div>
              </div>
            )
          })}
        </div>

        <div className="bg-slate-50 border border-slate-100 rounded-xl p-4 text-xs text-slate-500 leading-relaxed">
          Estes dados são compilados de forma autônoma a partir do <b>Funil de Clientes</b>. Conforme você atualiza as etapas e move os leads pelas etapas estratégicas, os valores e conversões de venda são computados em tempo real.
        </div>
      </div>

      {/* Metas de Equipe description */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-3">
        <h3 className="text-sm font-extrabold uppercase tracking-wide text-[#1F4E79]">Modelo de Atuação &amp; Regras</h3>
        <div className="bg-[#EEF4FA]/50 border border-[#D6E4F0] rounded-xl p-4 text-xs md:text-sm text-slate-700 leading-relaxed space-y-2">
          <p>
            As metas operacionais apoiam o modelo consultivo da imobiliária <b>Porto Real</b>:
          </p>
          <ul className="list-disc pl-5 space-y-1 text-xs md:text-sm text-slate-600">
            <li><b>Andressa</b> é a responsável pelas etapas iniciais do funil (E1 a E2), garantindo o primeiro contato em menos de 1h (com apoio da IA Lais).</li>
            <li>O **Corretor** assume o atendimento direto a partir da visita, propostas e negociações (etapas E3 a E5).</li>
            <li>O fechamento do contrato (etapa E6) é conduzido de forma conjunta entre a equipe de contratos e o corretor.</li>
            <li>A equipe de **Pós-venda** gerencia as etapas de acompanhamento e indicação (etapas E7 a E9).</li>
          </ul>
        </div>
      </div>
    </div>
  )
}
