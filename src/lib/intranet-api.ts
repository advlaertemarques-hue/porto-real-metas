import { createClient } from '@/lib/supabase'

const supabase = createClient()

// ============================================================
// TYPES
// ============================================================

export interface Profile {
  id: string
  full_name: string | null
  role: 'admin' | 'gestor' | 'funcionario'
  department: string | null
}

export interface Demanda {
  id: string
  titulo: string
  cliente: string | null
  categoria: string | null
  data_lancamento: string | null
  prazo: string | null
  status: string
}

export interface Tarefa {
  id: string
  demanda_id: string
  titulo: string
  setor: string
  responsavel: string | null
  prioridade: string
  data_lancamento: string | null
  prazo: string | null
  is_concluida: boolean
}

export interface Documento {
  id: string
  titulo: string
  tipo: string
  setor: string
  conteudo_html: string | null
  is_new: boolean
  created_at: string
}

export interface PdiRecord {
  id: string
  profile_id: string
  objective: string
  manager_feedback: string | null
  status: string
  created_at: string
  profiles?: { full_name: string }
}

// ============================================================
// DEMANDAS
// ============================================================

export async function getDemandas() {
  const { data, error } = await supabase
    .from('demandas')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Erro ao buscar demandas:', error)
    return []
  }
  return data as Demanda[]
}

export async function createDemanda(demanda: Omit<Demanda, 'id' | 'status'>) {
  const { data, error } = await supabase
    .from('demandas')
    .insert([demanda])
    .select()
    .single()

  if (error) {
    console.error('Erro ao criar demanda:', error)
    throw error
  }
  return data as Demanda
}

export async function deleteDemanda(id: string) {
  const { error } = await supabase
    .from('demandas')
    .delete()
    .eq('id', id)

  if (error) {
    console.error('Erro ao deletar demanda:', error)
    throw error
  }
  return true
}

// ============================================================
// TAREFAS
// ============================================================

export async function getTarefasDaDemanda(demandaId: string) {
  const { data, error } = await supabase
    .from('tarefas')
    .select('*')
    .eq('demanda_id', demandaId)
    .order('created_at', { ascending: true })

  if (error) {
    console.error('Erro ao buscar tarefas:', error)
    return []
  }
  return data as Tarefa[]
}

export async function createTarefa(tarefa: Omit<Tarefa, 'id' | 'is_concluida'>) {
  const { data, error } = await supabase
    .from('tarefas')
    .insert([tarefa])
    .select()
    .single()

  if (error) {
    console.error('Erro ao criar tarefa:', error)
    throw error
  }
  return data as Tarefa
}

export async function toggleStatusTarefa(tarefaId: string, is_concluida: boolean) {
  const { data, error } = await supabase
    .from('tarefas')
    .update({ is_concluida })
    .eq('id', tarefaId)
    .select()
    .single()

  if (error) {
    console.error('Erro ao atualizar tarefa:', error)
    throw error
  }
  return data as Tarefa
}

// ============================================================
// DOCUMENTOS
// ============================================================

export async function getDocumentos() {
  const { data, error } = await supabase
    .from('documentos')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Erro ao buscar documentos:', error)
    return []
  }
  return data as Documento[]
}

export async function createDocumento(documento: Partial<Documento>) {
  const { data, error } = await supabase
    .from('documentos')
    .insert([documento])
    .select()
    .single()

  if (error) {
    console.error('Erro ao criar documento:', error)
    throw error
  }
  return data as Documento
}

export async function deleteDocumento(id: string) {
  const { error } = await supabase
    .from('documentos')
    .delete()
    .eq('id', id)

  if (error) {
    console.error('Erro ao deletar documento:', error)
    throw error
  }
  return true
}

// ============================================================
// PROFILES
// ============================================================

export async function getCurrentProfile(userId: string) {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single()

  if (error) {
    console.error('Erro ao buscar perfil:', error)
    return null
  }
  return data as Profile
}

export async function getProfiles() {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .order('full_name', { ascending: true })

  if (error) {
    console.error('Erro ao buscar perfis:', error)
    return []
  }
  return data as Profile[]
}

// ============================================================
// PDI
// ============================================================

export async function getPdis() {
  const { data, error } = await supabase
    .from('pdi_records')
    .select(`*, profiles(full_name)`)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Erro ao buscar PDIs:', error)
    return []
  }
  return data as PdiRecord[]
}

export async function createPdi(pdi: Partial<PdiRecord>) {
  const { data, error } = await supabase
    .from('pdi_records')
    .insert([pdi])
    .select(`*, profiles(full_name)`)
    .single()

  if (error) {
    console.error('Erro ao criar PDI:', error)
    throw error
  }
  return data as PdiRecord
}

export async function updatePdi(id: string, updates: Partial<PdiRecord>) {
  const { data, error } = await supabase
    .from('pdi_records')
    .update(updates)
    .eq('id', id)
    .select(`*, profiles(full_name)`)
    .single()

  if (error) {
    console.error('Erro ao atualizar PDI:', error)
    throw error
  }
  return data as PdiRecord
}
