'use client'

import { useState, useEffect, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import {
  getAppUsuarios,
  AppUsuario,
  getVendasEquipes,
  createAppUsuario,
  deleteAppUsuario,
} from '@/lib/api'
import { VendasEquipe } from '@/lib/types'
import { Users, ShieldCheck, Briefcase, KeyRound, Info, Mail, Clock, Plus, Trash2, X } from 'lucide-react'

const ROLE: Record<string, { label: string; cls: string; icon: any }> = {
  superadmin: { label: 'Gestor', cls: 'bg-[#EEF4FA] text-[#33415C] border-[#D6E4F0]', icon: ShieldCheck },
  vendas: { label: 'Corretor', cls: 'bg-emerald-50 text-emerald-700 border-emerald-200', icon: Briefcase },
  aluguel: { label: 'Aluguel', cls: 'bg-amber-50 text-amber-700 border-amber-200', icon: Briefcase },
}

function papel(role: string | null) {
  return (role && ROLE[role]) || { label: '— sem papel', cls: 'bg-slate-50 text-slate-500 border-slate-200', icon: Users }
}

function getInitials(nome: string) {
  if (!nome) return '?'
  const p = nome.trim().split(/\s+/)
  return (p.length === 1 ? p[0].slice(0, 2) : p[0][0] + p[p.length - 1][0]).toUpperCase()
}

function fmtData(s: string | null) {
  if (!s) return 'nunca acessou'
  const d = new Date(s)
  return d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: '2-digit' }) +
    ' ' + d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
}

export default function CorretoresPage() {
  const { user, loading: authLoading } = useAuth()
  const router = useRouter()
  const [usuarios, setUsuarios] = useState<AppUsuario[]>([])
  const [equipes, setEquipes] = useState<VendasEquipe[]>([])
  const [dataLoading, setDataLoading] = useState(true)

  // Estado do modal "Novo Acesso"
  const [modalOpen, setModalOpen] = useState(false)
  const [salvando, setSalvando] = useState(false)
  const [formErro, setFormErro] = useState<string | null>(null)
  const [excluindoId, setExcluindoId] = useState<string | null>(null)
  const formInicial = {
    nome: '', email: '', senha: '',
    role: 'vendas' as 'superadmin' | 'vendas' | 'aluguel',
    telefone: '', creci: '', equipe_id: '',
  }
  const [form, setForm] = useState(formInicial)

  async function recarregar() {
    setUsuarios(await getAppUsuarios())
  }

  useEffect(() => {
    if (authLoading) return
    if (!user) { router.replace('/login'); return }
    if (user.role === 'vendas') { router.replace('/gestao-geral'); return }
    async function load() {
      try {
        const [us, eqs] = await Promise.all([getAppUsuarios(), getVendasEquipes()])
        setUsuarios(us)
        setEquipes(eqs)
      } catch (err) {
        console.error('Erro ao carregar usuários:', err)
      } finally {
        setDataLoading(false)
      }
    }
    load()
  }, [user, authLoading, router])

  function abrirModal() {
    setFormErro(null)
    setForm(formInicial)
    setModalOpen(true)
  }

  async function handleCriar(e: React.FormEvent) {
    e.preventDefault()
    setFormErro(null)
    if (!form.nome.trim() || !form.email.trim() || !form.senha.trim()) {
      setFormErro('Nome, e-mail e senha são obrigatórios.')
      return
    }
    if (form.senha.length < 6) {
      setFormErro('A senha deve ter pelo menos 6 caracteres.')
      return
    }
    setSalvando(true)
    const { ok, error } = await createAppUsuario({
      nome: form.nome.trim(),
      email: form.email.trim().toLowerCase(),
      senha: form.senha.trim(),
      role: form.role,
      telefone: form.telefone.trim() || undefined,
      creci: form.creci.trim() || undefined,
      equipe_id: form.equipe_id || undefined,
    })
    setSalvando(false)
    if (!ok) { setFormErro(error || 'Erro ao criar acesso.'); return }
    setModalOpen(false)
    await recarregar()
  }

  async function handleExcluir(u: AppUsuario) {
    if (!confirm(`Excluir o login de "${u.nome}" (${u.email})? Essa ação remove o acesso de verdade e não pode ser desfeita.`)) return
    setExcluindoId(u.id)
    const { ok, error } = await deleteAppUsuario(u.id)
    setExcluindoId(null)
    if (!ok) { alert(error || 'Não foi possível excluir o login.'); return }
    await recarregar()
  }

  const ordenados = useMemo(() => {
    const peso = (r: string | null) => (r === 'superadmin' ? 0 : r === 'vendas' ? 1 : r === 'aluguel' ? 2 : 3)
    return [...usuarios].sort((a, b) => peso(a.role) - peso(b.role) || a.nome.localeCompare(b.nome))
  }, [usuarios])

  const stats = useMemo(() => ({
    total: usuarios.length,
    gestores: usuarios.filter((u) => u.role === 'superadmin').length,
    corretores: usuarios.filter((u) => u.role === 'vendas').length,
    outros: usuarios.filter((u) => u.role !== 'superadmin' && u.role !== 'vendas').length,
  }), [usuarios])

  if (authLoading || dataLoading) {
    return (
      <div className="flex h-[80vh] items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-3">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-[#33415C] border-t-transparent"></div>
          <span className="text-sm font-semibold text-slate-600">Carregando controle de acessos...</span>
        </div>
      </div>
    )
  }
  if (user?.role !== 'superadmin') return null

  return (
    <div className="bg-slate-50 min-h-screen p-4 md:p-6 space-y-5">
      {/* Header */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl md:text-2xl font-black text-[#33415C] flex items-center gap-2">
            <Users className="text-[#eb3238]" size={22} /> Controle de Usuários
          </h1>
          <p className="text-xs text-slate-500 font-medium mt-1">
            Quem realmente acessa o sistema (login). Os corretores veem só a própria carteira; os gestores veem tudo.
          </p>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex gap-2 flex-wrap">
            <Chip n={stats.total} label="Total" />
            <Chip n={stats.gestores} label="Gestores" tone="navy" />
            <Chip n={stats.corretores} label="Corretores" tone="green" />
            {stats.outros > 0 && <Chip n={stats.outros} label="Outros" tone="slate" />}
          </div>
          <button
            onClick={abrirModal}
            className="flex items-center gap-2 bg-[#eb3238] hover:bg-[#c6282e] text-white px-4 py-2.5 rounded-xl text-xs md:text-sm font-extrabold shadow-sm transition-all hover:scale-[1.02]"
          >
            <Plus size={16} />
            Novo Acesso
          </button>
        </div>
      </div>

      {/* Aviso sobre criação de acessos */}
      <div className="flex items-start gap-2.5 bg-[#EEF4FA] border border-[#D6E4F0] rounded-xl p-3.5 text-[12px] text-[#33415C] font-medium">
        <Info size={16} className="flex-shrink-0 mt-0.5 text-[#33415C]" />
        <span>
          Esta lista reflete os <b>logins reais</b> (Supabase Auth). Como <b>gestor</b>, você pode <b>adicionar</b> e{' '}
          <b>excluir</b> acessos por aqui — a operação roda com segurança no servidor. Cada pessoa pode trocar a
          própria senha pelo botão <KeyRound size={11} className="inline -mt-0.5" /> no topo.
        </span>
      </div>

      {/* Tabela */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
        <div className="px-5 py-3.5 border-b border-slate-100">
          <span className="text-[11px] font-black text-slate-500 uppercase tracking-wider">Logins ativos ({ordenados.length})</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="text-[10px] text-slate-400 font-black uppercase tracking-wider border-b border-slate-100">
                <th className="py-3 px-5">Nome</th>
                <th className="py-3 px-3">E-mail</th>
                <th className="py-3 px-3">Papel</th>
                <th className="py-3 px-3">Equipe</th>
                <th className="py-3 px-3">CRECI / Tel</th>
                <th className="py-3 px-5">Último acesso</th>
                <th className="py-3 px-5 text-center">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {ordenados.map((u) => {
                const pp = papel(u.role)
                const Icon = pp.icon
                return (
                  <tr key={u.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="py-3 px-5">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-lg bg-[#33415C] text-white font-black text-[10px] flex items-center justify-center flex-shrink-0">
                          {getInitials(u.nome)}
                        </div>
                        <span className="font-bold text-slate-800">{u.nome}</span>
                      </div>
                    </td>
                    <td className="py-3 px-3">
                      <span className="flex items-center gap-1.5 text-slate-600 text-[13px]">
                        <Mail size={13} className="text-slate-300" /> {u.email}
                      </span>
                    </td>
                    <td className="py-3 px-3">
                      <span className={`inline-flex items-center gap-1 text-[10px] font-extrabold uppercase px-2 py-1 rounded-lg border ${pp.cls}`}>
                        <Icon size={11} /> {pp.label}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-slate-500 text-[13px]">{u.equipe || '—'}</td>
                    <td className="py-3 px-3 text-slate-500 text-[12px]">
                      {u.creci ? `CRECI ${u.creci}` : ''}{u.creci && u.telefone ? ' · ' : ''}{u.telefone || (!u.creci ? '—' : '')}
                    </td>
                    <td className="py-3 px-5 text-slate-400 text-[12px]">
                      <span className="flex items-center gap-1.5"><Clock size={12} /> {fmtData(u.last_sign_in_at)}</span>
                    </td>
                    <td className="py-3 px-5 text-center">
                      {u.id === user?.id ? (
                        <span className="text-[10px] text-slate-400 font-bold bg-slate-100 px-2 py-1 rounded-md whitespace-nowrap">
                          Você
                        </span>
                      ) : (
                        <button
                          onClick={() => handleExcluir(u)}
                          disabled={excluindoId === u.id}
                          className="p-2 text-rose-500 hover:text-white hover:bg-rose-500 rounded-lg transition-all disabled:opacity-40"
                          title="Excluir login"
                        >
                          <Trash2 size={15} />
                        </button>
                      )}
                    </td>
                  </tr>
                )
              })}
              {ordenados.length === 0 && (
                <tr><td colSpan={7} className="py-10 text-center text-slate-400 text-sm font-semibold">Nenhum usuário encontrado.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ============================================================
          MODAL: NOVO ACESSO (login real)
          ============================================================ */}
      {modalOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-black text-[#33415C] text-base md:text-lg flex items-center gap-1.5">🔑 Novo Login</h3>
                <p className="text-[11px] text-slate-400 font-medium">Cria um acesso real ao sistema.</p>
              </div>
              <button onClick={() => setModalOpen(false)} className="text-slate-400 hover:text-slate-600 transition-colors p-1">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleCriar} className="space-y-4">
              {formErro && (
                <div className="p-3 bg-rose-50 border border-rose-100 text-rose-600 font-bold text-xs rounded-xl">
                  ⚠️ {formErro}
                </div>
              )}

              <div className="space-y-1">
                <label className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider block">Nome Completo</label>
                <input
                  type="text" required placeholder="Nome do corretor ou gestor"
                  value={form.nome}
                  onChange={(e) => setForm((p) => ({ ...p, nome: e.target.value }))}
                  className="w-full border border-slate-200 rounded-xl p-2.5 text-xs outline-none focus:border-[#33415C] bg-white text-slate-700"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider block">E-mail (Login)</label>
                <input
                  type="email" required placeholder="exemplo@portoreal.com.br"
                  value={form.email}
                  onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))}
                  className="w-full border border-slate-200 rounded-xl p-2.5 text-xs outline-none focus:border-[#33415C] bg-white text-slate-700"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider block">Senha de Acesso</label>
                <input
                  type="text" required placeholder="Mínimo 6 caracteres"
                  value={form.senha}
                  onChange={(e) => setForm((p) => ({ ...p, senha: e.target.value }))}
                  className="w-full border border-slate-200 rounded-xl p-2.5 text-xs outline-none focus:border-[#33415C] bg-white text-slate-700 font-mono"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider block">Perfil de Acesso</label>
                <select
                  value={form.role}
                  onChange={(e) => setForm((p) => ({ ...p, role: e.target.value as any }))}
                  className="w-full border border-slate-200 rounded-xl p-2.5 text-xs outline-none focus:border-[#33415C] bg-white text-slate-700 cursor-pointer font-semibold"
                >
                  <option value="vendas">Corretor (Vendas)</option>
                  <option value="aluguel">Corretor (Aluguel)</option>
                  <option value="superadmin">Gestor / Diretoria</option>
                </select>
              </div>

              {(form.role === 'vendas' || form.role === 'aluguel') && (
                <>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider block">Telefone</label>
                      <input
                        type="text" placeholder="(11) 99999-9999"
                        value={form.telefone}
                        onChange={(e) => setForm((p) => ({ ...p, telefone: e.target.value }))}
                        className="w-full border border-slate-200 rounded-xl p-2.5 text-xs outline-none focus:border-[#33415C] bg-white text-slate-700"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider block">CRECI</label>
                      <input
                        type="text" placeholder="Ex: 12345-F"
                        value={form.creci}
                        onChange={(e) => setForm((p) => ({ ...p, creci: e.target.value }))}
                        className="w-full border border-slate-200 rounded-xl p-2.5 text-xs outline-none focus:border-[#33415C] bg-white text-slate-700"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider block">Equipe Associada</label>
                    <select
                      value={form.equipe_id}
                      onChange={(e) => setForm((p) => ({ ...p, equipe_id: e.target.value }))}
                      className="w-full border border-slate-200 rounded-xl p-2.5 text-xs outline-none focus:border-[#33415C] bg-white text-slate-700 cursor-pointer font-semibold"
                    >
                      <option value="">Nenhuma Equipe</option>
                      {equipes.map((eq) => (
                        <option key={eq.id} value={eq.id}>{eq.nome}</option>
                      ))}
                    </select>
                  </div>
                </>
              )}

              <div className="flex gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button" onClick={() => setModalOpen(false)}
                  className="flex-1 bg-white hover:bg-slate-50 border border-slate-200 text-slate-500 font-bold py-2.5 rounded-xl text-xs md:text-sm transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit" disabled={salvando}
                  className="flex-1 bg-[#33415C] hover:bg-[#47587A] disabled:opacity-50 text-white font-bold py-2.5 rounded-xl text-xs md:text-sm transition-all shadow-sm"
                >
                  {salvando ? 'Salvando...' : 'Criar Acesso'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

function Chip({ n, label, tone }: { n: number; label: string; tone?: 'navy' | 'green' | 'slate' }) {
  const cls = tone === 'navy' ? 'bg-[#EEF4FA] text-[#33415C]'
    : tone === 'green' ? 'bg-emerald-50 text-emerald-700'
    : tone === 'slate' ? 'bg-slate-100 text-slate-600'
    : 'bg-slate-800 text-white'
  return (
    <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl ${cls}`}>
      <span className="text-base font-black leading-none">{n}</span>
      <span className="text-[10px] font-bold uppercase tracking-wide">{label}</span>
    </div>
  )
}
