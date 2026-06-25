'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { PresenceProvider } from '@/contexts/PresenceContext'
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
      <div className="min-h-screen flex items-center justify-center bg-[#FAF9F7]">
        <div className="animate-pulse text-gray-400 font-medium">Carregando...</div>
      </div>
    )
  }

  if (!user) return null

  return (
    <PresenceProvider>
      <div className="glass-ui flex flex-col h-screen overflow-hidden relative bg-gradient-to-br from-[#EEF3FA] via-[#FAF9F7] to-[#F3EEF6]">
        {/* Decorative blurred background blobs — mais visíveis para o efeito de vidro */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
          <div className="absolute top-[-12%] left-[-8%] w-[48vw] h-[48vw] rounded-full bg-[#eb3238] opacity-[0.13] blur-[90px] md:blur-[130px]" />
          <div className="absolute bottom-[-14%] right-[-8%] w-[50vw] h-[50vw] rounded-full bg-[#33415C] opacity-[0.12] blur-[90px] md:blur-[130px]" />
          <div className="absolute top-[30%] left-[40%] w-[36vw] h-[36vw] rounded-full bg-[#47587A] opacity-[0.09] blur-[100px] md:blur-[140px]" />
        </div>

        <div className="app flex-1 min-h-0 relative z-10 bg-transparent flex flex-col">
          <Topbar />
          
          <div className="main flex-1 flex flex-col min-w-0 bg-transparent overflow-hidden">
            <div className="content !p-0 flex-1 overflow-y-auto bg-transparent">
              {children}
            </div>
          </div>
        </div>
      </div>
    </PresenceProvider>
  )
}

