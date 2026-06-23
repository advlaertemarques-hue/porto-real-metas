'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'

export default function RootPage() {
  const { user, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (loading) return
    if (user) {
      router.replace('/gestao-geral')
    } else {
      router.replace('/login')
    }
  }, [user, loading, router])

  return (
    <div className="min-h-screen flex items-center justify-center bg-porto-navy">
      <div className="animate-pulse">
        <h1 className="text-white text-2xl font-bold">Porto Real</h1>
      </div>
    </div>
  )
}
