'use client'

import { useState, useEffect, Suspense } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useSearchParams } from 'next/navigation'
import AcoesDoDia from '@/components/vendas/AcoesDoDia'
import MinhaCarteira from '@/components/vendas/MinhaCarteira'
import Dashboard from '@/components/vendas/Dashboard'
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
  ClipboardList
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

  const [activeView, setActiveView] = useState<'acoes' | 'funil' | 'dashboard'>('acoes')
  const [clientes, setClientes] = useState<VendasCliente[]>([])
  const [corretores, setCorretores] = useState<VendasCorretor[]>([])
  const [equipes, setEquipes] = useState<VendasEquipe[]>([])
  const [activeId, setActiveId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  // Sync activeView with query param 'view'
  useEffect(() => {
    const view = searchParams?.get('view')
    if (view && ['acoes', 'funil', 'dashboard'].includes(view)) {
      if (user?.role === 'vendas' && !['acoes', 'funil'].includes(view)) {
        setActiveView('acoes')
      } else {
        setActiveView(view as any)
      }
    }
  }, [searchParams, user])

  // Block brokers from trying to access general dashboard view
  useEffect(() => {
    if (user?.role === 'vendas' && !['acoes', 'funil'].includes(activeView)) {
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

        const activeCls = myClients.filter(c => !c.finalizado)
        if (activeCls.length > 0) {
          setActiveId(activeCls[0].id)
        } else if (myClients.length > 0) {
          setActiveId(myClients[0].id)
        }
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
    { id: 'dashboard', label: 'Dashboard Geral', icon: <TrendingUp size={15} /> }
  ] : [
    { id: 'acoes', label: 'Ações de Hoje', icon: <ClipboardList size={15} /> },
    { id: 'funil', label: 'Minha Carteira', icon: <Target size={15} /> }
  ]

  return (
    <div className="flex flex-col min-h-screen bg-slate-50 text-slate-800 font-sans pb-24">
      {/* HEADER TABS */}
      <div className="bg-[#1F4E79] text-white px-6 py-4 flex flex-col md:flex-row items-center justify-between gap-4 shadow-md sticky top-0 z-40">
        <div className="flex items-center gap-3">
          <img src="/logo.png" alt="Porto Real Logo" className="h-[36px] w-auto bg-white px-2.5 py-1 rounded-lg shadow-sm font-bold text-[#1F4E79] flex items-center justify-center" />
          <div>
            <h1 className="font-extrabold text-lg tracking-tight">Apoio à Venda</h1>
            <p className="text-[10px] text-slate-200 uppercase tracking-widest font-semibold">Sistema de Suporte &amp; CRM</p>
          </div>
        </div>
        
        {/* Navigation Tabs */}
        <div className="flex bg-[#123658] p-1 rounded-xl gap-1">
          {navigationTabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveView(tab.id as any)}
              className={`flex items-center gap-2 px-4 py-2 text-xs md:text-sm font-semibold rounded-lg transition-all ${
                activeView === tab.id
                  ? 'bg-white text-[#1F4E79] shadow-sm'
                  : 'text-slate-300 hover:text-white hover:bg-[#1f4e79]/45'
              }`}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-4">
          <div className="hidden sm:flex items-center gap-2 bg-[#ffffff12] border border-white/10 px-3 py-1.5 rounded-full text-xs font-semibold">
            <span className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse"></span>
            Conectado ao Supabase
          </div>
          
          {/* User info & Logout */}
          {user && (
            <div className="flex items-center gap-3 bg-[#ffffff12] border border-white/10 px-3 py-1.5 rounded-xl text-xs font-semibold">
              <div className="w-7 h-7 rounded-lg bg-white/20 flex items-center justify-center font-bold text-white uppercase text-[11px] shadow-xs">
                {getInitials(user.nome)}
              </div>
              <div className="hidden md:block text-left">
                <div className="font-bold text-white max-w-[110px] truncate">{user.nome}</div>
                <div className="text-[9px] text-slate-300 font-medium uppercase tracking-wider mt-0.5">{user.role === 'superadmin' ? 'Diretoria' : 'Corretor'}</div>
              </div>
              <button 
                onClick={logout} 
                className="p-1 text-slate-200 hover:text-white hover:bg-white/10 rounded-lg transition-all"
                title="Sair do sistema"
              >
                <LogOut size={16} />
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="max-w-[1440px] w-full mx-auto px-4 md:px-6 mt-6 flex-1 flex flex-col">
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
