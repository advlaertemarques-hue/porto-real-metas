-- =====================================================================
-- PORTO REAL — SETUP COMPLETO (rode tudo de uma vez no SQL Editor)
-- Junta, na ordem certa: eventos_cliente.sql + rls_por_corretor.sql
-- Idempotente: pode rodar mais de uma vez sem problema.
-- =====================================================================

-- ========================== PARTE 1/2 ==========================
-- =====================================================================
-- PORTO REAL — CAPTURA DE EVENTOS DO FUNIL (Caminho A: "operar é medir")
-- =====================================================================
-- PROBLEMA QUE RESOLVE:
--   As métricas avançadas (funil, no-show, gargalo, onde-treinar, ciclo,
--   tempo de resposta) liam tabelas (vendas_lead_etapa_eventos, vendas_leads…)
--   que o app NUNCA gravava. Resultado: Auditoria sempre vazia.
--
-- O QUE FAZ:
--   Cria UMA tabela de eventos ligada ao CRM real (vendas_clientes), no funil
--   real de 6 etapas (0..5 de constants.ts). Cada movimento de etapa grava um
--   evento — daí saem todos os indicadores. Sem dupla digitação.
--
-- MODELO:
--   • 1 evento ABERTO por cliente = a etapa onde ele está agora (saiu_em null).
--   • Ao avançar/retroceder: fecha o evento aberto (saiu_em, resultado) e abre
--     um novo na nova etapa.
--   • Ao finalizar: fecha o evento aberto com resultado 'avancou' (ganho) ou
--     'perdido' (com motivo). Não abre novo.
--
-- COMO RODAR:
--   Cole no Supabase Dashboard > SQL Editor e execute. É idempotente.
--   Rode DEPOIS que vendas_clientes já exista. O RLS segue o padrão do projeto.
-- =====================================================================

create table if not exists vendas_cliente_eventos (
  id          uuid primary key default gen_random_uuid(),
  cliente_id  uuid not null references vendas_clientes(id) on delete cascade,
  etapa       integer not null,                 -- índice do funil real (0..5)
  entrou_em   timestamptz not null default now(),
  saiu_em     timestamptz,                       -- null = cliente está nesta etapa agora
  dono_tipo   text check (dono_tipo in ('lais','humano')),
  resultado   text check (resultado in ('avancou','perdido','retrocedeu')),
  motivo      text,                              -- preenchido quando resultado='perdido'
  created_at  timestamptz default now()
);

create index if not exists idx_vce_cliente  on vendas_cliente_eventos(cliente_id);
create index if not exists idx_vce_etapa     on vendas_cliente_eventos(etapa);
create index if not exists idx_vce_abertos    on vendas_cliente_eventos(cliente_id) where saiu_em is null;
create index if not exists idx_vce_entrou     on vendas_cliente_eventos(entrou_em);

-- ---------------------------------------------------------------------
-- Evento inicial automático: todo cliente novo (inclusive do formulário
-- público anônimo) ganha um evento ABERTO na sua etapa de entrada.
-- SECURITY DEFINER para funcionar mesmo sob o RLS do papel `anon`.
-- ---------------------------------------------------------------------
create or replace function vendas_cliente_evento_inicial()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into vendas_cliente_eventos (cliente_id, etapa, entrou_em, dono_tipo)
  values (
    new.id,
    coalesce(new.etapa, 0),
    coalesce(new.created_at, now()),
    case when coalesce(new.porta, 'A') = 'A' and coalesce(new.etapa,0) <= 1
         then 'lais' else 'humano' end
  );
  return new;
end;
$$;

drop trigger if exists trg_vendas_cliente_evento_inicial on vendas_clientes;
create trigger trg_vendas_cliente_evento_inicial
  after insert on vendas_clientes
  for each row execute function vendas_cliente_evento_inicial();

-- ---------------------------------------------------------------------
-- Backfill: clientes que já existem ganham um evento-base na etapa atual
-- (histórico de tempo por etapa começa a valer a partir de agora; o passado
-- não tem como ser reconstruído, mas a foto atual fica correta).
-- ---------------------------------------------------------------------
insert into vendas_cliente_eventos (cliente_id, etapa, entrou_em, saiu_em, dono_tipo, resultado, motivo)
select
  c.id,
  coalesce(c.etapa, 0),
  coalesce(c.created_at, now()),
  case when c.finalizado then coalesce(c.updated_at, now()) else null end,
  case when coalesce(c.porta,'A') = 'A' and coalesce(c.etapa,0) <= 1 then 'lais' else 'humano' end,
  case when c.finalizado and c.status_finalizacao = 'sucesso' then 'avancou'
       when c.finalizado then 'perdido'
       else null end,
  case when c.finalizado and c.status_finalizacao <> 'sucesso' then c.motivo_finalizacao else null end
from vendas_clientes c
where not exists (
  select 1 from vendas_cliente_eventos e where e.cliente_id = c.id
);

-- ---------------------------------------------------------------------
-- RLS: mesmo padrão do projeto (login = acesso total). Anon não acessa
-- diretamente; o trigger (security definer) cuida do evento inicial dele.
-- ---------------------------------------------------------------------
alter table vendas_cliente_eventos enable row level security;
drop policy if exists vendas_cliente_eventos_auth_all on vendas_cliente_eventos;
create policy vendas_cliente_eventos_auth_all on vendas_cliente_eventos
  for all to authenticated using (true) with check (true);

-- ---------------------------------------------------------------------
-- HANDOFF (passagem de bastão Andressa/Lais → Corretor, na E3 Visita).
-- iniciado = quando a visita é agendada / o lead entra na Visita.
-- assumido = quando o corretor clica "Assumir atendimento".
-- Tempo morto do handoff = assumido − iniciado.
-- ---------------------------------------------------------------------
alter table vendas_clientes add column if not exists handoff_iniciado_em timestamptz;
alter table vendas_clientes add column if not exists handoff_assumido_em timestamptz;


-- ========================== PARTE 2/2 ==========================
-- =====================================================================
-- PORTO REAL — RLS POR CORRETOR ("cada um só o seu")
-- =====================================================================
-- Substitui o acesso "authenticated = vê tudo" no módulo de Vendas por:
--   • superadmin (gestor) ............ vê e edita TUDO.
--   • corretor (role 'vendas') ....... vê e edita apenas os PRÓPRIOS clientes
--                                       (e as notas / checklist / eventos deles).
--
-- Liga o cliente ao corretor logado por:
--   vendas_clientes.corretor_id → vendas_corretores.id → vendas_corretores.user_id = auth.uid()
-- (por isso o seed cria vendas_corretores com user_id de cada pessoa.)
--
-- COMO RODAR: cole no Supabase > SQL Editor e execute. Idempotente.
-- Rode DEPOIS de rls_policies.sql e de eventos_cliente.sql.
-- =====================================================================

-- ---- Helpers (SECURITY DEFINER para poderem ler profiles/corretores) ----
create or replace function public.is_superadmin()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from profiles where id = auth.uid() and metas_role = 'superadmin');
$$;

create or replace function public.owns_corretor(p_corretor uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select p_corretor is not null and exists (
    select 1 from vendas_corretores vc where vc.id = p_corretor and vc.user_id = auth.uid());
$$;

create or replace function public.owns_cliente(p_cliente uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from vendas_clientes c
    join vendas_corretores vc on vc.id = c.corretor_id
    where c.id = p_cliente and vc.user_id = auth.uid());
$$;

-- ---- vendas_clientes ----
alter table vendas_clientes enable row level security;
drop policy if exists vendas_clientes_auth_all on vendas_clientes;

drop policy if exists vendas_clientes_select on vendas_clientes;
create policy vendas_clientes_select on vendas_clientes for select to authenticated
  using (public.is_superadmin() or public.owns_corretor(corretor_id));

drop policy if exists vendas_clientes_update on vendas_clientes;
create policy vendas_clientes_update on vendas_clientes for update to authenticated
  using (public.is_superadmin() or public.owns_corretor(corretor_id))
  with check (public.is_superadmin() or public.owns_corretor(corretor_id) or corretor_id is null);

drop policy if exists vendas_clientes_delete on vendas_clientes;
create policy vendas_clientes_delete on vendas_clientes for delete to authenticated
  using (public.is_superadmin() or public.owns_corretor(corretor_id));

drop policy if exists vendas_clientes_insert_auth on vendas_clientes;
create policy vendas_clientes_insert_auth on vendas_clientes for insert to authenticated
  with check (public.is_superadmin() or public.owns_corretor(corretor_id) or corretor_id is null);
-- (a política vendas_clientes_anon_insert, do form público, continua valendo)

-- ---- Tabelas-filhas (notas / checklist / eventos): pelo dono do cliente ----
do $do$
declare t text;
  tbls text[] := array['vendas_cliente_notas','vendas_cliente_checklist','vendas_cliente_eventos'];
begin
  foreach t in array tbls loop
    if exists (select 1 from information_schema.tables where table_schema='public' and table_name=t) then
      execute format('alter table public.%I enable row level security', t);
      execute format('drop policy if exists %I on public.%I', t||'_auth_all', t);
      execute format('drop policy if exists %I on public.%I', t||'_owner', t);
      execute format(
        'create policy %I on public.%I for all to authenticated using (public.is_superadmin() or public.owns_cliente(cliente_id)) with check (public.is_superadmin() or public.owns_cliente(cliente_id))',
        t||'_owner', t);
    end if;
  end loop;
end $do$;

-- Nota: o trigger de evento inicial é SECURITY DEFINER, então segue criando o
-- evento mesmo para leads do formulário público (anon), sem esbarrar no RLS.
