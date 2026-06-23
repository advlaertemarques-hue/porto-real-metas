'use client'

import { useModule } from '@/contexts/ModuleContext'
import { usePathname, useRouter } from 'next/navigation'
import { useAuth, canAccessModule } from '@/contexts/AuthContext'
import { usePresence } from '@/contexts/PresenceContext'
import { Menu, LogOut, Shield } from 'lucide-react'

function getInitials(nome: string) {
  const parts = nome.trim().split(' ')
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
}

interface TopbarProps {
  onMenuClick?: () => void
}

export default function Topbar({ onMenuClick }: TopbarProps) {
  const { activeModule, setActiveModule } = useModule()
  const { user, logout } = useAuth()
  const { onlineUsers } = usePresence()
  const pathname = usePathname()
  const router = useRouter()

  if (!user) return null

  const handleModuleClick = (mod: 'vendas' | 'aluguel' | 'institucional') => {
    setActiveModule(mod)
    if (mod === 'vendas') {
      router.push('/gestao-geral')
    } else if (mod === 'aluguel') {
      router.push('/checklist')
    } else {
      router.push('/institucional')
    }
  }

  const onlineCount = Object.keys(onlineUsers || {}).length || 1

  // Determine page title and sub
  let pageTitle = 'Gestão Geral'
  let pageSub = 'Painel de Operações e Acompanhamento de Metas'

  if (pathname === '/gestao-geral') {
    pageTitle = activeModule === 'vendas' ? 'CRM & Funil de Vendas' : 'Operação Comercial'
    pageSub = activeModule === 'vendas' ? 'Ações diárias e gestão de clientes' : 'Apoio geral de metas'
  } else if (pathname === '/institucional') {
    pageTitle = 'Institucional'
    pageSub = 'Painel Institucional e Avisos Gerais da Porto Real'
  } else if (pathname === '/checklist') {
    pageTitle = 'Aluguel'
    pageSub = 'Checklists de locação e acompanhamento'
  } else if (pathname === '/vendas-vgv') {
    pageTitle = 'VGV e Estatísticas'
    pageSub = 'Indicadores consolidados de Volume Geral de Vendas'
  } else {
    // Fallback from path
    const parts = pathname.split('/').filter(Boolean)
    if (parts.length > 0) {
      const last = parts[parts.length - 1].replace(/-/g, ' ')
      pageTitle = last.charAt(0).toUpperCase() + last.slice(1)
      pageSub = 'Painel de controle e operações'
    }
  }

  return (
    <header className="h-16 bg-[#FAF9F7]/95 backdrop-blur-md border-b border-slate-200/80 px-4 md:px-6 flex items-center justify-between sticky top-0 z-30 flex-shrink-0">
      <div className="flex items-center gap-3 min-w-0">
        {/* Hamburger Menu on mobile */}
        <button
          onClick={onMenuClick}
          className="lg:hidden text-slate-600 hover:text-slate-800 p-1.5 hover:bg-slate-200/50 rounded-lg transition-colors flex-shrink-0"
          title="Abrir Menu"
        >
          <Menu size={20} />
        </button>

        {/* Page Title & Breadcrumb */}
        <div className="truncate">
          <h2 className="text-xs md:text-sm font-black text-slate-800 uppercase tracking-wider leading-none truncate">
            {pageTitle}
          </h2>
          <p className="text-[9px] md:text-[10px] text-slate-400 font-bold mt-1 truncate">
            {pageSub}
          </p>
        </div>
      </div>

      {/* Center/Right: Module Tabs + User Menu */}
      <div className="flex items-center gap-3 md:gap-4 flex-shrink-0">
        {/* Module Switcher tabs */}
        <div className="hidden md:flex items-center bg-slate-200/60 p-1 rounded-xl gap-0.5">
          {canAccessModule(user.role, 'institucional') && (
            <button
              onClick={() => handleModuleClick('institucional')}
              className={`px-3 py-1.5 rounded-lg text-[10px] font-extrabold uppercase tracking-wide transition-all ${
                activeModule === 'institucional'
                  ? 'bg-white text-emerald-600 shadow-xs'
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              🏢 Institucional
            </button>
          )}
          {canAccessModule(user.role, 'vendas') && (
            <button
              onClick={() => handleModuleClick('vendas')}
              className={`px-3 py-1.5 rounded-lg text-[10px] font-extrabold uppercase tracking-wide transition-all ${
                activeModule === 'vendas'
                  ? 'bg-white text-[#eb3238] shadow-xs'
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              📈 Vendas
            </button>
          )}
          {canAccessModule(user.role, 'aluguel') && (
            <button
              onClick={() => handleModuleClick('aluguel')}
              className={`px-3 py-1.5 rounded-lg text-[10px] font-extrabold uppercase tracking-wide transition-all ${
                activeModule === 'aluguel'
                  ? 'bg-white text-blue-600 shadow-xs'
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              🔑 Aluguel
            </button>
          )}
        </div>

        {/* User controls */}
        <div className="flex items-center gap-2">
          {/* Online count */}
          <div className="flex items-center gap-1.5 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 rounded-full text-[9px] font-extrabold text-emerald-600">
            <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
            {onlineCount > 1 ? `${onlineCount} ONLINE` : 'ONLINE'}
          </div>

          {/* Audit shield for Admin */}
          {user.role === 'superadmin' && (
            <button
              onClick={() => router.push('/auditoria')}
              className={`p-2 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-all ${
                pathname === '/auditoria' ? 'text-[#eb3238] bg-slate-100' : ''
              }`}
              title="Painel de Auditoria"
            >
              <Shield size={16} />
            </button>
          )}

          {/* User profile info (Avatar & logout) */}
          <div className="flex items-center gap-2 bg-slate-200/50 p-1 rounded-xl">
            <div className="w-6 h-6 rounded-lg bg-gradient-to-tr from-blue-500 to-indigo-600 text-white font-black text-[10px] flex items-center justify-center shadow-xs">
              {getInitials(user.nome)}
            </div>
            <span className="hidden sm:inline text-[11px] font-bold text-slate-700 max-w-[100px] truncate pl-1">
              {user.nome.split(' ')[0]}
            </span>
            <div className="h-4 w-[1px] bg-slate-300/60 mx-1.5 hidden sm:block" />
            <button
              onClick={() => {
                logout()
                router.push('/login')
              }}
              className="p-1 text-slate-400 hover:text-rose-600 rounded transition-colors"
              title="Sair"
            >
              <LogOut size={14} />
            </button>
          </div>
        </div>
      </div>
    </header>
  )
}
