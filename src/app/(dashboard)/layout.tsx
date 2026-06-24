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
      <div className="flex flex-col h-screen overflow-hidden bg-[#FAF9F7] relative">
        {/* Discret blurred decorative background blobs */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
          <div className="absolute top-[-10%] left-[-10%] w-[50vw] h-[50vw] rounded-full bg-[#eb3238] opacity-[0.05] blur-[80px] md:blur-[120px]" />
          <div className="absolute bottom-[-10%] right-[-10%] w-[50vw] h-[50vw] rounded-full bg-[#1F4E79] opacity-[0.04] blur-[80px] md:blur-[120px]" />
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

