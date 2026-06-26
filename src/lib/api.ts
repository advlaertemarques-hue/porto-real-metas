import { createClient } from '@/lib/supabase'
import { ETAPAS, I_VISITA } from '@/lib/constants'
import {
  Corretor,
  MetaGlobal,
  Venda,
  DashboardStats,
  TopCorretor,
  EquipeInfo,
  VersaoMeta,
  SystemModule,
  Aviso,
  ChecklistContrato,
  ChecklistPendencia,
  ProcessoSetor,
  ProcessoItem,
  PDIProfile,
  PDIRecord,
  PDIAcao,
  DocumentoCategoria,
  DocumentoItem,
  VendasEquipe,
  VendasCorretor,
  VendasMetasDefinicao,
  VendasLancamento,
  VendasTreinamentoCategoria,
  VendasTreinamentoItem,
  VendasCliente,
  VendasClienteNota,
  VendasClienteChecklist,
  VendasPesquisa,
  SystemUser,
  VendasMTempoResposta,
  VendasMFunil,
  VendasMNoShow,
  VendasMHandoff,
  VendasMLaisVsHumano,
  VendasMGargalo,
  VendasMOndeTreinar,
  VendasMTravasPagamento,
  VendasMCicloTotal,
  VendasAlerta
} from '@/lib/types'

const supabase = createClient()

// ============================================================
// CORRETORES
// ============================================================

export async function getCorretores(modulo: SystemModule): Promise<Corretor[]> {
  const { data, error } = await supabase
    .from('corretores')
    .select('*, equipes(nome)')
    .eq('modulo', modulo)
    .order('nome', { ascending: true })

  if (error) {
    console.error('Erro ao buscar corretores:', error)
    return []
  }

  return (data || []).map((c: any) => ({
    id: c.id,
    nome: c.nome,
    email: c.email,
    creci: c.creci || '',
    equipe: c.equipes?.nome || null,
    status: c.status,
    nivel_atual: c.nivel_atual,
    cor_barra: c.cor_barra,
    modulo: c.modulo,
  }))
}

export async function createCorretor(corretor: Omit<Corretor, 'id'>): Promise<Corretor | null> {
  // Lookup equipe_id by nome
  let equipe_id = null
  if (corretor.equipe) {
    const { data: eq } = await supabase
      .from('equipes')
      .select('id')
      .eq('nome', corretor.equipe)
      .single()
    equipe_id = eq?.id || null
  }

  const { data, error } = await supabase
    .from('corretores')
    .insert([{
      nome: corretor.nome,
      email: corretor.email,
      creci: corretor.creci,
      equipe_id,
      status: corretor.status,
      nivel_atual: corretor.nivel_atual,
      cor_barra: corretor.cor_barra,
      modulo: corretor.modulo,
    }])
    .select('*, equipes(nome)')
    .single()

  if (error) {
    console.error('Erro ao criar corretor:', error)
    return null
  }

  return {
    id: data.id,
    nome: data.nome,
    email: data.email,
    creci: data.creci || '',
    equipe: data.equipes?.nome || null,
    status: data.status,
    nivel_atual: data.nivel_atual,
    cor_barra: data.cor_barra,
    modulo: data.modulo,
  }
}

// ============================================================
// EQUIPES
// ============================================================

export async function getEquipes(): Promise<EquipeInfo[]> {
  const { data: equipes, error: eqError } = await supabase
    .from('equipes')
    .select('id, nome, sigla')
    .order('nome', { ascending: true })

  if (eqError || !equipes) return []

  // Count corretores per equipe
  const result: EquipeInfo[] = []
  for (const eq of equipes) {
    const { count } = await supabase
      .from('corretores')
      .select('*', { count: 'exact', head: true })
      .eq('equipe_id', eq.id)

    result.push({
      nome: eq.nome,
      sigla: eq.sigla,
      qtd_corretores: count || 0,
    })
  }

  return result
}

// ============================================================
// DASHBOARD STATS
// ============================================================

export async function getDashboardStats(modulo: SystemModule): Promise<DashboardStats> {
  // Total de corretores ativos
  const { count: ativos } = await supabase
    .from('corretores')
    .select('*', { count: 'exact', head: true })
    .eq('modulo', modulo)
    .eq('status', 'ativo')

  const { count: inativos } = await supabase
    .from('corretores')
    .select('*', { count: 'exact', head: true })
    .eq('modulo', modulo)
    .eq('status', 'inativo')

  const { count: total } = await supabase
    .from('corretores')
    .select('*', { count: 'exact', head: true })
    .eq('modulo', modulo)

  // VGV total dos últimos 12 meses
  const oneYearAgo = new Date()
  oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1)
  const dateStr = oneYearAgo.toISOString().split('T')[0]

  const { data: vendasData } = await supabase
    .from('vendas')
    .select('valor')
    .eq('modulo', modulo)
    .eq('status', 'concluida')
    .gte('data', dateStr)

  const vgvTotal = (vendasData || []).reduce((sum: number, v: any) => sum + Number(v.valor), 0)

  // Corretores que atingiram nível anual (40%)
  const { count: nivel40 } = await supabase
    .from('corretores')
    .select('*', { count: 'exact', head: true })
    .eq('modulo', modulo)
    .gte('nivel_atual', 40)

  // Meta de VGV vigente
  const { data: metaData } = await supabase
    .from('metas_globais')
    .select('meta_anual')
    .eq('modulo', modulo)
    .eq('vigente', true)
    .single()

  const metaVgv = metaData?.meta_anual?.vgv_acumulado_minimo || 0

  return {
    corretores_ativos: ativos || 0,
    inativos_periodo: inativos || 0,
    metas_batidas: 0, // TODO: calcular real quando houver dados de desempenho
    total_corretores: total || 0,
    vgv_total_12m: vgvTotal,
    meta_vgv: metaVgv,
    corretores_nivel_40: nivel40 || 0,
  }
}

// ============================================================
// TOP CORRETORES (ranking por VGV)
// ============================================================

export async function getTopCorretores(modulo: SystemModule): Promise<TopCorretor[]> {
  // Get all corretores with their sales
  const { data: corretores } = await supabase
    .from('corretores')
    .select('id, nome')
    .eq('modulo', modulo)
    .eq('status', 'ativo')

  if (!corretores || corretores.length === 0) return []

  const oneYearAgo = new Date()
  oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1)
  const dateStr = oneYearAgo.toISOString().split('T')[0]

  const ranking: TopCorretor[] = []

  for (const c of corretores) {
    const { data: vendasCorr } = await supabase
      .from('vendas')
      .select('valor')
      .eq('corretor_id', c.id)
      .eq('status', 'concluida')
      .gte('data', dateStr)

    const vgv = (vendasCorr || []).reduce((sum: number, v: any) => sum + Number(v.valor), 0)
    ranking.push({
      posicao: 0,
      nome: c.nome,
      meses_validos: 0,
      vgv,
    })
  }

  // Sort by VGV descending
  ranking.sort((a, b) => b.vgv - a.vgv)
  ranking.forEach((item, idx) => { item.posicao = idx + 1 })

  return ranking
}

// ============================================================
// METAS GLOBAIS
// ============================================================

export async function getMetaVigente(modulo: SystemModule): Promise<MetaGlobal | null> {
  const { data, error } = await supabase
    .from('metas_globais')
    .select('*')
    .eq('modulo', modulo)
    .eq('vigente', true)
    .single()

  if (error || !data) return null

  return {
    id: data.id,
    versao: data.versao,
    vigente: data.vigente,
    vigencia_inicio: formatDate(data.vigencia_inicio),
    vigencia_fim: data.vigencia_fim ? formatDate(data.vigencia_fim) : undefined,
    metas_semanais: data.metas_semanais,
    metas_mensais: data.metas_mensais,
    meta_anual: data.meta_anual,
    comissao_escalonada: data.comissao_escalonada,
    alterado_por: 'Administrador', // TODO: join com profiles
    data_alteracao: formatDate(data.created_at),
    modulo: data.modulo,
  }
}

export async function getHistoricoMetas(modulo: SystemModule): Promise<VersaoMeta[]> {
  const { data, error } = await supabase
    .from('metas_globais')
    .select('*')
    .eq('modulo', modulo)
    .order('created_at', { ascending: false })

  if (error || !data) return []

  return data.map((m: any) => ({
    versao: m.vigente ? `${m.versao} - vigente` : m.versao,
    vigencia: `${formatDate(m.vigencia_inicio)} - ${m.vigencia_fim ? formatDate(m.vigencia_fim) : 'atual'}`,
    alterado_por: 'Administrador',
    data: formatDate(m.created_at),
    vigente: m.vigente,
  }))
}

export async function createMeta(meta: Omit<MetaGlobal, 'id' | 'alterado_por' | 'data_alteracao'>): Promise<MetaGlobal | null> {
  // Desativa metas anteriores do mesmo módulo
  await supabase
    .from('metas_globais')
    .update({ vigente: false })
    .eq('modulo', meta.modulo)
    .eq('vigente', true)

  const { data, error } = await supabase
    .from('metas_globais')
    .insert([{
      versao: meta.versao,
      vigente: true,
      vigencia_inicio: meta.vigencia_inicio,
      vigencia_fim: meta.vigencia_fim || null,
      metas_semanais: meta.metas_semanais,
      metas_mensais: meta.metas_mensais,
      meta_anual: meta.meta_anual,
      comissao_escalonada: meta.comissao_escalonada,
      modulo: meta.modulo,
    }])
    .select()
    .single()

  if (error) {
    console.error('Erro ao criar meta:', error)
    return null
  }

  return data as MetaGlobal
}

// ============================================================
// VENDAS
// ============================================================

export async function getVendas(modulo: SystemModule): Promise<Venda[]> {
  const { data, error } = await supabase
    .from('vendas')
    .select('*')
    .eq('modulo', modulo)
    .order('data', { ascending: false })

  if (error) return []
  return data as Venda[]
}

export async function createVenda(venda: Omit<Venda, 'id'>): Promise<Venda | null> {
  const { data, error } = await supabase
    .from('vendas')
    .insert([venda])
    .select()
    .single()

  if (error) {
    console.error('Erro ao criar venda:', error)
    return null
  }
  return data as Venda
}

// ============================================================
// HELPERS
// ============================================================

function formatDate(dateStr: string): string {
  if (!dateStr) return ''
  const d = new Date(dateStr)
  return d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

// ============================================================
// AVISOS (INSTITUCIONAL)
// ============================================================

export async function getAvisos() {
  const { data, error } = await supabase
    .from('avisos')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Erro ao buscar avisos:', error)
    return []
  }
  
  return data
}

export async function createAviso(aviso: Omit<Aviso, 'id' | 'created_at'>) {
  const { data, error } = await supabase
    .from('avisos')
    .insert([aviso])
    .select()
    .single()

  if (error) {
    console.error('Erro ao criar aviso:', error)
    return null
  }
  return data as Aviso
}

export async function deleteAviso(id: string) {
  const { error } = await supabase
    .from('avisos')
    .delete()
    .eq('id', id)

  if (error) {
    console.error('Erro ao excluir aviso:', error)
    return false
  }
  return true
}

// ============================================================
// CHECKLIST (LOCAÇÃO)
// ============================================================

export async function getChecklists(): Promise<ChecklistContrato[]> {
  const { data, error } = await supabase
    .from('aluguel_contratos')
    .select(`
      *,
      aluguel_pendencias (*)
    `)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Erro ao buscar checklists:', error)
    return []
  }

  // Ensure typescript knows pendencias is mapped
  return (data as any[]).map(c => ({
    ...c,
    pendencias: c.aluguel_pendencias || []
  }))
}

export async function createContratoChecklist(imovel: string, inquilino: string) {
  const { data, error } = await supabase
    .from('aluguel_contratos')
    .insert([{ imovel, inquilino }])
    .select()
    .single()
  if (error) console.error('Erro ao criar contrato:', error)
  return data
}

export async function deleteContratoChecklist(id: string) {
  const { error } = await supabase.from('aluguel_contratos').delete().eq('id', id)
  if (error) console.error('Erro excluir contrato:', error)
  return !error
}

export async function createPendenciaChecklist(pendencia: Omit<ChecklistPendencia, 'id' | 'created_at' | 'status'>) {
  const { data, error } = await supabase
    .from('aluguel_pendencias')
    .insert([{ ...pendencia, status: 'pendente' }])
    .select()
    .single()
  if (error) console.error('Erro criar pendência:', error)
  return data
}

export async function deletePendenciaChecklist(id: string) {
  const { error } = await supabase.from('aluguel_pendencias').delete().eq('id', id)
  return !error
}

export async function togglePendenciaStatus(id: string, currentStatus: string) {
  const newStatus = currentStatus === 'concluido' ? 'pendente' : 'concluido'
  const { error } = await supabase.from('aluguel_pendencias').update({ status: newStatus }).eq('id', id)
  return !error
}

// ============================================================
// PROCESSOS (LOCAÇÃO)
// ============================================================

export async function getProcessos(): Promise<ProcessoSetor[]> {
  const { data, error } = await supabase
    .from('aluguel_processos_setores')
    .select(`
      *,
      aluguel_processos (*)
    `)
    .order('created_at', { ascending: true })

  if (error) {
    console.error('Erro ao buscar processos:', error)
    return []
  }

  // Ensure typescript knows processos is mapped
  return (data as any[]).map(s => ({
    ...s,
    processos: s.aluguel_processos || []
  }))
}

export async function createProcessoSetor(nome: string) {
  const { data, error } = await supabase
    .from('aluguel_processos_setores')
    .insert([{ nome }])
    .select()
    .single()
  if (error) console.error('Erro criar setor de processo:', error)
  return data
}

export async function deleteProcessoSetor(id: string) {
  const { error } = await supabase.from('aluguel_processos_setores').delete().eq('id', id)
  if (error) console.error('Erro excluir setor de processo:', error)
  return !error
}

export async function createProcessoItem(processo: Omit<ProcessoItem, 'id' | 'created_at'>) {
  const { data, error } = await supabase
    .from('aluguel_processos')
    .insert([processo])
    .select()
    .single()
  if (error) console.error('Erro criar processo:', error)
  return data
}

export async function deleteProcessoItem(id: string) {
  const { error } = await supabase.from('aluguel_processos').delete().eq('id', id)
  return !error
}

// ============================================================
// MEU PDI (LOCAÇÃO)
// ============================================================

export async function getAluguelProfiles(): Promise<PDIProfile[]> {
  const { data, error } = await supabase
    .from('profiles')
    .select('id, full_name, metas_role')
    .eq('metas_role', 'aluguel')
    .order('full_name')

  if (error) {
    console.error('Erro ao buscar perfis de aluguel:', error)
    return []
  }
  return data || []
}

export async function getPDI(userId: string): Promise<PDIRecord | null> {
  // Ignorar o usuário fake temporário com ID mockado
  if (userId.startsWith('mock-')) return null

  const { data, error } = await supabase
    .from('aluguel_pdis')
    .select(`
      *,
      aluguel_pdi_acoes (*)
    `)
    .eq('user_id', userId)
    .single()

  if (error && error.code !== 'PGRST116') {
    console.error('Erro buscar PDI:', error)
  }

  if (!data) return null

  return {
    ...data,
    acoes: data.aluguel_pdi_acoes ? data.aluguel_pdi_acoes.sort((a: any, b: any) => new Date(a.prazo).getTime() - new Date(b.prazo).getTime()) : []
  } as PDIRecord
}

export async function upsertPDI(userId: string, pontos_fortes: string, pontos_desenvolver: string) {
  if (userId.startsWith('mock-')) return null

  const { data, error } = await supabase
    .from('aluguel_pdis')
    .upsert({ user_id: userId, pontos_fortes, pontos_desenvolver }, { onConflict: 'user_id' })
    .select()
    .single()

  if (error) console.error('Erro ao salvar diagnóstico PDI:', error)
  return data
}

export async function createPDIAcao(pdi_id: string, titulo: string, prazo: string | null) {
  const { data, error } = await supabase
    .from('aluguel_pdi_acoes')
    .insert([{ pdi_id, titulo, prazo, status: 'Não iniciado' }])
    .select()
    .single()
  
  if (error) console.error('Erro add acao pdi:', error)
  return data
}

export async function updatePDIAcaoStatus(id: string, status: string) {
  const { error } = await supabase.from('aluguel_pdi_acoes').update({ status }).eq('id', id)
  return !error
}

// ============================================================
// DOCUMENTOS (LOCAÇÃO)
// ============================================================

export async function getDocumentos(): Promise<DocumentoCategoria[]> {
  const { data, error } = await supabase
    .from('aluguel_documentos_categorias')
    .select(`
      *,
      aluguel_documentos (*)
    `)
    .order('created_at', { ascending: true })

  if (error) {
    console.error('Erro ao buscar documentos:', error)
    return []
  }

  return (data as any[]).map(c => ({
    ...c,
    documentos: c.aluguel_documentos || []
  }))
}

export async function createDocumentoCategoria(nome: string) {
  const { data, error } = await supabase
    .from('aluguel_documentos_categorias')
    .insert([{ nome }])
    .select()
    .single()
  if (error) console.error('Erro criar categoria de documento:', error)
  return data
}

export async function deleteDocumentoCategoria(id: string) {
  const { error } = await supabase.from('aluguel_documentos_categorias').delete().eq('id', id)
  if (error) console.error('Erro excluir categoria de documento:', error)
  return !error
}

export async function createDocumentoItem(doc: Omit<DocumentoItem, 'id' | 'created_at'>) {
  const { data, error } = await supabase
    .from('aluguel_documentos')
    .insert([doc])
    .select()
    .single()
  if (error) console.error('Erro criar documento:', error)
  return data
}

export async function deleteDocumentoItem(id: string) {
  const { error } = await supabase.from('aluguel_documentos').delete().eq('id', id)
  return !error
}

export async function deletePDIAcao(id: string) {
  const { error } = await supabase.from('aluguel_pdi_acoes').delete().eq('id', id)
  return !error
}

// ============================================================
// EQUIPES E CORRETORES (VENDAS)
// ============================================================

export async function getVendasEquipes(): Promise<VendasEquipe[]> {
  const { data, error } = await supabase
    .from('vendas_equipes')
    .select(`
      *,
      vendas_corretores (*)
    `)
    .order('created_at', { ascending: true })

  if (error) {
    console.error('Erro buscar equipes:', error)
    return []
  }

  return (data as any[]).map(e => ({
    ...e,
    corretores: e.vendas_corretores || []
  }))
}

export async function createVendasEquipe(nome: string) {
  const { data, error } = await supabase.from('vendas_equipes').insert([{ nome }]).select().single()
  if (error) console.error('Erro criar equipe:', error)
  return data
}

export async function deleteVendasEquipe(id: string) {
  const { error } = await supabase.from('vendas_equipes').delete().eq('id', id)
  if (error) console.error('Erro excluir equipe:', error)
  return !error
}

export async function createVendasCorretor(corretor: Omit<VendasCorretor, 'id' | 'created_at'>) {
  const { data, error } = await supabase.from('vendas_corretores').insert([corretor]).select().single()
  if (error) console.error('Erro criar corretor:', error)
  return data
}

export async function deleteVendasCorretor(id: string) {
  const { error } = await supabase.from('vendas_corretores').delete().eq('id', id)
  return !error
}

export async function getVendasMetasDefinicoes(): Promise<VendasMetasDefinicao[]> {
  const { data, error } = await supabase.from('vendas_metas_definicoes').select('*')
  if (error) {
    console.error('Erro buscar metas definicoes:', error)
    return []
  }
  return data
}

export async function upsertVendasMetasDefinicao(meta: Partial<VendasMetasDefinicao> & {equipe_id: string}) {
  const { data, error } = await supabase
    .from('vendas_metas_definicoes')
    .upsert(meta, { onConflict: 'equipe_id' })
    .select()
    .single()
  
  if (error) console.error('Erro salvar meta definicao:', error)
  return data
}

export async function getVendasLancamentos(ano: number, mes: number): Promise<VendasLancamento[]> {
  const { data, error } = await supabase
    .from('vendas_lancamentos')
    .select('*')
    .eq('ano', ano)
    .eq('mes', mes)
  
  if (error) {
    console.error('Erro buscar lancamentos:', error)
    return []
  }
  return data
}

export async function upsertVendasLancamentos(lancamentos: Partial<VendasLancamento>[]) {
  const { data, error } = await supabase
    .from('vendas_lancamentos')
    .upsert(lancamentos, { onConflict: 'corretor_id,ano,mes,semana' })
    .select()
  
  if (error) {
    console.error('Erro salvar lancamentos:', error)
    return false
  }
  return true
}

export async function getVendasLancamentosAno(ano: number): Promise<VendasLancamento[]> {
  const { data, error } = await supabase
    .from('vendas_lancamentos')
    .select('*')
    .eq('ano', ano)
  
  if (error) {
    console.error('Erro buscar lancamentos ano:', error)
    return []
  }
  return data
}

// ============================================================
// TREINAMENTOS (VENDAS)
// ============================================================

export async function getTreinamentos(): Promise<VendasTreinamentoCategoria[]> {
  const { data, error } = await supabase
    .from('vendas_treinamentos_categorias')
    .select(`*, vendas_treinamentos (*)`)
    .order('created_at', { ascending: true })

  if (error) {
    console.error('Erro ao buscar treinamentos:', error)
    return []
  }

  return (data as any[]).map(c => ({
    ...c,
    treinamentos: c.vendas_treinamentos || []
  }))
}

export async function createTreinamentoCategoria(nome: string) {
  const { data, error } = await supabase.from('vendas_treinamentos_categorias').insert([{ nome }]).select().single()
  if (error) console.error('Erro criar categoria de treinamento:', error)
  return data
}

export async function deleteTreinamentoCategoria(id: string) {
  const { error } = await supabase.from('vendas_treinamentos_categorias').delete().eq('id', id)
  return !error
}

export async function createTreinamentoItem(doc: Omit<VendasTreinamentoItem, 'id' | 'created_at'>) {
  const { data, error } = await supabase.from('vendas_treinamentos').insert([doc]).select().single()
  if (error) console.error('Erro criar treinamento:', error)
  return data
}

export async function deleteTreinamentoItem(id: string) {
  const { error } = await supabase.from('vendas_treinamentos').delete().eq('id', id)
  return !error
}

export async function getVendasCorretores(): Promise<VendasCorretor[]> {
  const { data, error } = await supabase
    .from('vendas_corretores')
    .select('*')
    .order('nome', { ascending: true })

  if (error) {
    console.error('Erro ao buscar corretores de vendas:', error)
    return []
  }
  return data || []
}

// Leitura pública (formulário anônimo "qualificar"): só id + nome, o suficiente
// para preencher o seletor de corretor. Sob RLS o papel `anon` recebe SELECT
// apenas nessas colunas, então mesmo que vendas_corretores ganhe dados internos
// no futuro eles não vazam para o formulário público.
export async function getVendasCorretoresPublico(): Promise<Pick<VendasCorretor, 'id' | 'nome'>[]> {
  const { data, error } = await supabase
    .from('vendas_corretores')
    .select('id, nome')
    .order('nome', { ascending: true })

  if (error) {
    console.error('Erro ao buscar corretores (público):', error)
    return []
  }
  return data || []
}

export async function getVendasClientes(): Promise<VendasCliente[]> {
  const { data, error } = await supabase
    .from('vendas_clientes')
    .select('*')
    .order('created_at', { ascending: true })

  if (error) {
    console.error('Erro ao buscar clientes vendas:', error)
    return []
  }
  return data || []
}

export async function createVendasCliente(cliente: Omit<VendasCliente, 'id'>): Promise<VendasCliente | null> {
  const { data, error } = await supabase
    .from('vendas_clientes')
    .insert([cliente])
    .select()
    .single()

  if (error) {
    console.error('Erro ao criar cliente vendas:', error)
    return null
  }
  return data
}

// Insert público (formulário anônimo "qualificar"). Diferente de
// createVendasCliente, NÃO usa .select(): sob RLS o papel `anon` tem apenas
// INSERT em vendas_clientes (nunca SELECT), o que evita que o público leia
// leads de terceiros. Retorna só sucesso/falha — o formulário não precisa do id.
export async function createVendasClientePublico(cliente: Omit<VendasCliente, 'id'>): Promise<boolean> {
  const { error } = await supabase
    .from('vendas_clientes')
    .insert([cliente])

  if (error) {
    console.error('Erro ao criar cliente vendas (público):', error)
    return false
  }
  return true
}

export async function updateVendasCliente(id: string, campos: Partial<VendasCliente>): Promise<VendasCliente | null> {
  const { data, error } = await supabase
    .from('vendas_clientes')
    .update({ ...campos, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single()

  if (error) {
    console.error('Erro ao atualizar cliente vendas:', error)
    return null
  }
  return data
}

export async function deleteVendasCliente(id: string): Promise<boolean> {
  const { error } = await supabase
    .from('vendas_clientes')
    .delete()
    .eq('id', id)

  if (error) {
    console.error('Erro ao deletar cliente vendas:', error)
    return false
  }
  return true
}

export async function getVendasClienteNotas(clienteId: string): Promise<VendasClienteNota[]> {
  const { data, error } = await supabase
    .from('vendas_cliente_notas')
    .select('*')
    .eq('cliente_id', clienteId)
    .order('created_at', { ascending: true })

  if (error) {
    console.error('Erro ao buscar notas do cliente:', error)
    return []
  }
  return data || []
}

export async function createVendasClienteNota(nota: Omit<VendasClienteNota, 'id'>): Promise<VendasClienteNota | null> {
  const { data, error } = await supabase
    .from('vendas_cliente_notas')
    .insert([nota])
    .select()
    .single()

  if (error) {
    console.error('Erro ao criar nota do cliente:', error)
    return null
  }
  return data
}

export async function getVendasClienteChecklist(clienteId: string): Promise<VendasClienteChecklist[]> {
  const { data, error } = await supabase
    .from('vendas_cliente_checklist')
    .select('*')
    .eq('cliente_id', clienteId)

  if (error) {
    console.error('Erro ao buscar checklist do cliente:', error)
    return []
  }
  return data || []
}

export async function toggleVendasChecklistItem(
  clienteId: string,
  etapa: number,
  itemIndex: number,
  isChecked: boolean
): Promise<boolean> {
  if (isChecked) {
    const { error } = await supabase
      .from('vendas_cliente_checklist')
      .upsert(
        { cliente_id: clienteId, etapa, item_index: itemIndex },
        { onConflict: 'cliente_id,etapa,item_index' }
      )
    if (error) {
      console.error('Erro ao marcar item de checklist:', error)
      return false
    }
  } else {
    const { error } = await supabase
      .from('vendas_cliente_checklist')
      .delete()
      .eq('cliente_id', clienteId)
      .eq('etapa', etapa)
      .eq('item_index', itemIndex)
    if (error) {
      console.error('Erro ao desmarcar item de checklist:', error)
      return false
    }
  }
  return true
}

export async function getVendasPesquisas(): Promise<VendasPesquisa[]> {
  const { data, error } = await supabase
    .from('vendas_pesquisas')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Erro ao buscar pesquisas vendas:', error)
    return []
  }
  return data || []
}

// Insert público (formulário anônimo de pesquisa). Não usa .select() de
// propósito: sob RLS o papel `anon` recebe apenas INSERT, nunca SELECT, então
// ler a linha de volta falharia e — mais importante — manter SELECT fechado
// impede que o público liste pesquisas de terceiros.
export async function createVendasPesquisa(pesquisa: Omit<VendasPesquisa, 'id'>): Promise<boolean> {
  const { error } = await supabase
    .from('vendas_pesquisas')
    .insert([pesquisa])

  if (error) {
    console.error('Erro ao criar pesquisa vendas:', error)
    return false
  }
  return true
}

export async function deleteVendasPesquisa(id: string): Promise<boolean> {
  const { error } = await supabase
    .from('vendas_pesquisas')
    .delete()
    .eq('id', id)

  if (error) {
    console.error('Erro ao deletar pesquisa vendas:', error)
    return false
  }
  return true
}

// ============================================================
// SYSTEM USERS (USUÁRIOS SISTEMA)
// ============================================================

export async function getSystemUsers(): Promise<SystemUser[]> {
  const { data, error } = await supabase
    .from('usuarios_sistema')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Erro ao buscar usuários do sistema:', error)
    return []
  }
  return data || []
}

export async function createSystemUser(user: Omit<SystemUser, 'id'>): Promise<SystemUser | null> {
  const { data, error } = await supabase
    .from('usuarios_sistema')
    .insert([user])
    .select()
    .single()

  if (error) {
    console.error('Erro ao criar usuário do sistema:', error)
    return null
  }
  return data
}

export async function deleteSystemUser(id: string): Promise<boolean> {
  const { error } = await supabase
    .from('usuarios_sistema')
    .delete()
    .eq('id', id)

  if (error) {
    console.error('Erro ao deletar usuário do sistema:', error)
    return false
  }
  return true
}

// ============================================================
// MÉTRICAS AVANÇADAS (PROCESSO V5)
// ============================================================

export async function getMetricsTempoResposta(): Promise<VendasMTempoResposta[]> {
  const { data, error } = await supabase.from('vendas_v_tempo_resposta').select('*')
  if (error) {
    console.error('Erro ao buscar tempo de resposta:', error)
    return []
  }
  return data || []
}

export async function getMetricsFunil(): Promise<VendasMFunil[]> {
  const { data, error } = await supabase.from('vendas_v_funil').select('*').order('ordem', { ascending: true })
  if (error) {
    console.error('Erro ao buscar funil:', error)
    return []
  }
  return data || []
}

export async function getMetricsNoShow(): Promise<VendasMNoShow[]> {
  const { data, error } = await supabase.from('vendas_v_no_show').select('*')
  if (error) {
    console.error('Erro ao buscar no show:', error)
    return []
  }
  return data || []
}

export async function getMetricsHandoff(): Promise<VendasMHandoff[]> {
  const { data, error } = await supabase.from('vendas_v_handoff').select('*')
  if (error) {
    console.error('Erro ao buscar handoff:', error)
    return []
  }
  return data || []
}

export async function getMetricsLaisVsHumano(): Promise<VendasMLaisVsHumano[]> {
  const { data, error } = await supabase.from('vendas_v_lais_vs_humano').select('*')
  if (error) {
    console.error('Erro ao buscar lais vs humano:', error)
    return []
  }
  return data || []
}

export async function getMetricsGargalo(): Promise<VendasMGargalo[]> {
  const { data, error } = await supabase.from('vendas_v_gargalo').select('*')
  if (error) {
    console.error('Erro ao buscar gargalo:', error)
    return []
  }
  return data || []
}

export async function getMetricsOndeTreinar(): Promise<VendasMOndeTreinar[]> {
  const { data, error } = await supabase.from('vendas_v_onde_treinar').select('*').order('indice_atencao', { ascending: false })
  if (error) {
    console.error('Erro ao buscar onde treinar:', error)
    return []
  }
  return data || []
}

export async function getMetricsTravasPagamento(): Promise<VendasMTravasPagamento[]> {
  const { data, error } = await supabase.from('vendas_v_travas_pagamento').select('*').order('ocorrencias', { ascending: false })
  if (error) {
    console.error('Erro ao buscar travas pagamento:', error)
    return []
  }
  return data || []
}

export async function getMetricsCicloTotal(): Promise<VendasMCicloTotal[]> {
  const { data, error } = await supabase.from('vendas_v_ciclo_total').select('*')
  if (error) {
    console.error('Erro ao buscar ciclo total:', error)
    return []
  }
  return data || []
}

export async function getVendasAlertas(): Promise<VendasAlerta[]> {
  const { data, error } = await supabase
    .from('vendas_alertas')
    .select('*, vendas_leads(nome)')
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Erro ao buscar alertas de vendas:', error)
    return []
  }

  return (data || []).map((a: any) => ({
    id: a.id,
    lead_id: a.lead_id,
    tipo: a.tipo,
    detalhe: a.detalhe,
    acao_disparada: a.acao_disparada,
    resolvido: a.resolvido,
    resolvido_em: a.resolvido_em,
    created_at: a.created_at,
    lead_nome: a.vendas_leads?.nome || null,
  }))
}

export async function resolveVendasAlerta(id: string): Promise<boolean> {
  const { error } = await supabase
    .from('vendas_alertas')
    .update({ resolvido: true, resolvido_em: new Date().toISOString() })
    .eq('id', id)

  if (error) {
    console.error('Erro ao resolver alerta:', error)
    return false
  }
  return true
}

// ============================================================
// EVENTOS DO FUNIL (Caminho A — "operar é medir")
// Gravados a cada mudança de etapa / finalização do cliente.
// São a fonte das métricas avançadas (getMetricasAvancadas).
// ============================================================

export interface ClienteEvento {
  id: string
  cliente_id: string
  etapa: number
  entrou_em: string
  saiu_em: string | null
  dono_tipo: 'lais' | 'humano' | null
  resultado: 'avancou' | 'perdido' | 'retrocedeu' | null
  motivo: string | null
}

function donoTipoEtapa(etapa: number, porta: 'A' | 'B' | null | undefined): 'lais' | 'humano' {
  return (porta ?? 'A') === 'A' && etapa <= 1 ? 'lais' : 'humano'
}

// Fecha o evento aberto do cliente e abre um novo na nova etapa.
// Best-effort: nunca lança — uma falha de medição não pode travar o CRM.
export async function registrarMudancaEtapa(
  clienteId: string,
  novaEtapa: number,
  porta: 'A' | 'B' | null | undefined,
  resultado: 'avancou' | 'retrocedeu'
): Promise<void> {
  try {
    await supabase
      .from('vendas_cliente_eventos')
      .update({ saiu_em: new Date().toISOString(), resultado })
      .eq('cliente_id', clienteId)
      .is('saiu_em', null)

    await supabase
      .from('vendas_cliente_eventos')
      .insert([{ cliente_id: clienteId, etapa: novaEtapa, dono_tipo: donoTipoEtapa(novaEtapa, porta) }])
  } catch (e) {
    console.error('Erro ao registrar mudança de etapa:', e)
  }
}

// Fecha o evento aberto ao finalizar (ganho/perdido). 'interessado' não finaliza.
export async function registrarFinalizacao(
  clienteId: string,
  status: 'sucesso' | 'perdido' | 'interessado',
  motivo?: string | null
): Promise<void> {
  if (status === 'interessado') return
  try {
    await supabase
      .from('vendas_cliente_eventos')
      .update({
        saiu_em: new Date().toISOString(),
        resultado: status === 'sucesso' ? 'avancou' : 'perdido',
        motivo: motivo ?? null,
      })
      .eq('cliente_id', clienteId)
      .is('saiu_em', null)
  } catch (e) {
    console.error('Erro ao registrar finalização:', e)
  }
}

// Reabre um evento (ex.: usuário desfez a finalização). Só abre se não houver
// um evento já aberto, para não duplicar.
export async function reabrirEventoCliente(
  clienteId: string,
  etapa: number,
  porta: 'A' | 'B' | null | undefined
): Promise<void> {
  try {
    const { data } = await supabase
      .from('vendas_cliente_eventos')
      .select('id')
      .eq('cliente_id', clienteId)
      .is('saiu_em', null)
      .limit(1)
    if (data && data.length > 0) return
    await supabase
      .from('vendas_cliente_eventos')
      .insert([{ cliente_id: clienteId, etapa, dono_tipo: donoTipoEtapa(etapa, porta) }])
  } catch (e) {
    console.error('Erro ao reabrir evento do cliente:', e)
  }
}

export async function getClienteEventos(): Promise<ClienteEvento[]> {
  const { data, error } = await supabase.from('vendas_cliente_eventos').select('*')
  if (error) {
    console.error('Erro ao buscar eventos de cliente:', error)
    return []
  }
  return (data || []) as ClienteEvento[]
}

// ============================================================
// MÉTRICAS AVANÇADAS — calculadas no funil REAL (6 etapas) a partir de
// vendas_clientes + vendas_cliente_eventos. Substitui as views órfãs.
// ============================================================

export interface MetricasAvancadas {
  tempo: VendasMTempoResposta[]
  funil: VendasMFunil[]
  noShow: VendasMNoShow[]
  handoff: VendasMHandoff[]
  treinar: VendasMOndeTreinar[]
  laisVsHumano: VendasMLaisVsHumano[]
  travas: VendasMTravasPagamento[]
  ciclo: VendasMCicloTotal[]
}

// Formata ms como "H:MM:SS" (H pode passar de 24h) — compatível com o
// formatInterval do PainelMetricas, que entende esse formato e o converte.
function msParaHMS(ms: number): string {
  if (!isFinite(ms) || ms <= 0) return '0:00:00'
  const totS = Math.round(ms / 1000)
  const h = Math.floor(totS / 3600)
  const m = Math.floor((totS % 3600) / 60)
  const s = totS % 60
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${h}:${pad(m)}:${pad(s)}`
}

function mediana(nums: number[]): number | null {
  if (!nums.length) return null
  const a = [...nums].sort((x, y) => x - y)
  const mid = Math.floor(a.length / 2)
  return a.length % 2 ? a[mid] : (a[mid - 1] + a[mid]) / 2
}

export async function getMetricasAvancadas(): Promise<MetricasAvancadas> {
  const [clientes, eventos] = await Promise.all([getVendasClientes(), getClienteEventos()])

  const portaDe = new Map<string, 'A' | 'B'>()
  clientes.forEach((c) => portaDe.set(c.id, (c.porta as 'A' | 'B') || 'A'))

  const dur = (e: ClienteEvento) =>
    e.saiu_em ? new Date(e.saiu_em).getTime() - new Date(e.entrou_em).getTime() : 0
  const nEtapas = ETAPAS.length

  // ---- Funil por etapa (0..nEtapas-1) ----
  const funil: VendasMFunil[] = ETAPAS.map((et, idx) => {
    const evs = eventos.filter((e) => e.etapa === idx)
    const setOf = (pred: (e: ClienteEvento) => boolean) =>
      new Set(evs.filter(pred).map((e) => e.cliente_id)).size
    const entraram = new Set(evs.map((e) => e.cliente_id)).size
    const avancaram = setOf((e) => e.resultado === 'avancou')
    const perderam = setOf((e) => e.resultado === 'perdido')
    return {
      ordem: idx + 1,
      codigo: String(idx + 1),
      nome: et.nome,
      entraram,
      avancaram,
      perderam,
      taxa_avanco_pct: entraram ? Math.round((avancaram / entraram) * 1000) / 10 : 0,
    }
  })

  // ---- Tempo de resposta (etapa 0 fechada) por porta + dono ----
  const e0 = eventos.filter((e) => e.etapa === 0 && e.saiu_em)
  const grupos = new Map<string, { porta: string; dono: string; durs: number[] }>()
  e0.forEach((e) => {
    const porta = portaDe.get(e.cliente_id) || 'A'
    const dono = e.dono_tipo || 'humano'
    const key = `${porta}|${dono}`
    const g = grupos.get(key) || { porta, dono, durs: [] }
    g.durs.push(dur(e))
    grupos.set(key, g)
  })
  const tempo: VendasMTempoResposta[] = Array.from(grupos.values()).map((g) => ({
    porta: g.porta,
    dono_tipo: g.dono,
    leads: g.durs.length,
    tempo_medio: msParaHMS(g.durs.reduce((a, b) => a + b, 0) / g.durs.length),
    mediana_seg: mediana(g.durs.map((d) => d / 1000)),
  }))

  // ---- No-show (visita agendada x realizada) — de vendas_clientes ----
  const agendadas = clientes.filter((c) => !!c.visita_agendada_em).length
  const realizadas = clientes.filter((c) => !!c.visita_agendada_em && !!c.visita_realizada_em).length
  const noShow: VendasMNoShow[] = [{
    agendadas,
    realizadas,
    taxa_no_show_pct: agendadas ? Math.round((1 - realizadas / agendadas) * 1000) / 10 : 0,
  }]

  // ---- Handoff (Andressa/Lais → Corretor na E3): tempo morto da passagem ----
  const comHandoff = clientes.filter((c) => c.handoff_iniciado_em)
  const assumidos = comHandoff.filter((c) => c.handoff_assumido_em)
  const temposHandoff = assumidos.map(
    (c) => new Date(c.handoff_assumido_em!).getTime() - new Date(c.handoff_iniciado_em!).getTime()
  )
  const handoff: VendasMHandoff[] = comHandoff.length
    ? [{
        tipo: 'qualificador_corretor',
        total: comHandoff.length,
        pendentes: comHandoff.length - assumidos.length,
        tempo_morto_medio: temposHandoff.length
          ? msParaHMS(temposHandoff.reduce((a, b) => a + b, 0) / temposHandoff.length)
          : null,
        pacote_incompleto: 0,
      }]
    : []

  // ---- Onde treinar: tempo médio na etapa × taxa de queda ----
  const treinar: VendasMOndeTreinar[] = ETAPAS.map((et, idx) => {
    const evs = eventos.filter((e) => e.etapa === idx && e.saiu_em)
    if (!evs.length) {
      return { ordem: idx + 1, codigo: String(idx + 1), nome: et.nome, tempo_medio: null, taxa_queda_pct: 0, indice_atencao: 0 }
    }
    const tempos = evs.map(dur)
    const avgMs = tempos.reduce((a, b) => a + b, 0) / tempos.length
    const quedas = evs.filter((e) => e.resultado === 'perdido').length
    const taxa = Math.round((quedas / evs.length) * 1000) / 10
    const indice = Math.round((avgMs / 3_600_000) * (quedas / evs.length) * 100) / 100
    return { ordem: idx + 1, codigo: String(idx + 1), nome: et.nome, tempo_medio: msParaHMS(avgMs), taxa_queda_pct: taxa, indice_atencao: indice }
  }).sort((a, b) => b.indice_atencao - a.indice_atencao)

  // ---- Lais (porta A) × Humano (porta B): taxa de agendamento de visita ----
  const laisVsHumano: VendasMLaisVsHumano[] = (['A', 'B'] as const).map((porta) => {
    const grupo = clientes.filter((c) => ((c.porta as 'A' | 'B') || 'A') === porta)
    const agendaram = grupo.filter((c) => !!c.visita_agendada_em || c.etapa >= I_VISITA).length
    return {
      porta,
      leads: grupo.length,
      agendaram_visita: agendaram,
      taxa_agendamento_pct: grupo.length ? Math.round((agendaram / grupo.length) * 1000) / 10 : 0,
    }
  })

  // ---- Travas de pagamento (derivado de status_financiamento) ----
  const bloqueados = clientes.filter(
    (c) => c.status_financiamento === 'em_andamento' || c.status_financiamento === 'reprovado'
  )
  const travasMap = new Map<string, VendasMTravasPagamento>()
  bloqueados.forEach((c) => {
    const ramo = c.forma_pagamento || 'a_definir'
    const tipo_bloqueio = c.status_financiamento === 'reprovado' ? 'credito_reprovado' : 'analise_credito'
    const key = `${ramo}|${tipo_bloqueio}`
    const cur = travasMap.get(key) || { ramo, tipo_bloqueio, ocorrencias: 0, abertos: 0, tempo_medio_aberto: null }
    cur.ocorrencias += 1
    if (c.status_financiamento === 'em_andamento') cur.abertos += 1
    travasMap.set(key, cur)
  })
  const travas = Array.from(travasMap.values()).sort((a, b) => b.ocorrencias - a.ocorrencias)

  // ---- Ciclo total dos ganhos (entrada → finalização) ----
  const inicioDe = new Map<string, number>()
  eventos.forEach((e) => {
    const t = new Date(e.entrou_em).getTime()
    const cur = inicioDe.get(e.cliente_id)
    if (cur === undefined || t < cur) inicioDe.set(e.cliente_id, t)
  })
  const ciclo: VendasMCicloTotal[] = clientes
    .filter((c) => c.finalizado && c.status_finalizacao === 'sucesso')
    .map((c) => {
      const inicio = inicioDe.get(c.id) ?? (c.created_at ? new Date(c.created_at).getTime() : Date.now())
      const fim = c.updated_at ? new Date(c.updated_at).getTime() : Date.now()
      return {
        lead_id: c.id,
        nome: c.nome,
        inicio: new Date(inicio).toISOString(),
        fechamento: new Date(fim).toISOString(),
        ciclo_total: msParaHMS(fim - inicio),
      }
    })

  return { tempo, funil, noShow, handoff, treinar, laisVsHumano, travas, ciclo }
}


