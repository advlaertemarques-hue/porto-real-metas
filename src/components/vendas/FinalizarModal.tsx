'use client'

import { X } from 'lucide-react'
import { VendasCliente } from '@/lib/types'

export type FinalizarStatus = 'sucesso' | 'perdido' | 'interessado'

interface FinalizarModalProps {
  open: boolean
  client: VendasCliente | null
  onClose: () => void
  onConfirm: () => void
  status: FinalizarStatus
  setStatus: React.Dispatch<React.SetStateAction<FinalizarStatus>>
  motivo: string
  setMotivo: React.Dispatch<React.SetStateAction<string>>
  customMotivo: string
  setCustomMotivo: React.Dispatch<React.SetStateAction<string>>
  valFechado: string
  setValFechado: React.Dispatch<React.SetStateAction<string>>
}

export default function FinalizarModal({
  open,
  client,
  onClose,
  onConfirm,
  status,
  setStatus,
  motivo,
  setMotivo,
  customMotivo,
  setCustomMotivo,
  valFechado,
  setValFechado,
}: FinalizarModalProps) {
  if (!open || !client) return null

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl animate-scaleIn space-y-4 max-h-[90vh] overflow-y-auto">

        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div>
            <h3 className="font-black text-[#33415C] text-base md:text-lg flex items-center gap-1.5">🏁 Finalizar Processo</h3>
            <p className="text-[11px] text-slate-400 font-medium">Finalize o processo de {client.nome} no funil.</p>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 transition-colors p-1"
          >
            <X size={20} />
          </button>
        </div>

        <div className="space-y-4">
          <div className="space-y-1">
            <label className="text-xs font-extrabold text-slate-500 uppercase tracking-wider block">Resultado do Processo</label>
            <div className="grid grid-cols-3 gap-1.5">
              <button
                type="button"
                onClick={() => {
                  setStatus('sucesso')
                  setMotivo('')
                }}
                className={`py-2 px-1.5 rounded-xl border text-[10px] md:text-xs font-bold transition-all ${
                  status === 'sucesso'
                    ? 'border-emerald-500 bg-emerald-50 text-emerald-700 font-extrabold shadow-xs'
                    : 'border-slate-100 hover:bg-slate-50 text-slate-600'
                }`}
              >
                🎉 Ganho
              </button>
              <button
                type="button"
                onClick={() => {
                  setStatus('perdido')
                  setMotivo('')
                  setCustomMotivo('')
                }}
                className={`py-2 px-1.5 rounded-xl border text-[10px] md:text-xs font-bold transition-all ${
                  status === 'perdido'
                    ? 'border-rose-500 bg-rose-50 text-rose-700 font-extrabold shadow-xs'
                    : 'border-slate-100 hover:bg-slate-50 text-slate-600'
                }`}
              >
                ❌ Perdido
              </button>
              <button
                type="button"
                onClick={() => {
                  setStatus('interessado')
                  setMotivo('')
                  setCustomMotivo('')
                }}
                className={`py-2 px-1.5 rounded-xl border text-[10px] md:text-xs font-bold transition-all ${
                  status === 'interessado'
                    ? 'border-indigo-500 bg-indigo-50 text-indigo-700 font-extrabold shadow-xs'
                    : 'border-slate-100 hover:bg-slate-50 text-slate-600'
                }`}
              >
                📥 Interessado
              </button>
            </div>
          </div>

          {/* DYNAMIC FORM IF SUCCESS & COMPRAR */}
          {status === 'sucesso' && client.objetivo === 'Comprar' && (
            <div className="bg-emerald-50/50 border border-emerald-100 rounded-xl p-4 space-y-3">
              <span className="text-[10px] font-extrabold text-emerald-700 uppercase tracking-wider block">Valores da Transação (Venda)</span>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-500 tracking-wider block">Valor Fechado (R$)</label>
                <input
                  type="number"
                  placeholder="Ex: 340000"
                  value={valFechado}
                  onChange={(e) => setValFechado(e.target.value)}
                  className="w-full border border-slate-200 rounded-xl p-2.5 text-xs outline-none focus:border-emerald-500 bg-white font-bold text-slate-800"
                />
              </div>
            </div>
          )}

          {/* DYNAMIC FORM IF LOST */}
          {status === 'perdido' && (
            <div className="space-y-3 bg-rose-50/30 border border-rose-100 rounded-xl p-4">
              <div className="space-y-1">
                <label className="text-xs font-extrabold text-slate-500 uppercase tracking-wider block">Motivo do Insucesso</label>
                <select
                  value={motivo}
                  onChange={(e) => {
                    setMotivo(e.target.value)
                    if (e.target.value !== 'Outro') setCustomMotivo('')
                  }}
                  className="w-full border border-slate-200 rounded-xl p-2.5 text-xs outline-none bg-white cursor-pointer font-medium"
                >
                  <option value="">Selecione o motivo da perda...</option>
                  {(client.etapa === 9 || client.etapa === 8) ? (
                    <>
                      <option value="Proposta recusada pelo vendedor">Proposta recusada pelo proprietário/vendedor</option>
                      <option value="Proposta recusada pelo comprador">Proposta recusada pelo comprador</option>
                      <option value="Sem acordo de valores (desconto insuficiente)">Sem acordo de valores (desconto insuficiente)</option>
                      <option value="Financiamento negado na negociação">Financiamento bancário reprovado</option>
                      <option value="Condições de pagamento inviabilizadas">Condições de pagamento inviabilizadas</option>
                      <option value="Outro">Outro motivo customizado...</option>
                    </>
                  ) : (client.objetivo === 'Vender' || client.objetivo === 'Deixar para alugar') ? (
                    <>
                      <option value="Proprietário fechou com outra imobiliária">Proprietário fechou com outra imobiliária</option>
                      <option value="Proprietário desistiu de anunciar">Proprietário desistiu de anunciar</option>
                      <option value="Comissão acima do aceito pelo cliente">Comissão cobrada acima do aceito</option>
                      <option value="Imóvel fora de perfil/padrão">Imóvel fora de perfil/padrão</option>
                      <option value="Outro">Outro motivo customizado...</option>
                    </>
                  ) : (
                    <>
                      <option value="Comprou com concorrência">Comprou com concorrência</option>
                      <option value="Desistiu de comprar/alugar">Desistiu de comprar / alugar</option>
                      <option value="Orçamento incompatível com mercado">Orçamento incompatível com mercado</option>
                      <option value="Sumido / Sem contato">Cliente sumiu (sem contato)</option>
                      <option value="Outro">Outro motivo customizado...</option>
                    </>
                  )}
                </select>
              </div>

              {motivo === 'Outro' && (
                <div className="space-y-1 animate-fadeIn">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Descreva o Motivo</label>
                  <input
                    type="text"
                    placeholder="Digite o motivo customizado..."
                    value={customMotivo}
                    onChange={(e) => setCustomMotivo(e.target.value)}
                    className="w-full border border-slate-200 rounded-xl p-2.5 text-xs outline-none focus:border-rose-500 bg-white"
                  />
                </div>
              )}
            </div>
          )}
        </div>

        <div className="flex gap-3 pt-3 border-t border-slate-100">
          <button
            onClick={onClose}
            className="flex-1 bg-white hover:bg-slate-50 border border-slate-200 text-slate-500 font-bold py-2.5 rounded-xl text-xs md:text-sm transition-colors"
          >
            Voltar
          </button>
          <button
            onClick={onConfirm}
            disabled={status === 'perdido' && !motivo}
            className="flex-1 bg-[#33415C] hover:bg-[#47587A] disabled:opacity-50 text-white font-bold py-2.5 rounded-xl text-xs md:text-sm transition-all shadow-sm"
          >
            Confirmar
          </button>
        </div>

      </div>
    </div>
  )
}
