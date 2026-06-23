import { createClient } from '@/lib/supabase'
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

export async function createVendasPesquisa(pesquisa: Omit<VendasPesquisa, 'id'>): Promise<VendasPesquisa | null> {
  const { data, error } = await supabase
    .from('vendas_pesquisas')
    .insert([pesquisa])
    .select()
    .single()

  if (error) {
    console.error('Erro ao criar pesquisa vendas:', error)
    return null
  }
  return data
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


