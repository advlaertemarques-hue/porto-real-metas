'use client'

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { User as SupabaseUser } from '@supabase/supabase-js'
import { UserRole, SystemModule } from '@/lib/types'
import { createClient } from '@/lib/supabase'

interface AuthUser {
  id: string
  email: string
  nome: string
  role: UserRole
  avatar_url?: string
}

interface AuthContextType {
  user: AuthUser | null
  loading: boolean
  login: (email: string, password: string) => Promise<boolean>
  logout: () => void
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  login: async () => false,
  logout: () => {},
})

const supabase = createClient()

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [loading, setLoading] = useState(true)

  // Busca o profile com metas_role do Supabase
  const loadProfile = async (supabaseUser: SupabaseUser) => {
    const { data: profile, error } = await supabase
      .from('profiles')
      .select('full_name, metas_role')
      .eq('id', supabaseUser.id)
      .single()

    if (error || !profile) {
      console.error('Erro ao buscar profile:', error)
      // Cria um perfil se não existir
      const { data: newProfile } = await supabase
        .from('profiles')
        .upsert({
          id: supabaseUser.id,
          full_name: supabaseUser.email?.split('@')[0] || 'Usuário',
          metas_role: 'vendas',
        })
        .select('full_name, metas_role')
        .single()

      if (newProfile) {
        setUser({
          id: supabaseUser.id,
          email: supabaseUser.email || '',
          nome: newProfile.full_name || 'Usuário',
          role: (newProfile.metas_role as UserRole) || 'vendas',
        })
      }
      return
    }

    setUser({
      id: supabaseUser.id,
      email: supabaseUser.email || '',
      nome: profile.full_name || 'Usuário',
      role: (profile.metas_role as UserRole) || 'vendas',
    })
  }

  useEffect(() => {
    // Checa sessão existente no Supabase
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        loadProfile(session.user).finally(() => setLoading(false))
      } else {
        setLoading(false)
      }
    })

    // Escuta mudanças de auth
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        loadProfile(session.user)
      } else {
        setUser(null)
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  const login = async (email: string, password: string): Promise<boolean> => {
    const cleanEmail = email.trim().toLowerCase()
    const cleanPassword = password.trim()
    
    console.log('Tentativa de login real via Supabase:', cleanEmail)

    const { error } = await supabase.auth.signInWithPassword({
      email: cleanEmail,
      password: cleanPassword,
    })

    if (error) {
      console.error('Erro no login Supabase:', error.message)
    }

    return !error
  }

  const logout = async () => {
    localStorage.removeItem('porto_active_module')
    await supabase.auth.signOut()
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)

// Helper: verifica se o role tem acesso ao módulo
export function canAccessModule(role: UserRole, modulo: SystemModule): boolean {
  if (modulo === 'aluguel') return false
  if (modulo === 'institucional') return true
  if (role === 'superadmin') return true
  return role === modulo
}
