'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { getVendasClientes, getVendasPesquisas } from '@/lib/api'
import { VendasCliente, VendasPesquisa } from '@/lib/types'
import GestaoMetas from '@/components/vendas/GestaoMetas'

export default function MetasPage() {
  const { user, loading: authLoading } = useAuth()
  const router = useRouter()
  const [clientes, setClientes] = useState<VendasCliente[]>([])
  const [pesquisas, setPesquisas] = useState<VendasPesquisa[]>([])
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
        const [cls, psqs] = await Promise.all([
          getVendasClientes(),
          getVendasPesquisas()
        ])
        setClientes(cls)
        setPesquisas(psqs)
      } catch (err) {
        console.error("Erro ao carregar dados de metas:", err)
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
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-[#33415C] border-t-transparent"></div>
          <span className="text-sm font-semibold text-slate-600">Carregando metas...</span>
        </div>
      </div>
    )
  }

  if (user?.role !== 'superadmin') return null

  return (
    <div className="p-6 bg-slate-50 min-h-screen">
      <GestaoMetas clientes={clientes} pesquisas={pesquisas} />
    </div>
  )
}
