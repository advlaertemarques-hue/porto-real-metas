import {
  Corretor,
  DashboardStats,
  TopCorretor,
  AcessoRapidoItem,
  EquipeInfo,
  MetaGlobal,
  VersaoMeta,
  User,
} from '@/lib/types'

// ============================================================
// USUÁRIOS MOCK (para teste de login)
// ============================================================
export const MOCK_USERS: User[] = [
  { id: '1', email: 'admin@portoreal.com.br', nome: 'Administrador', role: 'superadmin' },
  { id: '2', email: 'vendas@portoreal.com.br', nome: 'Gestor Vendas', role: 'vendas' },
  { id: '3', email: 'aluguel@portoreal.com.br', nome: 'Gestor Aluguel', role: 'aluguel' },
]

// ============================================================
// DASHBOARD — VENDAS
// ============================================================
export const DASHBOARD_STATS_VENDAS: DashboardStats = {
  corretores_ativos: 4,
  inativos_periodo: 0,
  metas_batidas: 0,
  total_corretores: 4,
  vgv_total_12m: 8000000,
  meta_vgv: 0,
  corretores_nivel_40: 0,
}

export const TOP_CORRETORES_VENDAS: TopCorretor[] = [
  { posicao: 1, nome: 'João Cidin', meses_validos: 0, vgv: 5000000 },
  { posicao: 2, nome: 'Kaua Felipe', meses_validos: 0, vgv: 3000000 },
  { posicao: 3, nome: 'Jose Henrique', meses_validos: 0, vgv: 0 },
  { posicao: 4, nome: 'Gustavo', meses_validos: 0, vgv: 0 },
]

export const CORRETORES_VENDAS: Corretor[] = [
  {
    id: '1',
    nome: 'João Cidin',
    email: 'jvcidin97@gmail.com',
    creci: 'CRECI 5121',
    equipe: 'Ji-Paraná',
    status: 'ativo',
    nivel_atual: 35,
    cor_barra: '#eb3238',
    modulo: 'vendas',
  },
  {
    id: '2',
    nome: 'Gustavo',
    email: 'gustavohonoriomartins@gmail.com',
    creci: 'CRECI 4992 RO',
    equipe: null,
    status: 'ativo',
    nivel_atual: 35,
    cor_barra: '#3b82f6',
    modulo: 'vendas',
  },
  {
    id: '3',
    nome: 'Kaua Felipe',
    email: 'kauanfelipe@portoreal.com.br',
    creci: '',
    equipe: 'Ji-Paraná',
    status: 'ativo',
    nivel_atual: 35,
    cor_barra: '#3b82f6',
    modulo: 'vendas',
  },
  {
    id: '4',
    nome: 'Jose Henrique',
    email: 'josehenrique@portoreal.com.br',
    creci: '',
    equipe: 'Ouro Preto d\'Oeste',
    status: 'ativo',
    nivel_atual: 35,
    cor_barra: '#3b82f6',
    modulo: 'vendas',
  },
]

export const EQUIPES_VENDAS: EquipeInfo[] = [
  { nome: 'Ji-Paraná', sigla: 'J', qtd_corretores: 2 },
  { nome: 'Ouro Preto d\'Oeste', sigla: 'O', qtd_corretores: 1 },
]

// ============================================================
// DASHBOARD — ALUGUEL
// ============================================================
export const DASHBOARD_STATS_ALUGUEL: DashboardStats = {
  corretores_ativos: 3,
  inativos_periodo: 0,
  metas_batidas: 0,
  total_corretores: 3,
  vgv_total_12m: 2400000,
  meta_vgv: 0,
  corretores_nivel_40: 0,
}

export const TOP_CORRETORES_ALUGUEL: TopCorretor[] = [
  { posicao: 1, nome: 'Maria Silva', meses_validos: 0, vgv: 1200000 },
  { posicao: 2, nome: 'Pedro Santos', meses_validos: 0, vgv: 800000 },
  { posicao: 3, nome: 'Ana Costa', meses_validos: 0, vgv: 400000 },
]

export const CORRETORES_ALUGUEL: Corretor[] = [
  {
    id: '10',
    nome: 'Maria Silva',
    email: 'maria@portoreal.com.br',
    creci: 'CRECI 6100 RO',
    equipe: 'Ji-Paraná',
    status: 'ativo',
    nivel_atual: 35,
    cor_barra: '#eb3238',
    modulo: 'aluguel',
  },
  {
    id: '11',
    nome: 'Pedro Santos',
    email: 'pedro@portoreal.com.br',
    creci: 'CRECI 6200 RO',
    equipe: 'Ji-Paraná',
    status: 'ativo',
    nivel_atual: 35,
    cor_barra: '#3b82f6',
    modulo: 'aluguel',
  },
  {
    id: '12',
    nome: 'Ana Costa',
    email: 'ana@portoreal.com.br',
    creci: 'CRECI 6300 RO',
    equipe: 'Porto Velho',
    status: 'ativo',
    nivel_atual: 35,
    cor_barra: '#3b82f6',
    modulo: 'aluguel',
  },
]

// ============================================================
// METAS GLOBAIS — VENDAS
// ============================================================
export const META_GLOBAL_VIGENTE_VENDAS: MetaGlobal = {
  id: '1',
  versao: 'v3',
  vigente: true,
  vigencia_inicio: '09/03/2026',
  vigencia_fim: undefined,
  metas_semanais: {
    contatos_ativos: 10,
    postagem_instagram: 2,
  },
  metas_mensais: {
    visitas_vendas: 2,
    captacao_exclusividade: 1,
    semanas_validas_minimas: 2,
  },
  meta_anual: {
    vgv_acumulado_minimo: 5000000,
    meses_validos_minimos: 8,
  },
  comissao_escalonada: {
    nivel_base: 30,
    nivel_mensal: 30,
    nivel_anual: 40,
  },
  alterado_por: 'Administrador',
  data_alteracao: '09/03/2026',
  modulo: 'vendas',
}

export const HISTORICO_VERSOES_VENDAS: VersaoMeta[] = [
  { versao: 'v3 - vigente', vigencia: '09/03/2026 - atual', alterado_por: 'Administrador', data: '09/03/2026', vigente: true },
  { versao: 'v2', vigencia: '28/02/2026 - 30/11/2026', alterado_por: 'Administrador', data: '05/03/2026', vigente: false },
  { versao: 'v1', vigencia: '05/03/2026 - 28/02/2026', alterado_por: 'Administrador', data: '05/03/2026', vigente: false },
]

// ============================================================
// ACESSO RÁPIDO
// ============================================================
export const ACESSO_RAPIDO_VENDAS: AcessoRapidoItem[] = [
  { titulo: 'Gerenciar Corretores', descricao: 'Cadastro, edição e status', href: '/corretores' },
  { titulo: 'Definir Metas', descricao: 'Metas mensais e semanais', href: '/metas' },
  { titulo: 'Lançamentos', descricao: 'Registrar novos imóveis', href: '/lancamentos' },
  { titulo: 'Vendas e VGV', descricao: 'Histórico e projeções', href: '/vendas-vgv' },
  { titulo: 'Relatórios', descricao: 'Análises detalhadas', href: '/relatorios' },
]

export const ACESSO_RAPIDO_ALUGUEL: AcessoRapidoItem[] = [
  { titulo: 'Gerenciar Corretores', descricao: 'Cadastro, edição e status', href: '/corretores' },
  { titulo: 'Definir Metas', descricao: 'Metas mensais e semanais', href: '/metas' },
  { titulo: 'Lançamentos', descricao: 'Registrar novos imóveis', href: '/lancamentos' },
  { titulo: 'Aluguéis', descricao: 'Contratos e renovações', href: '/vendas-vgv' },
  { titulo: 'Relatórios', descricao: 'Análises detalhadas', href: '/relatorios' },
]
