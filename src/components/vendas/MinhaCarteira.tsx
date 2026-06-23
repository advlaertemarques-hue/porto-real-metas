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
  const [checklistExpanded, setChecklistExpanded] = useState(true)

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

  const moveClientEtapa = async (clientId: string, newEtapa: number) => {
    const client = clientes.find(c => c.id === clientId)
    if (!client) return
    const params: Partial<VendasCliente> = { etapa: newEtapa }
    if (client.status_finalizacao === 'interessado') {
      params.status_finalizacao = null
    }
    const updated = await updateVendasCliente(clientId, params)
    if (updated) {
      setClientes(prev => prev.map(c => c.id === clientId ? updated : c))
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

  const myCorretor = corretores.find(co => co.user_id === user?.id)
  
  // KPI Owner ID
  const kpiOwnerId = user?.role === 'vendas'
    ? myCorretor?.id
    : (funilCorretorFiltro !== 'todos' && funilCorretorFiltro !== 'sem_atribuicao' ? funilCorretorFiltro : null)

  const isToday = (dateStr: string | Date | null) => {
    if (!dateStr) return false
    const d = new Date(dateStr)
    const today = new Date()
    return d.getDate() === today.getDate() &&
           d.getMonth() === today.getMonth() &&
           d.getFullYear() === today.getFullYear()
  }

  // Active leads
  const kpiLeads = clientes.filter(c => {
    const belongs = !kpiOwnerId || c.corretor_id === kpiOwnerId
    const isUnassigned = funilCorretorFiltro === 'sem_atribuicao' && !c.corretor_id
    const matchesBroker = belongs || (user?.role === 'superadmin' && isUnassigned)
    return matchesBroker && !c.finalizado && c.status_finalizacao !== 'interessado'
  })

  // Visits scheduled today
  const kpiVisitasHoje = clientes.filter(c => {
    const belongs = !kpiOwnerId || c.corretor_id === kpiOwnerId
    const isUnassigned = funilCorretorFiltro === 'sem_atribuicao' && !c.corretor_id
    const matchesBroker = belongs || (user?.role === 'superadmin' && isUnassigned)
    return matchesBroker && isToday(c.visita_agendada_em ?? null) && !c.finalizado
  })

  // Propostas (etapa === 3)
  const kpiPropostas = clientes.filter(c => {
    const belongs = !kpiOwnerId || c.corretor_id === kpiOwnerId
    const isUnassigned = funilCorretorFiltro === 'sem_atribuicao' && !c.corretor_id
    const matchesBroker = belongs || (user?.role === 'superadmin' && isUnassigned)
    return matchesBroker && c.etapa === 3 && !c.finalizado
  })

  // Vendas fechadas (finalizado && sucesso)
  const kpiVendasFechadas = clientes.filter(c => {
    const belongs = !kpiOwnerId || c.corretor_id === kpiOwnerId
    const isUnassigned = funilCorretorFiltro === 'sem_atribuicao' && !c.corretor_id
    const matchesBroker = belongs || (user?.role === 'superadmin' && isUnassigned)
    return matchesBroker && c.finalizado && c.status_finalizacao === 'sucesso'
  })

  // Filtered clients for current view
  const myClientsFiltered = clientes.filter(c => {
    // 1. Filter by view type
    if (sidebarView === 'ativos') {
      if (c.finalizado || c.status_finalizacao === 'interessado') return false
    } else if (sidebarView === 'interessados') {
      if (c.status_finalizacao !== 'interessado') return false
    } else if (sidebarView === 'finalizados') {
      if (!c.finalizado || c.status_finalizacao === 'interessado') return false
    }

    // 2. Filter by broker assignment
    if (user?.role === 'vendas') {
      return c.corretor_id === myCorretor?.id
    } else if (user?.role === 'superadmin') {
      if (funilCorretorFiltro !== 'todos') {
        if (funilCorretorFiltro === 'sem_atribuicao') {
          return !c.corretor_id
        }
        return c.corretor_id === funilCorretorFiltro
      }
    }
    return true
  })

  // Helper color tints for column headers E1 to E6
  const COLUMN_TINTS = [
    'bg-slate-100 border-slate-200 text-slate-800',
    'bg-blue-50 border-blue-100 text-blue-800',
    'bg-emerald-50 border-emerald-100 text-emerald-800',
    'bg-amber-50 border-amber-100 text-amber-800',
    'bg-purple-50 border-purple-100 text-purple-800',
    'bg-rose-50 border-rose-100 text-rose-800',
  ]

  const getEtapaProgress = (etapaIdx: number) => {
    const total = ETAPAS[etapaIdx]?.chk.length || 0
    const done = activeChecklist.filter(chk => chk.etapa === etapaIdx).length
    return { done, total }
  }

  return (
    <div className="w-full space-y-6 relative z-10">
      
      {/* 1. KPIs ribbon at the top */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="premium-card p-4 flex flex-col justify-between">
          <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">Leads Ativos</span>
          <span className="text-2xl font-black text-slate-800 mt-1.5">{kpiLeads.length}</span>
        </div>
        <div className="premium-card p-4 flex flex-col justify-between">
          <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">Visitas Hoje</span>
          <span className="text-2xl font-black text-slate-800 mt-1.5">{kpiVisitasHoje.length}</span>
        </div>
        <div className="premium-card p-4 flex flex-col justify-between">
          <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">Propostas</span>
          <span className="text-2xl font-black text-slate-800 mt-1.5">{kpiPropostas.length}</span>
        </div>
        <div className="premium-card p-4 flex flex-col justify-between">
          <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">Vendas Fechadas</span>
          <span className="text-2xl font-black text-emerald-600 mt-1.5">{kpiVendasFechadas.length}</span>
        </div>
      </div>

      {/* 2. Controls row (Filtros, corretores e novo cliente) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        {/* Toggle between Kanban and grids */}
        <div className="flex bg-slate-200/50 p-1 rounded-xl gap-0.5 self-start">
          <button
            onClick={() => { setSidebarView('ativos'); setActiveId(null); }}
            className={`px-4 py-2 rounded-lg text-[10px] font-extrabold uppercase tracking-wider transition-all ${
              sidebarView === 'ativos'
                ? 'bg-white text-slate-800 shadow-xs'
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            💼 Funil Ativo
          </button>
          <button
            onClick={() => { setSidebarView('interessados'); setActiveId(null); }}
            className={`px-4 py-2 rounded-lg text-[10px] font-extrabold uppercase tracking-wider transition-all ${
              sidebarView === 'interessados'
                ? 'bg-white text-slate-800 shadow-xs'
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            ⭐ Interessados
          </button>
          <button
            onClick={() => { setSidebarView('finalizados'); setActiveId(null); }}
            className={`px-4 py-2 rounded-lg text-[10px] font-extrabold uppercase tracking-wider transition-all ${
              sidebarView === 'finalizados'
                ? 'bg-white text-slate-800 shadow-xs'
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            🏁 Arquivados
          </button>
        </div>

        {/* Right side actions */}
        <div className="flex items-center gap-3 self-end w-full sm:w-auto">
          {user?.role === 'superadmin' && (
            <select
              value={funilCorretorFiltro}
              onChange={(e) => setFunilCorretorFiltro(e.target.value)}
              className="border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold outline-none focus:border-[#eb3238] bg-white cursor-pointer text-slate-700"
            >
              <option value="todos">Todos os corretores</option>
              <option value="sem_atribuicao">Sem corretor</option>
              {corretores.map(co => (
                <option key={co.id} value={co.id}>{co.nome}</option>
              ))}
            </select>
          )}

          <button
            onClick={() => setModalNovoOpen(true)}
            className="flex items-center justify-center gap-2 bg-[#eb3238] hover:bg-[#eb3238]/90 text-white px-4 py-2 rounded-xl text-xs font-bold shadow-xs transition-colors w-full sm:w-auto flex-shrink-0"
          >
            <Plus size={14} /> Novo Cliente
          </button>
        </div>
      </div>

      {/* 3. Main Views Grid/Kanban */}
      <div className="w-full">
        {sidebarView === 'ativos' ? (
          /* KANBAN BOARD E1 - E6 */
          <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-thin">
            {ETAPAS.slice(0, 6).map((etapa, etapaIdx) => {
              const columnClients = myClientsFiltered.filter(c => c.etapa === etapaIdx)
              
              return (
                <div
                  key={etapaIdx}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={(e) => {
                    const clientId = e.dataTransfer.getData('clientId')
                    if (clientId) moveClientEtapa(clientId, etapaIdx)
                  }}
                  className="w-72 flex-shrink-0 flex flex-col bg-slate-100/40 border border-slate-200/50 rounded-2xl p-3 min-h-[500px]"
                >
                  {/* Column Header */}
                  <div className={`p-2.5 rounded-xl border border-hairline font-bold flex items-center justify-between mb-3 shadow-xs ${COLUMN_TINTS[etapaIdx]}`}>
                    <span className="text-[10px] uppercase tracking-wider truncate mr-2">{etapa.nome}</span>
                    <span className="text-[10px] px-2 py-0.5 bg-white/70 rounded-full font-black flex-shrink-0">{columnClients.length}</span>
                  </div>

                  {/* Cards container */}
                  <div className="flex-1 overflow-y-auto space-y-2.5 pb-8 min-h-[400px]">
                    {columnClients.length === 0 ? (
                      <div className="border border-dashed border-slate-200 rounded-xl p-4 text-center text-[10px] text-slate-400 font-semibold py-8">
                        Nenhum lead aqui
                      </div>
                    ) : (
                      columnClients.map(c => {
                        const isSelected = c.id === activeId
                        const tc = TEMP_CFG[c.temp as keyof typeof TEMP_CFG] || TEMP_CFG.quente
                        const perf = c.perfil ? PERFIS[c.perfil] : null

                        return (
                          <div
                            key={c.id}
                            draggable={true}
                            onDragStart={(e) => e.dataTransfer.setData('clientId', c.id)}
                            onClick={() => selectClient(c.id)}
                            className={`p-3.5 border rounded-xl bg-white shadow-xs cursor-grab active:cursor-grabbing hover:border-slate-300 transition-all ${
                              isSelected 
                                ? 'ring-2 ring-[#eb3238] border-transparent' 
                                : 'border-slate-200/80'
                            }`}
                          >
                            <div className="flex justify-between items-start gap-2 mb-1.5">
                              <span className="font-extrabold text-[12px] text-slate-800 line-clamp-1 heading-premium">
                                {c.nome}
                              </span>
                              {c.expressa && (
                                <span className="bg-[#fbf1e3] text-[#c77d2e] text-[8px] px-1.5 py-0.5 rounded font-black tracking-wider uppercase flex-shrink-0">Expressa</span>
                              )}
                            </div>

                            {/* Tags */}
                            <div className="flex flex-wrap items-center gap-1 mt-2">
                              <span className="flex items-center gap-1 text-[9px] font-bold text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">
                                <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: tc.cor }} />
                                {tc.rotulo}
                              </span>
                              {perf && (
                                <span className="bg-[#D6E4F0]/60 text-[#1F4E79] text-[9px] px-1.5 py-0.5 rounded font-black flex items-center gap-0.5">
                                  <span>{perf.emo}</span>
                                  <span>{perf.nome}</span>
                                </span>
                              )}
                              {c.em_captacao && (
                                <span className="bg-rose-50 text-[#eb3238] text-[9px] px-1.5 py-0.5 rounded font-black">
                                  🔍 Captação
                                </span>
                              )}
                            </div>

                            {/* Proxima Acao */}
                            {c.proxima_acao && (
                              <div className="mt-2.5 pt-2 border-t border-slate-100 flex items-start gap-1 text-[9px] text-slate-500">
                                <span className="text-slate-400 mt-0.5">📅</span>
                                <span className="line-clamp-1 font-medium">{c.proxima_acao}</span>
                              </div>
                            )}
                          </div>
                        )
                      })
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        ) : (
          /* INTERESTED AND ARCHIVED GRIDS */
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {myClientsFiltered.length === 0 ? (
              <div className="col-span-full border border-dashed border-slate-200 rounded-2xl p-12 text-center text-xs text-slate-400 font-semibold bg-white/40">
                Nenhum lead nesta lista
              </div>
            ) : (
              myClientsFiltered.map(c => {
                const isSelected = c.id === activeId
                const tc = TEMP_CFG[c.temp as keyof typeof TEMP_CFG] || TEMP_CFG.quente
                const perf = c.perfil ? PERFIS[c.perfil] : null

                return (
                  <div
                    key={c.id}
                    onClick={() => selectClient(c.id)}
                    className={`p-4 border rounded-xl bg-white shadow-xs cursor-pointer hover:border-slate-300 transition-all ${
                      isSelected 
                        ? 'ring-2 ring-[#eb3238] border-transparent' 
                        : 'border-slate-200/80'
                    }`}
                  >
                    <div className="flex justify-between items-start gap-2 mb-2">
                      <span className="font-extrabold text-xs text-slate-800 line-clamp-1 heading-premium">
                        {c.nome}
                      </span>
                      {c.finalizado && (
                        <span className={`text-[8px] px-1.5 py-0.5 rounded font-black tracking-wider uppercase flex-shrink-0 ${
                          c.status_finalizacao === 'sucesso' 
                            ? 'bg-emerald-50 text-emerald-600' 
                            : 'bg-rose-50 text-[#eb3238]'
                        }`}>
                          {c.status_finalizacao === 'sucesso' ? 'Ganho' : 'Perdido'}
                        </span>
                      )}
                    </div>

                    <div className="text-[10px] text-slate-500 font-semibold mb-2">
                      {c.contato} · Etapa: {ETAPAS[c.etapa]?.nome}
                    </div>

                    {/* Tags */}
                    <div className="flex flex-wrap items-center gap-1.5 mt-2">
                      <span className="flex items-center gap-1 text-[9px] font-bold text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">
                        <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: tc.cor }} />
                        {tc.rotulo}
                      </span>
                      {perf && (
                        <span className="bg-[#D6E4F0]/60 text-[#1F4E79] text-[9px] px-1.5 py-0.5 rounded font-black">
                          {perf.emo} {perf.nome}
                        </span>
                      )}
                    </div>

                    {/* Specific details for Interessados */}
                    {sidebarView === 'interessados' && (
                      <div className="mt-3.5 space-y-1 text-[9px] text-slate-600 bg-slate-50 border border-slate-100 rounded-lg p-2 font-medium">
                        {c.local && <div>📍 <b>Local:</b> {c.local}</div>}
                        {c.faixa && <div>💰 <b>Faixa:</b> {c.faixa}</div>}
                        {c.preferencia && <div className="line-clamp-1">🔑 <b>Pref:</b> {c.preferencia}</div>}
                      </div>
                    )}
                  </div>
                )
              })
            )}
          </div>
        )}
      </div>

      {/* 4. Slide-over details drawer */}
      {activeClient && (
        <>
          <div 
            className="fixed inset-0 bg-slate-900/35 backdrop-blur-xs z-40 transition-opacity"
            onClick={() => setActiveId(null)}
          />
          <div className="fixed inset-y-0 right-0 w-full max-w-2xl bg-[#FAF9F7] shadow-2xl border-l border-slate-200/80 z-50 flex flex-col h-full overflow-hidden animate-slide-in">
            {/* Drawer Header */}
            <div className="p-4 border-b border-slate-200/80 bg-white flex items-center justify-between flex-shrink-0">
              <div className="flex items-center gap-2">
                <button 
                  onClick={() => setActiveId(null)}
                  className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 transition-colors"
                  title="Fechar"
                >
                  <X size={18} />
                </button>
                <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">Detalhes do Lead</span>
              </div>
              
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setFichaOpen(true)}
                  className="bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5"
                >
                  📇 Ficha Completa
                </button>
                <span className="bg-slate-100 text-slate-600 text-xs font-bold px-3 py-1.5 rounded-xl flex items-center gap-1.5 border border-slate-200">
                  {RESP_EMO[RESP[activeClient.etapa]]} {RESP[activeClient.etapa]}
                </span>
              </div>
            </div>

            {/* Scrollable details container */}
            <div className="flex-1 overflow-y-auto p-5 space-y-5">
              
              {/* Card 1: Header Identity */}
              <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-4">
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h2 className="text-lg md:text-xl font-black text-slate-800 heading-premium">{activeClient.nome}</h2>
                    {activeClient.expressa && (
                      <span className="bg-[#fbf1e3] text-[#c77d2e] text-[8.5px] font-black px-2 py-0.5 rounded tracking-wider uppercase">VIA EXPRESSA</span>
                    )}
                    {activeClient.em_captacao && (
                      <span className="bg-rose-50 text-[#eb3238] text-[8.5px] font-black px-2 py-0.5 rounded tracking-wider uppercase">EM CAPTAÇÃO</span>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-500 mt-1 font-medium">
                    {activeClient.contato} · Origem: <span className="font-semibold text-slate-600">{activeClient.origem}</span>
                    {activeClient.valor > 0 && ` · Imóvel-alvo: ${fmtBRL(activeClient.valor)}`}
                  </p>
                </div>

                {/* Attributes dropdowns styled as premium pills */}
                <div className="flex flex-wrap items-center gap-2.5 pt-3.5 border-t border-slate-100">
                  {/* Perfil Dominante */}
                  <div className="flex items-center gap-1 bg-[#EEF4FA] border border-[#D6E4F0] rounded-xl px-2.5 py-1 text-[11px] font-bold text-[#1F4E79]">
                    <span>🧠 Perfil:</span>
                    <select
                      value={activeClient.perfil || ''}
                      onChange={async (e) => {
                        const newPerf = e.target.value || null
                        const updated = await updateVendasCliente(activeClient.id, { perfil: newPerf })
                        if (updated) {
                          setClientes(prev => prev.map(c => c.id === activeClient.id ? updated : c))
                        }
                      }}
                      className="bg-transparent border-none outline-none cursor-pointer font-black text-[#1F4E79]"
                    >
                      <option value="">Nenhum</option>
                      <option value="analitico">Analítico</option>
                      <option value="controlador">Controlador</option>
                      <option value="apoiador">Apoiador</option>
                      <option value="catalisador">Catalisador</option>
                    </select>
                  </div>

                  {/* Perfil Secundario */}
                  <div className="flex items-center gap-1 bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1 text-[11px] font-bold text-slate-600">
                    <span>🥈 Secundário:</span>
                    <select
                      value={activeClient.perfil_secundario || ''}
                      onChange={async (e) => {
                        const newPerfSec = e.target.value || null
                        const updated = await updateVendasCliente(activeClient.id, { perfil_secundario: newPerfSec })
                        if (updated) {
                          setClientes(prev => prev.map(c => c.id === activeClient.id ? updated : c))
                        }
                      }}
                      className="bg-transparent border-none outline-none cursor-pointer font-black text-slate-600"
                    >
                      <option value="">Nenhum</option>
                      <option value="analitico">Analítico</option>
                      <option value="controlador">Controlador</option>
                      <option value="apoiador">Apoiador</option>
                      <option value="catalisador">Catalisador</option>
                    </select>
                  </div>

                  {/* Temperatura */}
                  <div className="flex items-center gap-1 bg-white border border-slate-200 rounded-xl px-2.5 py-1 text-[11px] font-bold text-slate-700">
                    <span>🔥 Temp:</span>
                    <select
                      value={activeClient.temp}
                      onChange={(e) => setClientTemp(e.target.value as any)}
                      className="bg-transparent border-none outline-none cursor-pointer font-black text-slate-700"
                    >
                      <option value="quente">Quente</option>
                      <option value="morno">Morno</option>
                      <option value="frio">Frio</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Card 2: Lembrete / Próxima Ação */}
              <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-4">
                <h3 className="text-xs font-extrabold uppercase tracking-widest text-[#1F4E79] flex items-center gap-2">
                  <ClipboardList size={16} className="text-[#1F4E79]" />
                  Próxima Ação / Lembrete
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-[1.5fr_1fr] gap-4">
                  <div className="space-y-1">
                    <label className="text-[9px] font-extrabold text-slate-400 uppercase tracking-wider block">O que fazer a seguir?</label>
                    <input
                      type="text"
                      placeholder="Ex: Enviar catálogo de imóveis no WhatsApp..."
                      key={`pa_${activeClient.id}`}
                      defaultValue={activeClient.proxima_acao || ''}
                      onBlur={(e) => setCrmField('proxima_acao', e.target.value.trim() || null)}
                      className="w-full text-xs border border-slate-200 rounded-xl p-2.5 outline-none focus:border-[#eb3238] bg-slate-50/50"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] font-extrabold text-slate-400 uppercase tracking-wider block">Quando fazer?</label>
                    <input
                      type="datetime-local"
                      key={`pad_${activeClient.id}`}
                      defaultValue={activeClient.proxima_acao_data ? new Date(new Date(activeClient.proxima_acao_data).getTime() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 16) : ''}
                      onChange={(e) => setCrmField('proxima_acao_data', e.target.value || null)}
                      className="w-full text-xs border border-slate-200 rounded-xl p-2.5 outline-none focus:border-[#eb3238] bg-slate-50/50"
                    />
                  </div>
                </div>
              </div>

              {/* Card 3: Stepper Comercial */}
              <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-4">
                <h3 className="text-xs font-extrabold uppercase tracking-widest text-[#1F4E79] flex items-center gap-2">
                  <span className="w-5 h-5 bg-[#1F4E79] text-white rounded-md flex items-center justify-center text-[10px]">1</span>
                  Funil Comercial (Etapa)
                </h3>

                <div className="grid grid-cols-2 gap-2">
                  {ETAPAS.slice(0, 6).map((etapa, idx) => {
                    const isDone = idx < activeClient.etapa
                    const isCurrent = idx === activeClient.etapa
                    const { done, total } = getEtapaProgress(idx)

                    let cls = 'border-slate-200 text-slate-500 bg-white hover:border-slate-300 hover:bg-slate-50/50 font-medium'
                    if (isDone) cls = 'border-emerald-200 bg-emerald-50/40 text-emerald-700 font-bold hover:bg-emerald-100/40 hover:border-emerald-300'
                    if (isCurrent) cls = 'border-[#eb3238] bg-rose-50/60 text-[#eb3238] ring-2 ring-red-100 font-black'

                    return (
                      <button
                        key={idx}
                        onClick={() => changeEtapa(idx)}
                        className={`flex flex-col items-start gap-1 p-2.5 border rounded-xl text-left transition-all text-xs ${cls}`}
                      >
                        <div className="flex items-center gap-1.5 w-full">
                          <span
                            className="w-2 h-2 rounded-full flex-shrink-0"
                            style={{ backgroundColor: RESP_COR[RESP[idx]] || '#94a3b8' }}
                            title={`Responsável: ${RESP[idx]}`}
                          ></span>
                          <span className="font-extrabold truncate">{etapa.nome}</span>
                          {isDone && <span className="ml-auto text-emerald-600 font-black">✓</span>}
                        </div>
                        <span className="text-[9px] font-semibold text-slate-400 mt-0.5">
                          {done} de {total} concluídos
                        </span>
                      </button>
                    )
                  })}
                </div>

                {/* Legenda de responsáveis para 9 etapas */}
                <div className="flex flex-col gap-1.5 pt-3 text-[9px] text-slate-400 border-t border-slate-100 font-bold">
                  <div className="flex flex-wrap gap-x-4 gap-y-1">
                    <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full" style={{ backgroundColor: '#1F4E79' }}></span> Andressa: Triagem (E1)</span>
                    <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full" style={{ backgroundColor: '#2E6CA8' }}></span> Andressa+Corretor: Atendimento (E2), Fechamento (E6)</span>
                    <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full" style={{ backgroundColor: '#1f9d6b' }}></span> Corretor: Visita (E3), Proposta (E4), Negociação (E5)</span>
                    <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full" style={{ backgroundColor: '#c77d2e' }}></span> Pós-venda: Pós-venda (E7), Depoimento (E8), Indicação (E9)</span>
                  </div>
                  <span className="text-[#6b4fbb] font-black">🤖 Lais (IA) apoia o 1º contato e a via expressa</span>
                </div>

                {/* Finalizar Button */}
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
                    className="w-full flex items-center justify-center gap-1.5 py-2.5 bg-rose-50 border border-rose-200 hover:bg-rose-100 hover:border-rose-300 text-[#eb3238] rounded-xl text-xs font-black transition-all cursor-pointer shadow-xs"
                  >
                    🏁 Finalizar Atendimento (Comprar / Arquivar)
                  </button>
                )}

                {/* Finalizado Box */}
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

                {/* Pós-Venda (E7-E9) inside details if won */}
                {activeClient.status_finalizacao === 'sucesso' && (
                  <div className="pt-4 border-t border-slate-100 space-y-2.5">
                    <div className="text-[10px] font-black text-[#c77d2e] uppercase tracking-wider">Acompanhamento de Pós-Venda (E7-E9)</div>
                    <div className="grid grid-cols-3 gap-2">
                      {ETAPAS.slice(6, 9).map((etapa, idx) => {
                        const stepIdx = idx + 6
                        const isDone = stepIdx < activeClient.etapa
                        const isCurrent = stepIdx === activeClient.etapa
                        const { done, total } = getEtapaProgress(stepIdx)

                        let cls = 'border-slate-200 text-slate-500 bg-white hover:bg-slate-50/50'
                        if (isDone) cls = 'border-amber-200 bg-amber-50/40 text-amber-800 font-bold hover:bg-amber-100/40'
                        if (isCurrent) cls = 'border-[#c77d2e] bg-amber-50/60 text-[#c77d2e] ring-2 ring-amber-100 font-black'

                        return (
                          <button
                            key={stepIdx}
                            onClick={() => changeEtapa(stepIdx)}
                            className={`flex flex-col items-start gap-1 p-2 border rounded-xl text-left transition-all text-[11px] ${cls}`}
                          >
                            <span className="font-extrabold truncate">{etapa.nome}</span>
                            <span className="text-[9px] font-semibold text-slate-400">
                              {done} de {total}
                            </span>
                          </button>
                        )
                      })}
                    </div>
                  </div>
                )}
              </div>

              {/* Grid block for actions and checklist */}
              <div className="space-y-5">
                
                {/* Dynamic Stage Actions */}

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
            <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-4">
              <div 
                className="flex justify-between items-center cursor-pointer select-none" 
                onClick={() => setChecklistExpanded(!checklistExpanded)}
              >
                <h3 className="text-xs font-extrabold uppercase tracking-widest text-[#1F4E79] flex items-center gap-2">
                  <span className="w-5 h-5 bg-[#1F4E79] text-white rounded-md flex items-center justify-center text-[10px]">2</span>
                  Checklist — {ETAPAS[activeClient.etapa]?.nome}
                </h3>
                <span className="text-xs text-slate-400 font-semibold">
                  {checklistExpanded ? 'Recolher ▲' : 'Expandir ▼'}
                </span>
              </div>

              {checklistExpanded && (() => {
                const totalItens = ETAPAS[activeClient.etapa]?.chk.length || 0
                const concluidos = activeChecklist.filter(chk => chk.etapa === activeClient.etapa).length
                const pct = totalItens ? Math.round((concluidos / totalItens) * 100) : 0

                return (
                  <div className="space-y-4">
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

            {/* Dossiê & Resumo do Status */}
            <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-4">
              <h3 className="text-xs font-extrabold uppercase tracking-widest text-[#eb3238] flex items-center gap-2">
                <span className="w-5 h-5 bg-[#eb3238] text-white rounded-md flex items-center justify-center text-[10px]">3</span>
                Dossiê & Playbook do Perfil
              </h3>
              
              <div className="space-y-4">
                <div className="bg-[#EEF4FA]/50 border border-[#D6E4F0] rounded-xl p-4 space-y-3 text-xs text-slate-700 leading-relaxed shadow-xs font-medium">
                  <p>
                    <b>{activeClient.nome}</b> está atualmente na <b>etapa {activeClient.etapa + 1}</b> — <span className="font-extrabold text-[#eb3238]">{ETAPAS[activeClient.etapa]?.nome}</span>.
                  </p>
                  <p>
                    Temperatura: <span className="font-bold uppercase" style={{ color: (TEMP_CFG as any)[activeClient.temp]?.cor }}>{(TEMP_CFG as any)[activeClient.temp]?.rotulo}</span>.
                    {activeClient.perfil ? (
                      <span> Perfil: <b className="text-[#1F4E79]">{PERFIS[activeClient.perfil].nome} {PERFIS[activeClient.perfil].emo}</b>
                        {activeClient.perfil_secundario && PERFIS[activeClient.perfil_secundario] && (
                          <> / Secundário: <b className="text-slate-500">{PERFIS[activeClient.perfil_secundario].nome} {PERFIS[activeClient.perfil_secundario].emo}</b></>
                        )}.
                      </span>
                    ) : (
                      <span> Perfil ainda pendente de diagnóstico.</span>
                    )}
                  </p>
                </div>

                {/* Playbook se perfil mapeado */}
                {activeClient.perfil && (
                  <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3">
                    <h4 className="text-xs font-extrabold text-[#1F4E79] uppercase tracking-wide flex items-center gap-1.5">
                      {PERFIS[activeClient.perfil].emo} Playbook: O que Falar com este Perfil
                    </h4>
                    <ul className="space-y-1.5 text-xs text-slate-700 font-semibold">
                      {PERFIS[activeClient.perfil].estrategia.slice(0, 4).map((est, eIdx) => (
                        <li key={eIdx} className="flex items-start gap-2">
                          <span className="text-emerald-500 font-bold">✓</span>
                          <span>{est}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>

            {/* Ações da conversa / Anotações */}
            <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-4">
              <h3 className="text-xs font-extrabold uppercase tracking-widest text-[#1F4E79] flex items-center gap-2">
                Anotações da Conversa
              </h3>

              <div className="space-y-3">
                <textarea
                  value={novaNotaTxt}
                  onChange={(e) => setNovaNotaTxt(e.target.value)}
                  placeholder="O que ficou acertado nesta conversa?"
                  className="w-full text-xs border border-slate-200 rounded-xl p-3 focus:outline-none focus:border-[#eb3238] min-h-[70px] resize-y bg-slate-50/50"
                ></textarea>
                
                <div className="flex items-center justify-between gap-3">
                  <button
                    onClick={handleAddNota}
                    className="bg-[#eb3238] hover:bg-[#eb3238]/90 text-white text-xs font-bold px-4 py-2 rounded-xl transition-all shadow-xs"
                  >
                    + Adicionar Nota
                  </button>
                  <span className="text-[9px] text-slate-400 font-bold">
                    Etapa: <b>{ETAPAS[activeClient.etapa]?.nome}</b>
                  </span>
                </div>
              </div>

              {/* Notes Feed */}
              <div className="space-y-3 pt-2 max-h-[300px] overflow-y-auto">
                {activeNotas.length === 0 ? (
                  <div className="text-slate-400 text-xs italic py-2 text-center">Nenhuma nota cadastrada.</div>
                ) : (
                  activeNotas.slice().reverse().map(nota => (
                    <div key={nota.id} className="flex gap-4 border-l-2 border-slate-200 pl-4 py-1 relative">
                      <div className="absolute -left-[5px] top-2.5 w-2 h-2 rounded-full bg-[#eb3238]"></div>
                      <div className="flex-1 space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-black text-slate-400">{nota.data}</span>
                          <span className="bg-[#fbf1e3] text-[#c77d2e] text-[9px] font-bold px-2 py-0.5 rounded-full">{nota.etapa}</span>
                        </div>
                        <p className="text-xs text-slate-700 whitespace-pre-wrap leading-relaxed">{nota.texto}</p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      </>
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
