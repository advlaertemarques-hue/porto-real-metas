'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { PresenceProvider } from '@/contexts/PresenceContext'
import Sidebar from '@/components/Sidebar'
import TopNav from '@/components/TopNav'
import Topbar from '@/components/Topbar'
import { useModule } from '@/contexts/ModuleContext'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { user, loading } = useAuth()
  const { activeModule } = useModule()
  const router = useRouter()

  useEffect(() => {
    if (!loading && !user) {
      router.replace('/login')
    }
  }, [user, loading, router])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-pulse text-gray-400">Carregando...</div>
      </div>
    )
  }

  if (!user) return null

  return (
    <PresenceProvider>
      <div className="flex flex-col h-screen overflow-hidden">
        <TopNav />
        <div className="app flex-1 min-h-0">
          <Sidebar />
          <div className="main">
            <Topbar />
            <div className="content !p-0 flex-1 overflow-y-auto">
              {children}
            </div>
          </div>
        </div>
      </div>
    </PresenceProvider>
  )
}

