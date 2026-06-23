'use client'

import { useState } from 'react'
import { VendasPesquisa } from '@/lib/types'
import { PUB_LABEL, QS_PUBLICO } from '@/lib/constants'

interface PesquisasLeadsProps {
  pesquisas: VendasPesquisa[]
}

export default function PesquisasLeads({
  pesquisas
}: PesquisasLeadsProps) {
  const [pesqTab, setPesqTab] = useState<'gerar' | 'formulario'>('gerar')
  const [pesqPublico, setPesqPublico] = useState<string>('')
  const [linkGerado, setLinkGerado] = useState(false)
  const [pesqQs, setPesqQs] = useState<Record<string, number[]>>({})

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <h1 className="text-xl md:text-2xl font-black text-[#1F4E79]">Pesquisas &amp; Captação de Leads</h1>
          <p className="text-xs text-slate-500 mt-1">Gere pesquisas de satisfação para clientes ou simule o quiz de interesse que identifica perfis de leads.</p>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-1 shadow-sm flex flex-shrink-0">
          <button
            onClick={() => setPesqTab('gerar')}
            className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${
              pesqTab === 'gerar'
                ? 'bg-[#1F4E79] text-white shadow-sm'
                : 'text-slate-500 hover:text-[#1F4E79]'
            }`}
          >
            Gerar Pesquisa
          </button>
          <button
            onClick={() => setPesqTab('formulario')}
            className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${
              pesqTab === 'formulario'
                ? 'bg-[#1F4E79] text-white shadow-sm'
                : 'text-slate-500 hover:text-[#1F4E79]'
            }`}
          >
            Formulário de Interesse (Simulação)
          </button>
        </div>
      </div>

      {/* TAB: GERAR LINK PESQUISA */}
      {pesqTab === 'gerar' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-4">
            <div className="space-y-2">
              <label className="block text-xs font-extrabold uppercase tracking-wide text-slate-500">1 · Quem vai responder a pesquisa?</label>
              <select
                value={pesqPublico}
                onChange={(e) => {
                  const val = e.target.value
                  setPesqPublico(val)
                  setLinkGerado(false)
                  if (val && !pesqQs[val]) {
                    setPesqQs(prev => ({ ...prev, [val]: QS_PUBLICO[val as keyof typeof QS_PUBLICO].map((_, i) => i) }))
                  }
                }}
                className="w-full border border-slate-200 rounded-xl p-3 text-xs md:text-sm font-semibold outline-none focus:border-[#2E6CA8] bg-white cursor-pointer"
              >
                <option value="">Selecione o público alvo...</option>
                {Object.keys(PUB_LABEL).map(key => (
                  <option key={key} value={key}>{PUB_LABEL[key as keyof typeof PUB_LABEL]}</option>
                ))}
              </select>
            </div>

            {pesqPublico && (
              <div className="space-y-2">
                <label className="block text-xs font-extrabold uppercase tracking-wide text-slate-500">2 · Perguntas incluídas na pesquisa</label>
                <div className="space-y-1.5 max-h-[300px] overflow-y-auto">
                  {QS_PUBLICO[pesqPublico as keyof typeof QS_PUBLICO].map((q, idx) => {
                    const activeQs = pesqQs[pesqPublico] || []
                    const on = activeQs.includes(idx)
                    return (
                      <div
                        key={idx}
                        onClick={() => {
                          if (on) {
                            setPesqQs(prev => ({ ...prev, [pesqPublico]: activeQs.filter(x => x !== idx) }))
                          } else {
                            setPesqQs(prev => ({ ...prev, [pesqPublico]: [...activeQs, idx] }))
                          }
                        }}
                        className={`flex items-center gap-3 p-3 border rounded-xl cursor-pointer transition-all ${
                          on
                            ? 'border-[#1F4E79] bg-[#EEF4FA] text-[#1F4E79] font-bold'
                            : 'border-slate-100 hover:border-slate-200 bg-white text-slate-600'
                        }`}
                      >
                        <span className={`w-4.5 h-4.5 rounded border flex items-center justify-center text-[10px] ${
                          on ? 'bg-[#1F4E79] border-[#1F4E79] text-white' : 'border-slate-300'
                        }`}>
                          {on && '✓'}
                        </span>
                        <span className="text-xs leading-tight">{q}</span>
                      </div>
                    )
                  })}
                </div>

                <button
                  onClick={() => setLinkGerado(true)}
                  className="w-full bg-[#1F4E79] hover:bg-[#2E6CA8] text-white text-xs font-bold py-3 rounded-xl transition-all shadow-sm flex items-center justify-center gap-2 mt-3"
                >
                  Gerar link da pesquisa
                </button>
              </div>
            )}

            {linkGerado && (
              <div className="bg-[#EEF4FA] border border-dashed border-[#2E6CA8] rounded-xl p-4 text-xs font-semibold text-[#1F4E79] break-all flex flex-col gap-1.5 animate-fadeIn">
                <span>🔗 Link gerado com sucesso:</span>
                <span className="font-mono text-[11px] bg-white p-2 rounded-lg border border-slate-100 mt-1 select-all">
                  {typeof window !== 'undefined' ? window.location.origin + '/publico/pesquisa?tipo=' + pesqPublico + (pesqQs[pesqPublico] ? '&q=' + pesqQs[pesqPublico].join(',') : '') : ''}
                </span>
                <button
                  type="button"
                  onClick={() => {
                    const link = typeof window !== 'undefined' ? window.location.origin + '/publico/pesquisa?tipo=' + pesqPublico + (pesqQs[pesqPublico] ? '&q=' + pesqQs[pesqPublico].join(',') : '') : '';
                    navigator.clipboard.writeText(link).then(() => alert("Link copiado!"));
                  }}
                  className="bg-white hover:bg-slate-50 border border-slate-200 text-slate-600 font-bold py-2 rounded-xl text-xs mt-1 transition-all"
                >
                  Copiar Link
                </button>
              </div>
            )}
          </div>

          {/* COLUMN 2: RESPONSES LIST */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-4">
            <h3 className="text-sm font-extrabold uppercase tracking-wide text-slate-700">Respostas Recebidas ({pesquisas.length})</h3>
            <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1">
              {pesquisas.length === 0 ? (
                <p className="text-xs text-slate-400 text-center py-8">Nenhuma resposta recebida ainda.</p>
              ) : (
                pesquisas.map((r, idx) => {
                  return (
                    <div key={r.id || idx} className="border border-slate-100 rounded-xl p-3.5 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-xs">{r.nome}</span>
                        <span className="text-[10px] text-slate-400">{r.data}</span>
                      </div>
                      
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-[10px] text-slate-500">
                        {r.nota_imovel !== null && <div><b>Imóvel:</b> {r.nota_imovel}/10</div>}
                        {r.nota_corretor !== null && <div><b>Corretor:</b> {r.nota_corretor}/10</div>}
                        {r.nota_atend !== null && <div><b>Atend:</b> {r.nota_atend}/10</div>}
                        {r.nota_site !== null && <div><b>Site:</b> {r.nota_site}/10</div>}
                      </div>
                      
                      <div className="flex flex-wrap gap-1.5 mt-1">
                        <span className="text-[9px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded font-semibold uppercase">{r.tipo}</span>
                        {r.perfil && <span className="text-[9px] bg-emerald-50 text-emerald-700 px-1.5 py-0.5 rounded font-semibold uppercase">SPIN: {r.perfil}</span>}
                      </div>

                      {r.motivo && (
                        <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-100 mt-2">
                          <span className="font-bold text-[9px] text-slate-400 uppercase tracking-wide block">Por que não fechou</span>
                          <p className="text-slate-600 font-medium italic mt-0.5 leading-relaxed">{r.motivo}</p>
                        </div>
                      )}
                    </div>
                  )
                })
              )}
            </div>
          </div>
        </div>
      )}

      {pesqTab === 'formulario' && (
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
          <h3 className="text-sm font-extrabold uppercase tracking-wide text-slate-700">Formulário de Interesse (Simulador)</h3>
          <p className="text-xs text-slate-500">
            Você pode copiar o link público para enviar aos seus clientes ou realizar uma simulação rápida no link abaixo:
          </p>
          <div className="bg-[#EEF4FA] border border-dashed border-[#2E6CA8] rounded-xl p-4 text-xs font-semibold text-[#1F4E79] break-all flex flex-col gap-1.5">
            <span>🔗 Link do Formulário Público de Interesse:</span>
            <span className="font-mono text-[11px] bg-white p-2 rounded-lg border border-slate-100 mt-1 select-all">
              {typeof window !== 'undefined' ? window.location.origin + '/publico/qualificar' : ''}
            </span>
            <button
              type="button"
              onClick={() => {
                const link = typeof window !== 'undefined' ? window.location.origin + '/publico/qualificar' : '';
                navigator.clipboard.writeText(link).then(() => alert("Link copiado!"));
              }}
              className="bg-white hover:bg-slate-50 border border-slate-200 text-slate-600 font-bold py-2 rounded-xl text-xs mt-1 transition-all"
            >
              Copiar Link do Formulário
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
