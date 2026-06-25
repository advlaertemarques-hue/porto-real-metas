'use client'

import { X } from 'lucide-react'
import { VendasCorretor, User } from '@/lib/types'
import { FAIXAS_VALOR } from '@/lib/constants'

// Estado do formulário de novo cliente. Exportado para que MinhaCarteira tipe
// seu useState com a mesma forma e os dois não saiam de sincronia.
export type FormNovoState = {
  nome: string
  contato: string
  email: string
  objetivo: string
  faixa: string
  local: string
  origem: string
  corretor_id: string
}

interface NovoClienteModalProps {
  open: boolean
  onClose: () => void
  onSubmit: () => void
  formNovo: FormNovoState
  setFormNovo: React.Dispatch<React.SetStateAction<FormNovoState>>
  corretores: VendasCorretor[]
  user: User | null
}

export default function NovoClienteModal({
  open,
  onClose,
  onSubmit,
  formNovo,
  setFormNovo,
  corretores,
  user,
}: NovoClienteModalProps) {
  if (!open) return null

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl animate-scaleIn space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <h3 className="font-black text-[#33415C] text-base md:text-lg">Cadastrar Novo Cliente</h3>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 transition-colors p-1"
          >
            <X size={20} />
          </button>
        </div>

        <div className="space-y-3.5 max-h-[60vh] overflow-y-auto pr-1">
          <div className="space-y-1">
            <label className="text-xs font-extrabold text-slate-500 uppercase tracking-wider block">Nome do Cliente</label>
            <input
              type="text"
              placeholder="Ex: Roberto Silva"
              value={formNovo.nome}
              onChange={(e) => setFormNovo({ ...formNovo, nome: e.target.value })}
              className="w-full border border-slate-200 rounded-xl p-3 text-xs md:text-sm outline-none focus:border-[#47587A]"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-extrabold text-slate-500 uppercase tracking-wider block">Telefone</label>
            <input
              type="text"
              placeholder="Ex: (69) 9 9999-9999"
              value={formNovo.contato}
              onChange={(e) => setFormNovo({ ...formNovo, contato: e.target.value })}
              className="w-full border border-slate-200 rounded-xl p-3 text-xs md:text-sm outline-none focus:border-[#47587A]"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-extrabold text-slate-500 uppercase tracking-wider block">E-mail</label>
            <input
              type="email"
              placeholder="email@exemplo.com"
              value={formNovo.email}
              onChange={(e) => setFormNovo({ ...formNovo, email: e.target.value })}
              className="w-full border border-slate-200 rounded-xl p-3 text-xs md:text-sm outline-none focus:border-[#47587A]"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-extrabold text-slate-500 uppercase tracking-wider block">Objetivo</label>
            <select
              value={formNovo.objetivo}
              onChange={(e) => setFormNovo({ ...formNovo, objetivo: e.target.value })}
              className="w-full border border-slate-200 rounded-xl p-3 text-xs md:text-sm outline-none bg-white focus:border-[#47587A] cursor-pointer font-medium"
            >
              <option value="Comprar">Comprar</option>
              <option value="Alugar">Alugar</option>
              <option value="Vender">Vender</option>
              <option value="Deixar para alugar">Deixar para alugar</option>
            </select>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-extrabold text-slate-500 uppercase tracking-wider block">Faixa de Valor</label>
            <select
              value={formNovo.faixa}
              onChange={(e) => setFormNovo({ ...formNovo, faixa: e.target.value })}
              className="w-full border border-slate-200 rounded-xl p-3 text-xs md:text-sm outline-none bg-white focus:border-[#47587A] cursor-pointer font-medium"
            >
              <option value="">Selecione...</option>
              {FAIXAS_VALOR.map(f => <option key={f} value={f}>{f}</option>)}
            </select>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-extrabold text-slate-500 uppercase tracking-wider block">Localização Desejada</label>
            <input
              type="text"
              placeholder="Ex: Bairro / Cidade"
              value={formNovo.local}
              onChange={(e) => setFormNovo({ ...formNovo, local: e.target.value })}
              className="w-full border border-slate-200 rounded-xl p-3 text-xs md:text-sm outline-none focus:border-[#47587A]"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-extrabold text-slate-500 uppercase tracking-wider block">Origem do Lead</label>
            <select
              value={formNovo.origem}
              onChange={(e) => setFormNovo({ ...formNovo, origem: e.target.value })}
              className="w-full border border-slate-200 rounded-xl p-3 text-xs md:text-sm outline-none bg-white focus:border-[#47587A] cursor-pointer font-medium"
            >
              <option value="Portal (ZAP / VivaReal / OLX)">Portal (ZAP / VivaReal / OLX)</option>
              <option value="Instagram / Facebook">Instagram / Facebook</option>
              <option value="Indicação">Indicação</option>
              <option value="Placa / Loja física">Placa / Loja física</option>
              <option value="Site / Google">Site / Google</option>
            </select>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-extrabold text-slate-500 uppercase tracking-wider block">Corretor Responsável</label>
            <select
              value={user?.role === 'vendas' ? (corretores.find(co => co.user_id === user?.id)?.id || '') : formNovo.corretor_id}
              onChange={(e) => setFormNovo({ ...formNovo, corretor_id: e.target.value })}
              disabled={user?.role === 'vendas'}
              className="w-full border border-slate-200 rounded-xl p-3 text-xs md:text-sm outline-none bg-white disabled:bg-slate-50 disabled:text-slate-500 disabled:cursor-not-allowed focus:border-[#47587A] cursor-pointer font-medium"
            >
              <option value="">Não Distribuído (Sem Corretor)</option>
              {corretores.map(c => (
                <option key={c.id} value={c.id}>{c.nome}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex gap-3 pt-3 border-t border-slate-100">
          <button
            onClick={onClose}
            className="flex-1 bg-white hover:bg-slate-50 border border-slate-200 text-slate-500 font-bold py-2.5 rounded-xl text-xs md:text-sm transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={onSubmit}
            className="flex-1 bg-[#33415C] hover:bg-[#47587A] text-white font-bold py-2.5 rounded-xl text-xs md:text-sm transition-all shadow-sm"
          >
            Cadastrar
          </button>
        </div>
      </div>
    </div>
  )
}
