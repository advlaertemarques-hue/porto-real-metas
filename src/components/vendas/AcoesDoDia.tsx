'use client'

import { ClipboardList } from 'lucide-react'
import { VendasCliente, VendasCorretor, User } from '@/lib/types'
import { ETAPAS, TEMP_CFG } from '@/lib/constants'

interface AcoesDoDiaProps {
  clientes: VendasCliente[]
  corretores: VendasCorretor[]
  user: User | null
  setActiveId: (id: string | null) => void
  setActiveView: (view: any) => void
}

export default function AcoesDoDia({
  clientes,
  corretores,
  user,
  setActiveId,
  setActiveView
}: AcoesDoDiaProps) {
  if (!user) return null

  const isGestor = user.role === 'superadmin'

  // Encontra corretor correspondente ao usuário logado
  const myCorretor = corretores.find(co => co.user_id === user.id)

  // Nome do corretor dono da tarefa (o gestor precisa saber de quem é cada ação).
  const corretorNome = (id: string | null | undefined) =>
    corretores.find(co => co.id === id)?.nome || 'Sem corretor'

  const brokerClients = clientes.filter(c => {
    // Cada corretor vê só as suas ações; o gestor enxerga as de todos.
    const isMyClient = isGestor || c.corretor_id === myCorretor?.id
    // Processo finalizado (ganho/perdido) ou arquivado como interessado sai do
    // funil e some das ações — já não há próxima tarefa a cobrar.
    const ativoNoFunil = !c.finalizado && c.status_finalizacao !== 'interessado'
    return isMyClient && ativoNoFunil && c.proxima_acao
  })

  const sortedClients = [...brokerClients].sort((a, b) => {
    if (!a.proxima_acao_data) return 1
    if (!b.proxima_acao_data) return -1
    return new Date(a.proxima_acao_data).getTime() - new Date(b.proxima_acao_data).getTime()
  })

  // Status por DIA (hoje continua "Hoje" mesmo se o horário já passou — mais
  // justo com o corretor do que gritar "atrasada" às 10h por algo das 9h).
  const dayStatus = (dataStr?: string | null): 'atrasado' | 'hoje' | 'futuro' | 'semdata' => {
    if (!dataStr) return 'semdata'
    const due = new Date(dataStr)
    if (isNaN(due.getTime())) return 'semdata'
    const now = new Date()
    const t0 = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime()
    const d0 = new Date(due.getFullYear(), due.getMonth(), due.getDate()).getTime()
    if (d0 < t0) return 'atrasado'
    if (d0 === t0) return 'hoje'
    return 'futuro'
  }

  const counts = { atrasado: 0, hoje: 0, futuro: 0, semdata: 0 }
  sortedClients.forEach(c => { counts[dayStatus(c.proxima_acao_data)]++ })

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6 animate-fadeIn">
      {/* Header */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-md">
        <h2 className="text-xl md:text-2xl font-black text-[#33415C] tracking-tight flex items-center gap-2">
          <ClipboardList className="text-[#eb3238]" size={24} />
          Ações de Hoje
        </h2>
        <p className="text-xs text-slate-500 font-semibold mt-1">
          {counts.atrasado > 0
            ? `${isGestor ? 'A equipe tem' : 'Você tem'} ${counts.atrasado} ${counts.atrasado === 1 ? 'ação atrasada' : 'ações atrasadas'} — priorize esses contatos para não esfriar o funil.`
            : isGestor
              ? 'Próximas tarefas agendadas de toda a equipe. Acompanhe quem está com cada contato.'
              : 'Aqui estão as próximas tarefas agendadas para os seus clientes. Mantenha os contatos em dia!'}
        </p>

        {sortedClients.length > 0 && (
          <div className="grid grid-cols-3 gap-2.5 mt-4">
            <div className="rounded-xl border border-rose-100 bg-rose-50/60 p-3 text-center">
              <div className="text-2xl font-black text-[#eb3238] leading-none">{counts.atrasado}</div>
              <div className="text-[10px] font-extrabold text-rose-700/80 uppercase tracking-wide mt-1">⏰ Atrasadas</div>
            </div>
            <div className="rounded-xl border border-amber-100 bg-amber-50/60 p-3 text-center">
              <div className="text-2xl font-black text-amber-600 leading-none">{counts.hoje}</div>
              <div className="text-[10px] font-extrabold text-amber-700/80 uppercase tracking-wide mt-1">📌 Para hoje</div>
            </div>
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-center">
              <div className="text-2xl font-black text-slate-600 leading-none">{counts.futuro}</div>
              <div className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wide mt-1">📅 Próximas</div>
            </div>
          </div>
        )}
      </div>

      {/* List of actions */}
      <div className="space-y-3">
        {sortedClients.length === 0 ? (
          <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center shadow-sm">
            <ClipboardList size={48} className="text-slate-200 mx-auto mb-4" />
            <h3 className="text-lg font-bold text-slate-400">Nenhuma ação agendada</h3>
            <p className="text-xs text-slate-300 mt-1">
              Defina lembretes de próxima ação dentro da ficha de cada cliente para organizá-los aqui.
            </p>
          </div>
        ) : (
          sortedClients.map(c => {
            const actDate = c.proxima_acao_data ? new Date(c.proxima_acao_data) : null
            const { color: badgeColor, text: badgeText } = {
              atrasado: { color: 'bg-rose-50 text-rose-700 border-rose-100 animate-pulse', text: 'Atrasada' },
              hoje: { color: 'bg-amber-50 text-amber-700 border-amber-100', text: 'Hoje' },
              futuro: { color: 'bg-slate-100 text-slate-700 border-slate-200', text: 'Futura' },
              semdata: { color: 'bg-slate-100 text-slate-500 border-slate-200', text: 'Sem data' },
            }[dayStatus(c.proxima_acao_data)]

            const tc = TEMP_CFG[c.temp as keyof typeof TEMP_CFG] || TEMP_CFG.quente

            return (
              <div
                key={c.id}
                className="bg-white border border-slate-200 hover:border-slate-300 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all flex flex-col md:flex-row justify-between items-start md:items-center gap-4"
              >
                <div className="space-y-1.5 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={`text-[10px] font-extrabold uppercase px-2 py-0.5 border rounded-md ${badgeColor}`}>
                      {badgeText}
                    </span>
                    <span className="font-extrabold text-sm text-slate-800">{c.nome}</span>
                    {isGestor && (
                      <span className="text-[10px] bg-[#EEF4FA] text-[#33415C] border border-[#D6E4F0] px-2 py-0.5 rounded-full font-bold flex items-center gap-1">
                        👤 {corretorNome(c.corretor_id)}
                      </span>
                    )}
                    <span className="text-[10px] bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full font-semibold">
                      Etapa {c.etapa + 1}: {ETAPAS[c.etapa]?.nome || 'Lead'}
                    </span>
                    <span className="flex items-center gap-1 text-[10px] text-slate-400 font-medium">
                      <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: tc.cor }}></span>
                      {tc.rotulo}
                    </span>
                  </div>
                  <p className="text-xs font-bold text-slate-600 bg-slate-50 border border-slate-100 p-3 rounded-xl">
                    👉 {c.proxima_acao}
                  </p>
                  <div className="text-[10px] text-slate-400 font-semibold flex items-center gap-1">
                    📅 Agendado para: {actDate ? actDate.toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' }) : 'Sem data de vencimento'}
                  </div>
                </div>

                <button
                  onClick={() => {
                    setActiveId(c.id)
                    setActiveView('funil')
                  }}
                  className="bg-[#33415C] hover:bg-[#232E42] text-white px-4 py-2 rounded-xl text-xs font-extrabold shadow-sm transition-all whitespace-nowrap self-stretch md:self-auto text-center cursor-pointer"
                >
                  Abrir no Funil
                </button>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}
