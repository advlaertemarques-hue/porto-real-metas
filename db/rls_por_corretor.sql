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
