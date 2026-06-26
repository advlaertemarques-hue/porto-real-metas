-- =====================================================================
-- PORTO REAL — Garante perfil SUPERADMIN para os gestores (por e-mail)
-- =====================================================================
-- Necessário porque a Admin API de Auth desse projeto está com erro
-- ("Database error checking email/finding users"). Este SQL não usa a API:
-- casa auth.users (por e-mail) com a tabela public.profiles e seta superadmin.
-- Cria o profile se faltar. Idempotente.
--
-- COMO RODAR: Supabase > SQL Editor > cole e Run.
-- =====================================================================

-- 1) Diagnóstico: quais gestores JÁ existem no Auth?
select email, id, created_at
from auth.users
where lower(email) in ('laertejm@hotmail.com', 'atoginho18@gmail.com')
order by email;

-- 2) Fix: garante profile superadmin para os gestores que existirem.
insert into public.profiles (id, full_name, metas_role)
select u.id, x.nome, 'superadmin'
from auth.users u
join (values
  ('laertejm@hotmail.com',  'Laerte Marques'),
  ('atoginho18@gmail.com',  'Andressa Marques')
) as x(email, nome) on lower(u.email) = x.email
on conflict (id) do update
  set metas_role = 'superadmin',
      full_name  = excluded.full_name;

-- 3) Confere o resultado.
select p.full_name, p.metas_role, u.email
from public.profiles p
join auth.users u on u.id = p.id
where lower(u.email) in ('laertejm@hotmail.com', 'atoginho18@gmail.com');
