'use client'

import { useState, useEffect } from 'react'
import { VendasCliente, VendasCorretor, VendasEquipe, User, VendasClienteNota, VendasClienteChecklist } from '@/lib/types'
import {
  getVendasClienteNotas,
  getVendasClienteChecklist,
  updateVendasCliente,
  toggleVendasChecklistItem,
  createVendasClienteNota,
  createVendasCliente
} from '@/lib/api'
import {
  ETAPAS,
  TEMP_CFG,
  PERFIS,
  SINAIS_COMPORTAMENTAIS,
  PERFIL_QUIZ,
  RESP,
  RESP_COR,
  RESP_EMO,
  fmtBRL
} from '@/lib/constants'
import {
  Plus,
  Trash2,
  X,
  Check,
  CheckSquare,
  Square,
  Sparkles,
  Smartphone,
  ClipboardList,
  Flame,
  Settings,
  MessageSquare,
  Copy,
  Share2
} from 'lucide-react'

interface MinhaCarteiraProps {
  clientes: VendasCliente[]
  setClientes: React.Dispatch<React.SetStateAction<VendasCliente[]>>
  activeId: string | null
  setActiveId: (id: string | null) => void
  corretores: VendasCorretor[]
  equipes: VendasEquipe[]
  user: User | null
}

export default function MinhaCarteira({
  clientes,
  setClientes,
  activeId,
  setActiveId,
  corretores,
  equipes,
  user
}: MinhaCarteiraProps) {
  // Local sub-states
  const [activeNotas, setActiveNotas] = useState<VendasClienteNota[]>([])
  const [activeChecklist, setActiveChecklist] = useState<VendasClienteChecklist[]>([])
  const [showFinalizados, setShowFinalizados] = useState(false)
  const [funilCorretorFiltro, setFunilCorretorFiltro] = useState<string>('todos')
  const [sidebarView, setSidebarView] = useState<'ativos' | 'interessados' | 'finalizados'>('ativos')
  
  // Modals / Form States
  const [modalNovoOpen, setModalNovoOpen] = useState(false)
  const [formNovo, setFormNovo] = useState({
    nome: '',
    contato: '',
    email: '',
    objetivo: 'Comprar',
    faixa: '',
    local: '',
    origem: 'Instagram / Facebook',
    corretor_id: ''
  })

  // Finalizar Modal
  const [finalizarModalOpen, setFinalizarModalOpen] = useState(false)
  const [finalizarStatus, setFinalizarStatus] = useState<'sucesso' | 'perdido' | 'interessado'>('sucesso')
  const [finalizarMotivo, setFinalizarMotivo] = useState('')
  const [customMotivo, setCustomMotivo] = useState('')
  const [valProcurado, setValProcurado] = useState('')
  const [valFechado, setValFechado] = useState('')
  const [valPedido, setValPedido] = useState('')
  const [valVendido, setValVendido] = useState('')

  // Ficha Edit
  const [fichaOpen, setFichaOpen] = useState(false)
  const [novaNotaTxt, setNovaNotaTxt] = useState('')

  const activeClient = clientes.find(c => c.id === activeId)

  // Load Active Client Details on ID Change
  useEffect(() => {
    async function loadClientDetails(id: string) {
      const [nts, chks] = await Promise.all([
        getVendasClienteNotas(id),
        getVendasClienteChecklist(id)
      ])
      setActiveNotas(nts)
      setActiveChecklist(chks)
    }
    if (activeId) {
      loadClientDetails(activeId)
    } else {
      setActiveNotas([])
      setActiveChecklist([])
    }
  }, [activeId])

  const selectClient = (id: string) => {
    setActiveId(id)
    setFichaOpen(false)
  }

  const changeEtapa = async (etapaIndex: number) => {
    if (!activeId) return
    const params: Partial<VendasCliente> = { etapa: etapaIndex }
    if (activeClient?.status_finalizacao === 'interessado') {
      params.status_finalizacao = null
    }
    const updated = await updateVendasCliente(activeId, params)
    if (updated) {
      setClientes(prev => prev.map(c => c.id === activeId ? updated : c))
    }
  }

  const toggleChecklist = async (itemIndex: number) => {
    if (!activeId || !activeClient) return
    const isChecked = activeChecklist.some(chk => chk.etapa === activeClient.etapa && chk.item_index === itemIndex)
    const success = await toggleVendasChecklistItem(activeId, activeClient.etapa, itemIndex, !isChecked)
    if (success) {
      const updatedChks = await getVendasClienteChecklist(activeId)
      setActiveChecklist(updatedChks)
    }
  }

  const calculateProfiles = (quizMap: Record<string, string>) => {
    const tally: Record<string, number> = {
      analitico: 0,
      controlador: 0,
      apoiador: 0,
      catalisador: 0
    }

    Object.entries(quizMap || {}).forEach(([k, v]) => {
      if (k.startsWith('s_')) {
        const parts = k.split('_')
        const profile = parts[1]
        if (profile in tally && v === 'true') {
          tally[profile] += 1
        }
      } else {
        const profile = v
        if (profile in tally) {
          tally[profile] += 1
        }
      }
    })

    const sorted = Object.entries(tally).sort((a, b) => b[1] - a[1])
    const primaryScore = sorted[0][1]
    const primary = primaryScore > 0 ? sorted[0][0] : null

    const secondaryScore = sorted[1][1]
    const secondary = (secondaryScore > 0 && (secondaryScore < primaryScore || (primaryScore > 0 && secondaryScore === primaryScore && sorted[1][0] !== primary)))
      ? sorted[1][0]
      : null

    return { dominant: primary, secondary: secondary }
  }

  const handleQuizAnswer = async (quizIndex: number, profileKey: string) => {
    if (!activeId || !activeClient) return
    const quizMap = { ...activeClient.perfil_quiz, [quizIndex]: profileKey }
    
    const { dominant, secondary } = calculateProfiles(quizMap)

    const updated = await updateVendasCliente(activeId, {
      perfil_quiz: quizMap,
      perfil: dominant,
      perfil_secundario: secondary
    })

    if (updated) {
      setClientes(prev => prev.map(c => c.id === activeId ? updated : c))
    }
  }

  const handleSignalToggle = async (profileKey: string, sigIndex: number) => {
    if (!activeId || !activeClient) return
    const quizMap = { ...activeClient.perfil_quiz }
    const key = `s_${profileKey}_${sigIndex}`
    if (quizMap[key] === 'true') {
      delete quizMap[key]
    } else {
      quizMap[key] = 'true'
    }

    const { dominant, secondary } = calculateProfiles(quizMap)

    const updated = await updateVendasCliente(activeId, {
      perfil_quiz: quizMap,
      perfil: dominant,
      perfil_secundario: secondary
    })

    if (updated) {
      setClientes(prev => prev.map(c => c.id === activeId ? updated : c))
    }
  }

  const refazerQuiz = async () => {
    if (!activeId) return
    const updated = await updateVendasCliente(activeId, {
      perfil_quiz: {},
      perfil: null,
      perfil_secundario: null
    })
    if (updated) {
      setClientes(prev => prev.map(c => c.id === activeId ? updated : c))
    }
  }

  const setClientTemp = async (temp: 'quente' | 'morno' | 'frio') => {
    if (!activeId) return
    const updated = await updateVendasCliente(activeId, { temp })
    if (updated) {
      setClientes(prev => prev.map(c => c.id === activeId ? updated : c))
    }
  }

  const setCrmField = async (field: string, value: any) => {
    if (!activeId) return
    const updated = await updateVendasCliente(activeId, { [field]: value })
    if (updated) {
      setClientes(prev => prev.map(c => c.id === activeId ? updated : c))
    }
  }

  const setStageField = async (key: string, value: string) => {
    if (!activeId || !activeClient) return
    const quizMap = { ...activeClient.perfil_quiz, [key]: value }
    const updated = await updateVendasCliente(activeId, { perfil_quiz: quizMap })
    if (updated) {
      setClientes(prev => prev.map(c => c.id === activeId ? updated : c))
    }
  }

  const handleAddNota = async () => {
    if (!activeId || !activeClient || !novaNotaTxt.trim()) return
    const dt = new Date()
    const dataFormatted = String(dt.getDate()).padStart(2, '0') + '/' + 
                          String(dt.getMonth() + 1).padStart(2, '0') + ' · ' + 
                          String(dt.getHours()).padStart(2, '0') + ':' + 
                          String(dt.getMinutes()).padStart(2, '0')

    const newNota = await createVendasClienteNota({
      cliente_id: activeId,
      etapa: ETAPAS[activeClient.etapa].nome,
      texto: novaNotaTxt.trim(),
      data: dataFormatted
    })

    if (newNota) {
      setActiveNotas(prev => [...prev, newNota])
      setNovaNotaTxt('')
    }
  }

  const handleCriarCliente = async () => {
    const myCorretor = corretores.find(co => co.user_id === user?.id)
    const assignedCorretorId = user?.role === 'vendas'
      ? (myCorretor?.id || null)
      : (formNovo.corretor_id || null)

    const newClient = await createVendasCliente({
      nome: formNovo.nome.trim() || 'Novo Cliente',
      contato: formNovo.contato.trim() || '—',
      email: formNovo.email.trim() || '—',
      origem: formNovo.origem,
      valor: 0,
      etapa: 0,
      perfil: null,
      temp: 'quente',
      expressa: false,
      objetivo: formNovo.objetivo,
      faixa: formNovo.faixa,
      local: formNovo.local,
      preferencia: '',
      perfil_quiz: {},
      corretor_id: assignedCorretorId,
      finalizado: false
    })

    if (newClient) {
      setClientes(prev => [...prev, newClient])
      setActiveId(newClient.id)
      setFormNovo({
        nome: '',
        contato: '',
        email: '',
        objetivo: 'Comprar',
        faixa: '',
        local: '',
        origem: 'Instagram / Facebook',
        corretor_id: ''
      })
      setModalNovoOpen(false)
    }
  }

  const handleFinalizarCliente = async () => {
    if (!activeId || !activeClient) return
    
    let motivo = finalizarMotivo
    if (finalizarStatus === 'sucesso') {
      motivo = activeClient.objetivo === 'Comprar' ? 'Venda fechada com sucesso' : 'Captação concluída com sucesso'
    } else if (finalizarStatus === 'interessado') {
      motivo = 'Arquivado na Lista de Interessados'
    } else if (finalizarMotivo === 'Outro') {
      motivo = customMotivo || 'Outro'
    }

    const params: Partial<VendasCliente> = {
      finalizado: finalizarStatus !== 'interessado',
      status_finalizacao: finalizarStatus,
      motivo_finalizacao: motivo
    }

    if (finalizarStatus === 'sucesso' && activeClient.objetivo === 'Comprar') {
      if (valProcurado) params.valor = Number(valProcurado)
      params.valor_fechado = Number(valFechado) || 0
      params.valor_pedido = Number(valPedido) || 0
      params.valor_vendido = Number(valVendido) || 0
    }

    const updated = await updateVendasCliente(activeId, params)
    if (updated) {
      setClientes(prev => prev.map(c => c.id === activeId ? updated : c))
      setFinalizarModalOpen(false)
    }
  }

  return (
    <div className="flex-1 grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-6 items-start">
      
      {/* Sidebar Clientes */}
      <aside className="bg-white border border-slate-200 rounded-2xl flex flex-col max-h-[750px] shadow-sm">
        <div className="p-4 border-b border-slate-100 space-y-3">
          <div className="flex justify-between items-center">
            <h2 className="text-xs font-extrabold uppercase tracking-widest text-slate-400">Meus clientes</h2>
          </div>
          
          <div className="flex border border-slate-200 rounded-xl overflow-hidden text-[10px] font-bold">
            <button
              onClick={() => setSidebarView('ativos')}
              className={`flex-1 py-1.5 transition-all text-center ${
                sidebarView === 'ativos'
                  ? 'bg-[#1F4E79] text-white'
                  : 'bg-slate-50 hover:bg-slate-100 text-slate-600'
              }`}
            >
              Ativos
            </button>
            <button
              onClick={() => setSidebarView('interessados')}
              className={`flex-1 py-1.5 transition-all text-center border-x border-slate-200 ${
                sidebarView === 'interessados'
                  ? 'bg-[#1F4E79] text-white'
                  : 'bg-slate-50 hover:bg-slate-100 text-slate-600'
              }`}
            >
              Interessados
            </button>
            <button
              onClick={() => setSidebarView('finalizados')}
              className={`flex-1 py-1.5 transition-all text-center ${
                sidebarView === 'finalizados'
                  ? 'bg-[#1F4E79] text-white'
                  : 'bg-slate-50 hover:bg-slate-100 text-slate-600'
              }`}
            >
              Arquivados
            </button>
          </div>

          {user?.role === 'superadmin' && (
            <div className="mb-1">
              <select
                value={funilCorretorFiltro}
                onChange={(e) => setFunilCorretorFiltro(e.target.value)}
                className="w-full border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs font-semibold outline-none focus:border-[#1F4E79] bg-slate-50/50 cursor-pointer text-slate-700 font-medium"
              >
                <option value="todos">Todos os corretores</option>
                <option value="sem_atribuicao">Sem corretor atribuído</option>
                {corretores.map(co => (
                  <option key={co.id} value={co.id}>{co.nome}</option>
                ))}
              </select>
            </div>
          )}
          <button
            onClick={() => setModalNovoOpen(true)}
            className="w-full flex items-center justify-center gap-2 bg-[#EEF4FA] border border-dashed border-[#2E6CA8] hover:bg-[#D6E4F0] text-[#1F4E79] py-2.5 rounded-xl text-xs font-bold transition-colors"
          >
            <Plus size={14} /> Novo cliente
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-3 space-y-2">
          {(() => {
            const myCorretor = corretores.find(co => co.user_id === user?.id);
            const filtered = clientes.filter(c => {
              // Filter by status view
              if (sidebarView === 'ativos') {
                if (c.finalizado || c.status_finalizacao === 'interessado') return false;
              } else if (sidebarView === 'interessados') {
                if (c.status_finalizacao !== 'interessado') return false;
              } else if (sidebarView === 'finalizados') {
                if (!c.finalizado || c.status_finalizacao === 'interessado') return false;
              }
              
              // Filter by broker
              if (user?.role === 'vendas') {
                return c.corretor_id === myCorretor?.id;
              } else if (user?.role === 'superadmin') {
                if (funilCorretorFiltro !== 'todos') {
                  if (funilCorretorFiltro === 'sem_atribuicao') {
                    return !c.corretor_id;
                  }
                  return c.corretor_id === funilCorretorFiltro;
                }
              }
              return true;
            });

            if (filtered.length === 0) {
              return (
                <p className="text-xs text-slate-400 text-center py-8">Nenhum cliente nesta carteira.</p>
              );
            }

            return filtered.map(c => {
              const isAtivo = c.id === activeId
              const tc = TEMP_CFG[c.temp as keyof typeof TEMP_CFG] || TEMP_CFG.quente
              const perf = c.perfil ? PERFIS[c.perfil] : null
              const progVal = Math.round((c.etapa / (ETAPAS.length - 1)) * 100)

              return (
                <div
                  key={c.id}
                  onClick={() => selectClient(c.id)}
                  className={`p-3.5 border rounded-xl cursor-pointer transition-all ${
                    isAtivo
                      ? 'border-[#1F4E79] bg-[#EEF4FA] shadow-sm'
                      : 'border-slate-100 hover:border-slate-300 bg-white hover:bg-slate-50/50'
                  }`}
                >
                  <div className="flex justify-between items-start gap-1 mb-1">
                    <span className={`font-bold text-xs md:text-sm line-clamp-1 ${c.finalizado ? 'text-slate-400 line-through' : 'text-slate-800'}`}>
                      {c.nome}
                    </span>
                    {c.finalizado && (
                      <span className={`text-[8.5px] px-1.5 py-0.5 rounded font-black tracking-wider uppercase flex-shrink-0 ${
                        c.status_finalizacao === 'sucesso' 
                          ? 'bg-emerald-50 text-emerald-600' 
                          : c.status_finalizacao === 'interessado'
                          ? 'bg-blue-50 text-blue-600'
                          : 'bg-rose-50 text-rose-600'
                      }`}>
                        {c.status_finalizacao === 'sucesso' ? 'Ganho' : c.status_finalizacao === 'interessado' ? 'Interessado' : 'Perdido'}
                      </span>
                    )}
                    {c.expressa && !c.finalizado && (
                      <span className="bg-[#fbf1e3] text-[#c77d2e] text-[8.5px] px-1.5 py-0.5 rounded font-black tracking-wider uppercase flex-shrink-0">Expressa</span>
                    )}
                  </div>
                  <div className="flex flex-wrap items-center gap-2 mt-1.5 text-[10px] text-slate-500">
                    <span className="flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full" style={{ backgroundColor: tc.cor }}></span>
                      {tc.rotulo}
                    </span>
                    {perf ? (
                      <span className="bg-[#D6E4F0] text-[#1F4E79] px-2 py-0.5 rounded font-bold">
                        {perf.emo} {perf.nome}
                        {c.perfil_secundario && PERFIS[c.perfil_secundario] && (
                          <span className="font-normal text-[9.5px] opacity-85 border-l border-slate-300 pl-1.5 ml-1.5">
                            {PERFIS[c.perfil_secundario].emo} {PERFIS[c.perfil_secundario].nome}
                          </span>
                        )}
                      </span>
                    ) : (
                      <span className="bg-rose-50 text-rose-600 px-2 py-0.5 rounded font-bold">perfil?</span>
                    )}
                  </div>
                  {sidebarView === 'interessados' ? (
                    <div className="mt-2.5 space-y-1 text-[10px] text-slate-600 bg-slate-50 border border-slate-100 rounded-lg p-2 font-medium">
                      {c.local && <div>📍 <b>Local:</b> {c.local}</div>}
                      {c.faixa && <div>💰 <b>Faixa:</b> {c.faixa}</div>}
                      {c.preferencia && <div className="line-clamp-1">🔑 <b>Pref:</b> {c.preferencia}</div>}
                    </div>
                  ) : (
                    <div className="mt-3">
                      <div className="flex justify-between text-[10px] font-semibold text-[#1F4E79] mb-1">
                        <span>Etapa {c.etapa + 1}: {ETAPAS[c.etapa]?.nome}</span>
                        <span>{progVal}%</span>
                      </div>
                      <div className="h-1 bg-slate-100 rounded-full overflow-hidden">
                        <div className="h-full bg-[#2E6CA8] transition-all" style={{ width: `${progVal}%` }}></div>
                      </div>
                    </div>
                  )}
                </div>
              )
            })
          })()}
        </div>
      </aside>

      {/* Principal Client Detail */}
      {activeClient ? (
        <main className="space-y-6 flex-1">
          {/* Header card */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h2 className="text-xl md:text-2xl font-black text-slate-800">{activeClient.nome}</h2>
                  {activeClient.expressa && (
                    <span className="bg-[#fbf1e3] text-[#c77d2e] text-[10px] font-bold px-2 py-0.5 rounded-md">VIA EXPRESSA</span>
                  )}
                </div>
                <p className="text-xs text-slate-500 mt-1">
                  {activeClient.contato} · Origem: <span className="font-semibold text-slate-600">{activeClient.origem}</span>
                  {activeClient.valor > 0 && ` · Imóvel-alvo: ${fmtBRL(activeClient.valor)}`}
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  onClick={() => setFichaOpen(true)}
                  className="bg-white border border-[#2E6CA8] hover:bg-[#EEF4FA] text-[#1F4E79] px-3.5 py-1.5 rounded-full text-xs font-bold transition-all flex items-center gap-1"
                >
                  📇 Ficha do Cliente
                </button>
                <span className="bg-[#EEF4FA] text-[#1F4E79] text-xs font-bold px-3.5 py-1.5 rounded-full flex items-center gap-1.5">
                  {RESP_EMO[RESP[activeClient.etapa]]} {RESP[activeClient.etapa]}
                </span>
                <select
                  value={activeClient.perfil || ''}
                  onChange={async (e) => {
                    const newPerf = e.target.value || null
                    const updated = await updateVendasCliente(activeClient.id, { perfil: newPerf })
                    if (updated) {
                      setClientes(prev => prev.map(c => c.id === activeClient.id ? updated : c))
                    }
                  }}
                  className="border border-[#D6E4F0] rounded-full text-xs font-bold px-3 py-1.5 cursor-pointer bg-[#D6E4F0] text-[#1F4E79] outline-none focus:border-[#1F4E79] font-semibold"
                >
                  <option value="">🧠 Sem Perfil Dominante</option>
                  <option value="analitico">🧠 Analítico</option>
                  <option value="controlador">⚡ Controlador</option>
                  <option value="apoiador">❤️ Apoiador</option>
                  <option value="catalisador">🚀 Catalisador</option>
                </select>

                <select
                  value={activeClient.perfil_secundario || ''}
                  onChange={async (e) => {
                    const newPerfSec = e.target.value || null
                    const updated = await updateVendasCliente(activeClient.id, { perfil_secundario: newPerfSec })
                    if (updated) {
                      setClientes(prev => prev.map(c => c.id === activeClient.id ? updated : c))
                    }
                  }}
                  className="border border-slate-200 rounded-full text-xs font-bold px-3 py-1.5 cursor-pointer bg-slate-100 text-slate-700 outline-none focus:border-[#1F4E79] font-semibold"
                >
                  <option value="">🥈 Sem Perfil Secundário</option>
                  <option value="analitico">🧠 Analítico</option>
                  <option value="controlador">⚡ Controlador</option>
                  <option value="apoiador">❤️ Apoiador</option>
                  <option value="catalisador">🚀 Catalisador</option>
                </select>
                
                <select
                  value={activeClient.temp}
                  onChange={(e) => setClientTemp(e.target.value as any)}
                  className="border border-slate-200 rounded-full text-xs font-bold px-3 py-1.5 cursor-pointer bg-white outline-none focus:border-[#1F4E79]"
                >
                  <option value="quente">🔥 Quente</option>
                  <option value="morno">⚡ Morno</option>
                  <option value="frio">❄ Frio</option>
                </select>
              </div>
            </div>

            {/* Overall Checklist progression */}
            <div className="mt-4 flex items-center gap-3">
              <div className="flex-1 bg-slate-100 h-2 rounded-full overflow-hidden max-w-xs">
                <div
                  className="h-full bg-emerald-500 transition-all"
                  style={{
                    width: `${Math.round(
                      (activeChecklist.length /
                        ETAPAS.reduce((s, e) => s + e.chk.length, 0)) *
                        100
                    )}%`
                  }}
                ></div>
              </div>
              <span className="text-[10px] md:text-xs text-slate-500 font-semibold">
                {activeChecklist.length} de {ETAPAS.reduce((s, e) => s + e.chk.length, 0)} itens de checklist concluídos no processo
              </span>
            </div>

            {activeClient.expressa && (
              <div className="mt-4 bg-[#fbf1e3] border border-[#ecd3ad] border-l-4 border-[#c77d2e] rounded-xl p-4 text-xs md:text-sm text-[#7a5b00] leading-relaxed">
                ⚡ <b>Via expressa — qualificação pendente.</b> Este cliente marcou visita direta pelo site. Qualifique e descubra o perfil durante a visita. <b>Comece pelo imóvel escolhido</b>, apresentando alternativas apenas se necessário.
              </div>
            )}

            {/* Lembrete de Próxima Ação */}
            <div className="mt-4 border-t border-slate-100 pt-4 space-y-4">
              <h3 className="text-xs font-extrabold uppercase tracking-widest text-[#1F4E79] flex items-center gap-2">
                <ClipboardList size={16} className="text-[#1F4E79]" />
                Próxima Ação / Lembrete
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-[1.5fr_1fr] gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider block">O que fazer a seguir?</label>
                  <input
                    type="text"
                    placeholder="Ex: Enviar catálogo de imóveis no WhatsApp..."
                    key={`pa_${activeClient.id}`}
                    defaultValue={activeClient.proxima_acao || ''}
                    onBlur={(e) => setCrmField('proxima_acao', e.target.value.trim() || null)}
                    className="w-full text-xs border border-slate-200 rounded-xl p-2.5 outline-none focus:border-[#1F4E79] bg-slate-50/50"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider block">Quando fazer?</label>
                  <input
                    type="datetime-local"
                    key={`pad_${activeClient.id}`}
                    defaultValue={activeClient.proxima_acao_data ? new Date(new Date(activeClient.proxima_acao_data).getTime() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 16) : ''}
                    onChange={(e) => setCrmField('proxima_acao_data', e.target.value || null)}
                    className="w-full text-xs border border-slate-200 rounded-xl p-2.5 outline-none focus:border-[#1F4E79] bg-slate-50/50"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Section 1: Process Stepper */}
          <section className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-4">
            <h3 className="text-xs font-extrabold uppercase tracking-widest text-[#1F4E79] flex items-center gap-2">
              <span className="w-5 h-5 bg-[#1F4E79] text-white rounded-md flex items-center justify-center text-[10px]">1</span>
              Onde o cliente está no processo
            </h3>

            <div className="flex flex-wrap gap-2">
              {ETAPAS.map((etapa, idx) => {
                const isDone = idx < activeClient.etapa
                const isCurrent = idx === activeClient.etapa
                let cls = 'border-slate-200 text-slate-500 bg-white hover:border-slate-300 hover:bg-slate-50/50 font-medium'
                if (isDone) cls = 'border-emerald-200 bg-emerald-50 text-emerald-700 font-bold hover:bg-emerald-100/50 hover:border-emerald-300'
                if (isCurrent) cls = 'border-[#eb3238] bg-gradient-to-r from-[#eb3238] to-[#f43f5e] text-white shadow-md scale-105 ring-2 ring-red-100 font-extrabold z-10'

                return (
                  <button
                    key={idx}
                    onClick={() => changeEtapa(idx)}
                    className={`flex items-center gap-2 px-3.5 py-2 border rounded-xl text-xs font-bold transition-all duration-200 ${cls}`}
                  >
                    <span
                      className="w-2.5 h-2.5 rounded-full shadow-inner"
                      style={{ backgroundColor: RESP_COR[RESP[idx]] || '#94a3b8' }}
                      title={`Responsável: ${RESP[idx]}`}
                    ></span>
                    <span className={`w-5 h-5 rounded-full text-[10px] flex items-center justify-center font-bold ${
                      isCurrent ? 'bg-white text-[#eb3238]' : isDone ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-500'
                    }`}>
                      {isDone ? '✓' : idx + 1}
                    </span>
                    {etapa.nome}
                  </button>
                )
              })}
              {!activeClient.finalizado && (
                <button
                  onClick={() => {
                    setFinalizarStatus('sucesso')
                    setFinalizarMotivo('')
                    setValProcurado(activeClient.valor ? String(activeClient.valor) : '')
                    setValFechado('')
                    setValPedido('')
                    setValVendido('')
                    setFinalizarModalOpen(true)
                  }}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-50 border border-rose-200 hover:bg-rose-100 hover:border-rose-300 text-rose-600 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-xs"
                >
                  🏁 Finalizar
                </button>
              )}
            </div>

            {activeClient.finalizado && (
              <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-50 border border-slate-200 rounded-xl p-3.5 mt-2">
                <div className="flex items-center gap-2">
                  <span className="text-base">
                    {activeClient.status_finalizacao === 'sucesso' ? '🎉' : '❌'}
                  </span>
                  <div>
                    <div className="text-xs font-bold text-slate-700">
                      Processo Finalizado ({activeClient.status_finalizacao === 'sucesso' ? 'Ganho / Sucesso' : 'Perdido'})
                    </div>
                    <div className="text-[11px] text-slate-500 font-medium">
                      {activeClient.motivo_finalizacao && `Motivo: ${activeClient.motivo_finalizacao}`}
                      {activeClient.status_finalizacao === 'sucesso' && activeClient.valor_fechado && (
                        <span className="block font-semibold mt-0.5 text-emerald-600">
                          Valor Fechado: {fmtBRL(Number(activeClient.valor_fechado))}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <button
                  onClick={async () => {
                    if (!activeId) return
                    const updated = await updateVendasCliente(activeId, {
                      finalizado: false,
                      status_finalizacao: null,
                      motivo_finalizacao: null,
                      valor_fechado: null,
                      valor_pedido: null,
                      valor_vendido: null
                    })
                    if (updated) {
                      setClientes(prev => prev.map(c => c.id === activeId ? updated : c))
                    }
                  }}
                  className="px-3 py-1.5 bg-white hover:bg-slate-50 border border-slate-200 text-slate-500 font-bold rounded-lg text-[10px] uppercase tracking-wide transition-colors"
                >
                  Reabrir Processo
                </button>
              </div>
            )}

            <div className="flex flex-wrap items-center gap-4 pt-2 text-[10px] text-slate-500 border-t border-slate-50 font-semibold">
              <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: '#1F4E79' }}></span> Andressa (1-6)</span>
              <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: '#1f9d6b' }}></span> Corretor (7-9)</span>
              <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: '#2E6CA8' }}></span> Andressa + Corretor (10-12)</span>
              <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: '#c77d2e' }}></span> Pós-venda (13-15)</span>
              <span className="text-[#6b4fbb]">🤖 Lais (IA) apoia o 1º contato e a via expressa</span>
            </div>
          </section>

          {/* Section 2: Conteúdo Dinâmico da Etapa + Checklist */}
          <div className="grid grid-cols-1 lg:grid-cols-[1.2fr_1fr] gap-6">
            
            {/* Conteúdo Dinâmico por Etapa */}
            <div key={`${activeClient.id}_${activeClient.etapa}`} className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-4">
              <h3 className="text-xs font-extrabold uppercase tracking-widest text-[#1F4E79] flex items-center gap-2">
                <span className="w-5 h-5 bg-[#1F4E79] text-white rounded-md flex items-center justify-center text-[10px]">2</span>
                Ações da Etapa — {ETAPAS[activeClient.etapa]?.nome}
              </h3>

              {/* ETAPA 0: Triagem */}
              {activeClient.etapa === 0 && (
                <div className="space-y-4">
                  <p className="text-[11px] text-slate-400 font-semibold uppercase">Dados do Lead & Triagem</p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-500 uppercase">Nome Completo</label>
                      <input 
                        type="text"
                        defaultValue={activeClient.nome}
                        onBlur={(e) => setCrmField('nome', e.target.value)}
                        className="w-full text-xs border border-slate-200 rounded-xl p-2.5 focus:border-[#eb3238] outline-none"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-500 uppercase">WhatsApp / Telefone</label>
                      <input 
                        type="text"
                        defaultValue={activeClient.contato || ''}
                        onBlur={(e) => setCrmField('contato', e.target.value)}
                        className="w-full text-xs border border-slate-200 rounded-xl p-2.5 focus:border-[#eb3238] outline-none"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-500 uppercase">E-mail</label>
                      <input 
                        type="email"
                        defaultValue={activeClient.email || ''}
                        onBlur={(e) => setCrmField('email', e.target.value)}
                        className="w-full text-xs border border-slate-200 rounded-xl p-2.5 focus:border-[#eb3238] outline-none"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-500 uppercase">Canal de Origem</label>
                      <select 
                        defaultValue={activeClient.origem || 'Instagram / Facebook'}
                        onChange={(e) => setCrmField('origem', e.target.value)}
                        className="w-full text-xs border border-slate-200 rounded-xl p-2.5 focus:border-[#eb3238] outline-none bg-white font-medium text-slate-700"
                      >
                        <option value="Instagram / Facebook">Instagram / Facebook</option>
                        <option value="Anúncio Google">Anúncio Google</option>
                        <option value="Site Porto Real">Site Porto Real</option>
                        <option value="Indicação">Indicação</option>
                        <option value="WhatsApp/Atendimento Direto">WhatsApp/Atendimento Direto</option>
                      </select>
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-500 uppercase">Finalidade da Aquisição</label>
                      <select 
                        defaultValue={activeClient.perfil_quiz?.cadastro_finalidade || 'Moradia'}
                        onChange={(e) => setStageField('cadastro_finalidade', e.target.value)}
                        className="w-full text-xs border border-slate-200 rounded-xl p-2.5 focus:border-[#eb3238] outline-none bg-white"
                      >
                        <option value="Moradia">Moradia Própria</option>
                        <option value="Investimento">Investimento / Renda</option>
                        <option value="Comercial">Uso Comercial</option>
                      </select>
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-500 uppercase">Canal Preferido de Contato</label>
                      <select 
                        defaultValue={activeClient.perfil_quiz?.cadastro_canal || 'WhatsApp'}
                        onChange={(e) => setStageField('cadastro_canal', e.target.value)}
                        className="w-full text-xs border border-slate-200 rounded-xl p-2.5 focus:border-[#eb3238] outline-none bg-white"
                      >
                        <option value="WhatsApp">WhatsApp</option>
                        <option value="Ligação Telefônica">Ligação Telefônica</option>
                        <option value="E-mail">E-mail</option>
                        <option value="Reunião Presencial">Reunião Presencial</option>
                      </select>
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-500 uppercase">Melhor Horário para Contato</label>
                      <select 
                        defaultValue={activeClient.perfil_quiz?.cadastro_horario || 'Qualquer Horário'}
                        onChange={(e) => setStageField('cadastro_horario', e.target.value)}
                        className="w-full text-xs border border-slate-200 rounded-xl p-2.5 focus:border-[#eb3238] outline-none bg-white"
                      >
                        <option value="Qualquer Horário">Qualquer Horário</option>
                        <option value="Período da Manhã">Período da Manhã</option>
                        <option value="Período da Tarde">Período da Tarde</option>
                        <option value="Período da Noite">Período da Noite</option>
                      </select>
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-500 uppercase">Orçamento Inicial do Cliente</label>
                      <input 
                        type="text"
                        defaultValue={activeClient.perfil_quiz?.cadastro_orcamento || ''}
                        onBlur={(e) => setStageField('cadastro_orcamento', e.target.value)}
                        placeholder="Ex: R$ 500.000"
                        className="w-full text-xs border border-slate-200 rounded-xl p-2.5 focus:border-[#eb3238] outline-none"
                      />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-500 uppercase">Observações do Cadastro</label>
                    <textarea 
                      defaultValue={activeClient.perfil_quiz?.cadastro_obs || ''}
                      onBlur={(e) => setStageField('cadastro_obs', e.target.value)}
                      placeholder="Anote detalhes de composição familiar, pressa para mudança ou outros fatores chave..."
                      className="w-full text-xs border border-slate-200 rounded-xl p-2.5 focus:border-[#eb3238] outline-none min-h-[70px] resize-y"
                    />
                  </div>
                </div>
              )}

              {/* ETAPA 1: Atendimento & Match */}
              {activeClient.etapa === 1 && (
                <div className="space-y-4">
                  <p className="text-[11px] text-slate-400 font-semibold uppercase">Atendimento, Match & Qualificação</p>
                  
                  {/* Flag Em Captação */}
                  <div className="bg-slate-50 border border-slate-100 rounded-xl p-3.5 flex items-center justify-between">
                    <div>
                      <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Estado de Captação</span>
                      <span className="text-xs text-slate-600 font-semibold">Cliente necessita de captação ou parceria de imóvel personalizado?</span>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer select-none">
                      <input 
                        type="checkbox"
                        checked={activeClient.em_captacao || false}
                        onChange={async (e) => {
                          const updated = await updateVendasCliente(activeClient.id, { em_captacao: e.target.checked })
                          if (updated) {
                            setClientes(prev => prev.map(c => c.id === activeClient.id ? updated : c))
                          }
                        }}
                        className="rounded text-[#eb3238] focus:ring-[#eb3238] h-4 w-4"
                      />
                    </label>
                  </div>

                  <div className="space-y-3">
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-500 uppercase">Canal Utilizado para o Contato</label>
                      <select 
                        defaultValue={activeClient.perfil_quiz?.atend_canal || 'WhatsApp'}
                        onChange={(e) => setStageField('atend_canal', e.target.value)}
                        className="w-full text-xs border border-slate-200 rounded-xl p-2.5 focus:border-[#eb3238] outline-none bg-white"
                      >
                        <option value="WhatsApp">WhatsApp</option>
                        <option value="Ligação">Ligação Telefônica</option>
                        <option value="Presencial">Atendimento Presencial na Porto Real</option>
                      </select>
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-500 uppercase">Primeiras Impressões & Conexão (Rapport)</label>
                      <textarea 
                        defaultValue={activeClient.perfil_quiz?.atend_rapport || ''}
                        onBlur={(e) => setStageField('atend_rapport', e.target.value)}
                        placeholder="Como foi a abertura da conversa?..."
                        className="w-full text-xs border border-slate-200 rounded-xl p-2.5 focus:border-[#eb3238] outline-none min-h-[60px] resize-y"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-500 uppercase">Dores / Necessidades Mapeadas</label>
                      <textarea 
                        defaultValue={activeClient.perfil_quiz?.atend_necessidade || ''}
                        onBlur={(e) => setStageField('atend_necessidade', e.target.value)}
                        placeholder="O que motiva a busca atual?..."
                        className="w-full text-xs border border-slate-200 rounded-xl p-2.5 focus:border-[#eb3238] outline-none min-h-[60px] resize-y"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-500 uppercase">Imóveis Pré-Selecionados</label>
                      <textarea 
                        defaultValue={activeClient.perfil_quiz?.selecao_imoveis || ''}
                        onBlur={(e) => setStageField('selecao_imoveis', e.target.value)}
                        placeholder="Imóveis selecionados para o cliente..."
                        className="w-full text-xs border border-slate-200 rounded-xl p-2.5 focus:border-[#eb3238] outline-none min-h-[60px] resize-y"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-500 uppercase">Feedback da Apresentação</label>
                      <textarea 
                        defaultValue={activeClient.perfil_quiz?.apres_reacao || ''}
                        onBlur={(e) => setStageField('apres_reacao', e.target.value)}
                        placeholder="Como o cliente reagiu às opções enviadas?..."
                        className="w-full text-xs border border-slate-200 rounded-xl p-2.5 focus:border-[#eb3238] outline-none min-h-[60px] resize-y"
                      />
                    </div>
                  </div>

                  {/* SPIN Quiz & Sinais (Helper de Perfil) */}
                  <div className="pt-4 border-t border-slate-100 space-y-3">
                    <span className="text-xs font-bold text-slate-700 block">Questionário SPIN & Sinais Comportamentais</span>
                    <div className="bg-slate-50 rounded-xl p-3 text-[11px] text-slate-500 leading-relaxed border border-slate-100">
                      Responda para ajudar a definir o perfil dominante (Analítico, Controlador, Apoiador, Catalisador) no cabeçalho do painel.
                    </div>
                    <div className="space-y-4 max-h-[260px] overflow-y-auto pr-1">
                      {PERFIL_QUIZ.map((pq, qi) => {
                        const sel = activeClient.perfil_quiz?.[qi]
                        return (
                          <div key={qi} className="space-y-2 border-b border-slate-50 pb-3 last:border-0 last:pb-0">
                            <span className="text-[11px] font-bold text-slate-700 block">{qi + 1}. {pq.q}</span>
                            <div className="flex flex-col gap-1.5">
                              {pq.opts.map(o => {
                                const isSel = sel === o.k
                                return (
                                  <button
                                    key={o.k}
                                    type="button"
                                    onClick={() => handleQuizAnswer(qi, o.k)}
                                    className={`w-full text-left text-[11px] px-3.5 py-2.5 rounded-xl border transition-all ${
                                      isSel
                                        ? 'border-[#eb3238] bg-rose-50/20 text-[#eb3238] font-bold'
                                        : 'border-slate-100 hover:border-slate-200 hover:bg-slate-50 text-slate-600'
                                    }`}
                                  >
                                    {o.t}
                                  </button>
                                )
                              })}
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                </div>
              )}

              {/* ETAPA 2: Visita */}
              {activeClient.etapa === 2 && (
                <div className="space-y-4">
                  <p className="text-[11px] text-slate-400 font-semibold uppercase">Agendamento & Registro de Visitas</p>
                  
                  {/* Lembrete de Perfil */}
                  <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-xs text-slate-600">
                    💡 <b>Lembrete Pós-Visita:</b> Não se esqueça de confirmar e atualizar o <b>Perfil do Cliente</b> (🧠/⚡/❤️/🚀) no seletor do cabeçalho com base nas observações feitas na visita!
                  </div>

                  <div className="space-y-3">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-500 uppercase">Data/Hora Agendada</label>
                        <input 
                          type="datetime-local"
                          defaultValue={activeClient.visita_agendada_em ? new Date(new Date(activeClient.visita_agendada_em).getTime() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 16) : ''}
                          onChange={async (e) => {
                            const updated = await updateVendasCliente(activeClient.id, { visita_agendada_em: e.target.value || null })
                            if (updated) {
                              setClientes(prev => prev.map(c => c.id === activeClient.id ? updated : c))
                            }
                          }}
                          className="w-full text-xs border border-slate-200 rounded-xl p-2.5 focus:border-[#eb3238] outline-none"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-500 uppercase">Data/Hora Realizada</label>
                        <input 
                          type="datetime-local"
                          defaultValue={activeClient.visita_realizada_em ? new Date(new Date(activeClient.visita_realizada_em).getTime() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 16) : ''}
                          onChange={async (e) => {
                            const updated = await updateVendasCliente(activeClient.id, { visita_realizada_em: e.target.value || null })
                            if (updated) {
                              setClientes(prev => prev.map(c => c.id === activeClient.id ? updated : c))
                            }
                          }}
                          className="w-full text-xs border border-slate-200 rounded-xl p-2.5 focus:border-[#eb3238] outline-none"
                        />
                      </div>
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-500 uppercase">Imóveis Visitados</label>
                      <textarea 
                        defaultValue={activeClient.perfil_quiz?.visita_imoveis || ''}
                        onBlur={(e) => setStageField('visita_imoveis', e.target.value)}
                        placeholder="Quais imóveis foram visitados?..."
                        className="w-full text-xs border border-slate-200 rounded-xl p-2.5 focus:border-[#eb3238] outline-none min-h-[70px] resize-y"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-500 uppercase">Feedback Detalhado Pós-Visita</label>
                      <textarea 
                        defaultValue={activeClient.perfil_quiz?.visita_feedback || ''}
                        onBlur={(e) => setStageField('visita_feedback', e.target.value)}
                        placeholder="Reação e favoritos..."
                        className="w-full text-xs border border-slate-200 rounded-xl p-2.5 focus:border-[#eb3238] outline-none min-h-[70px] resize-y"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-500 uppercase">Objeções e Pontos de Atenção</label>
                      <input 
                        type="text"
                        defaultValue={activeClient.perfil_quiz?.visita_pontos_atencao || ''}
                        onBlur={(e) => setStageField('visita_pontos_atencao', e.target.value)}
                        placeholder="Pontos críticos..."
                        className="w-full text-xs border border-slate-200 rounded-xl p-2.5 focus:border-[#eb3238] outline-none"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* ETAPA 3: Proposta */}
              {activeClient.etapa === 3 && (
                <div className="space-y-4">
                  <p className="text-[11px] text-slate-400 font-semibold uppercase">Dados da Proposta</p>
                  
                  {/* Status de Financiamento */}
                  <div className="bg-slate-50 border border-slate-100 rounded-xl p-3.5 space-y-2">
                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Status do Financiamento</span>
                    <select
                      value={activeClient.status_financiamento || 'n/a'}
                      onChange={async (e) => {
                        const updated = await updateVendasCliente(activeClient.id, { status_financiamento: e.target.value as any })
                        if (updated) {
                          setClientes(prev => prev.map(c => c.id === activeClient.id ? updated : c))
                        }
                      }}
                      className="w-full text-xs border border-slate-200 rounded-xl p-2.5 focus:border-[#eb3238] outline-none bg-white font-semibold text-slate-700"
                    >
                      <option value="n/a">N/A (Não utiliza financiamento / À Vista)</option>
                      <option value="em_andamento">⏳ Em Andamento (Análise de Crédito)</option>
                      <option value="aprovado">✅ Aprovado</option>
                      <option value="reprovado">❌ Reprovado</option>
                    </select>
                  </div>

                  <div className="space-y-3">
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-500 uppercase">Imóvel-Alvo da Proposta</label>
                      <input 
                        type="text"
                        defaultValue={activeClient.perfil_quiz?.proposta_imovel || ''}
                        onBlur={(e) => setStageField('proposta_imovel', e.target.value)}
                        placeholder="Ex: Condomínio Royal Green - Ref #2918..."
                        className="w-full text-xs border border-slate-200 rounded-xl p-2.5 focus:border-[#eb3238] outline-none"
                      />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-500 uppercase">Valor Ofertado (R$)</label>
                        <input 
                          type="text"
                          defaultValue={activeClient.perfil_quiz?.proposta_valor || ''}
                          onBlur={(e) => {
                            setStageField('proposta_valor', e.target.value);
                            const cleanNum = Number(e.target.value.replace(/[^0-9]/g, ''));
                            if (cleanNum > 0) setCrmField('valor', cleanNum);
                          }}
                          placeholder="Ex: R$ 450.000"
                          className="w-full text-xs border border-slate-200 rounded-xl p-2.5 focus:border-[#eb3238] outline-none font-bold"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-500 uppercase">Data de Envio</label>
                        <input 
                          type="text"
                          defaultValue={activeClient.perfil_quiz?.proposta_data || ''}
                          onBlur={(e) => setStageField('proposta_data', e.target.value)}
                          placeholder="Ex: DD/MM/AAAA"
                          className="w-full text-xs border border-slate-200 rounded-xl p-2.5 focus:border-[#eb3238] outline-none"
                        />
                      </div>
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-500 uppercase">Condições de Pagamento</label>
                      <textarea 
                        defaultValue={activeClient.perfil_quiz?.proposta_condicoes || ''}
                        onBlur={(e) => setStageField('proposta_condicoes', e.target.value)}
                        placeholder="Condições e prazos..."
                        className="w-full text-xs border border-slate-200 rounded-xl p-2.5 focus:border-[#eb3238] outline-none min-h-[60px] resize-y"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* ETAPA 4: Negociação */}
              {activeClient.etapa === 4 && (
                <div className="space-y-4">
                  <p className="text-[11px] text-slate-400 font-semibold uppercase">Rodada de Negociação</p>
                  <div className="space-y-3">
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-500 uppercase">Contraproposta do Vendedor</label>
                      <textarea 
                        defaultValue={activeClient.perfil_quiz?.negoc_contraproposta || ''}
                        onBlur={(e) => setStageField('negoc_contraproposta', e.target.value)}
                        placeholder="Posição e contraoferta do proprietário..."
                        className="w-full text-xs border border-slate-200 rounded-xl p-2.5 focus:border-[#eb3238] outline-none min-h-[70px] resize-y"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-500 uppercase">Impasses a Resolver</label>
                      <textarea 
                        defaultValue={activeClient.perfil_quiz?.negoc_impasse || ''}
                        onBlur={(e) => setStageField('negoc_impasse', e.target.value)}
                        placeholder="Pontos críticos que travam a negociação..."
                        className="w-full text-xs border border-slate-200 rounded-xl p-2.5 focus:border-[#eb3238] outline-none min-h-[70px] resize-y"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-500 uppercase">Concessões Planejadas</label>
                      <input 
                        type="text"
                        defaultValue={activeClient.perfil_quiz?.negoc_concessoes || ''}
                        onBlur={(e) => setStageField('negoc_concessoes', e.target.value)}
                        placeholder="Concessões aceitas pelas partes..."
                        className="w-full text-xs border border-slate-200 rounded-xl p-2.5 focus:border-[#eb3238] outline-none"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* ETAPA 5: Fechamento */}
              {activeClient.etapa === 5 && (
                <div className="space-y-4">
                  <p className="text-[11px] text-slate-400 font-semibold uppercase">Documentação & Fechamento</p>
                  
                  {/* Status de Financiamento */}
                  <div className="bg-slate-50 border border-slate-100 rounded-xl p-3.5 space-y-2">
                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Status do Financiamento</span>
                    <select
                      value={activeClient.status_financiamento || 'n/a'}
                      onChange={async (e) => {
                        const updated = await updateVendasCliente(activeClient.id, { status_financiamento: e.target.value as any })
                        if (updated) {
                          setClientes(prev => prev.map(c => c.id === activeClient.id ? updated : c))
                        }
                      }}
                      className="w-full text-xs border border-slate-200 rounded-xl p-2.5 focus:border-[#eb3238] outline-none bg-white font-semibold text-slate-700"
                    >
                      <option value="n/a">N/A (Não utiliza financiamento / À Vista)</option>
                      <option value="em_andamento">⏳ Em Andamento (Análise de Crédito)</option>
                      <option value="aprovado">✅ Aprovado</option>
                      <option value="reprovado">❌ Reprovado</option>
                    </select>
                  </div>

                  <div className="space-y-3">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-500 uppercase">Documentação do Financiamento</label>
                        <input 
                          type="text"
                          defaultValue={activeClient.perfil_quiz?.doc_financiamento || ''}
                          onBlur={(e) => setStageField('doc_financiamento', e.target.value)}
                          placeholder="Ex: CEF em andamento..."
                          className="w-full text-xs border border-slate-200 rounded-xl p-2.5 focus:border-[#eb3238] outline-none"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-500 uppercase">Previsão Escritura/Assinatura</label>
                        <input 
                          type="text"
                          defaultValue={activeClient.perfil_quiz?.doc_previsao || ''}
                          onBlur={(e) => setStageField('doc_previsao', e.target.value)}
                          placeholder="Ex: Previsão 15/08..."
                          className="w-full text-xs border border-slate-200 rounded-xl p-2.5 focus:border-[#eb3238] outline-none"
                        />
                      </div>
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-500 uppercase">Certidões Pendentes</label>
                      <textarea 
                        defaultValue={activeClient.perfil_quiz?.doc_pendencias || ''}
                        onBlur={(e) => setStageField('doc_pendencias', e.target.value)}
                        placeholder="Certidões em aberto..."
                        className="w-full text-xs border border-slate-200 rounded-xl p-2.5 focus:border-[#eb3238] outline-none min-h-[50px] resize-y"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-500 uppercase">Imóvel Comercializado</label>
                      <input 
                        type="text"
                        defaultValue={activeClient.perfil_quiz?.fech_imovel || ''}
                        onBlur={(e) => setStageField('fech_imovel', e.target.value)}
                        placeholder="Apartamento 101 Bloco A..."
                        className="w-full text-xs border border-slate-200 rounded-xl p-2.5 focus:border-[#eb3238] outline-none"
                      />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                      <div className="space-y-1">
                        <label className="text-[9px] font-bold text-slate-500 uppercase">Valor Fechado (VGV)</label>
                        <input 
                          type="text"
                          defaultValue={activeClient.perfil_quiz?.fech_valor_final || ''}
                          onBlur={(e) => {
                            setStageField('fech_valor_final', e.target.value);
                            const val = Number(e.target.value.replace(/[^0-9]/g, ''));
                            if (val > 0) setCrmField('valor_fechado', val);
                          }}
                          className="w-full text-xs border border-slate-200 rounded-xl p-2 focus:border-[#eb3238] outline-none font-bold text-emerald-600"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[9px] font-bold text-slate-500 uppercase">Valor Pedido Original</label>
                        <input 
                          type="text"
                          defaultValue={activeClient.perfil_quiz?.fech_valor_pedido || ''}
                          onBlur={(e) => {
                            setStageField('fech_valor_pedido', e.target.value);
                            const val = Number(e.target.value.replace(/[^0-9]/g, ''));
                            if (val > 0) setCrmField('valor_pedido', val);
                          }}
                          className="w-full text-xs border border-slate-200 rounded-xl p-2 focus:border-[#eb3238] outline-none"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[9px] font-bold text-slate-500 uppercase">Valor Escriturado</label>
                        <input 
                          type="text"
                          defaultValue={activeClient.perfil_quiz?.fech_valor_vendido || ''}
                          onBlur={(e) => {
                            setStageField('fech_valor_vendido', e.target.value);
                            const val = Number(e.target.value.replace(/[^0-9]/g, ''));
                            if (val > 0) setCrmField('valor_vendido', val);
                          }}
                          className="w-full text-xs border border-slate-200 rounded-xl p-2 focus:border-[#eb3238] outline-none"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-500 uppercase">Data da Assinatura</label>
                        <input 
                          type="text"
                          defaultValue={activeClient.perfil_quiz?.fech_data_assinatura || ''}
                          onBlur={(e) => setStageField('fech_data_assinatura', e.target.value)}
                          placeholder="Ex: DD/MM/AAAA"
                          className="w-full text-xs border border-slate-200 rounded-xl p-2.5 focus:border-[#eb3238] outline-none"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-500 uppercase">Previsão das Chaves</label>
                        <input 
                          type="text"
                          defaultValue={activeClient.perfil_quiz?.fech_data_chaves || ''}
                          onBlur={(e) => setStageField('fech_data_chaves', e.target.value)}
                          placeholder="Prazo ou data..."
                          className="w-full text-xs border border-slate-200 rounded-xl p-2.5 focus:border-[#eb3238] outline-none"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* ETAPA 6: Pós-venda */}
              {activeClient.etapa === 6 && (
                <div className="space-y-4">
                  <p className="text-[11px] text-slate-400 font-semibold uppercase">Pós-Venda</p>
                  <div className="space-y-3">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-500 uppercase">Data do Contato</label>
                        <input 
                          type="text"
                          defaultValue={activeClient.perfil_quiz?.pos_data || ''}
                          onBlur={(e) => setStageField('pos_data', e.target.value)}
                          placeholder="Ex: DD/MM/AAAA"
                          className="w-full text-xs border border-slate-200 rounded-xl p-2.5 focus:border-[#eb3238] outline-none"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-500 uppercase">Satisfação (0-10)</label>
                        <select 
                          defaultValue={activeClient.perfil_quiz?.pos_satisfacao || '10'}
                          onChange={(e) => setStageField('pos_satisfacao', e.target.value)}
                          className="w-full text-xs border border-slate-200 rounded-xl p-2.5 focus:border-[#eb3238] outline-none bg-white font-bold text-[#1F4E79]"
                        >
                          <option value="10">⭐ 10 (Excelente)</option>
                          <option value="9">⭐ 9 (Ótimo)</option>
                          <option value="8">⭐ 8 (Bom)</option>
                          <option value="7">⭐ 7 (Regular)</option>
                          <option value="6">⭐ 6 ou menos (Insatisfeito)</option>
                        </select>
                      </div>
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-500 uppercase">Comentários Pós-Venda</label>
                      <textarea 
                        defaultValue={activeClient.perfil_quiz?.pos_obs || ''}
                        onBlur={(e) => setStageField('pos_obs', e.target.value)}
                        className="w-full text-xs border border-slate-200 rounded-xl p-2.5 focus:border-[#eb3238] outline-none min-h-[80px] resize-y"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* ETAPA 7: Depoimento */}
              {activeClient.etapa === 7 && (
                <div className="space-y-4">
                  <p className="text-[11px] text-slate-400 font-semibold uppercase">Prova Social & Depoimento</p>
                  <div className="space-y-3">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-500 uppercase">Autorizado Publicar?</label>
                        <select 
                          defaultValue={activeClient.perfil_quiz?.depoimento_autorizado || 'Sim'}
                          onChange={(e) => setStageField('depoimento_autorizado', e.target.value)}
                          className="w-full text-xs border border-slate-200 rounded-xl p-2.5 focus:border-[#eb3238] outline-none bg-white font-medium"
                        >
                          <option value="Sim">Sim, autorizado</option>
                          <option value="Não">Não, privado</option>
                        </select>
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-500 uppercase">Canal de Divulgação</label>
                        <input 
                          type="text"
                          defaultValue={activeClient.perfil_quiz?.depoimento_canal || ''}
                          onBlur={(e) => setStageField('depoimento_canal', e.target.value)}
                          placeholder="Google, site..."
                          className="w-full text-xs border border-slate-200 rounded-xl p-2.5 focus:border-[#eb3238] outline-none"
                        />
                      </div>
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-500 uppercase">Depoimento</label>
                      <textarea 
                        defaultValue={activeClient.perfil_quiz?.depoimento_texto || ''}
                        onBlur={(e) => setStageField('depoimento_texto', e.target.value)}
                        placeholder="Transcrição do depoimento..."
                        className="w-full text-xs border border-slate-200 rounded-xl p-2.5 focus:border-[#eb3238] outline-none min-h-[90px] resize-y"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* ETAPA 8: Indicação */}
              {activeClient.etapa === 8 && (
                <div className="space-y-4">
                  <p className="text-[11px] text-slate-400 font-semibold uppercase">Registro de Indicações</p>
                  <div className="space-y-3">
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-500 uppercase">Nome do Indicado</label>
                      <input 
                        type="text"
                        defaultValue={activeClient.perfil_quiz?.indicacao_nome || ''}
                        onBlur={(e) => setStageField('indicacao_nome', e.target.value)}
                        placeholder="Nome..."
                        className="w-full text-xs border border-slate-200 rounded-xl p-2.5 focus:border-[#eb3238] outline-none"
                      />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-500 uppercase">Contato/WhatsApp</label>
                        <input 
                          type="text"
                          defaultValue={activeClient.perfil_quiz?.indicacao_contato || ''}
                          onBlur={(e) => setStageField('indicacao_contato', e.target.value)}
                          placeholder="WhatsApp..."
                          className="w-full text-xs border border-slate-200 rounded-xl p-2.5 focus:border-[#eb3238] outline-none"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-500 uppercase">Interesse Principal</label>
                        <select 
                          defaultValue={activeClient.perfil_quiz?.indicacao_tipo || 'Comprar'}
                          onChange={(e) => setStageField('indicacao_tipo', e.target.value)}
                          className="w-full text-xs border border-slate-200 rounded-xl p-2.5 focus:border-[#eb3238] outline-none bg-white"
                        >
                          <option value="Comprar">Comprar Imóvel</option>
                          <option value="Alugar">Alugar Imóvel</option>
                          <option value="Vender">Vender Imóvel dele</option>
                        </select>
                      </div>
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-500 uppercase">Observações da Indicação</label>
                      <input 
                        type="text"
                        defaultValue={activeClient.perfil_quiz?.indicacao_obs || ''}
                        onBlur={(e) => setStageField('indicacao_obs', e.target.value)}
                        placeholder="Ex: Busca casa em condomínio..."
                        className="w-full text-xs border border-slate-200 rounded-xl p-2.5 focus:border-[#eb3238] outline-none"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Checklist Section (Checklist da Etapa) */}
            <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-4">
              <h3 className="text-xs font-extrabold uppercase tracking-widest text-[#1F4E79] flex items-center gap-2">
                <span className="w-5 h-5 bg-[#1F4E79] text-white rounded-md flex items-center justify-center text-[10px]">3</span>
                Checklist — {ETAPAS[activeClient.etapa]?.nome}
              </h3>

              {(() => {
                const totalItens = ETAPAS[activeClient.etapa]?.chk.length || 0
                const concluidos = activeChecklist.filter(chk => chk.etapa === activeClient.etapa).length
                const pct = totalItens ? Math.round((concluidos / totalItens) * 100) : 0

                return (
                  <div className="space-y-2">
                    <div className="flex items-center gap-3">
                      <div className="flex-1 bg-slate-100 h-2 rounded-full overflow-hidden">
                        <div className="h-full bg-emerald-500 transition-all" style={{ width: `${pct}%` }}></div>
                      </div>
                      <span className="text-xs font-black text-emerald-600 w-10 text-right">{pct}%</span>
                    </div>

                    <div className="space-y-1.5">
                      {ETAPAS[activeClient.etapa]?.chk.map((item, idx) => {
                        const isChecked = activeChecklist.some(chk => chk.etapa === activeClient.etapa && chk.item_index === idx)
                        return (
                          <div
                            key={idx}
                            onClick={() => toggleChecklist(idx)}
                            className={`flex items-start gap-3 p-3 border rounded-xl cursor-pointer transition-all ${
                              isChecked
                                ? 'border-emerald-100 bg-emerald-50/40 text-slate-500'
                                : 'border-slate-100 hover:border-slate-200 hover:bg-slate-50 text-slate-800'
                            }`}
                          >
                            {isChecked ? (
                              <CheckSquare size={18} className="text-emerald-500 mt-0.5 flex-shrink-0" />
                            ) : (
                              <Square size={18} className="text-slate-300 mt-0.5 flex-shrink-0" />
                            )}
                            <span className={`text-xs md:text-sm leading-relaxed ${isChecked ? 'line-through text-slate-400' : 'font-medium'}`}>
                              {item}
                            </span>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )
              })()}
            </div>

          </div>

          {/* Section 3: Resumo do Status (Expandido e Completo) */}
          <section className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-4">
            <h3 className="text-xs font-extrabold uppercase tracking-widest text-[#eb3238] flex items-center gap-2">
              <span className="w-5 h-5 bg-[#eb3238] text-white rounded-md flex items-center justify-center text-[10px]">4</span>
              Resumo do Status & Linha do Tempo
            </h3>
            
            <div className="grid grid-cols-1 lg:grid-cols-[1fr_1.5fr] gap-6">
              {/* Resumo Geral & Playbook */}
              <div className="space-y-4">
                <div className="bg-[#EEF4FA]/50 border border-[#D6E4F0] rounded-xl p-4.5 space-y-3 text-xs md:text-sm text-slate-700 leading-relaxed shadow-xs">
                  <p>
                    <b>{activeClient.nome}</b> está atualmente na <b>etapa {activeClient.etapa + 1} de {ETAPAS.length}</b> — <span className="font-extrabold text-[#eb3238]">{ETAPAS[activeClient.etapa]?.nome}</span>, sob responsabilidade de <b>{RESP[activeClient.etapa]}</b>.
                  </p>
                  <p>
                    Temperatura do lead: <span className="font-bold uppercase" style={{ color: (TEMP_CFG as any)[activeClient.temp]?.cor }}>{(TEMP_CFG as any)[activeClient.temp]?.rotulo}</span>.
                    {activeClient.perfil ? (
                      <span> Perfil consultivo mapeado como <b className="text-[#1F4E79]">{PERFIS[activeClient.perfil].nome} {PERFIS[activeClient.perfil].emo}</b>
                        {activeClient.perfil_secundario && PERFIS[activeClient.perfil_secundario] && (
                          <> e perfil secundário <b className="text-slate-500">{PERFIS[activeClient.perfil_secundario].nome} {PERFIS[activeClient.perfil_secundario].emo}</b></>
                        )}.
                      </span>
                    ) : (
                      <span> Perfil de compra SPIN ainda pendente de diagnóstico.</span>
                    )}
                  </p>
                  {activeClient.expressa && !activeClient.finalizado && (
                    <p className="bg-[#fbf1e3] text-[#c77d2e] px-3 py-1.5 rounded-lg font-bold border border-[#ecd3ad]">
                      ⚡ Cliente via expressa marcou visita diretamente no site.
                    </p>
                  )}
                  <p className="font-extrabold text-[#1F4E79] pt-2 border-t border-slate-200/50 mt-1">
                    {activeClient.etapa < ETAPAS.length - 1 ? (
                      <span>Próximo passo planejado: {ETAPAS[activeClient.etapa + 1]?.nome}</span>
                    ) : (
                      <span>Processo concluído com sucesso! 🎉</span>
                    )}
                  </p>
                </div>

                {/* Playbook Playbox se perfil mapeado */}
                {activeClient.perfil && (
                  <div className="bg-slate-50 border border-slate-200 rounded-xl p-4.5 space-y-3">
                    <h4 className="text-xs font-extrabold text-[#1F4E79] uppercase tracking-wide flex items-center gap-1.5">
                      {PERFIS[activeClient.perfil].emo} Playbook: O que Falar com este Perfil
                    </h4>
                    <ul className="space-y-1.5 text-xs text-slate-700">
                      {PERFIS[activeClient.perfil].estrategia.map((est, eIdx) => (
                        <li key={eIdx} className="flex items-start gap-2">
                          <span className="text-emerald-500 font-bold">✓</span>
                          <span>{est}</span>
                        </li>
                      ))}
                    </ul>
                    {PERFIS[activeClient.perfil].evitar && (
                      <div className="border-t border-slate-200/50 pt-2.5">
                        <h5 className="text-[10px] font-black text-rose-600 uppercase tracking-wider mb-1 flex items-center gap-1">
                          ⚠️ Evitar Absolutamente
                        </h5>
                        <ul className="space-y-1 text-xs text-slate-600">
                          {PERFIS[activeClient.perfil].evitar.map((ev, evIdx) => (
                            <li key={evIdx} className="flex items-start gap-1.5">
                              <span className="text-rose-500">•</span>
                              <span>{ev}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Histórico/Linha do tempo de informações inseridas */}
              <div className="bg-slate-50/50 border border-slate-200 rounded-xl p-4.5 space-y-3.5 max-h-[400px] overflow-y-auto">
                <h4 className="text-xs font-extrabold text-slate-700 uppercase tracking-wider pb-2 border-b border-slate-200/60">
                  📋 Dossiê de Lançamentos do Cliente
                </h4>

                <div className="space-y-4">
                  {/* Etapa 1: Lead */}
                  <div className="space-y-1.5 border-l-2 border-[#1F4E79] pl-3.5 py-0.5 relative">
                    <div className="absolute -left-[5px] top-1.5 w-2 h-2 rounded-full bg-[#1F4E79]" />
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">Etapa 1: Lead (Cadastro Inicial)</span>
                    <div className="text-xs text-slate-700 grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-1 font-medium">
                      <div>• <b>Nome:</b> {activeClient.nome}</div>
                      <div>• <b>WhatsApp:</b> {activeClient.contato || '—'}</div>
                      <div>• <b>E-mail:</b> {activeClient.email || '—'}</div>
                      <div>• <b>Origem:</b> {activeClient.origem || '—'}</div>
                    </div>
                  </div>

                  {/* Etapa 2: Cadastro no CRM */}
                  {(activeClient.perfil_quiz?.cadastro_finalidade || activeClient.perfil_quiz?.cadastro_canal || activeClient.perfil_quiz?.cadastro_obs) && (
                    <div className="space-y-1.5 border-l-2 border-[#1F4E79] pl-3.5 py-0.5 relative">
                      <div className="absolute -left-[5px] top-1.5 w-2 h-2 rounded-full bg-[#1F4E79]" />
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">Etapa 2: Cadastro no CRM</span>
                      <div className="text-xs text-slate-700 space-y-1 font-medium">
                        <div>• <b>Finalidade:</b> {activeClient.perfil_quiz.cadastro_finalidade || 'Moradia'} | <b>Canal:</b> {activeClient.perfil_quiz.cadastro_canal || 'WhatsApp'} | <b>Horário:</b> {activeClient.perfil_quiz.cadastro_horario || 'Qualquer'}</div>
                        {activeClient.perfil_quiz.cadastro_orcamento && <div>• <b>Orçamento Inicial:</b> {activeClient.perfil_quiz.cadastro_orcamento}</div>}
                        {activeClient.perfil_quiz.cadastro_obs && <div className="text-slate-600 italic font-normal">• "{activeClient.perfil_quiz.cadastro_obs}"</div>}
                      </div>
                    </div>
                  )}

                  {/* Etapa 3: Primeiro Atendimento */}
                  {(activeClient.perfil_quiz?.atend_rapport || activeClient.perfil_quiz?.atend_necessidade) && (
                    <div className="space-y-1.5 border-l-2 border-[#1F4E79] pl-3.5 py-0.5 relative">
                      <div className="absolute -left-[5px] top-1.5 w-2 h-2 rounded-full bg-[#1F4E79]" />
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">Etapa 3: Primeiro Atendimento</span>
                      <div className="text-xs text-slate-700 space-y-1 font-medium">
                        <div>• <b>Canal de Atendimento:</b> {activeClient.perfil_quiz.atend_canal || '—'}</div>
                        {activeClient.perfil_quiz.atend_rapport && <div className="text-slate-600 font-normal">• <b>Rapport/Impressões:</b> "{activeClient.perfil_quiz.atend_rapport}"</div>}
                        {activeClient.perfil_quiz.atend_necessidade && <div className="text-slate-600 font-normal">• <b>Dores/Motivação:</b> "{activeClient.perfil_quiz.atend_necessidade}"</div>}
                      </div>
                    </div>
                  )}

                  {/* Etapa 4: Identificar Perfil */}
                  {activeClient.perfil && (
                    <div className="space-y-1.5 border-l-2 border-[#1F4E79] pl-3.5 py-0.5 relative">
                      <div className="absolute -left-[5px] top-1.5 w-2 h-2 rounded-full bg-[#1F4E79]" />
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">Etapa 4: Descoberta de Perfil</span>
                      <div className="text-xs text-slate-700 space-y-1 font-medium">
                        <div>• <b>Perfil Identificado:</b> {PERFIS[activeClient.perfil].nome} {PERFIS[activeClient.perfil].emo}
                          {activeClient.perfil_secundario && ` / Secundário: ${PERFIS[activeClient.perfil_secundario].nome} ${PERFIS[activeClient.perfil_secundario].emo}`}
                        </div>
                        <div className="text-[10px] text-slate-500 font-semibold">• Comportamentos marcados: {
                          Object.entries(activeClient.perfil_quiz || {})
                            .filter(([k, v]) => k.startsWith('s_') && v === 'true')
                            .map(([k]) => {
                              const parts = k.split('_');
                              const profKey = parts[1];
                              const sIdx = Number(parts[2]);
                              return (SINAIS_COMPORTAMENTAIS as any)[profKey]?.[sIdx];
                            })
                            .filter(Boolean)
                            .join(', ') || 'nenhum sinal de comportamento anotado'
                        }</div>
                      </div>
                    </div>
                  )}

                  {/* Etapa 5: Estratégia */}
                  {(activeClient.perfil_quiz?.estrategia_cadencia || activeClient.perfil_quiz?.estrategia_roteiro) && (
                    <div className="space-y-1.5 border-l-2 border-[#1F4E79] pl-3.5 py-0.5 relative">
                      <div className="absolute -left-[5px] top-1.5 w-2 h-2 rounded-full bg-[#1F4E79]" />
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">Etapa 5: Estratégia de Atendimento</span>
                      <div className="text-xs text-slate-700 space-y-1 font-medium">
                        <div>• <b>Cadência:</b> {activeClient.perfil_quiz.estrategia_cadencia || '—'}</div>
                        {activeClient.perfil_quiz.estrategia_roteiro && <div className="text-slate-600 font-normal">• <b>Roteiro:</b> "{activeClient.perfil_quiz.estrategia_roteiro}"</div>}
                        {activeClient.perfil_quiz.estrategia_argumentos && <div className="text-slate-600 font-normal">• <b>Argumentação:</b> "{activeClient.perfil_quiz.estrategia_argumentos}"</div>}
                      </div>
                    </div>
                  )}

                  {/* Etapa 6: Seleção de Imóveis */}
                  {(activeClient.perfil_quiz?.selecao_imoveis || activeClient.perfil_quiz?.selecao_motivo) && (
                    <div className="space-y-1.5 border-l-2 border-[#1F4E79] pl-3.5 py-0.5 relative">
                      <div className="absolute -left-[5px] top-1.5 w-2 h-2 rounded-full bg-[#1F4E79]" />
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">Etapa 6: Seleção de Imóveis</span>
                      <div className="text-xs text-slate-700 space-y-1 font-medium">
                        {activeClient.perfil_quiz.selecao_imoveis && <div className="whitespace-pre-wrap font-normal text-slate-600">• <b>Imóveis selecionados:</b>&#10;{activeClient.perfil_quiz.selecao_imoveis}</div>}
                        {activeClient.perfil_quiz.selecao_motivo && <div className="text-slate-600 font-normal">• <b>Motivo/Filtro:</b> "{activeClient.perfil_quiz.selecao_motivo}"</div>}
                      </div>
                    </div>
                  )}

                  {/* Etapa 7: Apresentação */}
                  {(activeClient.perfil_quiz?.apres_reacao || activeClient.perfil_quiz?.apres_destaques) && (
                    <div className="space-y-1.5 border-l-2 border-[#1F4E79] pl-3.5 py-0.5 relative">
                      <div className="absolute -left-[5px] top-1.5 w-2 h-2 rounded-full bg-[#1F4E79]" />
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">Etapa 7: Apresentação de Imóveis</span>
                      <div className="text-xs text-slate-700 space-y-1 font-medium">
                        {activeClient.perfil_quiz.apres_reacao && <div className="text-slate-600 font-normal">• <b>Reação:</b> "{activeClient.perfil_quiz.apres_reacao}"</div>}
                        {activeClient.perfil_quiz.apres_destaques && <div className="text-slate-600 font-normal">• <b>Imóveis favoritos:</b> "{activeClient.perfil_quiz.apres_destaques}"</div>}
                        {activeClient.perfil_quiz.apres_ajustes && <div>• <b>Ajuste no Filtro:</b> {activeClient.perfil_quiz.apres_ajustes}</div>}
                      </div>
                    </div>
                  )}

                  {/* Etapa 8: Visita */}
                  {(activeClient.perfil_quiz?.visita_imoveis || activeClient.perfil_quiz?.visita_feedback) && (
                    <div className="space-y-1.5 border-l-2 border-[#1F4E79] pl-3.5 py-0.5 relative">
                      <div className="absolute -left-[5px] top-1.5 w-2 h-2 rounded-full bg-[#1F4E79]" />
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">Etapa 8: Visita (Imóveis Visitados)</span>
                      <div className="text-xs text-slate-700 space-y-1 font-medium">
                        {activeClient.perfil_quiz.visita_imoveis && <div className="whitespace-pre-wrap font-normal text-slate-600">• <b>Imóveis visitados:</b>&#10;{activeClient.perfil_quiz.visita_imoveis}</div>}
                        {activeClient.perfil_quiz.visita_feedback && <div className="text-slate-600 font-normal">• <b>Feedback/Resultado:</b> "{activeClient.perfil_quiz.visita_feedback}"</div>}
                        {activeClient.perfil_quiz.visita_pontos_atencao && <div>• <b>Objeções/Atenções:</b> {activeClient.perfil_quiz.visita_pontos_atencao}</div>}
                      </div>
                    </div>
                  )}

                  {/* Etapa 9: Proposta */}
                  {(activeClient.perfil_quiz?.proposta_imovel || activeClient.perfil_quiz?.proposta_valor) && (
                    <div className="space-y-1.5 border-l-2 border-[#1F4E79] pl-3.5 py-0.5 relative">
                      <div className="absolute -left-[5px] top-1.5 w-2 h-2 rounded-full bg-[#1F4E79]" />
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">Etapa 9: Proposta Lançada</span>
                      <div className="text-xs text-slate-700 space-y-1 font-medium">
                        <div>• <b>Imóvel-alvo:</b> {activeClient.perfil_quiz.proposta_imovel || '—'}</div>
                        <div>• <b>Valor da Proposta:</b> {activeClient.perfil_quiz.proposta_valor || fmtBRL(activeClient.valor || 0)} {activeClient.perfil_quiz.proposta_data && ` em ${activeClient.perfil_quiz.proposta_data}`}</div>
                        {activeClient.perfil_quiz.proposta_condicoes && <div className="text-slate-600 font-normal">• <b>Condições de pgto:</b> "{activeClient.perfil_quiz.proposta_condicoes}"</div>}
                      </div>
                    </div>
                  )}

                  {/* Etapa 10: Negociação */}
                  {(activeClient.perfil_quiz?.negoc_contraproposta || activeClient.perfil_quiz?.negoc_impasse) && (
                    <div className="space-y-1.5 border-l-2 border-[#1F4E79] pl-3.5 py-0.5 relative">
                      <div className="absolute -left-[5px] top-1.5 w-2 h-2 rounded-full bg-[#1F4E79]" />
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">Etapa 10: Negociação</span>
                      <div className="text-xs text-slate-700 space-y-1 font-medium">
                        {activeClient.perfil_quiz.negoc_contraproposta && <div className="text-slate-600 font-normal">• <b>Contraproposta / Posição proprietário:</b> "{activeClient.perfil_quiz.negoc_contraproposta}"</div>}
                        {activeClient.perfil_quiz.negoc_impasse && <div className="text-slate-600 font-normal">• <b>Impasse / Objeções:</b> "{activeClient.perfil_quiz.negoc_impasse}"</div>}
                        {activeClient.perfil_quiz.negoc_concessoes && <div>• <b>Concessões acordadas:</b> {activeClient.perfil_quiz.negoc_concessoes}</div>}
                      </div>
                    </div>
                  )}

                  {/* Etapa 11: Documentação / Financiamento */}
                  {(activeClient.perfil_quiz?.doc_financiamento || activeClient.perfil_quiz?.doc_pendencias) && (
                    <div className="space-y-1.5 border-l-2 border-[#1F4E79] pl-3.5 py-0.5 relative">
                      <div className="absolute -left-[5px] top-1.5 w-2 h-2 rounded-full bg-[#1F4E79]" />
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">Etapa 11: Documentação & Crédito</span>
                      <div className="text-xs text-slate-700 space-y-1 font-medium">
                        {activeClient.perfil_quiz.doc_financiamento && <div className="text-slate-600 font-normal">• <b>Crédito / Financiamento:</b> "{activeClient.perfil_quiz.doc_financiamento}"</div>}
                        {activeClient.perfil_quiz.doc_pendencias && <div className="text-slate-600 font-normal">• <b>Certidões pendentes:</b> "{activeClient.perfil_quiz.doc_pendencias}"</div>}
                        {activeClient.perfil_quiz.doc_previsao && <div>• <b>Previsão de Assinatura:</b> {activeClient.perfil_quiz.doc_previsao}</div>}
                      </div>
                    </div>
                  )}

                  {/* Etapa 12: Fechamento */}
                  {(activeClient.finalizado || activeClient.perfil_quiz?.fech_imovel || activeClient.valor_fechado) && (
                    <div className="space-y-1.5 border-l-2 border-emerald-500 pl-3.5 py-0.5 relative bg-emerald-50/20 p-2.5 rounded-lg border border-emerald-100/50">
                      <div className="absolute -left-[5px] top-4 w-2 h-2 rounded-full bg-emerald-500" />
                      <span className="text-[10px] font-black text-emerald-700 uppercase tracking-wider block">Etapa 12: Fechamento Concluído</span>
                      <div className="text-xs text-slate-700 space-y-1 font-medium">
                        <div>• <b>Imóvel:</b> {activeClient.perfil_quiz.fech_imovel || '—'}</div>
                        <div>• <b>VGV Final Fechado:</b> <span className="text-emerald-600 font-black">{fmtBRL(activeClient.valor_fechado || 0)}</span></div>
                        {activeClient.valor_pedido && <div>• <b>Valor Pedido Original:</b> {fmtBRL(activeClient.valor_pedido)} | <b>Escriturado:</b> {fmtBRL(activeClient.valor_vendido || 0)}</div>}
                        {activeClient.perfil_quiz.fech_data_assinatura && <div>• <b>Assinatura:</b> {activeClient.perfil_quiz.fech_data_assinatura} | <b>Chaves:</b> {activeClient.perfil_quiz.fech_data_chaves || '—'}</div>}
                      </div>
                    </div>
                  )}

                  {/* Etapa 13: Pós-venda */}
                  {activeClient.perfil_quiz?.pos_data && (
                    <div className="space-y-1.5 border-l-2 border-[#1F4E79] pl-3.5 py-0.5 relative">
                      <div className="absolute -left-[5px] top-1.5 w-2 h-2 rounded-full bg-[#1F4E79]" />
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">Etapa 13: Pós-venda</span>
                      <div className="text-xs text-slate-700 space-y-1 font-medium">
                        <div>• <b>Data Contato:</b> {activeClient.perfil_quiz.pos_data} | <b>Nota de Satisfação:</b> <span className="font-bold text-[#1F4E79]">{activeClient.perfil_quiz.pos_satisfacao}/10</span></div>
                        {activeClient.perfil_quiz.pos_obs && <div className="text-slate-600 font-normal">• <b>Obs do cliente:</b> "{activeClient.perfil_quiz.pos_obs}"</div>}
                      </div>
                    </div>
                  )}

                  {/* Etapa 14: Depoimento */}
                  {activeClient.perfil_quiz?.depoimento_texto && (
                    <div className="space-y-1.5 border-l-2 border-[#1F4E79] pl-3.5 py-0.5 relative">
                      <div className="absolute -left-[5px] top-1.5 w-2 h-2 rounded-full bg-[#1F4E79]" />
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">Etapa 14: Prova Social (Depoimento)</span>
                      <div className="text-xs text-slate-700 space-y-1 font-medium">
                        <div>• <b>Autorizado:</b> {activeClient.perfil_quiz.depoimento_autorizado || 'Sim'} | <b>Canal:</b> {activeClient.perfil_quiz.depoimento_canal || '—'}</div>
                        {activeClient.perfil_quiz.depoimento_texto && <div className="text-slate-600 font-normal italic">• "{activeClient.perfil_quiz.depoimento_texto}"</div>}
                      </div>
                    </div>
                  )}

                  {/* Etapa 15: Indicação */}
                  {activeClient.perfil_quiz?.indicacao_nome && (
                    <div className="space-y-1.5 border-l-2 border-[#1F4E79] pl-3.5 py-0.5 relative">
                      <div className="absolute -left-[5px] top-1.5 w-2 h-2 rounded-full bg-[#1F4E79]" />
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">Etapa 15: Captação de Indicação</span>
                      <div className="text-xs text-slate-700 space-y-1 font-medium">
                        <div>• <b>Nome do indicado:</b> {activeClient.perfil_quiz.indicacao_nome}</div>
                        <div>• <b>WhatsApp/Contato:</b> {activeClient.perfil_quiz.indicacao_contato || '—'} | <b>Interesse:</b> {activeClient.perfil_quiz.indicacao_tipo || 'Comprar'}</div>
                        {activeClient.perfil_quiz.indicacao_obs && <div className="text-slate-600 font-normal">• <b>Obs da indicação:</b> {activeClient.perfil_quiz.indicacao_obs}</div>}
                      </div>
                    </div>
                  )}

                </div>
              </div>
            </div>
          </section>

          {/* Section 4: Conversations Timeline */}
          <section className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-4">
            <h3 className="text-xs font-extrabold uppercase tracking-widest text-[#1F4E79] flex items-center gap-2">
              <span className="w-5 h-5 bg-[#1F4E79] text-white rounded-md flex items-center justify-center text-[10px]">5</span>
              Anotações da conversa
            </h3>

            <div className="space-y-3">
              <textarea
                value={novaNotaTxt}
                onChange={(e) => setNovaNotaTxt(e.target.value)}
                placeholder="O que o cliente falou? O que ficou acertado nesta etapa?"
                className="w-full text-xs md:text-sm border border-slate-200 rounded-xl p-3.5 focus:outline-none focus:border-[#2E6CA8] min-h-[70px] resize-y"
              ></textarea>
              
              <div className="flex items-center justify-between gap-3">
                <button
                  onClick={handleAddNota}
                  className="bg-[#1F4E79] hover:bg-[#2E6CA8] text-white text-xs font-bold px-4 py-2.5 rounded-xl transition-all shadow-sm flex items-center gap-1.5"
                >
                  + Adicionar anotação
                </button>
                <span className="text-[10px] text-slate-400 font-semibold">
                  Registrada com a etapa atual: <b>{ETAPAS[activeClient.etapa]?.nome}</b>
                </span>
              </div>
            </div>

            {/* Notes Feed */}
            <div className="space-y-3 pt-2">
              {activeNotas.length === 0 ? (
                <div className="text-slate-400 text-xs italic py-4">Nenhuma nota cadastrada para este cliente.</div>
              ) : (
                activeNotas.slice().reverse().map(nota => (
                  <div key={nota.id} className="flex gap-4 border-l-2 border-slate-100 pl-4 py-1 relative">
                    <div className="absolute -left-[5px] top-2.5 w-2 h-2 rounded-full bg-[#2E6CA8]"></div>
                    <div className="flex-1 space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-black text-slate-400">{nota.data}</span>
                        <span className="bg-[#EEF4FA] text-[#1F4E79] text-[9px] font-bold px-2 py-0.5 rounded-full">{nota.etapa}</span>
                      </div>
                      <p className="text-xs md:text-sm text-slate-700 whitespace-pre-wrap leading-relaxed">{nota.texto}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </section>
        </main>
      ) : (
        <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center text-slate-400 font-medium flex-1">
          Nenhum cliente cadastrado no funil de vendas. Adicione um para começar.
        </div>
      )}

      {/* ============================================================
          MODAL: FICHA DO CLIENTE (CRM DETAILS / EDIT)
          ============================================================ */}
      {fichaOpen && activeClient && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-xl shadow-2xl animate-scaleIn space-y-4 max-h-[90vh] overflow-y-auto">
            
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-black text-[#1F4E79] text-base md:text-lg flex items-center gap-1.5">📇 Ficha do Cliente</h3>
                <p className="text-[11px] text-slate-400 font-medium">Altere as informações cadastrais que alimentam o Banco de Dados.</p>
              </div>
              <button
                onClick={() => setFichaOpen(false)}
                className="text-slate-400 hover:text-slate-600 transition-colors p-1"
              >
                <X size={20} />
              </button>
            </div>

            {/* CRM Form fields */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-wide block">Nome</label>
                <input
                  type="text"
                  value={activeClient.nome}
                  onChange={(e) => setCrmField('nome', e.target.value)}
                  className="w-full border border-slate-200 rounded-xl p-2.5 text-xs md:text-sm outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-wide block">Telefone</label>
                <input
                  type="text"
                  value={activeClient.contato || ''}
                  onChange={(e) => setCrmField('contato', e.target.value)}
                  className="w-full border border-slate-200 rounded-xl p-2.5 text-xs md:text-sm outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-wide block">E-mail</label>
                <input
                  type="email"
                  value={activeClient.email || ''}
                  onChange={(e) => setCrmField('email', e.target.value)}
                  className="w-full border border-slate-200 rounded-xl p-2.5 text-xs md:text-sm outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-wide block">Localização</label>
                <input
                  type="text"
                  value={activeClient.local || ''}
                  onChange={(e) => setCrmField('local', e.target.value)}
                  className="w-full border border-slate-200 rounded-xl p-2.5 text-xs md:text-sm outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-wide block">Objetivo</label>
                <select
                  value={activeClient.objetivo}
                  onChange={(e) => setCrmField('objetivo', e.target.value)}
                  className="w-full border border-slate-200 rounded-xl p-2.5 text-xs md:text-sm outline-none bg-white cursor-pointer font-semibold"
                >
                  <option value="Comprar">Comprar</option>
                  <option value="Alugar">Alugar</option>
                  <option value="Vender">Vender</option>
                  <option value="Deixar para alugar">Deixar para alugar</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-wide block">Faixa de Valor</label>
                <select
                  value={activeClient.faixa || ''}
                  onChange={(e) => setCrmField('faixa', e.target.value)}
                  className="w-full border border-slate-200 rounded-xl p-2.5 text-xs md:text-sm outline-none bg-white cursor-pointer font-semibold"
                >
                  <option value="">—</option>
                  <option value="Até R$ 200 mil">Até R$ 200 mil</option>
                  <option value="R$ 200–350 mil">R$ 200–350 mil</option>
                  <option value="R$ 350–500 mil">R$ 350–500 mil</option>
                  <option value="Acima de R$ 500 mil">Acima de R$ 500 mil</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-wide block">Corretor Responsável</label>
                <select
                  value={activeClient.corretor_id || ''}
                  onChange={(e) => setCrmField('corretor_id', e.target.value || null)}
                  disabled={user?.role === 'vendas'}
                  className="w-full border border-slate-200 rounded-xl p-2.5 text-xs md:text-sm outline-none bg-white disabled:bg-slate-50 disabled:text-slate-500 disabled:cursor-not-allowed cursor-pointer font-semibold"
                >
                  <option value="">Não Distribuído (Sem Corretor)</option>
                  {corretores.map(c => (
                    <option key={c.id} value={c.id}>{c.nome}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-wide block">Preferência</label>
              <textarea
                value={activeClient.preferencia || ''}
                onChange={(e) => setCrmField('preferencia', e.target.value)}
                placeholder="Características desejadas (ex: 3 quartos, varanda, área gourmet...)"
                className="w-full border border-slate-200 rounded-xl p-3.5 text-xs md:text-sm outline-none focus:border-[#2E6CA8] min-h-[60px] resize-y"
              ></textarea>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 pt-3 border-t border-slate-100">
              <button
                onClick={() => setFichaOpen(false)}
                className="flex-1 bg-white hover:bg-slate-50 border border-slate-200 text-slate-500 font-bold py-2.5 rounded-xl text-xs md:text-sm transition-colors"
              >
                Fechar Ficha
              </button>
              
              <button
                onClick={() => {
                  const link = window.location.origin + '/publico/qualificar?corretor=' + (activeClient.corretor_id || '')
                  navigator.clipboard.writeText(link)
                    .then(() => alert("Link do Formulário de Interesse copiado para transferência! Envie para o cliente preencher via WhatsApp."))
                    .catch(err => {
                      console.error("Erro ao copiar link:", err)
                      alert("Não foi possível copiar automaticamente. Use o link: " + link)
                    })
                  setFichaOpen(false)
                }}
                className="flex-1 bg-[#1F4E79] hover:bg-[#2E6CA8] text-white font-bold py-2.5 rounded-xl text-xs md:text-sm transition-all shadow-sm flex items-center justify-center gap-1.5"
              >
                <Smartphone size={15} />
                Enviar p/ Cliente Preencher
              </button>
            </div>

          </div>
        </div>
      )}

      {/* ============================================================
          MODAL: CADASTRAR NOVO CLIENTE (FUNIL)
          ============================================================ */}
      {modalNovoOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl animate-scaleIn space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-black text-[#1F4E79] text-base md:text-lg">Cadastrar Novo Cliente</h3>
              <button
                onClick={() => setModalNovoOpen(false)}
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
                  className="w-full border border-slate-200 rounded-xl p-3 text-xs md:text-sm outline-none focus:border-[#2E6CA8]"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-extrabold text-slate-500 uppercase tracking-wider block">Telefone</label>
                <input
                  type="text"
                  placeholder="Ex: (69) 9 9999-9999"
                  value={formNovo.contato}
                  onChange={(e) => setFormNovo({ ...formNovo, contato: e.target.value })}
                  className="w-full border border-slate-200 rounded-xl p-3 text-xs md:text-sm outline-none focus:border-[#2E6CA8]"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-extrabold text-slate-500 uppercase tracking-wider block">E-mail</label>
                <input
                  type="email"
                  placeholder="email@exemplo.com"
                  value={formNovo.email}
                  onChange={(e) => setFormNovo({ ...formNovo, email: e.target.value })}
                  className="w-full border border-slate-200 rounded-xl p-3 text-xs md:text-sm outline-none focus:border-[#2E6CA8]"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-extrabold text-slate-500 uppercase tracking-wider block">Objetivo</label>
                <select
                  value={formNovo.objetivo}
                  onChange={(e) => setFormNovo({ ...formNovo, objetivo: e.target.value })}
                  className="w-full border border-slate-200 rounded-xl p-3 text-xs md:text-sm outline-none bg-white focus:border-[#2E6CA8] cursor-pointer font-medium"
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
                  className="w-full border border-slate-200 rounded-xl p-3 text-xs md:text-sm outline-none bg-white focus:border-[#2E6CA8] cursor-pointer font-medium"
                >
                  <option value="">Selecione...</option>
                  <option value="Até R$ 200 mil">Até R$ 200 mil</option>
                  <option value="R$ 200–350 mil">R$ 200–350 mil</option>
                  <option value="R$ 350–500 mil">R$ 350–500 mil</option>
                  <option value="Acima de R$ 500 mil">Acima de R$ 500 mil</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-extrabold text-slate-500 uppercase tracking-wider block">Localização Desejada</label>
                <input
                  type="text"
                  placeholder="Ex: Bairro / Cidade"
                  value={formNovo.local}
                  onChange={(e) => setFormNovo({ ...formNovo, local: e.target.value })}
                  className="w-full border border-slate-200 rounded-xl p-3 text-xs md:text-sm outline-none focus:border-[#2E6CA8]"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-extrabold text-slate-500 uppercase tracking-wider block">Origem do Lead</label>
                <select
                  value={formNovo.origem}
                  onChange={(e) => setFormNovo({ ...formNovo, origem: e.target.value })}
                  className="w-full border border-slate-200 rounded-xl p-3 text-xs md:text-sm outline-none bg-white focus:border-[#2E6CA8] cursor-pointer font-medium"
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
                  className="w-full border border-slate-200 rounded-xl p-3 text-xs md:text-sm outline-none bg-white disabled:bg-slate-50 disabled:text-slate-500 disabled:cursor-not-allowed focus:border-[#2E6CA8] cursor-pointer font-medium"
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
                onClick={() => setModalNovoOpen(false)}
                className="flex-1 bg-white hover:bg-slate-50 border border-slate-200 text-slate-500 font-bold py-2.5 rounded-xl text-xs md:text-sm transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleCriarCliente}
                className="flex-1 bg-[#1F4E79] hover:bg-[#2E6CA8] text-white font-bold py-2.5 rounded-xl text-xs md:text-sm transition-all shadow-sm"
              >
                Cadastrar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================
          MODAL: FINALIZAR PROCESSO
          ============================================================ */}
      {finalizarModalOpen && activeClient && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl animate-scaleIn space-y-4 max-h-[90vh] overflow-y-auto">
            
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-black text-[#1F4E79] text-base md:text-lg flex items-center gap-1.5">🏁 Finalizar Processo</h3>
                <p className="text-[11px] text-slate-400 font-medium">Finalize o processo de {activeClient.nome} no funil.</p>
              </div>
              <button
                onClick={() => setFinalizarModalOpen(false)}
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
                      setFinalizarStatus('sucesso')
                      setFinalizarMotivo('')
                    }}
                    className={`py-2 px-1.5 rounded-xl border text-[10px] md:text-xs font-bold transition-all ${
                      finalizarStatus === 'sucesso'
                        ? 'border-emerald-500 bg-emerald-50 text-emerald-700 font-extrabold shadow-xs'
                        : 'border-slate-100 hover:bg-slate-50 text-slate-600'
                    }`}
                  >
                    🎉 Ganho
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setFinalizarStatus('perdido')
                      setFinalizarMotivo('')
                      setCustomMotivo('')
                    }}
                    className={`py-2 px-1.5 rounded-xl border text-[10px] md:text-xs font-bold transition-all ${
                      finalizarStatus === 'perdido'
                        ? 'border-rose-500 bg-rose-50 text-rose-700 font-extrabold shadow-xs'
                        : 'border-slate-100 hover:bg-slate-50 text-slate-600'
                    }`}
                  >
                    ❌ Perdido
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setFinalizarStatus('interessado')
                      setFinalizarMotivo('')
                      setCustomMotivo('')
                    }}
                    className={`py-2 px-1.5 rounded-xl border text-[10px] md:text-xs font-bold transition-all ${
                      finalizarStatus === 'interessado'
                        ? 'border-indigo-500 bg-indigo-50 text-indigo-700 font-extrabold shadow-xs'
                        : 'border-slate-100 hover:bg-slate-50 text-slate-600'
                    }`}
                  >
                    📥 Interessado
                  </button>
                </div>
              </div>

              {/* DYNAMIC FORM IF SUCCESS & COMPRAR */}
              {finalizarStatus === 'sucesso' && activeClient.objetivo === 'Comprar' && (
                <div className="bg-emerald-50/50 border border-emerald-100 rounded-xl p-4 space-y-3">
                  <span className="text-[10px] font-extrabold text-emerald-700 uppercase tracking-wider block">Valores da Transação (Venda)</span>
                  
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Valor Procurado (Orçamento do Cliente)</label>
                    <input
                      type="number"
                      placeholder="Ex: 350000"
                      value={valProcurado}
                      onChange={(e) => setValProcurado(e.target.value)}
                      className="w-full border border-slate-200 rounded-xl p-2.5 text-xs outline-none focus:border-emerald-500 bg-white"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Valor Fechado (Valor Final da Compra)</label>
                    <input
                      type="number"
                      placeholder="Ex: 340000"
                      value={valFechado}
                      onChange={(e) => setValFechado(e.target.value)}
                      className="w-full border border-slate-200 rounded-xl p-2.5 text-xs outline-none focus:border-emerald-500 bg-white"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Valor Pedido (Original do Proprietário)</label>
                    <input
                      type="number"
                      placeholder="Ex: 360000"
                      value={valPedido}
                      onChange={(e) => setValPedido(e.target.value)}
                      className="w-full border border-slate-200 rounded-xl p-2.5 text-xs outline-none focus:border-emerald-500 bg-white"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Valor Vendido (Real Aceito pelo Proprietário)</label>
                    <input
                      type="number"
                      placeholder="Ex: 340000"
                      value={valVendido}
                      onChange={(e) => setValVendido(e.target.value)}
                      className="w-full border border-slate-200 rounded-xl p-2.5 text-xs outline-none focus:border-emerald-500 bg-white"
                    />
                  </div>
                </div>
              )}

              {/* DYNAMIC FORM IF LOST */}
              {finalizarStatus === 'perdido' && (
                <div className="space-y-3 bg-rose-50/30 border border-rose-100 rounded-xl p-4">
                  <div className="space-y-1">
                    <label className="text-xs font-extrabold text-slate-500 uppercase tracking-wider block">Motivo do Insucesso</label>
                    <select
                      value={finalizarMotivo}
                      onChange={(e) => {
                        setFinalizarMotivo(e.target.value)
                        if (e.target.value !== 'Outro') setCustomMotivo('')
                      }}
                      className="w-full border border-slate-200 rounded-xl p-2.5 text-xs outline-none bg-white cursor-pointer font-medium"
                    >
                      <option value="">Selecione o motivo da perda...</option>
                      {(activeClient.etapa === 9 || activeClient.etapa === 8) ? (
                        <>
                          <option value="Proposta recusada pelo vendedor">Proposta recusada pelo proprietário/vendedor</option>
                          <option value="Proposta recusada pelo comprador">Proposta recusada pelo comprador</option>
                          <option value="Sem acordo de valores (desconto insuficiente)">Sem acordo de valores (desconto insuficiente)</option>
                          <option value="Financiamento negado na negociação">Financiamento bancário reprovado</option>
                          <option value="Condições de pagamento inviabilizadas">Condições de pagamento inviabilizadas</option>
                          <option value="Outro">Outro motivo customizado...</option>
                        </>
                      ) : (activeClient.objetivo === 'Vender' || activeClient.objetivo === 'Deixar para alugar') ? (
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

                  {finalizarMotivo === 'Outro' && (
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
                onClick={() => setFinalizarModalOpen(false)}
                className="flex-1 bg-white hover:bg-slate-50 border border-slate-200 text-slate-500 font-bold py-2.5 rounded-xl text-xs md:text-sm transition-colors"
              >
                Voltar
              </button>
              <button
                onClick={handleFinalizarCliente}
                disabled={finalizarStatus === 'perdido' && !finalizarMotivo}
                className="flex-1 bg-[#1F4E79] hover:bg-[#2E6CA8] disabled:opacity-50 text-white font-bold py-2.5 rounded-xl text-xs md:text-sm transition-all shadow-sm"
              >
                Confirmar
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  )
}
