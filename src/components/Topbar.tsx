'use client'

import { useModule } from '@/contexts/ModuleContext'
import { usePathname } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'

export default function Topbar() {
  const { activeModule } = useModule()
  const { user } = useAuth()
  const pathname = usePathname()

  if (!user) return null

  // Determine page title and sub
  let pageTitle = 'Gestão Geral'
  let pageSub = 'Painel de Operações e Acompanhamento de Metas'

  if (pathname === '/gestao-geral') {
    pageTitle = activeModule === 'vendas' ? 'CRM & Funil de Vendas' : 'Operação Comercial'
    pageSub = activeModule === 'vendas' ? 'Ações diárias e gestão de clientes' : 'Apoio geral de metas'
  } else if (pathname === '/institucional') {
    pageTitle = 'Institucional'
    pageSub = 'Painel Institucional e Avisos Gerais da Porto Real'
  } else if (pathname === '/checklist') {
    pageTitle = 'Aluguel'
    pageSub = 'Checklists de locação e acompanhamento'
  } else if (pathname === '/vendas-vgv') {
    pageTitle = 'VGV e Estatísticas'
    pageSub = 'Indicadores consolidados de Volume Geral de Vendas'
  } else {
    // Fallback from path
    const parts = pathname.split('/').filter(Boolean)
    if (parts.length > 0) {
      const last = parts[parts.length - 1].replace(/-/g, ' ')
      pageTitle = last.charAt(0).toUpperCase() + last.slice(1)
      pageSub = 'Painel de controle e operações'
    }
  }

  return (
    <header className="page-topbar">
      <div className="topbar-breadcrumb">
        <h2 className="topbar-page uppercase font-black text-slate-800 tracking-tight text-xs md:text-sm">{pageTitle}</h2>
        <p className="topbar-sub font-semibold text-[10px] text-slate-400 mt-0.5">{pageSub}</p>
      </div>
    </header>
  )
}
