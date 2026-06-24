'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import BancoDados from '@/components/vendas/BancoDados'

export default function BancoDadosPage() {
  const { user, loading: authLoading } = useAuth()
  const router = useRouter()

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
  }, [user, authLoading, router])

  if (authLoading) {
    return (
      <div className="flex h-[80vh] items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-3">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-[#1F4E79] border-t-transparent"></div>
          <span className="text-sm font-semibold text-slate-600">Verificando permissões...</span>
        </div>
      </div>
    )
  }

  if (user?.role !== 'superadmin') return null

  return (
    <div className="bg-slate-50 min-h-screen">
      <BancoDados />
    </div>
  )
}
