'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase'
import { X, KeyRound, Check, Eye, EyeOff } from 'lucide-react'

// Troca de senha do usuário LOGADO (supabase.auth.updateUser).
// Não usa e-mail/SMTP nem a Admin API — funciona com a sessão atual.
export default function TrocarSenhaModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [senha, setSenha] = useState('')
  const [confirma, setConfirma] = useState('')
  const [show, setShow] = useState(false)
  const [loading, setLoading] = useState(false)
  const [erro, setErro] = useState<string | null>(null)
  const [ok, setOk] = useState(false)

  if (!open) return null

  const fechar = () => {
    setSenha(''); setConfirma(''); setErro(null); setOk(false); setShow(false)
    onClose()
  }

  const submit = async () => {
    setErro(null)
    if (senha.length < 6) { setErro('A senha precisa ter pelo menos 6 caracteres.'); return }
    if (senha !== confirma) { setErro('As senhas não conferem.'); return }
    setLoading(true)
    try {
      const supabase = createClient()
      const { error } = await supabase.auth.updateUser({ password: senha })
      if (error) { setErro(error.message || 'Não foi possível alterar a senha.'); setLoading(false); return }
      setOk(true); setSenha(''); setConfirma('')
      setTimeout(fechar, 1600)
    } catch (e: any) {
      setErro(e?.message || 'Erro ao alterar a senha.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4" onClick={fechar}>
      <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-2xl text-slate-800" onClick={(e) => e.stopPropagation()}>
        <div className="flex justify-between items-start mb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-[#EEF4FA] text-[#33415C] flex items-center justify-center flex-shrink-0"><KeyRound size={18} /></div>
            <div>
              <h3 className="text-base font-black text-slate-800">Trocar senha</h3>
              <p className="text-[11px] text-slate-400 font-semibold">Defina uma nova senha de acesso.</p>
            </div>
          </div>
          <button onClick={fechar} className="text-slate-400 hover:text-slate-700"><X size={18} /></button>
        </div>

        {ok ? (
          <div className="py-6 text-center">
            <Check className="mx-auto text-emerald-500 mb-2" size={40} />
            <p className="text-sm font-bold text-slate-700">Senha alterada com sucesso!</p>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="relative">
              <input
                type={show ? 'text' : 'password'}
                value={senha}
                onChange={(e) => setSenha(e.target.value)}
                placeholder="Nova senha (mín. 6 caracteres)"
                className="w-full border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm outline-none focus:border-[#eb3238] pr-10"
              />
              <button type="button" onClick={() => setShow((s) => !s)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                {show ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            <input
              type={show ? 'text' : 'password'}
              value={confirma}
              onChange={(e) => setConfirma(e.target.value)}
              placeholder="Confirmar nova senha"
              className="w-full border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm outline-none focus:border-[#eb3238]"
            />
            {erro && <p className="text-[12px] text-rose-600 font-semibold">{erro}</p>}
            <button
              onClick={submit}
              disabled={loading}
              className="w-full bg-[#eb3238] hover:bg-[#c6282e] text-white font-bold py-2.5 rounded-xl text-sm transition-colors disabled:opacity-60"
            >
              {loading ? 'Salvando...' : 'Salvar nova senha'}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
