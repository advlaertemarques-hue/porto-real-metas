-- =====================================================================
-- Porto Real — Campos estruturados do imóvel desejado (vendas_clientes)
-- =====================================================================
-- Adiciona colunas para as preferências do imóvel que antes ficavam soltas
-- no texto livre "preferencia". Ter isso estruturado permite filtrar e gerar
-- métricas (ex.: "quantos leads querem 3+ quartos com piscina").
--
-- COMO RODAR: cole no Supabase Dashboard > SQL Editor e execute.
-- Idempotente (IF NOT EXISTS). Todas as colunas são opcionais (nullable),
-- então leads antigos e o formulário público continuam funcionando.
-- =====================================================================

alter table public.vendas_clientes
  add column if not exists tipo_imovel text,
  add column if not exists quartos     smallint,
  add column if not exists suites      smallint,
  add column if not exists vagas       smallint,
  add column if not exists piscina     text;  -- 'sim' | 'nao' | 'indiferente'

-- Opcional: restringe os valores aceitos em piscina (descomente se quiser).
-- alter table public.vendas_clientes
--   add constraint vendas_clientes_piscina_chk
--   check (piscina is null or piscina in ('sim','nao','indiferente'));
