'use client'

import { useState } from 'react'
import { VendasCorretor, VendasEquipe, SystemUser, User } from '@/lib/types'
import {
  createSystemUser,
  createVendasCorretor,
  getVendasCorretores,
  getSystemUsers,
  deleteSystemUser,
  deleteVendasCorretor
} from '@/lib/api'
import { Users, Plus, Trash2, X } from 'lucide-react'

interface GestaoUsuariosProps {
  systemUsers: SystemUser[]
  setSystemUsers: React.Dispatch<React.SetStateAction<SystemUser[]>>
  corretores: VendasCorretor[]
  setCorretores: React.Dispatch<React.SetStateAction<VendasCorretor[]>>
  equipes: VendasEquipe[]
  user: User | null
}

function getInitials(nome: string) {
  if (!nome) return '?'
  const parts = nome.trim().split(/\s+/)
  if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase()
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
}

export default function GestaoUsuarios({
  systemUsers,
  setSystemUsers,
  corretores,
  setCorretores,
  equipes,
  user
}: GestaoUsuariosProps) {
  const [modalUsuarioOpen, setModalUsuarioOpen] = useState(false)
  const [usuarioErro, setUsuarioErro] = useState<string | null>(null)
  const [usuarioSalvando, setUsuarioSalvando] = useState(false)
  const [formUsuario, setFormUsuario] = useState({
    nome: '',
    email: '',
    senha: '',
    role: 'vendas' as 'vendas' | 'aluguel' | 'superadmin',
    telefone: '',
    creci: '',
    equipe_id: ''
  })

  const handleCreateUsuario = async (e: React.FormEvent) => {
    e.preventDefault()
    setUsuarioErro(null)
    
    const { nome, email, senha, role, telefone, creci, equipe_id } = formUsuario
    if (!nome.trim() || !email.trim() || !senha.trim()) {
      setUsuarioErro("Todos os campos de login são obrigatórios.")
      return
    }

    if (senha.length < 6) {
      setUsuarioErro("A senha deve ter pelo menos 6 caracteres.")
      return
    }

    setUsuarioSalvando(true)
    try {
      const newUser = await createSystemUser({
        nome: nome.trim(),
        email: email.trim().toLowerCase(),
        senha: senha.trim(),
        role
      })

      if (newUser) {
        // Se for um corretor, criar também o perfil correspondente na tabela vendas_corretores
        if (role === 'vendas' || role === 'aluguel') {
          await createVendasCorretor({
            nome: nome.trim(),
            email: email.trim().toLowerCase(),
            telefone: telefone.trim() || null,
            creci: creci.trim() || null,
            equipe_id: equipe_id || null,
            user_id: newUser.id
          })
          
          // Atualiza lista de corretores no estado
          const freshCorretores = await getVendasCorretores()
          setCorretores(freshCorretores)
        }

        // Refresh list
        const freshUsers = await getSystemUsers()
        setSystemUsers(freshUsers)
        
        // Reset form & modal
        setFormUsuario({ nome: '', email: '', senha: '', role: 'vendas', telefone: '', creci: '', equipe_id: '' })
        setModalUsuarioOpen(false)
      } else {
        setUsuarioErro("Erro ao cadastrar usuário. Verifique se o e-mail já está em uso.")
      }
    } catch (err) {
      console.error(err)
      setUsuarioErro("Ocorreu um erro ao salvar o usuário.")
    } finally {
      setUsuarioSalvando(false)
    }
  }

  const handleDeleteUsuario = async (id: string, nome: string) => {
    const userToDelete = systemUsers.find(u => u.id === id)
    if (!userToDelete) return

    if (confirm(`Tem certeza que deseja excluir o acesso de "${nome}"?`)) {
      const matchedCorretor = corretores.find(c => c.email.toLowerCase() === userToDelete.email.toLowerCase())
      
      const success = await deleteSystemUser(id)
      if (success) {
        if (matchedCorretor) {
          await deleteVendasCorretor(matchedCorretor.id)
          const freshCorretores = await getVendasCorretores()
          setCorretores(freshCorretores)
        }
        
        // Refresh list
        const freshUsers = await getSystemUsers()
        setSystemUsers(freshUsers)
      } else {
        alert("Não foi possível excluir o usuário.")
      }
    }
  }

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6 animate-fadeIn">
      {/* Header section */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-md">
        <div>
          <h2 className="text-xl md:text-2xl font-black text-[#33415C] tracking-tight flex items-center gap-2">
            <Users className="text-[#eb3238]" size={24} />
            Controle de Usuários
          </h2>
          <p className="text-xs text-slate-500 font-semibold mt-1">
            Gerencie as credenciais de acesso para corretores e administradores do sistema.
          </p>
        </div>
        
        <button
          onClick={() => {
            setUsuarioErro(null)
            setFormUsuario({ nome: '', email: '', senha: '', role: 'vendas', telefone: '', creci: '', equipe_id: '' })
            setModalUsuarioOpen(true)
          }}
          className="flex items-center gap-2 bg-[#eb3238] hover:bg-[#c6282e] text-white px-4 py-2.5 rounded-xl text-xs md:text-sm font-extrabold shadow-sm transition-all hover:scale-[1.02]"
        >
          <Plus size={16} />
          Novo Acesso
        </button>
      </div>

      {/* List Table Card */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-md overflow-hidden">
        <div className="border-b border-slate-100 bg-slate-50/50 p-4">
          <span className="text-xs font-black text-[#33415C] uppercase tracking-wider">
            Logins Ativos ({systemUsers.length})
          </span>
        </div>

        {systemUsers.length === 0 ? (
          <div className="p-8 text-center text-slate-400 font-semibold text-sm">
            Nenhum usuário cadastrado no sistema.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/40 text-[10px] font-extrabold uppercase tracking-wider text-slate-400 border-b border-slate-100">
                  <th className="py-3.5 px-6">Nome</th>
                  <th className="py-3.5 px-6">E-mail</th>
                  <th className="py-3.5 px-6">Perfil / Acesso</th>
                  <th className="py-3.5 px-6">CRECI / Telefone</th>
                  <th className="py-3.5 px-6">Equipe</th>
                  <th className="py-3.5 px-6">Senha de Acesso</th>
                  <th className="py-3.5 px-6 text-center">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs md:text-sm font-medium">
                {systemUsers.map(u => {
                  const corr = corretores.find(c => c.email.toLowerCase() === u.email.toLowerCase())
                  const eq = corr ? equipes.find(e => e.id === corr.equipe_id) : null
                  
                  return (
                    <tr key={u.id} className="hover:bg-slate-50/30 transition-colors">
                      <td className="py-4 px-6 font-bold text-slate-800">{u.nome}</td>
                      <td className="py-4 px-6 text-slate-600 font-semibold">{u.email}</td>
                      <td className="py-4 px-6">
                        {u.role === 'superadmin' && (
                          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-extrabold bg-[#33415C]/10 text-[#33415C] border border-[#33415C]/20 uppercase">
                            Administrativo
                          </span>
                        )}
                        {u.role === 'vendas' && (
                          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-extrabold bg-emerald-50 text-emerald-700 border border-emerald-100 uppercase">
                            Corretor (Vendas)
                          </span>
                        )}
                        {u.role === 'aluguel' && (
                          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-extrabold bg-amber-50 text-amber-700 border border-amber-100 uppercase">
                            Corretor (Aluguel)
                          </span>
                        )}
                      </td>
                      <td className="py-4 px-6 text-slate-600 font-semibold">
                        {corr ? (
                          <div className="space-y-0.5">
                            {corr.creci && <div><span className="text-[10px] text-slate-400 font-bold uppercase">CRECI:</span> <span className="font-extrabold text-[#33415C]">{corr.creci}</span></div>}
                            {corr.telefone && <div><span className="text-[10px] text-slate-400 font-bold uppercase">Tel:</span> <span className="font-bold text-slate-700">{corr.telefone}</span></div>}
                            {!corr.creci && !corr.telefone && <span className="text-slate-400 italic">—</span>}
                          </div>
                        ) : (
                          <span className="text-slate-400 italic">—</span>
                        )}
                      </td>
                      <td className="py-4 px-6 text-slate-700 font-bold">
                        {eq ? (
                          <span className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded-lg text-[10px] uppercase font-extrabold border border-slate-200">{eq.nome}</span>
                        ) : corr ? (
                          <span className="text-slate-400 italic">Sem Equipe</span>
                        ) : (
                          <span className="text-slate-400 italic">—</span>
                        )}
                      </td>
                      <td className="py-4 px-6 text-slate-400 font-mono select-all hover:text-slate-700 transition-colors" title="Dê dois cliques para selecionar a senha">
                        {u.senha || '••••••'}
                      </td>
                      <td className="py-4 px-6 text-center">
                        {user?.id === u.id ? (
                          <span className="text-[10px] text-slate-400 font-bold bg-slate-100 px-2 py-1 rounded-md">
                            Usuário Logado
                          </span>
                        ) : (
                          <button
                            onClick={() => handleDeleteUsuario(u.id, u.nome)}
                            className="p-2 text-rose-500 hover:text-white hover:bg-rose-500 rounded-lg transition-all"
                            title="Excluir usuário"
                          >
                            <Trash2 size={15} />
                          </button>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ============================================================
          MODAL: CADASTRAR NOVO USUÁRIO
          ============================================================ */}
      {modalUsuarioOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl animate-scaleIn space-y-4">
            
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-black text-[#33415C] text-base md:text-lg flex items-center gap-1.5">🔑 Novo Login</h3>
                <p className="text-[11px] text-slate-400 font-medium">Cadastre um novo login para acessar o sistema.</p>
              </div>
              <button
                onClick={() => setModalUsuarioOpen(false)}
                className="text-slate-400 hover:text-slate-600 transition-colors p-1"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleCreateUsuario} className="space-y-4">
              {usuarioErro && (
                <div className="p-3 bg-rose-50 border border-rose-100 text-rose-600 font-bold text-xs rounded-xl">
                  ⚠️ {usuarioErro}
                </div>
              )}

              <div className="space-y-1">
                <label className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider block">Nome Completo</label>
                <input
                  type="text"
                  required
                  placeholder="Nome do Corretor ou Administrador"
                  value={formUsuario.nome}
                  onChange={(e) => setFormUsuario(prev => ({ ...prev, nome: e.target.value }))}
                  className="w-full border border-slate-200 rounded-xl p-2.5 text-xs outline-none focus:border-[#33415C] bg-white text-slate-700"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider block">E-mail (Login)</label>
                <input
                  type="email"
                  required
                  placeholder="exemplo@portoreal.com.br"
                  value={formUsuario.email}
                  onChange={(e) => setFormUsuario(prev => ({ ...prev, email: e.target.value }))}
                  className="w-full border border-slate-200 rounded-xl p-2.5 text-xs outline-none focus:border-[#33415C] bg-white text-slate-700"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider block">Senha de Acesso</label>
                <input
                  type="text"
                  required
                  placeholder="Mínimo 6 caracteres"
                  value={formUsuario.senha}
                  onChange={(e) => setFormUsuario(prev => ({ ...prev, senha: e.target.value }))}
                  className="w-full border border-slate-200 rounded-xl p-2.5 text-xs outline-none focus:border-[#33415C] bg-white text-slate-700 font-mono"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider block">Perfil de Acesso</label>
                <select
                  value={formUsuario.role}
                  onChange={(e) => setFormUsuario(prev => ({ ...prev, role: e.target.value as any }))}
                  className="w-full border border-slate-200 rounded-xl p-2.5 text-xs outline-none focus:border-[#33415C] bg-white text-slate-700 cursor-pointer font-semibold"
                >
                  <option value="vendas">Corretor (Vendas)</option>
                  <option value="aluguel">Corretor (Aluguel)</option>
                  <option value="superadmin">Administrativo / Diretoria</option>
                </select>
              </div>

              {(formUsuario.role === 'vendas' || formUsuario.role === 'aluguel') && (
                <>
                  <div className="grid grid-cols-2 gap-3 animate-fadeIn">
                    <div className="space-y-1">
                      <label className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider block">Telefone</label>
                      <input
                        type="text"
                        placeholder="(11) 99999-9999"
                        value={formUsuario.telefone}
                        onChange={(e) => setFormUsuario(prev => ({ ...prev, telefone: e.target.value }))}
                        className="w-full border border-slate-200 rounded-xl p-2.5 text-xs outline-none focus:border-[#33415C] bg-white text-slate-700"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider block">CRECI</label>
                      <input
                        type="text"
                        placeholder="Ex: 12345-F"
                        value={formUsuario.creci}
                        onChange={(e) => setFormUsuario(prev => ({ ...prev, creci: e.target.value }))}
                        className="w-full border border-slate-200 rounded-xl p-2.5 text-xs outline-none focus:border-[#33415C] bg-white text-slate-700"
                      />
                    </div>
                  </div>

                  <div className="space-y-1 animate-fadeIn">
                    <label className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider block">Equipe Associada</label>
                    <select
                      value={formUsuario.equipe_id}
                      onChange={(e) => setFormUsuario(prev => ({ ...prev, equipe_id: e.target.value }))}
                      className="w-full border border-slate-200 rounded-xl p-2.5 text-xs outline-none focus:border-[#33415C] bg-white text-slate-700 cursor-pointer font-semibold"
                    >
                      <option value="">Nenhuma Equipe</option>
                      {equipes.map(eq => (
                        <option key={eq.id} value={eq.id}>{eq.nome}</option>
                      ))}
                    </select>
                  </div>
                </>
              )}

              <div className="flex gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setModalUsuarioOpen(false)}
                  className="flex-1 bg-white hover:bg-slate-50 border border-slate-200 text-slate-500 font-bold py-2.5 rounded-xl text-xs md:text-sm transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={usuarioSalvando}
                  className="flex-1 bg-[#33415C] hover:bg-[#47587A] disabled:opacity-50 text-white font-bold py-2.5 rounded-xl text-xs md:text-sm transition-all shadow-sm flex items-center justify-center gap-1.5"
                >
                  {usuarioSalvando ? "Salvando..." : "Salvar Acesso"}
                </button>
              </div>
            </form>

          </div>
        </div>
      )}
    </div>
  )
}
