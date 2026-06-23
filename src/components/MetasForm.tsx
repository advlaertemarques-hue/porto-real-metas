'use client'

import { MetaGlobal, VersaoMeta } from '@/lib/types'

interface MetasFormProps {
  meta: MetaGlobal
  versoes: VersaoMeta[]
}

export default function MetasForm({ meta, versoes }: MetasFormProps) {
  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="bg-white border border-gray-100 rounded-xl p-8">
        <div className="flex items-baseline justify-between mb-8">
          <div>
            <h2 className="text-xl font-bold text-gray-900">
              Configuração de Metas Globais{' '}
              <span className="text-gray-400 font-normal">
                — Versão {meta.versao} (Vigente)
              </span>
            </h2>
          </div>
          <span className="text-sm text-gray-400">
            Vigente desde {meta.vigencia_inicio}
          </span>
        </div>

        {/* Período de Vigência */}
        <Section label="PERÍODO DE VIGÊNCIA">
          <FormRow label="Início da Vigência" sublabel="Mês/Ano que esta meta começa a valer">
            <div className="flex gap-2">
              <Select options={MESES} defaultValue="Março" />
              <Select options={ANOS} defaultValue="2026" />
            </div>
          </FormRow>
          <FormRow label="Término da Vigência" sublabel="Opcional. Deixe em branco para tempo indeterminado">
            <div className="flex gap-2">
              <Select options={['Mês', ...MESES]} defaultValue="Mês" />
              <Select options={['Ano', ...ANOS]} defaultValue="Ano" />
            </div>
          </FormRow>
        </Section>

        {/* Metas Semanais */}
        <Section label="METAS SEMANAIS">
          <FormRow label="Contatos ativos" sublabel="Registros por semana (seg-dom)">
            <NumberInput defaultValue={meta.metas_semanais.contatos_ativos} />
          </FormRow>
          <FormRow label="Postagem Instagram" sublabel="Obrigatória, compartilhada com imobiliária">
            <NumberInput defaultValue={meta.metas_semanais.postagem_instagram} />
          </FormRow>
        </Section>

        {/* Metas Mensais */}
        <Section label="METAS MENSAIS">
          <FormRow label="Visitas de vendas" sublabel="Visitas no mês">
            <NumberInput defaultValue={meta.metas_mensais.visitas_vendas} />
          </FormRow>
          <FormRow label="Captação com exclusividade" sublabel="Venda ou locação">
            <NumberInput defaultValue={meta.metas_mensais.captacao_exclusividade} />
          </FormRow>
          <FormRow label="Semanas válidas mínimas" sublabel="Para validar o mês">
            <NumberInput defaultValue={meta.metas_mensais.semanas_validas_minimas} />
          </FormRow>
        </Section>

        {/* Meta Anual */}
        <Section label="META ANUAL (JANELA MÓVEL)">
          <FormRow label="VGV acumulado mínimo" sublabel="Últimos 12 meses">
            <div className="flex items-center gap-1">
              <span className="text-sm text-gray-400">R$</span>
              <NumberInput defaultValue={meta.meta_anual.vgv_acumulado_minimo} />
            </div>
          </FormRow>
          <FormRow label="Meses válidos mínimos" sublabel="Nos últimos 12 meses">
            <NumberInput defaultValue={meta.meta_anual.meses_validos_minimos} />
          </FormRow>
        </Section>

        {/* Comissão Escalonada */}
        <Section label="COMISSÃO ESCALONADA">
          <FormRow label="Nível Base" sublabel="Sem metas">
            <PercentInput defaultValue={meta.comissao_escalonada.nivel_base} />
          </FormRow>
          <FormRow label="Nível Mensal" sublabel="5 meses consecutivos">
            <PercentInput defaultValue={meta.comissao_escalonada.nivel_mensal} />
          </FormRow>
          <FormRow label="Nível Anual" sublabel="VGV + meses válidos">
            <PercentInput defaultValue={meta.comissao_escalonada.nivel_anual} />
          </FormRow>
        </Section>

        {/* Actions */}
        <div className="flex justify-end gap-3 mt-8 pt-6 border-t border-gray-100">
          <button className="px-6 py-2.5 border border-gray-200 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors">
            Cancelar
          </button>
          <button className="px-6 py-2.5 bg-porto-red text-white rounded-lg text-sm font-medium hover:bg-porto-red-dark transition-colors shadow-sm">
            Salvar nova versão
          </button>
        </div>
      </div>

      {/* Histórico de Versões */}
      <div className="bg-white border border-gray-100 rounded-xl p-8">
        <h3 className="text-lg font-bold text-gray-900 mb-6">Histórico de Versões</h3>
        <table className="w-full">
          <thead>
            <tr className="text-[10px] uppercase tracking-wider text-gray-400">
              <th className="text-left pb-4 font-semibold">Versão</th>
              <th className="text-left pb-4 font-semibold">Vigência</th>
              <th className="text-left pb-4 font-semibold">Alterado por</th>
              <th className="text-left pb-4 font-semibold">Data</th>
            </tr>
          </thead>
          <tbody>
            {versoes.map((v, i) => (
              <tr key={i} className="border-t border-gray-50">
                <td className="py-4 text-sm">
                  {v.vigente ? (
                    <span className="text-porto-blue font-semibold">{v.versao}</span>
                  ) : (
                    <span className="text-gray-600">{v.versao}</span>
                  )}
                </td>
                <td className="py-4 text-sm text-gray-600">{v.vigencia}</td>
                <td className="py-4 text-sm text-gray-600">{v.alterado_por}</td>
                <td className="py-4 text-sm text-gray-600">{v.data}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

// ============================================================
// Sub-components
// ============================================================

function Section({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="mb-6">
      <p className="text-[10px] font-semibold uppercase tracking-wider text-porto-blue mb-4 mt-6">
        {label}
      </p>
      <div className="space-y-0">{children}</div>
    </div>
  )
}

function FormRow({
  label,
  sublabel,
  children,
}: {
  label: string
  sublabel: string
  children: React.ReactNode
}) {
  return (
    <div className="flex items-center justify-between py-3 border-b border-gray-50">
      <div>
        <p className="text-sm font-medium text-gray-800">{label}</p>
        <p className="text-xs text-gray-400">{sublabel}</p>
      </div>
      {children}
    </div>
  )
}

function NumberInput({ defaultValue }: { defaultValue: number }) {
  return (
    <input
      type="number"
      defaultValue={defaultValue}
      className="w-28 px-3 py-2 border border-gray-200 rounded-lg text-sm text-right text-gray-700 focus:outline-none focus:border-porto-blue focus:ring-1 focus:ring-porto-blue/20"
    />
  )
}

function PercentInput({ defaultValue }: { defaultValue: number }) {
  return (
    <div className="flex items-center gap-1">
      <input
        type="number"
        defaultValue={defaultValue}
        className="w-20 px-3 py-2 border border-gray-200 rounded-lg text-sm text-right text-gray-700 focus:outline-none focus:border-porto-blue focus:ring-1 focus:ring-porto-blue/20"
      />
      <span className="text-sm text-gray-400">%</span>
    </div>
  )
}

function Select({ options, defaultValue }: { options: string[]; defaultValue: string }) {
  return (
    <select
      defaultValue={defaultValue}
      className="px-3 py-2 border border-gray-200 rounded-lg text-sm text-gray-700 focus:outline-none focus:border-porto-blue appearance-none bg-white pr-8"
    >
      {options.map((o) => (
        <option key={o} value={o}>
          {o}
        </option>
      ))}
    </select>
  )
}

const MESES = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
]

const ANOS = ['2024', '2025', '2026', '2027', '2028']
