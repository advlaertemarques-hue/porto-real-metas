-- =====================================================================
-- PORTO REAL — View dos USUÁRIOS REAIS (login) p/ a página Controle de Usuários
-- =====================================================================
-- Reflete quem realmente acessa o sistema (Supabase Auth), juntando:
--   auth.users (e-mail, datas) + profiles (papel) + vendas_corretores (CRECI,
--   telefone, equipe).
--
-- SEGURANÇA: a view roda como dona (lê auth.users), mas só retorna linhas se
-- QUEM consulta for superadmin (gate por auth.uid()). anon não tem acesso.
-- NÃO usar security_invoker aqui (precisa ler auth.users como dona).
--
-- COMO RODAR: Supabase > SQL Editor > cole e Run. Idempotente.
-- =====================================================================

create or replace view public.app_usuarios as
select
  u.id,
  coalesce(nullif(vc.nome, ''), nullif(p.full_name, ''), split_part(u.email, '@', 1)) as nome,
  u.email,
  p.metas_role as role,
  vc.creci,
  vc.telefone,
  e.nome as equipe,
  u.created_at,
  u.last_sign_in_at
from auth.users u
left join public.profiles p          on p.id = u.id
left join public.vendas_corretores vc on vc.user_id = u.id
left join public.vendas_equipes e     on e.id = vc.equipe_id
where exists (
  select 1 from public.profiles me
  where me.id = auth.uid() and me.metas_role = 'superadmin'
);

revoke all on public.app_usuarios from anon;
grant select on public.app_usuarios to authenticated;
