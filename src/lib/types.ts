// ============================================================
// TIPOS — Porto Real Sistema de Metas
// ============================================================

export type UserRole = 'vendas' | 'aluguel' | 'superadmin'
export type SystemModule = 'vendas' | 'aluguel' | 'institucional'

export interface User {
  id: string
  email: string
  nome: string
  role: UserRole
  avatar_url?: string
}

export interface SystemUser {
  id: string
  email: string
  senha?: string
  nome: string
  role: 'vendas' | 'aluguel' | 'superadmin'
  created_at?: string
}


export interface Corretor {
  id: string
  nome: string
  email: string
  creci: string
  equipe: string | null
  status: 'ativo' | 'inativo'
  nivel_atual: number // percentual da comissão
  cor_barra: string   // cor do topo do card
  modulo: SystemModule
}

export interface MetaGlobal {
  id: string
  versao: string
  vigente: boolean
  vigencia_inicio: string
  vigencia_fim?: string
  metas_semanais: {
    contatos_ativos: number
    postagem_instagram: number
  }
  metas_mensais: {
    visitas_vendas: number
    captacao_exclusividade: number
    semanas_validas_minimas: number
  }
  meta_anual: {
    vgv_acumulado_minimo: number
    meses_validos_minimos: number
  }
  comissao_escalonada: {
    nivel_base: number
    nivel_mensal: number
    nivel_anual: number
  }
  alterado_por: string
  data_alteracao: string
  modulo: SystemModule
}

export interface Venda {
  id: string
  corretor_id: string
  tipo: 'venda' | 'locacao'
  valor: number
  data: string
  imovel: string
  status: 'pendente' | 'concluida' | 'cancelada'
  modulo: SystemModule
}

export interface EquipeInfo {
  nome: string
  sigla: string
  qtd_corretores: number
}

export interface DashboardStats {
  corretores_ativos: number
  inativos_periodo: number
  metas_batidas: number
  total_corretores: number
  vgv_total_12m: number
  meta_vgv: number
  corretores_nivel_40: number
}

export interface TopCorretor {
  posicao: number
  nome: string
  meses_validos: number
  vgv: number
}

export interface AcessoRapidoItem {
  titulo: string
  descricao: string
  href: string
}

export interface VersaoMeta {
  versao: string
  vigencia: string
  alterado_por: string
  data: string
  vigente: boolean
}

export interface Aviso {
  id: string
  tipo: 'comunicado' | 'alerta' | 'celebracao'
  titulo: string
  mensagem: string
  autor_nome: string
  created_at: string
}

export interface ChecklistPendencia {
  id: string
  contrato_id: string
  titulo: string
  setor: string
  responsavel: string
  prioridade: string
  status: string
  prazo: string | null
  created_at: string
}

export interface ChecklistContrato {
  id: string
  imovel: string
  inquilino: string
  created_at: string
  pendencias?: ChecklistPendencia[]
}

export interface ProcessoItem {
  id: string
  setor_id: string
  titulo: string
  url: string
  created_at: string
}

export interface ProcessoSetor {
  id: string
  nome: string
  created_at: string
  processos?: ProcessoItem[]
}

export interface PDIAcao {
  id: string
  pdi_id: string
  titulo: string
  prazo: string | null
  status: 'Não iniciado' | 'Em andamento' | 'Concluído'
  created_at: string
}

export interface PDIRecord {
  id: string
  user_id: string
  pontos_fortes: string
  pontos_desenvolver: string
  created_at: string
  acoes?: PDIAcao[]
}

export interface PDIProfile {
  id: string
  full_name: string
  metas_role: string
}

export interface DocumentoItem {
  id: string
  categoria_id: string
  titulo: string
  url: string
  created_at: string
}

export interface DocumentoCategoria {
  id: string
  nome: string
  created_at: string
  documentos?: DocumentoItem[]
}

// ------------------- MÓDULO DE VENDAS -------------------

export interface VendasEquipe {
  id: string
  nome: string
  created_at: string
  corretores?: VendasCorretor[]
}

export interface VendasCorretor {
  id: string
  equipe_id: string | null
  nome: string
  email: string
  telefone: string | null
  creci: string | null
  created_at: string
  user_id?: string | null
}

export interface VendasMetasDefinicao {
  id: string
  equipe_id: string
  contatos_semana: number
  postagens_semana: number
  visitas_mes: number
  captacoes_mes: number
  vgv_anual_movel: number
  updated_at: string
  created_at: string
}

export interface VendasLancamento {
  id: string
  corretor_id: string
  ano: number
  mes: number
  semana: number
  contatos: number
  postagens: number
  visitas: number
  captacoes: number
  vgv: number
  created_at?: string
  updated_at?: string
}

export interface VendasTreinamentoItem {
  id: string
  categoria_id: string
  titulo: string
  url: string
  created_at: string
}

export interface VendasTreinamentoCategoria {
  id: string
  nome: string
  created_at: string
  treinamentos?: VendasTreinamentoItem[]
}

// ------------------- CRM DE VENDAS (MOCKUP INTEGRADO) -------------------

export interface VendasCliente {
  id: string
  nome: string
  contato: string | null
  email: string | null
  origem: string | null
  valor: number
  etapa: number
  perfil: string | null
  temp: 'quente' | 'morno' | 'frio'
  expressa: boolean
  objetivo: string
  faixa: string | null
  local: string | null
  preferencia: string | null
  imovel_interesse?: string | null
  // Preferências estruturadas do imóvel desejado
  tipo_imovel?: string | null
  quartos?: number | null
  suites?: number | null
  vagas?: number | null
  piscina?: 'sim' | 'nao' | 'indiferente' | null
  perfil_quiz: Record<string, string> // qi -> perfil
  finalizado?: boolean
  status_finalizacao?: 'sucesso' | 'perdido' | 'interessado' | null
  motivo_finalizacao?: string | null
  valor_fechado?: number | null
  valor_pedido?: number | null
  valor_vendido?: number | null
  corretor_id?: string | null
  perfil_secundario?: string | null
  proxima_acao?: string | null
  proxima_acao_data?: string | null
  visita_agendada_em?: string | null
  visita_realizada_em?: string | null
  status_financiamento?: 'n/a' | 'em_andamento' | 'aprovado' | 'reprovado' | null
  em_captacao?: boolean
  porta?: 'A' | 'B'
  etiqueta_status?: 'Novo' | 'Em atendimento' | 'Aguardando cliente' | 'Sem resposta' | 'Via expressa' | 'Descartado'
  forma_pagamento?: 'a_vista' | 'parcelamento' | 'permuta' | 'financiamento' | 'a_definir'
  created_at?: string
  updated_at?: string
}

export interface VendasClienteNota {
  id: string
  cliente_id: string
  etapa: string
  texto: string
  data: string
  created_at?: string
}

export interface VendasClienteChecklist {
  id: string
  cliente_id: string
  etapa: number
  item_index: number
  created_at?: string
}

export interface VendasPesquisa {
  id: string
  nome: string
  tipo: 'comprou' | 'naocomprou' | 'proprietario' | 'visitante'
  data: string
  nota_imovel: number | null
  nota_corretor: number | null
  nota_atend: number | null
  nota_site: number | null
  motivo: string | null
  perfil: string | null
  interesse: {
    op?: string | null
    tipoImovel?: string | null
    quartos?: string | null
    local?: string | null
    valor?: string | null
  }
  created_at?: string
}

// ------------------- VIEWS DE MÉTRICAS (MÓDULO DE VENDAS) -------------------

export interface VendasMTempoResposta {
  porta: string
  dono_tipo: string
  leads: number
  tempo_medio: string
  mediana_seg: number | null
}

export interface VendasMFunil {
  ordem: number
  codigo: string
  nome: string
  entraram: number
  avancaram: number
  perderam: number
  taxa_avanco_pct: number
}

export interface VendasMNoShow {
  agendadas: number
  realizadas: number
  taxa_no_show_pct: number
}

export interface VendasMHandoff {
  tipo: string
  total: number
  pendentes: number
  tempo_morto_medio: string | null
  pacote_incompleto: number
}

export interface VendasMLaisVsHumano {
  porta: string
  leads: number
  agendaram_visita: number
  taxa_agendamento_pct: number
}

export interface VendasMGargalo {
  ordem: number
  codigo: string
  nome: string
  perdas: number
}

export interface VendasMOndeTreinar {
  ordem: number
  codigo: string
  nome: string
  tempo_medio: string | null
  taxa_queda_pct: number
  indice_atencao: number
}

export interface VendasMTravasPagamento {
  ramo: string
  tipo_bloqueio: string
  ocorrencias: number
  abertos: number
  tempo_medio_aberto: string | null
}

export interface VendasMCicloTotal {
  lead_id: string
  nome: string
  inicio: string
  fechamento: string
  ciclo_total: string
}

export interface VendasAlerta {
  id: string
  lead_id: string | null
  tipo: 'imovel_fora_catalogo' | 'pergunta_repetida' | 'conversa_sem_avanco' | 'loop_detectado' | 'lead_quente_sem_resposta' | 'nao_encaminha_visita'
  detalhe: Record<string, any>
  acao_disparada: string | null
  resolvido: boolean
  resolvido_em: string | null
  created_at: string
  lead_nome?: string | null
}


