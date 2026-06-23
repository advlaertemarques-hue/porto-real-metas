'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { useModule } from '@/contexts/ModuleContext'
import { LogOut } from 'lucide-react'

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

export default function Sidebar() {
  const { user, logout } = useAuth()
  const { activeModule } = useModule()
  const pathname = usePathname()

  if (!user) return null

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
    <aside className="sidebar">
      <div className="sb-nav">
        {filteredSections.map((section, idx) => (
          <div key={idx} className="nav-group">
            <span className="nav-group-label">{section.label}</span>
            <div className="space-y-1">
              {section.items.map((item, itemIdx) => {
                const isActive = pathname === item.href
                // Color accent class matching module in globals.css
                let activeClass = 'active'
                if (activeModule === 'institucional') activeClass = 'active-em'
                if (activeModule === 'vendas') activeClass = 'active-rd'
                if (activeModule === 'aluguel') activeClass = 'active-bl'

                return (
                  <Link
                    key={itemIdx}
                    href={item.href}
                    className={`nav-item ${isActive ? activeClass : ''}`}
                  >
                    <span className="nav-icon">{item.icon}</span>
                    <div className="flex-1 min-w-0">
                      <div className="truncate font-semibold">{item.label}</div>
                      {item.sub && <div className="text-[9px] text-slate-500 font-medium">{item.sub}</div>}
                    </div>
                  </Link>
                )
              })}
            </div>
          </div>
        ))}
      </div>

      <div className="sb-user">
        <div className="user-av">
          {getInitials(user.nome)}
        </div>
        <div className="flex-1 min-w-0">
          <div className="user-name truncate">{user.nome}</div>
          <div className="user-role uppercase tracking-wider font-extrabold text-[8px] text-slate-500">
            {user.role === 'superadmin' ? 'Diretoria' : 'Corretor'}
          </div>
        </div>
        <button
          onClick={() => logout()}
          className="logout-btn"
          title="Sair da Conta"
        >
          <LogOut size={16} />
        </button>
      </div>
    </aside>
  )
}
