'use client'

import { useState, useEffect, Suspense } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useSearchParams } from 'next/navigation'
import AcoesDoDia from '@/components/vendas/AcoesDoDia'
import MinhaCarteira from '@/components/vendas/MinhaCarteira'
import Dashboard from '@/components/vendas/Dashboard'
import GuiasDeApoio from '@/components/vendas/GuiasDeApoio'
import {
  getVendasClientes,
  getVendasCorretores,
  getVendasEquipes
} from '@/lib/api'
import { VendasCliente, VendasCorretor, VendasEquipe } from '@/lib/types'
import {
  Target,
  Users,
  TrendingUp,
  LogOut,
  ClipboardList,
  BookOpen
} from 'lucide-react'

function getInitials(nome: string) {
  if (!nome) return '?'
  const parts = nome.trim().split(/\s+/)
  if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase()
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
}

function VendasMockupContent() {
  const { user, logout } = useAuth()
  const searchParams = useSearchParams()

  const [activeView, setActiveView] = useState<'acoes' | 'funil' | 'dashboard' | 'guias'>('acoes')
  const [clientes, setClientes] = useState<VendasCliente[]>([])
  const [corretores, setCorretores] = useState<VendasCorretor[]>([])
  const [equipes, setEquipes] = useState<VendasEquipe[]>([])
  const [activeId, setActiveId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  // Sync activeView with query param 'view'
  useEffect(() => {
    const view = searchParams?.get('view')
    if (view && ['acoes', 'funil', 'dashboard', 'guias'].includes(view)) {
      if (user?.role === 'vendas' && !['acoes', 'funil', 'guias'].includes(view)) {
        setActiveView('acoes')
      } else {
        setActiveView(view as any)
      }
    }
  }, [searchParams, user])

  // Block brokers from trying to access general dashboard view
  useEffect(() => {
    if (user?.role === 'vendas' && !['acoes', 'funil', 'guias'].includes(activeView)) {
      setActiveView('acoes')
    }
  }, [activeView, user])

  // Init Data
  useEffect(() => {
    async function loadData() {
      setLoading(true)
      try {
        const [cls, corrs, eqps] = await Promise.all([
          getVendasClientes(),
          getVendasCorretores(),
          getVendasEquipes()
        ])
        setClientes(cls)
        setCorretores(corrs)
        setEquipes(eqps)
        
        const myCorretor = corrs.find(co => co.user_id === user?.id)
        const myClients = user?.role === 'vendas'
          ? cls.filter(c => c.corretor_id === myCorretor?.id)
          : cls

        // Do not auto-select first client on load to keep Kanban board visible by default
      } catch (err) {
        console.error("Erro ao carregar dados:", err)
      } finally {
        setLoading(false)
      }
    }
    loadData()
  }, [user])

  if (loading) {
    return (
      <div className="flex h-[80vh] items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-3">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-[#1F4E79] border-t-transparent"></div>
          <span className="text-sm font-semibold text-slate-600">Carregando painel de apoio a vendas...</span>
        </div>
      </div>
    )
  }

  const navigationTabs = user?.role === 'superadmin' ? [
    { id: 'acoes', label: 'Ações de Hoje', icon: <ClipboardList size={15} /> },
    { id: 'funil', label: 'Funil / Minha Carteira', icon: <Target size={15} /> },
    { id: 'dashboard', label: 'Dashboard Geral', icon: <TrendingUp size={15} /> },
    { id: 'guias', label: 'Guias', icon: <BookOpen size={15} /> }
  ] : [
    { id: 'acoes', label: 'Ações de Hoje', icon: <ClipboardList size={15} /> },
    { id: 'funil', label: 'Minha Carteira', icon: <Target size={15} /> },
    { id: 'guias', label: 'Guias', icon: <BookOpen size={15} /> }
  ]

  return (
    <div className="flex flex-col min-h-screen bg-transparent text-slate-800 font-sans pb-24 relative z-10">
      <div className="max-w-[1440px] w-full mx-auto px-4 md:px-6 mt-6 flex-1 flex flex-col">
        {/* Sub-navigation Tabs */}
        <div className="flex border-b border-slate-200/80 mb-6 gap-6 items-center">
          {navigationTabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveView(tab.id as any)}
              className={`pb-3 text-xs md:text-sm font-extrabold uppercase tracking-wider border-b-2 transition-all flex items-center gap-2 ${
                activeView === tab.id
                  ? 'border-[#eb3238] text-[#eb3238]'
                  : 'border-transparent text-slate-400 hover:text-slate-600'
              }`}
            >
              {tab.icon}
              <span>{tab.label}</span>
            </button>
          ))}
        </div>
        {activeView === 'acoes' && (
          <AcoesDoDia
            clientes={clientes}
            corretores={corretores}
            user={user}
            setActiveId={setActiveId}
            setActiveView={setActiveView}
          />
        )}

        {activeView === 'funil' && (
          <MinhaCarteira
            clientes={clientes}
            setClientes={setClientes}
            activeId={activeId}
            setActiveId={setActiveId}
            corretores={corretores}
            equipes={equipes}
            user={user}
          />
        )}

        {activeView === 'dashboard' && user?.role === 'superadmin' && (
          <Dashboard
            clientes={clientes}
            corretores={corretores}
            equipes={equipes}
            setActiveId={setActiveId}
            setActiveView={setActiveView}
          />
        )}

        {activeView === 'guias' && (
          <GuiasDeApoio />
        )}
      </div>
    </div>
  )
}

export default function VendasMockupPage() {
  return (
    <Suspense fallback={<div className="p-6 text-slate-400 animate-pulse">Carregando módulo...</div>}>
      <VendasMockupContent />
    </Suspense>
  )
}
