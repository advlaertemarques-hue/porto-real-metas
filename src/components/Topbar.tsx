'use client'

import Link from 'next/link'
import { useModule } from '@/contexts/ModuleContext'
import { usePathname, useRouter } from 'next/navigation'
import { useAuth, canAccessModule } from '@/contexts/AuthContext'
import { usePresence } from '@/contexts/PresenceContext'
import { LogOut } from 'lucide-react'

function getInitials(nome: string) {
  const parts = nome.trim().split(' ')
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
}

export default function Topbar() {
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

  // Navigation items based on module and role
  const getNavItems = () => {
    if (activeModule === 'vendas') {
      const items = [
        { href: '/gestao-geral', label: 'Funil' },
      ]
      if (user.role === 'superadmin') {
        items.push({ href: '/metas', label: 'Metas' })
        items.push({ href: '/lancamentos', label: 'Pesquisas' })
        items.push({ href: '/banco-dados', label: 'Banco de Dados' })
        items.push({ href: '/corretores', label: 'Controle de Usuários' })
        items.push({ href: '/vendas-vgv', label: 'VGV e Alertas' })
        items.push({ href: '/treinamentos', label: 'Treinamentos' })
        items.push({ href: '/auditoria', label: 'Auditoria' })
      }
      return items
    } else if (activeModule === 'aluguel') {
      return [
        { href: '/checklist', label: 'Checklist' },
        { href: '/processos', label: 'Processos' },
        { href: '/pdi', label: 'Meu PDI' },
        { href: '/documentos', label: 'Documentos' },
      ]
    } else {
      return [
        { href: '/institucional', label: 'Sobre a Empresa' },
        { href: '/quadro-de-avisos', label: 'Quadro de Avisos' },
      ]
    }
  }

  const navItems = getNavItems()

  return (
    <header className="h-16 bg-[#1F4E79] border-b border-white/10 px-4 md:px-6 flex items-center justify-between sticky top-0 z-30 flex-shrink-0 text-white shadow-md">
      {/* Brand & Navigation */}
      <div className="flex items-center gap-6 min-w-0 flex-1">
        {/* Brand Logo */}
        <Link href="/gestao-geral" className="flex items-center gap-2.5 flex-shrink-0 hover:opacity-90 transition-opacity">
          <div className="h-8 w-8 rounded-full bg-[#eb3238] flex items-center justify-center shadow-md">
            <svg viewBox="0 0 24 24" className="h-4.5 w-4.5 text-white fill-white" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 3L2 12h3v8h14v-8h3L12 3z" />
            </svg>
          </div>
          <div className="font-extrabold text-[15px] text-white tracking-tight leading-none">
            Porto<span className="font-medium text-slate-200">Real</span>
          </div>
        </Link>

        {/* Top Navigation Items */}
        <nav className="flex items-center gap-1 overflow-x-auto no-scrollbar scroll-smooth py-1 max-w-[50vw] sm:max-w-none">
          {navItems.map((item, idx) => {
            const isActive = pathname === item.href
            return (
              <Link
                key={idx}
                href={item.href}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-extrabold transition-all whitespace-nowrap ${
                  isActive
                    ? 'bg-white text-[#1F4E79] shadow-xs'
                    : 'text-slate-200 hover:text-white hover:bg-white/10'
                }`}
              >
                {item.label}
              </Link>
            )
          })}
        </nav>
      </div>

      {/* Right controls */}
      <div className="flex items-center gap-3 md:gap-4 flex-shrink-0">
        {/* Module Switcher dropdown */}
        <div className="flex items-center gap-2">
          <select
            value={activeModule}
            onChange={(e) => handleModuleClick(e.target.value as any)}
            className="bg-white/10 border border-white/20 text-white rounded-xl px-2.5 py-1.5 text-xs font-bold outline-none cursor-pointer hover:bg-white/15 focus:border-[#eb3238]"
          >
            {canAccessModule(user.role, 'vendas') && <option className="text-slate-800" value="vendas">📈 Vendas</option>}
            {canAccessModule(user.role, 'aluguel') && <option className="text-slate-800" value="aluguel">🔑 Aluguel</option>}
            {canAccessModule(user.role, 'institucional') && <option className="text-slate-800" value="institucional">🏢 Institucional</option>}
          </select>
        </div>

        {/* Online count */}
        <div className="hidden sm:flex items-center gap-1.5 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 rounded-full text-[9px] font-extrabold text-emerald-400">
          <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse" />
          {onlineCount > 1 ? `${onlineCount} ONLINE` : 'ONLINE'}
        </div>

        {/* User profile info & logout */}
        <div className="flex items-center gap-2 bg-white/10 p-1 rounded-xl border border-white/5">
          <div className="w-6 h-6 rounded-lg bg-gradient-to-tr from-blue-500 to-indigo-600 text-white font-black text-[10px] flex items-center justify-center shadow-xs">
            {getInitials(user.nome)}
          </div>
          <span className="hidden md:inline text-[11px] font-bold text-slate-200 max-w-[100px] truncate pl-1">
            {user.nome.split(' ')[0]}
          </span>
          <div className="h-4 w-[1px] bg-white/10 mx-1.5 hidden md:block" />
          <button
            onClick={() => {
              logout()
              router.push('/login')
            }}
            className="p-1 text-slate-300 hover:text-[#eb3238] rounded transition-colors"
            title="Sair"
          >
            <LogOut size={14} />
          </button>
        </div>
      </div>
    </header>
  )
}
