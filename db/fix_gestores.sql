-- =====================================================================
-- PORTO REAL — Acerta os GESTORES (Laerte e Andressa) por SQL
-- =====================================================================
-- Contexto: a Admin API de Auth desse projeto está instável e o painel
-- não deixa "Add user" para e-mail já existente. Como a Andressa JÁ existe
-- (e o Laerte também), resolvemos tudo direto no banco:
--   • define a senha da Andressa (ela não tem uma conhecida) e confirma o e-mail
--   • garante papel superadmin para os dois (cria o profile se faltar)
-- NÃO mexe na senha do Laerte (ele já usa a conta dele).
--
-- COMO RODAR: Supabase > SQL Editor > cole tudo e Run. Idempotente.
-- =====================================================================

create extension if not exists pgcrypto;  -- para crypt()/gen_salt()

-- 1) Diagnóstico: quem existe e está confirmado?
select email, id, (email_confirmed_at is not null) as confirmado
from auth.users
where lower(email) in ('laertejm@hotmail.com', 'atoginho18@gmail.com')
order by email;

-- 2) Andressa: define senha = portoreal123 (ela troca depois pelo 🔑 no app)
--    e confirma o e-mail (sem isso o login não funciona).
update auth.users
set encrypted_password = crypt('portoreal123', gen_salt('bf')),
    email_confirmed_at = coalesce(email_confirmed_at, now())
where lower(email) = 'atoginho18@gmail.com';

-- 3) Papel superadmin para os dois gestores (cria o profile se faltar).
insert into public.profiles (id, full_name, metas_role)
select u.id, x.nome, 'superadmin'
from auth.users u
join (values
  ('laertejm@hotmail.com', 'Laerte Marques'),
  ('atoginho18@gmail.com', 'Andressa Marques')
) as x(email, nome) on lower(u.email) = x.email
on conflict (id) do update
  set metas_role = 'superadmin',
      full_name  = excluded.full_name;

-- 4) Confere o resultado final.
select p.full_name, p.metas_role, u.email,
       (u.email_confirmed_at is not null) as confirmado
from public.profiles p
join auth.users u on u.id = p.id
where lower(u.email) in ('laertejm@hotmail.com', 'atoginho18@gmail.com');
