'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { getSystemUsers, getVendasCorretores, getVendasEquipes } from '@/lib/api'
import { SystemUser, VendasCorretor, VendasEquipe } from '@/lib/types'
import GestaoUsuarios from '@/components/vendas/GestaoUsuarios'

export default function CorretoresPage() {
  const { user, loading: authLoading } = useAuth()
  const router = useRouter()
  const [systemUsers, setSystemUsers] = useState<SystemUser[]>([])
  const [corretores, setCorretores] = useState<VendasCorretor[]>([])
  const [equipes, setEquipes] = useState<VendasEquipe[]>([])
  const [dataLoading, setDataLoading] = useState(true)

  useEffect(() => {
    if (authLoading) return
    if (!user) {
      router.replace('/login')
      return
    }

    if (user.role === 'vendas') {
      router.replace('/gestao-geral')
      return
    }

    async function loadData() {
      try {
        const [sysUsers, corrs, eqps] = await Promise.all([
          getSystemUsers(),
          getVendasCorretores(),
          getVendasEquipes()
        ])
        setSystemUsers(sysUsers)
        setCorretores(corrs)
        setEquipes(eqps)
      } catch (err) {
        console.error("Erro ao carregar dados de usuários:", err)
      } finally {
        setDataLoading(false)
      }
    }
    loadData()
  }, [user, authLoading, router])

  if (authLoading || dataLoading) {
    return (
      <div className="flex h-[80vh] items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-3">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-[#1F4E79] border-t-transparent"></div>
          <span className="text-sm font-semibold text-slate-600">Carregando controle de acessos...</span>
        </div>
      </div>
    )
  }

  if (user?.role !== 'superadmin') return null

  return (
    <div className="bg-slate-50 min-h-screen">
      <GestaoUsuarios
        systemUsers={systemUsers}
        setSystemUsers={setSystemUsers}
        corretores={corretores}
        setCorretores={setCorretores}
        equipes={equipes}
        user={user}
      />
    </div>
  )
}
