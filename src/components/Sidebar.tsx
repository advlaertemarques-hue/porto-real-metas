'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useAuth, canAccessModule } from '@/contexts/AuthContext'
import { useModule } from '@/contexts/ModuleContext'
import { LogOut, X, Crown } from 'lucide-react'
import { useRouter } from 'next/navigation'

type NavItem = {
  href: string
  label: string
  icon: string
  sub?: string
}

type NavSection = {
  label: string
  items: NavItem[]
}

const VENDAS_NAV: NavSection[] = [
  {
    label: 'Principal',
    items: [
      { href: '/gestao-geral', label: 'Gestão Geral', icon: '📊' },
    ],
  },
  {
    label: 'Gestão',
    items: [
      { href: '/corretores', label: 'Corretores', icon: '👥' },
      { href: '/metas', label: 'Metas', icon: '🎯' },
      { href: '/lancamentos', label: 'Lançamentos', icon: '🏢' },
      { href: '/vendas-vgv', label: 'VGV e Alertas', icon: '💰' },
    ],
  },
  {
    label: 'Análise',
    items: [
      { href: '/treinamentos', label: 'Treinamentos', icon: '🎓' },
    ],
  },
  {
    label: 'Sistema',
    items: [
      { href: '/auditoria', label: 'Auditoria', icon: '🛡' },
    ],
  },
]

const ALUGUEL_NAV: NavSection[] = [
  {
    label: 'Menu',
    items: [
      { href: '/checklist', label: 'Checklist', icon: '✅' },
      { href: '/processos', label: 'Processos', icon: '🔀' },
      { href: '/pdi', label: 'Meu PDI', icon: '📈', sub: 'Visão restrita' },
      { href: '/documentos', label: 'Documentos', icon: '📂' },
    ],
  }
]

const INSTITUCIONAL_NAV: NavSection[] = [
  {
    label: 'Empresa',
    items: [
      { href: '/institucional', label: 'Sobre a Empresa', icon: '🏛️' },
      { href: '/quadro-de-avisos', label: 'Quadro de Avisos', icon: '📢' },
    ],
  }
]

function getInitials(nome: string) {
  const parts = nome.trim().split(' ')
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
}

interface SidebarProps {
  isOpen?: boolean
  onClose?: () => void
}

export default function Sidebar({ isOpen, onClose }: SidebarProps) {
  const { user, logout } = useAuth()
  const { activeModule, setActiveModule } = useModule()
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
    if (onClose) onClose()
  }

  // Determine nav sections based on active module
  let sections: NavSection[] = []
  if (activeModule === 'vendas') {
    sections = VENDAS_NAV
  } else if (activeModule === 'aluguel') {
    sections = ALUGUEL_NAV
  } else {
    sections = INSTITUCIONAL_NAV
  }

  // Filter sections and items based on role
  const filteredSections = sections
    .map(section => {
      // If user is sales broker (vendas) in vendas module, they only see Principal
      if (activeModule === 'vendas' && user.role === 'vendas') {
        if (section.label !== 'Principal') {
          return null
        }
      }
      return section
    })
    .filter(Boolean) as NavSection[]

  return (
    <aside className={`fixed inset-y-0 left-0 z-50 flex flex-col w-60 bg-[#0f172a] border-r border-slate-800/50 transition-transform duration-300 lg:static lg:translate-x-0 ${
      isOpen ? 'translate-x-0' : '-translate-x-full'
    }`}>
      {/* Brand Header */}
      <div className="h-16 px-5 border-b border-slate-800/60 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="h-8 w-8 bg-gradient-to-tr from-[#eb3238] to-[#f43f5e] rounded-lg flex items-center justify-center shadow-md">
            <Crown className="h-4 w-4 text-white" />
          </div>
          <div>
            <div className="font-extrabold text-[13px] text-white tracking-wide leading-none uppercase">Porto Real</div>
            <div className="text-[9px] text-[#eb3238] font-black uppercase tracking-wider mt-0.5">
              {activeModule === 'vendas' ? 'Vendas' : activeModule === 'aluguel' ? 'Aluguel' : 'Corporativo'}
            </div>
          </div>
        </div>
        <button 
          onClick={onClose} 
          className="lg:hidden text-slate-400 hover:text-white p-1 transition-colors"
          title="Fechar Menu"
        >
          <X size={18} />
        </button>
      </div>

      {/* Mobile-friendly Module Switcher inside Sidebar (visible on mobile only) */}
      <div className="px-4 py-3 border-b border-slate-800/40 bg-slate-950/20 lg:hidden">
        <select
          value={activeModule}
          onChange={(e) => handleModuleClick(e.target.value as any)}
          className="w-full bg-slate-900 border border-slate-800 text-slate-300 rounded-lg px-2.5 py-1.5 text-xs font-semibold outline-none cursor-pointer focus:border-[#eb3238]"
        >
          {canAccessModule(user.role, 'vendas') && <option value="vendas">📈 Módulo Vendas</option>}
          {canAccessModule(user.role, 'aluguel') && <option value="aluguel">🔑 Módulo Aluguel</option>}
          {canAccessModule(user.role, 'institucional') && <option value="institucional">🏢 Módulo Institucional</option>}
        </select>
      </div>

      {/* Nav items */}
      <div className="flex-1 overflow-y-auto px-3.5 py-4 space-y-4">
        {filteredSections.map((section, idx) => (
          <div key={idx} className="space-y-1">
            <span className="text-[9px] font-extrabold tracking-widest text-slate-500 uppercase px-3 block">
              {section.label}
            </span>
            <div className="space-y-0.5">
              {section.items.map((item, itemIdx) => {
                const isActive = pathname === item.href
                let activeClass = 'bg-[#eb3238]/10 text-red-400 font-semibold border-l-2 border-[#eb3238]'
                if (!isActive) activeClass = 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/30'

                return (
                  <Link
                    key={itemIdx}
                    href={item.href}
                    onClick={onClose}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-semibold transition-all ${activeClass}`}
                  >
                    <span className="text-base w-5 text-center">{item.icon}</span>
                    <div className="flex-1 min-w-0">
                      <div className="truncate">{item.label}</div>
                      {item.sub && <div className="text-[8px] text-slate-500 font-bold uppercase mt-0.5">{item.sub}</div>}
                    </div>
                  </Link>
                )
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Sidebar Footer User Info */}
      <div className="p-4 border-t border-slate-800/60 flex items-center gap-3 bg-slate-950/20">
        <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-blue-500 to-indigo-600 text-white font-black text-xs flex items-center justify-center shadow-sm">
          {getInitials(user.nome)}
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-xs font-bold text-slate-200 truncate">{user.nome}</div>
          <div className="text-[8px] text-slate-500 font-black uppercase tracking-wider mt-0.5">
            {user.role === 'superadmin' ? 'Diretoria' : 'Corretor'}
          </div>
        </div>
        <button
          onClick={() => logout()}
          className="p-1 text-slate-500 hover:text-slate-300 rounded transition-colors"
          title="Sair"
        >
          <LogOut size={15} />
        </button>
      </div>
    </aside>
  )
}
