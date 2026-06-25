'use client'

import { useState, useEffect, useRef } from 'react'
import { VendasCliente, VendasCorretor, VendasEquipe, User, VendasClienteNota, VendasClienteChecklist } from '@/lib/types'
import GuiasDeApoio from './GuiasDeApoio'
import NovoClienteModal, { FormNovoState } from './NovoClienteModal'
import FinalizarModal, { FinalizarStatus } from './FinalizarModal'
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
  fmtBRL,
  FAIXAS_VALOR,
  TIPOS_IMOVEL
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
  Share2,
  ArrowLeft
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
  const [formNovo, setFormNovo] = useState<FormNovoState>({
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
  const [finalizarStatus, setFinalizarStatus] = useState<FinalizarStatus>('sucesso')
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
  const [selectedDetailTab, setSelectedDetailTab] = useState<number>(0)
  const scrollContainerRef = useRef<HTMLDivElement>(null)
  const [copiedText, setCopiedText] = useState<string | null>(null)

  const handleCopyText = (text: string, key: string) => {
    navigator.clipboard.writeText(text)
    setCopiedText(key)
    setTimeout(() => {
      setCopiedText(null)
    }, 1500)
  }

  // Filters for Interessados tab
  const [filterLocal, setFilterLocal] = useState('')
  const [filterPreco, setFilterPreco] = useState('')
  const [filterPref, setFilterPref] = useState('')

  const activeClient = clientes.find(c => c.id === activeId)

  // Inicializa a aba na etapa do cliente APENAS ao abrir um cliente diferente.
  // As abas de baixo são independentes do funil/kanban: clicar nos botões de
  // etapa (stepper do topo) não move mais a aba selecionada aqui.
  useEffect(() => {
    if (activeClient) {
      setSelectedDetailTab(Math.min(activeClient.etapa, 5))
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeClient?.id])

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
    const originalEtapa = client.etapa
    const originalStatusFin = client.status_finalizacao
    
    // 1. Optimistic Update (Immediate)
    setClientes(prev => prev.map(c => c.id === clientId ? { ...c, etapa: newEtapa, status_finalizacao: c.status_finalizacao === 'interessado' ? null : c.status_finalizacao } : c))
    
    // 2. Background API Call
    const params: Partial<VendasCliente> = { etapa: newEtapa }
    if (client.status_finalizacao === 'interessado') {
      params.status_finalizacao = null
    }
    try {
      const updated = await updateVendasCliente(clientId, params)
      if (!updated) {
        setClientes(prev => prev.map(c => c.id === clientId ? { ...c, etapa: originalEtapa, status_finalizacao: originalStatusFin } : c))
      } else {
        setClientes(prev => prev.map(c => c.id === clientId ? updated : c))
      }
    } catch (err) {
      setClientes(prev => prev.map(c => c.id === clientId ? { ...c, etapa: originalEtapa, status_finalizacao: originalStatusFin } : c))
    }
  }

  const toggleChecklist = async (itemIndex: number, overrideEtapa?: number) => {
    if (!activeId || !activeClient) return
    const targetEtapa = overrideEtapa !== undefined ? overrideEtapa : activeClient.etapa
    const isChecked = activeChecklist.some(chk => chk.etapa === targetEtapa && chk.item_index === itemIndex)
    const success = await toggleVendasChecklistItem(activeId, targetEtapa, itemIndex, !isChecked)
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
    const client = clientes.find(c => c.id === activeId)
    if (!client) return
    const originalValue = client[field as keyof VendasCliente]
    
    // 1. Optimistic Update
    setClientes(prev => prev.map(c => c.id === activeId ? { ...c, [field]: value } : c))
    
    // 2. Background API Call
    try {
      const updated = await updateVendasCliente(activeId, { [field]: value })
      if (!updated) {
        setClientes(prev => prev.map(c => c.id === activeId ? { ...c, [field]: originalValue } : c))
      }
    } catch (err) {
      setClientes(prev => prev.map(c => c.id === activeId ? { ...c, [field]: originalValue } : c))
    }
  }

  const handleDragOverContainer = (e: React.DragEvent<HTMLDivElement>) => {
    if (!scrollContainerRef.current) return
    const container = scrollContainerRef.current
    const rect = container.getBoundingClientRect()
    const x = e.clientX - rect.left
    
    const scrollSpeed = 16
    const edgeThreshold = 90
    
    if (x > rect.width - edgeThreshold) {
      container.scrollLeft += scrollSpeed
    } else if (x < edgeThreshold) {
      container.scrollLeft -= scrollSpeed
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
      etapa: ETAPAS[activeClient.etapa]?.nome || 'Triagem',
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
      params.valor_fechado = Number(valFechado) || 0
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
      
      // Apply filters for Interessados criteria
      if (filterLocal && !c.local?.toLowerCase().includes(filterLocal.toLowerCase())) {
        return false
      }
      if (filterPreco && c.faixa !== filterPreco) {
        return false
      }
      if (filterPref && !c.preferencia?.toLowerCase().includes(filterPref.toLowerCase())) {
        return false
      }
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

  const renderChecklist = (isMobile: boolean = false) => {
    if (!activeClient) return null
    const chkEtapaIndex = selectedDetailTab < 6 ? selectedDetailTab : Math.min(activeClient.etapa, 5)
    const totalItens = ETAPAS[chkEtapaIndex]?.chk.length || 0
    const concluidos = activeChecklist.filter(chk => chk.etapa === chkEtapaIndex).length
    const pct = totalItens ? Math.round((concluidos / totalItens) * 100) : 0

    return (
      <div className={`space-y-4 ${isMobile ? 'bg-white border border-slate-200 rounded-2xl p-5 shadow-xs' : 'flex-1 flex flex-col'}`}>
        {!isMobile && (
          <div className="mb-2">
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block mb-1">Passos da Etapa</span>
            <h3 className="text-sm font-black text-[#33415C] flex items-center gap-1.5">
              📋 Checklist — {ETAPAS[chkEtapaIndex]?.nome}
            </h3>
          </div>
        )}
        {isMobile && (
          <h3 className="text-xs font-extrabold uppercase tracking-widest text-[#33415C] mb-3 flex items-center gap-2">
            📋 Checklist — {ETAPAS[chkEtapaIndex]?.nome}
          </h3>
        )}

        <div className="flex items-center gap-3 bg-slate-50 border border-slate-100 p-3 rounded-xl">
          <div className="flex-1 bg-slate-200 h-2 rounded-full overflow-hidden">
            <div className="h-full bg-emerald-500 transition-all duration-300" style={{ width: `${pct}%` }}></div>
          </div>
          <span className="text-xs font-black text-emerald-600 w-10 text-right">{pct}%</span>
        </div>

        <div className={`space-y-2 ${isMobile ? '' : 'overflow-y-auto flex-1 pr-1 scrollbar-thin'}`} style={isMobile ? {} : { maxHeight: 'calc(90vh - 240px)' }}>
          {ETAPAS[chkEtapaIndex]?.chk.map((item, idx) => {
            const isChecked = activeChecklist.some(chk => chk.etapa === chkEtapaIndex && chk.item_index === idx)
            return (
              <div
                key={idx}
                onClick={() => toggleChecklist(idx, chkEtapaIndex)}
                className={`flex items-start gap-2.5 p-3 border rounded-xl cursor-pointer transition-all ${
                  isChecked
                    ? 'border-emerald-100 bg-emerald-50/30 text-slate-405'
                    : 'border-slate-100 hover:border-slate-200 hover:bg-slate-50 bg-white text-slate-800'
                }`}
              >
                <input
                  type="checkbox"
                  checked={isChecked}
                  readOnly
                  className="rounded text-emerald-600 focus:ring-emerald-500 h-4 w-4 mt-0.5 cursor-pointer flex-shrink-0"
                />
                <span className={`text-[11px] leading-relaxed ${isChecked ? 'line-through text-slate-450' : 'font-semibold'}`}>
                  {item}
                </span>
              </div>
            )
          })}
        </div>
      </div>
    )
  }

  const renderNotes = (isMobile: boolean = false) => {
    if (!activeClient) return null
    return (
      <div className={`space-y-4 ${isMobile ? 'bg-white border border-slate-200 rounded-2xl p-5 shadow-xs' : 'flex-1 flex flex-col'}`}>
        {!isMobile && (
          <div className="mb-2">
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block mb-1">Anotações</span>
            <h3 className="text-sm font-black text-[#33415C] flex items-center gap-1.5">
              ✍️ Histórico do Lead
            </h3>
          </div>
        )}
        {isMobile && (
          <h3 className="text-xs font-extrabold uppercase tracking-widest text-[#33415C] mb-3 flex items-center gap-2">
            ✍️ Histórico do Lead
          </h3>
        )}

        <div className="space-y-3 flex-1 flex flex-col">
          <textarea
            value={novaNotaTxt}
            onChange={(e) => setNovaNotaTxt(e.target.value)}
            placeholder="O que ficou acertado nesta conversa?"
            className="w-full text-xs border border-slate-200 rounded-xl p-3 focus:outline-none focus:border-[#eb3238] min-h-[90px] resize-none bg-slate-50/50"
          />
          
          <button
            onClick={handleAddNota}
            className="bg-[#eb3238] hover:bg-[#eb3238]/90 text-white text-xs font-bold px-4 py-2.5 rounded-xl transition-all shadow-xs w-full cursor-pointer text-center flex-shrink-0"
          >
            + Adicionar Nota
          </button>

          {/* Notes Feed */}
          <div className={`space-y-3 pt-2 overflow-y-auto ${isMobile ? '' : 'flex-1 pr-1 scrollbar-thin'}`} style={isMobile ? {} : { maxHeight: 'calc(90vh - 350px)' }}>
            {activeNotas.length === 0 ? (
              <div className="text-slate-400 text-xs italic py-2 text-center">Nenhuma nota cadastrada.</div>
            ) : (
              activeNotas.slice().reverse().map(nota => (
                <div key={nota.id} className="flex gap-3 border-l-2 border-slate-200 pl-3.5 py-1 relative">
                  <div className="absolute -left-[5px] top-2.5 w-2 h-2 rounded-full bg-[#eb3238]"></div>
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-[9px] font-black text-slate-400">{nota.data}</span>
                      <span className="bg-[#fbf1e3] text-[#c77d2e] text-[8px] font-bold px-1.5 py-0.5 rounded-full">{nota.etapa}</span>
                    </div>
                    <p className="text-[11px] text-slate-700 whitespace-pre-wrap leading-relaxed font-medium">{nota.texto}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="w-full space-y-6 relative z-10">
      <>
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
        <div className="flex bg-slate-200/50 p-1.5 rounded-2xl gap-1 self-start border border-slate-350/20 shadow-xs">
          <button
            onClick={() => { setSidebarView('ativos'); setActiveId(null); setFilterLocal(''); setFilterPreco(''); setFilterPref(''); }}
            className={`px-4.5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all duration-200 ${
              sidebarView === 'ativos'
                ? 'bg-[#eb3238] text-white shadow-md'
                : 'text-slate-600 hover:text-slate-800 hover:bg-white/80'
            }`}
          >
            💼 Funil Ativo
          </button>
          <button
            onClick={() => { setSidebarView('interessados'); setActiveId(null); setFilterLocal(''); setFilterPreco(''); setFilterPref(''); }}
            className={`px-4.5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all duration-200 ${
              sidebarView === 'interessados'
                ? 'bg-[#eb3238] text-white shadow-md'
                : 'text-slate-600 hover:text-slate-800 hover:bg-white/80'
            }`}
          >
            ⭐ Interessados
          </button>
          <button
            onClick={() => { setSidebarView('finalizados'); setActiveId(null); setFilterLocal(''); setFilterPreco(''); setFilterPref(''); }}
            className={`px-4.5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all duration-200 ${
              sidebarView === 'finalizados'
                ? 'bg-[#eb3238] text-white shadow-md'
                : 'text-slate-600 hover:text-slate-800 hover:bg-white/80'
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
              className="border border-slate-300 rounded-xl px-3 py-2.5 text-xs font-black outline-none focus:border-[#eb3238] bg-white cursor-pointer text-slate-800 shadow-xs"
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
            className="flex items-center justify-center gap-2 bg-[#eb3238] hover:bg-[#eb3238]/90 text-white px-5 py-2.5 rounded-xl text-xs font-black shadow-md hover:-translate-y-0.5 hover:shadow-lg transition-all duration-200 w-full sm:w-auto flex-shrink-0 cursor-pointer"
          >
            <Plus size={15} /> Novo Cliente
          </button>
        </div>
      </div>

      {/* 3. Main Views Grid/Kanban */}
      <div className="w-full">
        {sidebarView === 'ativos' ? (
          /* KANBAN BOARD E1 - E6 */
          <div ref={scrollContainerRef} onDragOver={handleDragOverContainer} className="flex gap-4 overflow-x-auto pb-4 scrollbar-thin">
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
                  className="w-72 flex-shrink-0 flex flex-col bg-slate-200/50 border border-slate-300/40 rounded-2xl p-3.5 min-h-[520px] shadow-xs"
                >
                  {/* Column Header */}
                  <div className={`p-2.5 rounded-xl border border-hairline font-bold flex items-center justify-between mb-3 shadow-xs ${COLUMN_TINTS[etapaIdx]}`}>
                    <span className="text-[10px] uppercase tracking-wider truncate mr-2">{etapa.nome}</span>
                    <span className="text-[10px] px-2 py-0.5 bg-white/70 rounded-full font-black flex-shrink-0">{columnClients.length}</span>
                  </div>

                  {/* Cards container */}
                  <div className="flex-1 overflow-y-auto space-y-2.5 pb-8 min-h-[400px]">
                    {columnClients.length === 0 ? (
                       <div className="border border-dashed border-slate-300 rounded-xl p-4 text-center text-[10px] text-slate-400 font-semibold py-8 bg-white/30">
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
                            className={`p-3.5 border rounded-xl bg-white shadow-xs hover:shadow-md cursor-grab active:cursor-grabbing hover:border-slate-400 transition-all duration-200 hover:-translate-y-0.5 ${
                              isSelected 
                                ? 'ring-2 ring-[#eb3238] border-transparent' 
                                : 'border-slate-250'
                            }`}
                          >
                            <div className="flex justify-between items-start gap-2 mb-1.5">
                              <span className="font-black text-[13px] text-slate-900 line-clamp-1 leading-snug">
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
                                <span className="bg-[#D6E4F0]/60 text-[#33415C] text-[9px] px-1.5 py-0.5 rounded font-black flex items-center gap-0.5">
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
          <div className="space-y-4 w-full">
            {sidebarView === 'interessados' && (
              <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-xs flex flex-col md:flex-row gap-4 items-end mb-2 w-full">
                <div className="flex-1 space-y-1 w-full">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-wide block">📍 Localização / Bairro</label>
                  <input
                    type="text"
                    value={filterLocal}
                    onChange={(e) => setFilterLocal(e.target.value)}
                    placeholder="Filtrar por bairro ou cidade..."
                    className="w-full border border-slate-200 rounded-xl px-3.5 py-2 text-xs md:text-sm outline-none bg-slate-50/30 focus:bg-white focus:border-[#eb3238] font-semibold transition-all text-slate-800"
                  />
                </div>
                <div className="flex-1 space-y-1 w-full">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-wide block">💰 Faixa de Preço</label>
                  <select
                    value={filterPreco}
                    onChange={(e) => setFilterPreco(e.target.value)}
                    className="w-full border border-slate-200 rounded-xl px-3.5 py-2 text-xs md:text-sm outline-none bg-white cursor-pointer focus:border-[#eb3238] font-semibold transition-all text-slate-800 h-[38px]"
                  >
                    <option value="">Todas as faixas</option>
                    {FAIXAS_VALOR.map(f => <option key={f} value={f}>{f}</option>)}
                  </select>
                </div>
                <div className="flex-1 space-y-1 w-full">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-wide block">🔑 Preferências / Tipo</label>
                  <input
                    type="text"
                    value={filterPref}
                    onChange={(e) => setFilterPref(e.target.value)}
                    placeholder="Ex: 3 quartos, suíte, vaga..."
                    className="w-full border border-slate-200 rounded-xl px-3.5 py-2 text-xs md:text-sm outline-none bg-slate-50/30 focus:bg-white focus:border-[#eb3238] font-semibold transition-all text-slate-800"
                  />
                </div>
                {(filterLocal || filterPreco || filterPref) && (
                  <button
                    onClick={() => {
                      setFilterLocal('');
                      setFilterPreco('');
                      setFilterPref('');
                    }}
                    className="bg-slate-100 hover:bg-slate-250 border border-slate-200 text-slate-600 px-4 py-2 text-xs font-black transition-all w-full md:w-auto h-[38px] rounded-xl cursor-pointer"
                  >
                    Limpar
                  </button>
                )}
              </div>
            )}
            
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 w-full">
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
                          <span className="bg-[#D6E4F0]/60 text-[#33415C] text-[9px] px-1.5 py-0.5 rounded font-black">
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
          </div>
        )}
      </div>
      </>

      {/* 4. Split screen layout or Slide-over details drawer */}
      {activeClient && (
        <div 
          className="fixed inset-x-0 bottom-0 top-16 z-20 flex items-center justify-center p-4"
          onClick={() => setActiveId(null)}
        >
          <div 
            className="bg-[#FAF9F7] w-full max-w-[95vw] xl:max-w-[90vw] h-full rounded-3xl shadow-2xl flex flex-col overflow-hidden relative border border-slate-200 z-50 animate-scale-in"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="p-6 border-b border-slate-200 bg-white flex flex-col gap-4 flex-shrink-0">
              {/* Cabeçalho: nome/contato (esq.) + funil compacto e ações (dir.) */}
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
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

              <div className="flex items-center gap-2 flex-wrap">
                {/* Funil de processos — compacto, no canto superior direito */}
                <div className="flex items-center gap-1 flex-wrap justify-end">
                  {ETAPAS.slice(0, 6).map((etapa, idx) => {
                    const isDone = idx < activeClient.etapa
                    const isCurrent = idx === activeClient.etapa
                    let cls = 'bg-slate-50 border-slate-200 text-slate-400 hover:bg-slate-100'
                    if (isDone) cls = 'bg-emerald-50 border-emerald-200 text-emerald-700 hover:bg-emerald-100'
                    if (isCurrent) cls = 'bg-rose-50 border-[#eb3238] text-[#eb3238] ring-1 ring-red-100'
                    return (
                      <button
                        key={idx}
                        onClick={() => changeEtapa(idx)}
                        title={etapa.nome}
                        className={`flex items-center gap-1 px-1.5 py-1 border rounded-lg text-[10px] font-bold transition-all ${cls}`}
                      >
                        <span
                          className="w-3.5 h-3.5 rounded-full flex items-center justify-center text-[7px] font-black text-white flex-shrink-0"
                          style={{ backgroundColor: isCurrent ? '#eb3238' : isDone ? '#10b981' : '#cbd5e1' }}
                        >
                          {isDone ? '✓' : idx + 1}
                        </span>
                        <span className="hidden lg:inline">{etapa.nome.split(' ')[0]}</span>
                      </button>
                    )
                  })}
                </div>

                <div className="h-6 w-[1px] bg-slate-200 mx-1 hidden md:block"></div>

                <button
                  onClick={() => setFichaOpen(true)}
                  className="bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5"
                >
                  📇 Ficha Completa
                </button>
                <button
                  onClick={() => setActiveId(null)}
                  className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 transition-colors"
                  title="Fechar"
                >
                  <X size={18} />
                </button>
              </div>
              </div>
            </div>

            {/* Modal Columns */}
            <div className="flex-1 flex overflow-hidden">
              {/* Left Column: Checklist (desktop) */}
              <div className="hidden md:flex w-[280px] bg-white border-r border-slate-200 p-5 flex-col flex-shrink-0">
                {renderChecklist(false)}
              </div>

              {/* Middle Column: Scrollable details panel */}
              <div className="flex-1 overflow-y-auto p-5 space-y-5 scrollbar-thin">
                
                {/* Card 2: Lembrete / Próxima Ação */}
                <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-4">
                  <h3 className="text-xs font-extrabold uppercase tracking-widest text-[#33415C] flex items-center gap-2">
                    <ClipboardList size={16} className="text-[#33415C]" />
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

              {/* Ação de finalizar (sem quadro — apenas o botão / status) */}
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

              {/* Chrome/Folder Style Tabs — quebram em 2 linhas, sem rolagem */}
              <div className="flex flex-wrap items-center gap-1 border-b border-slate-200/80 pt-2 flex-shrink-0">
                {ETAPAS.slice(0, 6).map((etapa, idx) => {
                  const isActive = selectedDetailTab === idx
                  const isLeadEtapa = idx === activeClient.etapa
                  
                  return (
                    <button
                      key={idx}
                      onClick={() => setSelectedDetailTab(idx)}
                      className={`relative px-4 py-2.5 text-[11px] font-black uppercase tracking-wider transition-all rounded-t-2xl border-t-2 border-x -mb-[1px] flex-shrink-0 flex items-center gap-2 ${
                        isActive
                          ? 'bg-white border-t-[#33415C] border-x-slate-200/80 text-[#33415C] font-black z-10 shadow-xs'
                          : 'bg-slate-100/50 border-t-transparent border-x-transparent text-slate-400 hover:bg-slate-150/45 hover:text-slate-600'
                      }`}
                      style={{
                        borderBottomColor: isActive ? '#ffffff' : 'transparent'
                      }}
                    >
                      {isLeadEtapa && (
                        <span className="w-2 h-2 rounded-full bg-[#eb3238] flex-shrink-0 shadow-xs" title="Etapa atual no Funil" />
                      )}
                      <span>E{idx + 1}: {etapa.nome.split(' ')[0]}</span>
                    </button>
                  )
                })}

                {/* 7th Tab: Perfil do Cliente */}
                <button
                  onClick={() => setSelectedDetailTab(6)}
                  className={`relative px-4 py-2.5 text-[11px] font-black uppercase tracking-wider transition-all rounded-t-2xl border-t-2 border-x -mb-[1px] flex-shrink-0 flex items-center gap-2 ${
                    selectedDetailTab === 6
                      ? 'bg-white border-t-[#33415C] border-x-slate-200/80 text-[#33415C] font-black z-10 shadow-xs'
                      : 'bg-slate-100/50 border-t-transparent border-x-transparent text-slate-400 hover:bg-slate-150/45 hover:text-slate-600'
                  }`}
                  style={{
                    borderBottomColor: selectedDetailTab === 6 ? '#ffffff' : 'transparent'
                  }}
                >
                  <span>👤 Perfil do Cliente</span>
                </button>

                {/* 8th Tab: Resumo do Lead */}
                <button
                  onClick={() => setSelectedDetailTab(7)}
                  className={`relative px-4 py-2.5 text-[11px] font-black uppercase tracking-wider transition-all rounded-t-2xl border-t-2 border-x -mb-[1px] flex-shrink-0 flex items-center gap-2 ${
                    selectedDetailTab === 7
                      ? 'bg-white border-t-[#33415C] border-x-slate-200/80 text-[#33415C] font-black z-10 shadow-xs'
                      : 'bg-slate-100/50 border-t-transparent border-x-transparent text-slate-400 hover:bg-slate-150/45 hover:text-slate-600'
                  }`}
                  style={{
                    borderBottomColor: selectedDetailTab === 7 ? '#ffffff' : 'transparent'
                  }}
                >
                  <span>📋 Resumo do Lead</span>
                </button>
              </div>

              {/* Grid block for actions and checklist */}
              <div className="space-y-5">
                
                {/* Dynamic Stage Actions */}

              {/* ETAPA 0: Triagem */}
              {selectedDetailTab === 0 && (
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
                      <label className="text-[10px] font-bold text-slate-500 uppercase">Porta de Entrada</label>
                      <select 
                        value={activeClient.porta || 'A'}
                        onChange={(e) => setCrmField('porta', e.target.value)}
                        className="w-full text-xs border border-slate-200 rounded-xl p-2.5 focus:border-[#eb3238] outline-none bg-white font-medium text-slate-700"
                      >
                        <option value="A">Porta A (Lais / IA)</option>
                        <option value="B">Porta B (Direto com Humano)</option>
                      </select>
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-500 uppercase">Etiqueta de Status</label>
                      <select 
                        value={activeClient.etiqueta_status || 'Novo'}
                        onChange={(e) => setCrmField('etiqueta_status', e.target.value)}
                        className="w-full text-xs border border-slate-200 rounded-xl p-2.5 focus:border-[#eb3238] outline-none bg-white font-medium text-slate-700"
                      >
                        <option value="Novo">Novo</option>
                        <option value="Em atendimento">Em atendimento</option>
                        <option value="Aguardando cliente">Aguardando cliente</option>
                        <option value="Sem resposta">Sem resposta</option>
                        <option value="Via expressa">Via expressa</option>
                        <option value="Descartado">Descartado</option>
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
                      <label className="text-[10px] font-bold text-slate-500 uppercase">Orçamento Inicial do Cliente (R$)</label>
                      <input 
                        type="text"
                        defaultValue={activeClient.perfil_quiz?.cadastro_orcamento || ''}
                        onBlur={(e) => {
                          setStageField('cadastro_orcamento', e.target.value);
                          const cleanNum = Number(e.target.value.replace(/[^0-9]/g, ''));
                          if (cleanNum > 0) setCrmField('valor', cleanNum);
                        }}
                        placeholder="Ex: R$ 500.000"
                        className="w-full text-xs border border-slate-200 rounded-xl p-2.5 focus:border-[#eb3238] outline-none font-bold text-slate-800"
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
              {selectedDetailTab === 1 && (
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
                      <label className="text-[10px] font-bold text-slate-500 uppercase">Forma de Pagamento (Intenção Inicial)</label>
                      <select 
                        value={activeClient.forma_pagamento || 'a_definir'}
                        onChange={async (e) => {
                          const updated = await updateVendasCliente(activeClient.id, { forma_pagamento: e.target.value as any })
                          if (updated) {
                            setClientes(prev => prev.map(c => c.id === activeClient.id ? updated : c))
                          }
                        }}
                        className="w-full text-xs border border-slate-200 rounded-xl p-2.5 focus:border-[#eb3238] outline-none bg-white font-medium text-slate-700"
                      >
                        <option value="a_definir">A Definir</option>
                        <option value="a_vista">À Vista</option>
                        <option value="parcelamento">Parcelamento</option>
                        <option value="permuta">Permuta</option>
                        <option value="financiamento">Financiamento (Caixa)</option>
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
                </div>
              )}

              {/* ETAPA 2: Visita */}
              {selectedDetailTab === 2 && (
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
              {selectedDetailTab === 3 && (
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
                        <label className="text-[10px] font-bold text-slate-500 uppercase">Valor Ofertado pelo Comprador (R$)</label>
                        <input 
                          type="text"
                          defaultValue={activeClient.perfil_quiz?.proposta_valor || ''}
                          onBlur={(e) => {
                            setStageField('proposta_valor', e.target.value);
                            const cleanNum = Number(e.target.value.replace(/[^0-9]/g, ''));
                            if (cleanNum > 0) setCrmField('valor_vendido', cleanNum);
                          }}
                          placeholder="Ex: R$ 450.000"
                          className="w-full text-xs border border-slate-200 rounded-xl p-2.5 focus:border-[#eb3238] outline-none font-bold text-slate-800"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-500 uppercase">Valor Pedido pelo Proprietário (R$)</label>
                        <input 
                          type="text"
                          defaultValue={activeClient.valor_pedido ? String(activeClient.valor_pedido) : ''}
                          onBlur={(e) => {
                            const cleanNum = Number(e.target.value.replace(/[^0-9]/g, ''));
                            if (cleanNum > 0) setCrmField('valor_pedido', cleanNum);
                          }}
                          placeholder="Ex: R$ 480.000"
                          className="w-full text-xs border border-slate-200 rounded-xl p-2.5 focus:border-[#eb3238] outline-none font-bold text-slate-800"
                        />
                      </div>
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-500 uppercase">Data de Envio da Proposta</label>
                      <input 
                        type="text"
                        defaultValue={activeClient.perfil_quiz?.proposta_data || ''}
                        onBlur={(e) => setStageField('proposta_data', e.target.value)}
                        placeholder="Ex: DD/MM/AAAA"
                        className="w-full text-xs border border-slate-200 rounded-xl p-2.5 focus:border-[#eb3238] outline-none"
                      />
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
              {selectedDetailTab === 4 && (
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

                  {/* Gaps de Negociação Card */}
                  {(() => {
                    const X = activeClient.valor || 0;
                    const Y = activeClient.valor_pedido || 0;
                    const Z = activeClient.valor_fechado || activeClient.valor_vendido || 0;
                    const isEstimate = !activeClient.valor_fechado;

                    if (X === 0 && Y === 0 && Z === 0) return null;

                    const gapComprador = Z > 0 && X > 0 ? (Z - X) : null;
                    const gapProprietario = Y > 0 && Z > 0 ? (Y - Z) : null;

                    return (
                      <div className="bg-[#EEF4FA]/40 border border-[#D6E4F0] rounded-xl p-4.5 space-y-3 mt-4">
                        <div className="flex items-center justify-between border-b border-[#D6E4F0] pb-2">
                          <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#33415C] flex items-center gap-1.5">
                            📊 Gaps de Negociação {isEstimate ? '(Estimativa / Proposta)' : '(Acordo Fechado)'}
                          </span>
                          {isEstimate && <span className="bg-amber-100 text-amber-800 text-[8px] font-black uppercase px-2 py-0.5 rounded">Preview</span>}
                        </div>
                        
                        <div className="grid grid-cols-3 gap-3 text-center">
                          <div>
                            <span className="text-[9px] font-bold text-slate-400 uppercase block leading-none">Orçamento Comprador</span>
                            <span className="text-xs font-black text-slate-700 block mt-1">{X > 0 ? fmtBRL(X) : 'Não informado'}</span>
                          </div>
                          <div>
                            <span className="text-[9px] font-bold text-slate-400 uppercase block leading-none">Valor Proprietário</span>
                            <span className="text-xs font-black text-slate-700 block mt-1">{Y > 0 ? fmtBRL(Y) : 'Não informado'}</span>
                          </div>
                          <div>
                            <span className="text-[9px] font-bold text-slate-400 uppercase block leading-none">{isEstimate ? 'Proposta Oferta' : 'Valor Fechado'}</span>
                            <span className="text-xs font-black text-slate-900 block mt-1">{Z > 0 ? fmtBRL(Z) : 'Não informado'}</span>
                          </div>
                        </div>

                        {(gapComprador !== null || gapProprietario !== null) && (
                          <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-100 text-xs font-semibold text-slate-650">
                            {gapComprador !== null && (
                              <div className="flex flex-col items-center p-2 rounded-lg bg-white/70 border border-slate-200">
                                <span className="text-[9px] font-bold text-slate-400 uppercase text-center block">Subiu da Expectativa</span>
                                <span className={`text-[12px] font-black mt-1 ${gapComprador > 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
                                  {gapComprador > 0 ? `+${fmtBRL(gapComprador)}` : gapComprador < 0 ? `-${fmtBRL(Math.abs(gapComprador))}` : 'Alinhado'}
                                </span>
                              </div>
                            )}
                            {gapProprietario !== null && (
                              <div className="flex flex-col items-center p-2 rounded-lg bg-white/70 border border-slate-200">
                                <span className="text-[9px] font-bold text-slate-400 uppercase text-center block">Proprietário Cedeu</span>
                                <span className={`text-[12px] font-black mt-1 ${gapProprietario > 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                                  {gapProprietario > 0 ? `-${fmtBRL(gapProprietario)}` : gapProprietario < 0 ? `+${fmtBRL(Math.abs(gapProprietario))}` : 'Sem concessão'}
                                </span>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    )
                  })()}
                </div>
              )}

              {/* ETAPA 5: Fechamento */}
              {selectedDetailTab === 5 && (
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
                  {/* Gaps de Negociação Card */}
                  {(() => {
                    const X = activeClient.valor || 0;
                    const Y = activeClient.valor_pedido || 0;
                    const Z = activeClient.valor_fechado || activeClient.valor_vendido || 0;
                    const isEstimate = !activeClient.valor_fechado;

                    if (X === 0 && Y === 0 && Z === 0) return null;

                    const gapComprador = Z > 0 && X > 0 ? (Z - X) : null;
                    const gapProprietario = Y > 0 && Z > 0 ? (Y - Z) : null;

                    return (
                      <div className="bg-[#EEF4FA]/40 border border-[#D6E4F0] rounded-xl p-4.5 space-y-3 mt-4">
                        <div className="flex items-center justify-between border-b border-[#D6E4F0] pb-2">
                          <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#33415C] flex items-center gap-1.5">
                            📊 Gaps de Negociação {isEstimate ? '(Estimativa / Proposta)' : '(Acordo Fechado)'}
                          </span>
                          {isEstimate && <span className="bg-amber-100 text-amber-800 text-[8px] font-black uppercase px-2 py-0.5 rounded">Preview</span>}
                        </div>
                        
                        <div className="grid grid-cols-3 gap-3 text-center">
                          <div>
                            <span className="text-[9px] font-bold text-slate-400 uppercase block leading-none">Orçamento Comprador</span>
                            <span className="text-xs font-black text-slate-700 block mt-1">{X > 0 ? fmtBRL(X) : 'Não informado'}</span>
                          </div>
                          <div>
                            <span className="text-[9px] font-bold text-slate-400 uppercase block leading-none">Valor Proprietário</span>
                            <span className="text-xs font-black text-slate-700 block mt-1">{Y > 0 ? fmtBRL(Y) : 'Não informado'}</span>
                          </div>
                          <div>
                            <span className="text-[9px] font-bold text-slate-400 uppercase block leading-none">{isEstimate ? 'Proposta Oferta' : 'Valor Fechado'}</span>
                            <span className="text-xs font-black text-slate-900 block mt-1">{Z > 0 ? fmtBRL(Z) : 'Não informado'}</span>
                          </div>
                        </div>

                        {(gapComprador !== null || gapProprietario !== null) && (
                          <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-100 text-xs font-semibold text-slate-650">
                            {gapComprador !== null && (
                              <div className="flex flex-col items-center p-2 rounded-lg bg-white/70 border border-slate-200">
                                <span className="text-[9px] font-bold text-slate-400 uppercase text-center block">Subiu da Expectativa</span>
                                <span className={`text-[12px] font-black mt-1 ${gapComprador > 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
                                  {gapComprador > 0 ? `+${fmtBRL(gapComprador)}` : gapComprador < 0 ? `-${fmtBRL(Math.abs(gapComprador))}` : 'Alinhado'}
                                </span>
                              </div>
                            )}
                            {gapProprietario !== null && (
                              <div className="flex flex-col items-center p-2 rounded-lg bg-white/70 border border-slate-200">
                                <span className="text-[9px] font-bold text-slate-400 uppercase text-center block">Proprietário Cedeu</span>
                                <span className={`text-[12px] font-black mt-1 ${gapProprietario > 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                                  {gapProprietario > 0 ? `-${fmtBRL(gapProprietario)}` : gapProprietario < 0 ? `+${fmtBRL(Math.abs(gapProprietario))}` : 'Sem concessão'}
                                </span>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    )
                  })()}
                </div>
              )}

              {selectedDetailTab === 6 && (
                <div className="space-y-6">
                  {/* Part 1: Playbook do Perfil (Dossiê Estratégico) */}
                  <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-4">
                    <h3 className="text-xs font-extrabold uppercase tracking-widest text-[#33415C] flex items-center gap-2">
                      <Sparkles size={16} className="text-[#33415C]" />
                      Playbook & Dossiê de Atendimento
                    </h3>

                    {activeClient.perfil && PERFIS[activeClient.perfil] ? (
                      <div className="space-y-5">
                        {/* Profile Header Card */}
                        <div className="bg-gradient-to-r from-[#EEF4FA] to-slate-50 border border-[#D6E4F0] rounded-xl p-4 flex items-start gap-3.5">
                          <span className="text-3xl p-2 bg-white rounded-xl shadow-xs border border-slate-100 flex-shrink-0">
                            {PERFIS[activeClient.perfil].emo}
                          </span>
                          <div className="space-y-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <h4 className="text-sm font-black text-[#33415C] uppercase tracking-wide">
                                Perfil Dominante: {PERFIS[activeClient.perfil].nome}
                              </h4>
                              {activeClient.perfil_secundario && PERFIS[activeClient.perfil_secundario] && (
                                <span className="bg-slate-150/70 text-slate-650 text-[10px] font-bold px-2 py-0.5 rounded-md border border-slate-250">
                                  🥈 Secundário: {PERFIS[activeClient.perfil_secundario].nome} {PERFIS[activeClient.perfil_secundario].emo}
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-slate-500 font-semibold mt-0.5">
                              🎯 Quest Primária: <span className="text-[#33415C] font-bold">{PERFIS[activeClient.perfil].busca}</span>
                            </p>
                          </div>
                        </div>

                        {/* Como Agir / Estratégia de Atendimento */}
                        <div className="space-y-2">
                          <span className="text-xs font-extrabold text-slate-400 uppercase tracking-wider block">Como Agir (Estratégias Recomendadas)</span>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                            {PERFIS[activeClient.perfil].estrategia.map((est, idx) => (
                              <div key={idx} className="flex items-start gap-2.5 bg-slate-50/60 hover:bg-slate-50 border border-slate-100 p-3 rounded-xl transition-colors">
                                <span className="text-emerald-500 font-black text-xs mt-0.5">✓</span>
                                <span className="text-xs text-slate-700 leading-relaxed font-medium">{est}</span>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Frases Prontas por Momento (Copiáveis) */}
                        <div className="space-y-2">
                          <span className="text-xs font-extrabold text-slate-400 uppercase tracking-wider block">Sugestões de Abordagem e Contorno</span>
                          <div className="space-y-3">
                            {[
                              { label: 'Abordagem Inicial', value: PERFIS[activeClient.perfil].frase_momento.abordagem, key: 'abordagem' },
                              { label: 'Contorno de Objeções', value: PERFIS[activeClient.perfil].frase_momento.contorno, key: 'contorno' },
                              { label: 'Fechamento Comercial', value: PERFIS[activeClient.perfil].frase_momento.fechamento, key: 'fechamento' }
                            ].map((item) => (
                              <div key={item.key} className="bg-slate-50/50 hover:bg-slate-50 border border-slate-150 rounded-xl p-3.5 transition-all space-y-2">
                                <div className="flex items-center justify-between">
                                  <span className="text-[10px] font-extrabold text-[#33415C] uppercase tracking-wide">{item.label}</span>
                                  <button
                                    onClick={() => handleCopyText(item.value, item.key)}
                                    className="flex items-center gap-1 text-[10px] font-bold text-slate-505 hover:text-[#eb3238] bg-white border border-slate-200 rounded-md px-2 py-1 transition-colors shadow-2xs cursor-pointer"
                                  >
                                    {copiedText === item.key ? (
                                      <>
                                        <Check size={10} className="text-emerald-500" />
                                        <span className="text-emerald-600">Copiado!</span>
                                      </>
                                    ) : (
                                      <>
                                        <Copy size={10} />
                                        <span>Copiar</span>
                                      </>
                                    )}
                                  </button>
                                </div>
                                <p className="text-xs text-slate-650 leading-relaxed font-semibold italic">
                                  {item.value}
                                </p>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* O que Evitar */}
                        <div className="space-y-2">
                          <span className="text-xs font-extrabold text-slate-400 uppercase tracking-wider block">O que Evitar (Red Flags ⚠️)</span>
                          <div className="bg-rose-50/40 border border-rose-100 rounded-xl p-4 space-y-2">
                            {PERFIS[activeClient.perfil].evitar.map((ev, idx) => (
                              <div key={idx} className="flex items-start gap-2">
                                <span className="text-rose-550 text-xs mt-0.5">⚠️</span>
                                <span className="text-xs text-slate-700 leading-relaxed font-medium">{ev}</span>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Reset quiz button */}
                        <div className="pt-2 flex justify-end">
                          <button
                            onClick={refazerQuiz}
                            className="px-4 py-2 text-xs font-bold text-slate-500 hover:text-[#eb3238] hover:bg-slate-50 border border-slate-200 rounded-xl transition-colors uppercase tracking-wider cursor-pointer"
                          >
                            🔄 Refazer Diagnóstico (Limpar Quiz)
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="bg-slate-50/50 border border-slate-200 rounded-xl p-5 text-center space-y-2">
                        <p className="text-xs text-slate-500 leading-relaxed font-medium">
                          Nenhum perfil comportamental dominante foi identificado ainda.
                        </p>
                        <p className="text-[11px] text-slate-400">
                          Responda ao <b>Quiz do Comprador</b> ou marque os <b>Sinais Comportamentais</b> abaixo para traçar o perfil do cliente e habilitar as estratégias de abordagem e fechamento do Playbook.
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Part 2: SPIN Quiz & Sinais (Helper de Perfil) */}
                  <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-5">
                    <div>
                      <h3 className="text-xs font-extrabold uppercase tracking-widest text-[#33415C] flex items-center gap-2">
                        <span className="w-5 h-5 bg-[#33415C] text-white rounded-md flex items-center justify-center text-[10px]">2</span>
                        Identificar o Perfil do Comprador (SPIN)
                      </h3>
                      <p className="text-[10px] text-slate-450 mt-1 font-semibold">
                        Responda observando o cliente durante as conversas — cada resposta pesa para um estilo comportamental dominante.
                      </p>
                    </div>

                    <div className="space-y-4">
                      {PERFIL_QUIZ.map((pq, qi) => {
                        const sel = activeClient.perfil_quiz?.[qi]
                        return (
                          <div key={qi} className="space-y-2 border-b border-slate-100 pb-4 last:border-0 last:pb-0">
                            <span className="text-xs font-bold text-slate-700 block">{qi + 1}. {pq.q}</span>
                            <div className="flex flex-col gap-1.5">
                              {pq.opts.map(o => {
                                const isSel = sel === o.k
                                return (
                                  <button
                                    key={o.k}
                                    type="button"
                                    onClick={() => handleQuizAnswer(qi, o.k)}
                                    className={`w-full text-left text-xs px-3.5 py-2.5 rounded-xl border transition-all cursor-pointer ${
                                      isSel
                                        ? 'border-[#eb3238] bg-rose-50/20 text-[#eb3238] font-bold shadow-2xs'
                                        : 'border-slate-100 hover:border-slate-250 hover:bg-slate-50/50 text-slate-655'
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

                    {/* Subsection: Sinais Comportamentais */}
                    <div className="pt-5 border-t border-slate-150 space-y-4">
                      <div>
                        <h4 className="text-xs font-extrabold uppercase tracking-widest text-slate-500 flex items-center gap-1.5">
                          Sinais Comportamentais Observados
                        </h4>
                        <p className="text-[10px] text-slate-450 mt-1 font-semibold">
                          Selecione os sinais práticos observados na atitude ou fala do cliente para refinar o diagnóstico.
                        </p>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                        {(() => {
                          const list: { perfKey: string; sIdx: number; sinal: string }[] = []
                          const keys = Object.keys(SINAIS_COMPORTAMENTAIS) as (keyof typeof SINAIS_COMPORTAMENTAIS)[]
                          for (let i = 0; i < 5; i++) {
                            keys.forEach(k => {
                              list.push({
                                perfKey: k,
                                sIdx: i,
                                sinal: SINAIS_COMPORTAMENTAIS[k][i]
                              })
                            })
                          }
                          return list.map(({ perfKey, sIdx, sinal }) => {
                            const key = `s_${perfKey}_${sIdx}`
                            const isChecked = activeClient.perfil_quiz?.[key] === 'true'
                            return (
                              <label key={`${perfKey}_${sIdx}`} className={`flex items-start gap-2.5 text-xs text-slate-650 cursor-pointer select-none p-3 rounded-xl border transition-all ${
                                isChecked 
                                  ? 'border-[#eb3238] bg-rose-50/10 text-[#eb3238] font-bold' 
                                  : 'border-slate-100 hover:border-slate-200 hover:bg-slate-50/50 bg-white'
                              }`}>
                                <input 
                                  type="checkbox"
                                  checked={isChecked}
                                  onChange={() => handleSignalToggle(perfKey, sIdx)}
                                  className="rounded text-[#eb3238] focus:ring-[#eb3238] h-4 w-4 mt-0.5 cursor-pointer"
                                />
                                <span className="leading-snug">{sinal}</span>
                              </label>
                            )
                          })
                        })()}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {selectedDetailTab === 7 && (
              <div className="space-y-6">
                <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-5">
                  <div>
                    <h3 className="text-xs font-extrabold uppercase tracking-widest text-[#eb3238] flex items-center gap-2">
                      📊 Resumo Geral do Lead
                    </h3>
                    <p className="text-[10px] text-slate-400 mt-1 font-semibold">
                      Consolidado das informações registradas no funil comercial.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Status & Temp Card */}
                    <div className="bg-[#EEF4FA]/50 border border-[#D6E4F0] rounded-xl p-4 space-y-3 text-xs text-slate-700 leading-relaxed font-medium">
                      <h4 className="text-xs font-extrabold text-[#33415C] uppercase tracking-wide">
                        Etapa Atual & Temperatura
                      </h4>
                      <div className="space-y-2">
                        <div>
                          <b>Etapa:</b> <span className="font-extrabold text-[#eb3238]">{ETAPAS[activeClient.etapa]?.nome} (E{activeClient.etapa + 1})</span>
                        </div>
                        <div>
                          <b>Temperatura:</b> <span className="font-bold uppercase" style={{ color: (TEMP_CFG as any)[activeClient.temp]?.cor }}>{(TEMP_CFG as any)[activeClient.temp]?.rotulo}</span>
                        </div>
                        <div>
                          <b>Origem:</b> <span className="font-semibold text-slate-600">{activeClient.origem || 'Não informada'}</span>
                        </div>
                        <div>
                          <b>Porta de Entrada:</b> <span className="font-semibold text-slate-650">{activeClient.porta === 'A' ? 'Porta A (Lais / IA)' : 'Porta B (Humano)'}</span>
                        </div>
                        {activeClient.finalizado && (
                          <div className="text-rose-600 font-bold border-t border-rose-100 pt-2 mt-2">
                            🏁 Atendimento Finalizado: {activeClient.status_finalizacao === 'sucesso' ? 'Ganho / Sucesso' : 'Perdido'}
                            {activeClient.motivo_finalizacao && <span className="block text-[10px] text-slate-500 font-medium">Motivo: {activeClient.motivo_finalizacao}</span>}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Perfil & Comportamento Card */}
                    <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3 text-xs text-slate-700">
                      <h4 className="text-xs font-extrabold text-slate-500 uppercase tracking-wide">
                        Perfil Comportamental
                      </h4>
                      <div className="space-y-2 font-medium">
                        <div>
                          <b>Perfil Dominante:</b> {activeClient.perfil ? (
                            <span className="font-extrabold text-[#33415C]">{PERFIS[activeClient.perfil].nome} {PERFIS[activeClient.perfil].emo}</span>
                          ) : (
                            <span className="text-slate-400">Pendente de diagnóstico</span>
                          )}
                        </div>
                        {activeClient.perfil_secundario && (
                          <div>
                            <b>Perfil Secundário:</b> <span className="font-bold text-slate-500">{PERFIS[activeClient.perfil_secundario].nome} {PERFIS[activeClient.perfil_secundario].emo}</span>
                          </div>
                        )}
                        {activeClient.perfil && (
                          <div className="text-[11px] text-slate-500 leading-relaxed font-semibold italic border-t border-slate-200 pt-2 mt-2">
                            "{PERFIS[activeClient.perfil].estrategia[0]}"
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Financeiro / Interesse Card */}
                  <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3">
                    <h4 className="text-xs font-extrabold text-[#33415C] uppercase tracking-wide">
                      Dados de Interesse & Valores
                    </h4>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs font-medium text-slate-700">
                      <div>
                        <span className="text-[9px] font-bold text-slate-400 uppercase block">Local Desejado</span>
                        <span className="font-semibold text-slate-800">{activeClient.local || 'Não informado'}</span>
                      </div>
                      <div>
                        <span className="text-[9px] font-bold text-slate-400 uppercase block">Faixa de Preço</span>
                        <span className="font-semibold text-slate-800">{activeClient.faixa || 'Não informada'}</span>
                      </div>
                      <div>
                        <span className="text-[9px] font-bold text-[#33415C] uppercase block">Orçamento Máximo</span>
                        <span className="font-bold text-[#33415C]">{activeClient.valor ? fmtBRL(activeClient.valor) : 'Não informado'}</span>
                      </div>
                      <div>
                        <span className="text-[9px] font-bold text-slate-400 uppercase block">Forma de Pagamento</span>
                        <span className="font-semibold text-slate-800">
                          {activeClient.forma_pagamento === 'a_vista' ? 'À vista' : 
                           activeClient.forma_pagamento === 'parcelamento' ? 'Parcelamento' :
                           activeClient.forma_pagamento === 'permuta' ? 'Permuta' :
                           activeClient.forma_pagamento === 'financiamento' ? 'Financiamento (Caixa)' : 'A definir'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Additional Lead Info */}
                  <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3 text-xs text-slate-700">
                    <h4 className="text-xs font-extrabold text-slate-550 uppercase tracking-wide">
                      Informações de Contato & Imóvel
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 font-semibold">
                      <div>📞 <b>Contato/WhatsApp:</b> {activeClient.contato || 'Não informado'}</div>
                      {activeClient.email && <div>✉️ <b>E-mail:</b> {activeClient.email}</div>}
                      {activeClient.imovel_interesse && <div className="col-span-full">🔑 <b>Imóvel de Interesse:</b> {activeClient.imovel_interesse}</div>}
                      {activeClient.valor_pedido && <div>💰 <b>Valor Pedido (Proprietário):</b> {fmtBRL(activeClient.valor_pedido)}</div>}
                      {activeClient.valor_fechado && <div>🏁 <b>Valor Fechado:</b> {fmtBRL(activeClient.valor_fechado)}</div>}
                    </div>
                  </div>

                  {/* Playbook se perfil mapeado */}
                  {activeClient.perfil && PERFIS[activeClient.perfil] && (
                    <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3">
                      <h4 className="text-xs font-extrabold text-[#33415C] uppercase tracking-wide flex items-center gap-1.5">
                        {PERFIS[activeClient.perfil].emo} Playbook: Dicas de Abordagem para este Perfil
                      </h4>
                      <ul className="space-y-1.5 text-xs text-slate-700 font-semibold">
                        {PERFIS[activeClient.perfil].estrategia.map((est, eIdx) => (
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
            )}

            {/* Responsive fallbacks at the bottom of the middle column scroll view */}
            <div className="block md:hidden border-t border-slate-200 pt-5 mt-5">
              {renderChecklist(true)}
            </div>

            <div className="block lg:hidden border-t border-slate-200 pt-5 mt-5">
              {renderNotes(true)}
            </div>

          </div>

          {/* Right Column: Notes & History (desktop) */}
          <div className="hidden lg:flex w-[320px] bg-white border-l border-slate-200 p-5 flex-col flex-shrink-0">
            {renderNotes(false)}
          </div>
        </div>
      </div>
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
                <h3 className="font-black text-[#33415C] text-base md:text-lg flex items-center gap-1.5">📇 Ficha do Cliente</h3>
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
                  {FAIXAS_VALOR.map(f => <option key={f} value={f}>{f}</option>)}
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

            {/* Imóvel desejado — preferências estruturadas (compacto) */}
            <div className="space-y-2 pt-1">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-wide block">Imóvel Desejado</label>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5">
                <div className="space-y-1">
                  <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wide block">Tipo</span>
                  <select
                    value={activeClient.tipo_imovel || ''}
                    onChange={(e) => setCrmField('tipo_imovel', e.target.value || null)}
                    className="w-full border border-slate-200 rounded-lg p-2 text-xs outline-none bg-white cursor-pointer font-semibold"
                  >
                    <option value="">—</option>
                    {TIPOS_IMOVEL.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
                <div className="space-y-1">
                  <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wide block">Quartos</span>
                  <select
                    value={activeClient.quartos ?? ''}
                    onChange={(e) => setCrmField('quartos', e.target.value === '' ? null : Number(e.target.value))}
                    className="w-full border border-slate-200 rounded-lg p-2 text-xs outline-none bg-white cursor-pointer font-semibold"
                  >
                    <option value="">—</option>
                    {[1, 2, 3, 4, 5].map(n => <option key={n} value={n}>{n === 5 ? '5+' : n}</option>)}
                  </select>
                </div>
                <div className="space-y-1">
                  <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wide block">Suítes</span>
                  <select
                    value={activeClient.suites ?? ''}
                    onChange={(e) => setCrmField('suites', e.target.value === '' ? null : Number(e.target.value))}
                    className="w-full border border-slate-200 rounded-lg p-2 text-xs outline-none bg-white cursor-pointer font-semibold"
                  >
                    <option value="">—</option>
                    {[0, 1, 2, 3, 4].map(n => <option key={n} value={n}>{n === 4 ? '4+' : n}</option>)}
                  </select>
                </div>
                <div className="space-y-1">
                  <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wide block">Vagas</span>
                  <select
                    value={activeClient.vagas ?? ''}
                    onChange={(e) => setCrmField('vagas', e.target.value === '' ? null : Number(e.target.value))}
                    className="w-full border border-slate-200 rounded-lg p-2 text-xs outline-none bg-white cursor-pointer font-semibold"
                  >
                    <option value="">—</option>
                    {[0, 1, 2, 3, 4].map(n => <option key={n} value={n}>{n === 4 ? '4+' : n}</option>)}
                  </select>
                </div>
                <div className="space-y-1">
                  <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wide block">Piscina</span>
                  <select
                    value={activeClient.piscina || ''}
                    onChange={(e) => setCrmField('piscina', e.target.value || null)}
                    className="w-full border border-slate-200 rounded-lg p-2 text-xs outline-none bg-white cursor-pointer font-semibold"
                  >
                    <option value="">—</option>
                    <option value="sim">Sim</option>
                    <option value="nao">Não</option>
                    <option value="indiferente">Indiferente</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-wide block">Outras Preferências</label>
              <textarea
                value={activeClient.preferencia || ''}
                onChange={(e) => setCrmField('preferencia', e.target.value)}
                placeholder="Detalhes adicionais (ex: varanda gourmet, andar alto, pet friendly, mobiliado...)"
                className="w-full border border-slate-200 rounded-xl p-3.5 text-xs md:text-sm outline-none focus:border-[#47587A] min-h-[60px] resize-y"
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
                className="flex-1 bg-[#33415C] hover:bg-[#47587A] text-white font-bold py-2.5 rounded-xl text-xs md:text-sm transition-all shadow-sm flex items-center justify-center gap-1.5"
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
      <NovoClienteModal
        open={modalNovoOpen}
        onClose={() => setModalNovoOpen(false)}
        onSubmit={handleCriarCliente}
        formNovo={formNovo}
        setFormNovo={setFormNovo}
        corretores={corretores}
        user={user}
      />

      {/* ============================================================
          MODAL: FINALIZAR PROCESSO
          ============================================================ */}
      <FinalizarModal
        open={finalizarModalOpen}
        client={activeClient ?? null}
        onClose={() => setFinalizarModalOpen(false)}
        onConfirm={handleFinalizarCliente}
        status={finalizarStatus}
        setStatus={setFinalizarStatus}
        motivo={finalizarMotivo}
        setMotivo={setFinalizarMotivo}
        customMotivo={customMotivo}
        setCustomMotivo={setCustomMotivo}
        valFechado={valFechado}
        setValFechado={setValFechado}
      />

    </div>
  )
}
