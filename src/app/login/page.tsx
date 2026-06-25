'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import Logo from '@/components/Logo'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const { user, login } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (user) router.replace('/quadro-de-avisos')
  }, [user, router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setIsLoading(true)

    const success = await login(email, password)
    if (success) {
      router.push('/quadro-de-avisos')
    } else {
      setError('Email ou senha inválidos.')
    }
    setIsLoading(false)
  }

  return (
    <div className="min-h-screen bg-porto-navy flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="flex flex-col items-center mb-10">
          <Logo iconSize={40} fontSize="text-4xl" textClassName="text-white" />
          <p className="text-gray-500 text-sm mt-3 uppercase tracking-widest">
            Sistema de Metas
          </p>
        </div>

        {/* Login Card */}
        <div className="bg-white rounded-2xl p-8 shadow-2xl shadow-black/20">
          <h2 className="text-xl font-bold text-gray-900 mb-1">Entrar</h2>
          <p className="text-sm text-gray-400 mb-6">
            Acesse sua conta para gerenciar o sistema
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="seu@email.com"
                className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm text-gray-800 placeholder:text-gray-300 focus:outline-none focus:border-porto-blue focus:ring-2 focus:ring-porto-blue/10 transition-all"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
                Senha
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm text-gray-800 placeholder:text-gray-300 focus:outline-none focus:border-porto-blue focus:ring-2 focus:ring-porto-blue/10 transition-all"
                required
              />
            </div>

            {error && (
              <p className="text-porto-red text-sm bg-red-50 px-4 py-2 rounded-lg">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 bg-porto-red text-white font-semibold rounded-xl hover:bg-porto-red-dark transition-colors shadow-lg shadow-porto-red/20 disabled:opacity-60"
            >
              {isLoading ? 'Entrando...' : 'Entrar'}
            </button>
          </form>


        </div>
      </div>
    </div>
  )
}
