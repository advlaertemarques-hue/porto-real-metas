import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { AuthProvider } from '@/contexts/AuthContext'
import { ModuleProvider } from '@/contexts/ModuleContext'

const inter = Inter({
  variable: '--font-geist-sans',
  subsets: ['latin'],
})

export const metadata: Metadata = {
  title: 'Porto Real — Sistema de Metas',
  description: 'Sistema de gestão de metas para corretores da Porto Real Imobiliária',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="pt-BR">
      <body className={`${inter.variable} font-sans bg-gray-50 antialiased`}>
        <AuthProvider>
          <ModuleProvider>
            {children}
          </ModuleProvider>
        </AuthProvider>
      </body>
    </html>
  )
}
