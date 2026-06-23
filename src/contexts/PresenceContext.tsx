'use client'

import { createContext, useContext, useEffect, useState, ReactNode, useRef } from 'react'
import { createClient } from '@/lib/supabase'
import { useAuth } from './AuthContext'

export interface OnlineUser {
  userId: string
  nome: string
  email: string
}

interface PresenceContextType {
  onlineUsers: Record<string, OnlineUser> // userId -> dados
}

const PresenceContext = createContext<PresenceContextType>({
  onlineUsers: {},
})

const supabase = createClient()

export function PresenceProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth()
  const [onlineUsers, setOnlineUsers] = useState<Record<string, OnlineUser>>({})
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null)

  useEffect(() => {
    if (!user) {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current)
        channelRef.current = null
      }
      setOnlineUsers({})
      return
    }

    const channel = supabase.channel('presence:porto-real', {
      config: { presence: { key: user.id } },
    })

    channelRef.current = channel

    channel
      .on('presence', { event: 'sync' }, () => {
        const state = channel.presenceState()
        const online: Record<string, OnlineUser> = {}
        Object.entries(state).forEach(([uid, presences]) => {
          const p = (presences as unknown as Array<{ nome: string; email: string }>)[0]
          if (p) online[uid] = { userId: uid, nome: p.nome || 'Usuário', email: p.email || '' }
        })
        setOnlineUsers(online)
      })
      .on('presence', { event: 'join' }, ({ key, newPresences }) => {
        const p = (newPresences as unknown as Array<{ nome: string; email: string }>)[0]
        if (p) {
          setOnlineUsers((prev) => ({
            ...prev,
            [key]: { userId: key, nome: p.nome || 'Usuário', email: p.email || '' },
          }))
        }
      })
      .on('presence', { event: 'leave' }, ({ key }) => {
        setOnlineUsers((prev) => {
          const next = { ...prev }
          delete next[key]
          return next
        })
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          await channel.track({
            nome: user.nome,
            email: user.email,
          })
        }
      })

    return () => {
      supabase.removeChannel(channel)
    }
  }, [user])

  return (
    <PresenceContext.Provider value={{ onlineUsers }}>
      {children}
    </PresenceContext.Provider>
  )
}

export const usePresence = () => useContext(PresenceContext)
