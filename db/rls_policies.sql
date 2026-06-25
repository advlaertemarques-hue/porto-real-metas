-- =====================================================================
-- Porto Real — Políticas de Row Level Security (RLS)
-- =====================================================================
-- PROBLEMA QUE RESOLVE:
-- O app acessa o Supabase direto do navegador com a ANON KEY (que é pública
-- e está no bundle JS). Sem RLS, qualquer pessoa com essa chave pode ler e
-- gravar QUALQUER tabela via API REST do Supabase. As checagens de papel no
-- front (canAccessModule) são só de UI e não protegem os dados.
--
-- MODELO DE ACESSO APLICADO AQUI:
--   • authenticated (usuário logado) ......... acesso total (MVP).
--   • anon (visitante dos formulários) ....... apenas o mínimo:
--       - SELECT (id, nome) em vendas_corretores  → seletor do formulário
--       - INSERT em vendas_clientes               → envio de lead
--       - INSERT em vendas_pesquisas              → envio de pesquisa
--     (anon NÃO pode ler clientes/pesquisas/metas/perfis/usuários etc.)
--
-- COMO RODAR:
--   Cole este arquivo inteiro no Supabase Dashboard > SQL Editor e execute.
--   É idempotente (pode rodar de novo) e ignora tabelas/views que não existam.
--   Requer Postgres 15+ (security_invoker em views) — padrão no Supabase atual.
--
-- PRÓXIMO PASSO (não incluído aqui, de propósito):
--   Hoje qualquer usuário logado vê tudo. Quando o sistema amadurecer, trocar
--   as políticas "authenticated total" por regras por papel/equipe usando o
--   profiles.metas_role (ex.: só superadmin gerencia usuarios_sistema).
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1) Tabelas que exigem login: RLS ON + acesso total para `authenticated`
-- ---------------------------------------------------------------------
do $do$
declare
  t text;
  tbls text[] := array[
    'aluguel_contratos','aluguel_documentos','aluguel_documentos_categorias',
    'aluguel_pdi_acoes','aluguel_pdis','aluguel_pendencias','aluguel_processos',
    'aluguel_processos_setores','avisos','corretores','demandas','documentos',
    'equipes','metas_globais','pdi_records','profiles','tarefas','usuarios_sistema',
    'vendas','vendas_alertas','vendas_cliente_checklist','vendas_cliente_notas',
    'vendas_clientes','vendas_corretores','vendas_equipes','vendas_lancamentos',
    'vendas_metas_definicoes','vendas_pesquisas','vendas_treinamentos',
    'vendas_treinamentos_categorias'
  ];
begin
  foreach t in array tbls loop
    if exists (
      select 1 from information_schema.tables
      where table_schema = 'public' and table_name = t
    ) then
      execute format('alter table public.%I enable row level security', t);
      execute format('drop policy if exists %I on public.%I', t || '_auth_all', t);
      execute format(
        'create policy %I on public.%I for all to authenticated using (true) with check (true)',
        t || '_auth_all', t
      );
    else
      raise notice 'Tabela inexistente, ignorada: %', t;
    end if;
  end loop;
end
$do$;

-- ---------------------------------------------------------------------
-- 2) Acesso anônimo mínimo para os formulários públicos
-- ---------------------------------------------------------------------

-- 2a) vendas_corretores: anon lê SOMENTE id e nome (seletor do formulário).
do $do$
begin
  if exists (
    select 1 from information_schema.tables
    where table_schema = 'public' and table_name = 'vendas_corretores'
  ) then
    -- Restringe as COLUNAS visíveis ao anon (defesa em profundidade: mesmo que
    -- a tabela ganhe email/telefone/comissão depois, o anon não os enxerga).
    revoke select on public.vendas_corretores from anon;
    grant select (id, nome) on public.vendas_corretores to anon;

    drop policy if exists vendas_corretores_anon_read on public.vendas_corretores;
    create policy vendas_corretores_anon_read on public.vendas_corretores
      for select to anon using (true);
  end if;
end
$do$;

-- 2b) vendas_clientes: anon pode INSERIR lead, nunca ler.
do $do$
begin
  if exists (
    select 1 from information_schema.tables
    where table_schema = 'public' and table_name = 'vendas_clientes'
  ) then
    drop policy if exists vendas_clientes_anon_insert on public.vendas_clientes;
    create policy vendas_clientes_anon_insert on public.vendas_clientes
      for insert to anon with check (true);
  end if;
end
$do$;

-- 2c) vendas_pesquisas: anon pode INSERIR pesquisa, nunca ler.
do $do$
begin
  if exists (
    select 1 from information_schema.tables
    where table_schema = 'public' and table_name = 'vendas_pesquisas'
  ) then
    drop policy if exists vendas_pesquisas_anon_insert on public.vendas_pesquisas;
    create policy vendas_pesquisas_anon_insert on public.vendas_pesquisas
      for insert to anon with check (true);
  end if;
end
$do$;

-- ---------------------------------------------------------------------
-- 3) Views de métricas: respeitar o RLS das tabelas-base e exigir login
-- ---------------------------------------------------------------------
-- Por padrão uma view roda com os privilégios do dono e IGNORA o RLS das
-- tabelas que ela lê — o que poderia vazar dados ao anon. security_invoker faz
-- a view rodar com o papel de quem consulta, herdando o RLS. Além disso,
-- removemos qualquer acesso do anon a essas views.
do $do$
declare
  v text;
  vws text[] := array[
    'vendas_v_ciclo_total','vendas_v_funil','vendas_v_gargalo','vendas_v_handoff',
    'vendas_v_lais_vs_humano','vendas_v_no_show','vendas_v_onde_treinar',
    'vendas_v_tempo_resposta','vendas_v_travas_pagamento'
  ];
begin
  foreach v in array vws loop
    if exists (
      select 1 from information_schema.views
      where table_schema = 'public' and table_name = v
    ) then
      execute format('alter view public.%I set (security_invoker = true)', v);
      execute format('revoke all on public.%I from anon', v);
      execute format('grant select on public.%I to authenticated', v);
    else
      raise notice 'View inexistente, ignorada: %', v;
    end if;
  end loop;
end
$do$;

-- ---------------------------------------------------------------------
-- 4) Conferência rápida: tabelas do schema público AINDA sem RLS
-- ---------------------------------------------------------------------
-- Rode após o script. O ideal é vir vazio (fora views e tabelas de sistema).
-- select tablename
-- from pg_tables
-- where schemaname = 'public'
--   and rowsecurity = false
-- order by tablename;
