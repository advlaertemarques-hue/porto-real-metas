'use client'

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { SystemModule } from '@/lib/types'
import { useAuth, canAccessModule } from './AuthContext'

interface ModuleContextType {
  activeModule: SystemModule
  setActiveModule: (mod: SystemModule) => void
}

const ModuleContext = createContext<ModuleContextType>({
  activeModule: 'vendas',
  setActiveModule: () => {},
})

const MODULE_KEY = 'porto_active_module'

export function ModuleProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth()
  const [activeModule, setActiveModuleState] = useState<SystemModule>('vendas')
  const [initialized, setInitialized] = useState(false)

  useEffect(() => {
    if (!user) {
      // Logout: permite reinicialização no próximo login
      if (initialized) setInitialized(false)
      return
    }

    // Já inicializado: ignora refreshes de token do Supabase (foco de janela etc.)
    if (initialized) return

    // Força o módulo de vendas como único e ativo, limpando resquícios do cache do navegador
    setActiveModuleState('vendas')
    localStorage.setItem(MODULE_KEY, 'vendas')
    setInitialized(true)
  }, [user, initialized])

  const setActiveModule = (mod: SystemModule) => {
    if (user && canAccessModule(user.role, mod)) {
      setActiveModuleState(mod)
      localStorage.setItem(MODULE_KEY, mod)
    }
  }

  return (
    <ModuleContext.Provider value={{ activeModule, setActiveModule }}>
      {children}
    </ModuleContext.Provider>
  )
}

export const useModule = () => useContext(ModuleContext)
