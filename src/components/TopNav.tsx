'use client'

import { useAuth, canAccessModule } from '@/contexts/AuthContext'
import { useModule } from '@/contexts/ModuleContext'
import { usePresence } from '@/contexts/PresenceContext'
import { useRouter } from 'next/navigation'
import { LogOut, Shield } from 'lucide-react'

function getInitials(nome: string) {
  const parts = nome.trim().split(' ')
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
}

export default function TopNav() {
  const { user, logout } = useAuth()
  const { activeModule, setActiveModule } = useModule()
  const { onlineUsers } = usePresence()
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

  const onlineCount = Object.keys(onlineUsers).length || 1

  return (
    <nav className="topnav">
      <div className="tn-brand">
        <div className="tn-logo-icon">PR</div>
        <span className="tn-logo-text">Porto Real</span>
      </div>

      <div className="tn-divider" />

      <div className="flex gap-1">
        {canAccessModule(user.role, 'institucional') && (
          <button
            onClick={() => handleModuleClick('institucional')}
            className={`mod-btn ${activeModule === 'institucional' ? 'active-inst' : ''}`}
          >
            🏢 Institucional
          </button>
        )}
        {canAccessModule(user.role, 'vendas') && (
          <button
            onClick={() => handleModuleClick('vendas')}
            className={`mod-btn ${activeModule === 'vendas' ? 'active-vend' : ''}`}
          >
            📈 Vendas
          </button>
        )}
        {canAccessModule(user.role, 'aluguel') && (
          <button
            onClick={() => handleModuleClick('aluguel')}
            className={`mod-btn ${activeModule === 'aluguel' ? 'active-alug' : ''}`}
          >
            🔑 Aluguel
          </button>
        )}
      </div>

      <div className="tn-spacer" />

      <div className="tn-right">
        <div className="tn-online">
          <span className="tn-online-dot" />
          {onlineCount > 1 ? `${onlineCount} Online` : 'Online'}
        </div>

        {user.role === 'superadmin' && (
          <button 
            onClick={() => router.push('/auditoria')}
            className="tn-notif" 
            title="Painel de Auditoria"
          >
            <Shield size={16} />
          </button>
        )}

        <div className="tn-user">
          <div className="tn-av">
            {getInitials(user.nome)}
          </div>
          <span className="tn-uname">{user.nome}</span>
        </div>

        <button 
          onClick={() => {
            logout()
            router.push('/login')
          }}
          className="tn-notif" 
          title="Sair"
        >
          <LogOut size={16} />
        </button>
      </div>
    </nav>
  )
}
