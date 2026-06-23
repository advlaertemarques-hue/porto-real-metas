-- =====================================================================
-- PORTO REAL — SCHEMA DE MEDICAO DO PROCESSO DE VENDAS (Supabase/Postgres)
-- Terceira camada: rastreamento + medicao (onde o cliente esta, tempos,
-- quedas, no-show, tempo morto de handoff, eventos-alerta).
-- Alinhado ao Processo de Vendas v5 (etapas E1-E12, duas portas, 1 handoff).
-- Convencao: prefixo de modulo "vendas_", colunas em portugues, uuid + timestamptz.
-- =====================================================================

-- Supabase ja expoe gen_random_uuid(); se rodar fora, descomente:
-- create extension if not exists pgcrypto;

-- ---------------------------------------------------------------------
-- 1) vendas_etapas — definicao das etapas (tabela de referencia / seed)
--    E uma etapa por evento. dono_padrao = quem normalmente conduz.
--    mede_queda = true no funil de cima (mede escape); false no fim (mede tempo/trava).
-- ---------------------------------------------------------------------
create table if not exists vendas_etapas (
  id            uuid primary key default gen_random_uuid(),
  codigo        text not null unique,                 -- 'E1' ... 'E12'
  nome          text not null,
  ordem         integer not null,
  fase          text not null check (fase in ('qualificacao','visita','fechamento','pos_venda')),
  dono_padrao   text not null check (dono_padrao in ('qualificador','corretor','pos_venda')),
  evento_entrada text,
  evento_saida   text,
  mede_queda    boolean not null default true,
  setor_id      uuid,                                 -- ponte opcional p/ a biblioteca de manuais
  created_at    timestamptz default now()
);

-- ---------------------------------------------------------------------
-- 2) vendas_leads — quem esta no funil
--    porta: A = entrou pela Lais; B = entrou direto num humano (balcao, telefone, placa, indicacao)
--    forma_pagamento alimenta os ramos da etapa E8 (Formalizacao & Documentacao)
-- ---------------------------------------------------------------------
create table if not exists vendas_leads (
  id              uuid primary key default gen_random_uuid(),
  nome            text,
  telefone        text,
  email           text,
  origem          text check (origem in ('portal','instagram','facebook','indicacao','placa','site','google','whatsapp','balcao','telefone','outro')),
  canal           text,
  porta           char(1) not null default 'A' check (porta in ('A','B')),
  via_expressa    boolean not null default false,     -- chegou decidido apontando um imovel
  temperatura     text check (temperatura in ('quente','morno','frio')),
  -- intencao (Qualificacao Nivel 1, sem comprovacao)
  tipo_negocio    text check (tipo_negocio in ('compra','aluguel')),
  faixa_min       numeric(14,2),
  faixa_max       numeric(14,2),
  forma_pagamento text not null default 'a_definir'
                  check (forma_pagamento in ('a_vista','parcelamento','permuta','financiamento','a_definir')),
  urgencia        text check (urgencia in ('alta','media','baixa')),
  imovel_interesse text,                              -- codigo ou descricao do imovel-alvo
  -- perfil (2 passadas)
  perfil_hipotese   text check (perfil_hipotese  in ('analitico','controlador','apoiador','catalisador')),
  perfil_confirmado text check (perfil_confirmado in ('analitico','controlador','apoiador','catalisador')),
  -- roteamento / estado
  corretor_id     uuid,                               -- closer responsavel (quando atribuido)
  etapa_atual_id  uuid references vendas_etapas(id),  -- denormalizado p/ a UI "onde o cliente esta"
  status          text not null default 'ativo' check (status in ('ativo','ganho','perdido','congelado')),
  motivo_perda    text,
  created_at      timestamptz default now(),
  updated_at      timestamptz default now()
);

create index if not exists idx_vendas_leads_status   on vendas_leads(status);
create index if not exists idx_vendas_leads_etapa     on vendas_leads(etapa_atual_id);
create index if not exists idx_vendas_leads_corretor  on vendas_leads(corretor_id);
create index if not exists idx_vendas_leads_porta     on vendas_leads(porta);

-- ---------------------------------------------------------------------
-- 3) vendas_lead_etapa_eventos — O CORACAO. Uma linha por passagem de um
--    lead por uma etapa. saiu_em IS NULL => o lead esta nesta etapa agora.
--    Daqui saem quase todas as metricas (tempo por etapa, queda, no-show).
-- ---------------------------------------------------------------------
create table if not exists vendas_lead_etapa_eventos (
  id              uuid primary key default gen_random_uuid(),
  lead_id         uuid not null references vendas_leads(id) on delete cascade,
  etapa_id        uuid not null references vendas_etapas(id),
  entrou_em       timestamptz not null default now(),
  saiu_em         timestamptz,
  dono_tipo       text check (dono_tipo in ('lais','humano')),
  dono_id         uuid,                               -- qual pessoa/corretor (null se Lais)
  resultado       text check (resultado in ('avancou','perdido','pulou','retrocedeu')),
  avanco_descricao text,                              -- o compromisso concreto: "visita sabado 10h"
  meta            jsonb not null default '{}'::jsonb, -- extras por etapa (ex.: {"realizada": true})
  created_at      timestamptz default now()
);

create index if not exists idx_vendas_eventos_lead   on vendas_lead_etapa_eventos(lead_id);
create index if not exists idx_vendas_eventos_etapa  on vendas_lead_etapa_eventos(etapa_id);
create index if not exists idx_vendas_eventos_abertos on vendas_lead_etapa_eventos(lead_id) where saiu_em is null;
create index if not exists idx_vendas_eventos_entrou on vendas_lead_etapa_eventos(entrou_em);

-- ---------------------------------------------------------------------
-- 4) vendas_handoffs — passagem de bastao (mede o tempo morto da passagem)
--    iniciado_em = carimbo de saida do qualificador; assumido_em = chegada no corretor.
-- ---------------------------------------------------------------------
create table if not exists vendas_handoffs (
  id              uuid primary key default gen_random_uuid(),
  lead_id         uuid not null references vendas_leads(id) on delete cascade,
  tipo            text not null check (tipo in ('qualificador_corretor','lais_humano','corretor_posvenda')),
  de_dono_tipo    text check (de_dono_tipo in ('lais','humano')),
  de_dono_id      uuid,
  para_dono_tipo  text check (para_dono_tipo in ('lais','humano')),
  para_dono_id    uuid,
  iniciado_em     timestamptz not null default now(),
  assumido_em     timestamptz,                        -- null = ainda nao assumido (pendente)
  pacote_completo boolean not null default true,      -- contexto viajou completo?
  created_at      timestamptz default now()
);

create index if not exists idx_vendas_handoffs_lead     on vendas_handoffs(lead_id);
create index if not exists idx_vendas_handoffs_pendentes on vendas_handoffs(lead_id) where assumido_em is null;

-- ---------------------------------------------------------------------
-- 5) vendas_alertas — eventos-alerta / gatilhos automaticos
--    Ex.: imovel pedido fora do catalogo (dispara sync + manda humano).
-- ---------------------------------------------------------------------
create table if not exists vendas_alertas (
  id              uuid primary key default gen_random_uuid(),
  lead_id         uuid references vendas_leads(id) on delete cascade,
  tipo            text not null check (tipo in (
                    'imovel_fora_catalogo',
                    'pergunta_repetida',
                    'conversa_sem_avanco',
                    'loop_detectado',
                    'lead_quente_sem_resposta',
                    'nao_encaminha_visita')),
  detalhe         jsonb not null default '{}'::jsonb, -- ex.: {"codigo_imovel": "JP056"}
  acao_disparada  text,                               -- ex.: 'sync_catalogo', 'handoff_humano'
  resolvido       boolean not null default false,
  resolvido_em    timestamptz,
  created_at      timestamptz default now()
);

create index if not exists idx_vendas_alertas_tipo      on vendas_alertas(tipo);
create index if not exists idx_vendas_alertas_abertos   on vendas_alertas(tipo) where resolvido = false;

-- ---------------------------------------------------------------------
-- 6) vendas_bloqueios — onde a etapa trava (sobretudo E8 Formalizacao e E9)
--    ramo = forma de pagamento que define o subprocesso (a vista, parcelamento, permuta, financiamento).
--    tipo_bloqueio = sub-marco que travou (doc_comprador, analise_credito, avaliacao_bem, cartorio...).
-- ---------------------------------------------------------------------
create table if not exists vendas_bloqueios (
  id            uuid primary key default gen_random_uuid(),
  lead_id       uuid not null references vendas_leads(id) on delete cascade,
  etapa_id      uuid not null references vendas_etapas(id),
  ramo          text check (ramo in ('a_vista','parcelamento','permuta','financiamento')),
  tipo_bloqueio text not null,                        -- ex.: 'doc_comprador','doc_vendedor','analise_credito','avaliacao_bem','cartorio','fgts'
  descricao     text,
  aberto_em     timestamptz not null default now(),
  resolvido_em  timestamptz,
  created_at    timestamptz default now()
);

create index if not exists idx_vendas_bloqueios_lead    on vendas_bloqueios(lead_id);
create index if not exists idx_vendas_bloqueios_abertos on vendas_bloqueios(etapa_id) where resolvido_em is null;

-- ---------------------------------------------------------------------
-- updated_at automatico em vendas_leads
-- ---------------------------------------------------------------------
create or replace function vendas_set_updated_at()
returns trigger as $$
begin
  new.updated_at := now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists trg_vendas_leads_updated_at on vendas_leads;
create trigger trg_vendas_leads_updated_at
  before update on vendas_leads
  for each row execute function vendas_set_updated_at();

-- =====================================================================
-- SEED — etapas E1 a E12 (modelo v5)
-- =====================================================================
insert into vendas_etapas (codigo, nome, ordem, fase, dono_padrao, evento_entrada, evento_saida, mede_queda) values
  ('E1','Lead / Entrada',                  1,'qualificacao','qualificador','Contato chega por qualquer canal','Primeira resposta enviada', true),
  ('E2','Conexao & Qualificacao leve',     2,'qualificacao','qualificador','Cliente respondeu','Intencao lida (Nivel 1)', true),
  ('E3','Oferta / Match (lista enviada)',  3,'qualificacao','qualificador','Intencao qualificada','Imoveis apresentados ao cliente', true),
  ('E4','Visita agendada',                 4,'qualificacao','qualificador','Interesse numa opcao (ou via expressa)','Visita marcada com data e hora', true),
  ('E5','Visita realizada + Perfil',       5,'visita','corretor','Visita agendada (handoff ao corretor)','Visita aconteceu + perfil confirmado + Avanco', true),
  ('E6','Proposta',                        6,'fechamento','corretor','Interesse pos-visita','Proposta colhida (checkpoint financeiro Nivel 2)', true),
  ('E7','Negociacao',                      7,'fechamento','corretor','Existe proposta','Acordo de valor e condicoes', true),
  ('E8','Formalizacao & Documentacao',     8,'fechamento','corretor','Acordo fechado','Documentacao aprovada / condicoes executadas', false),
  ('E9','Fechamento',                      9,'fechamento','corretor','Documentacao ok','Contrato assinado e chaves entregues', false),
  ('E10','Pos-venda',                     10,'pos_venda','pos_venda','Chaves entregues','Acompanhamento concluido', false),
  ('E11','Depoimento',                    11,'pos_venda','pos_venda','Cliente satisfeito','Depoimento coletado e publicado', false),
  ('E12','Indicacao',                     12,'pos_venda','pos_venda','Relacionamento ativo','Indicacao registrada como novo lead', false)
on conflict (codigo) do nothing;

-- =====================================================================
-- VIEWS DE METRICA
-- =====================================================================

-- Tempo de resposta (E1): da entrada do lead ate a 1a resposta, por porta e dono.
create or replace view vendas_v_tempo_resposta as
select l.porta,
       ev.dono_tipo,
       count(*)                                   as leads,
       avg(ev.saiu_em - ev.entrou_em)             as tempo_medio,
       percentile_cont(0.5) within group (order by extract(epoch from (ev.saiu_em - ev.entrou_em))) as mediana_seg
from vendas_lead_etapa_eventos ev
join vendas_etapas et on et.id = ev.etapa_id and et.codigo = 'E1'
join vendas_leads  l  on l.id  = ev.lead_id
where ev.saiu_em is not null
group by l.porta, ev.dono_tipo;

-- Funil de conversao por etapa (quantos entraram e quantos avancaram).
create or replace view vendas_v_funil as
select et.ordem, et.codigo, et.nome,
       count(distinct ev.lead_id)                                                   as entraram,
       count(distinct ev.lead_id) filter (where ev.resultado = 'avancou')           as avancaram,
       count(distinct ev.lead_id) filter (where ev.resultado = 'perdido')           as perderam,
       round(100.0 * count(distinct ev.lead_id) filter (where ev.resultado = 'avancou')
             / nullif(count(distinct ev.lead_id), 0), 1)                            as taxa_avanco_pct
from vendas_etapas et
left join vendas_lead_etapa_eventos ev on ev.etapa_id = et.id
group by et.ordem, et.codigo, et.nome
order by et.ordem;

-- No-show: na E5, entrar = visita agendada; avancar = visita realizada.
create or replace view vendas_v_no_show as
select count(distinct ev.lead_id)                                                    as agendadas,
       count(distinct ev.lead_id) filter (where ev.resultado = 'avancou')            as realizadas,
       round(100.0 * (1 - count(distinct ev.lead_id) filter (where ev.resultado = 'avancou')::numeric
             / nullif(count(distinct ev.lead_id), 0)), 1)                            as taxa_no_show_pct
from vendas_lead_etapa_eventos ev
join vendas_etapas et on et.id = ev.etapa_id and et.codigo = 'E5';

-- Tempo morto do handoff (e pendentes nao assumidos).
create or replace view vendas_v_handoff as
select tipo,
       count(*)                                                  as total,
       count(*) filter (where assumido_em is null)               as pendentes,
       avg(assumido_em - iniciado_em)                            as tempo_morto_medio,
       count(*) filter (where pacote_completo = false)           as pacote_incompleto
from vendas_handoffs
group by tipo;

-- Lais vs humano: quantos leads de cada porta chegaram a agendar visita (E4 avancou).
create or replace view vendas_v_lais_vs_humano as
select l.porta,
       count(distinct l.id)                                       as leads,
       count(distinct l.id) filter (where exists (
         select 1 from vendas_lead_etapa_eventos e4
         join vendas_etapas et4 on et4.id = e4.etapa_id and et4.codigo = 'E4'
         where e4.lead_id = l.id and e4.resultado = 'avancou'))   as agendaram_visita,
       round(100.0 * count(distinct l.id) filter (where exists (
         select 1 from vendas_lead_etapa_eventos e4
         join vendas_etapas et4 on et4.id = e4.etapa_id and et4.codigo = 'E4'
         where e4.lead_id = l.id and e4.resultado = 'avancou'))
         / nullif(count(distinct l.id), 0), 1)                    as taxa_agendamento_pct
from vendas_leads l
group by l.porta;

-- Gargalo: em que etapa os leads perdidos pararam.
create or replace view vendas_v_gargalo as
select et.ordem, et.codigo, et.nome,
       count(*) as perdas
from vendas_leads l
join vendas_etapas et on et.id = l.etapa_atual_id
where l.status = 'perdido'
group by et.ordem, et.codigo, et.nome
order by perdas desc;

-- Onde treinar: cruza tempo medio na etapa x taxa de queda (quanto maior o indice, mais atencao).
create or replace view vendas_v_onde_treinar as
select et.ordem, et.codigo, et.nome,
       avg(ev.saiu_em - ev.entrou_em)                                                as tempo_medio,
       round(100.0 * count(*) filter (where ev.resultado = 'perdido')
             / nullif(count(*), 0), 1)                                              as taxa_queda_pct,
       round(extract(epoch from avg(ev.saiu_em - ev.entrou_em)) / 3600.0
             * (count(*) filter (where ev.resultado = 'perdido')::numeric
                / nullif(count(*), 0)), 2)                                          as indice_atencao
from vendas_etapas et
join vendas_lead_etapa_eventos ev on ev.etapa_id = et.id and ev.saiu_em is not null
group by et.ordem, et.codigo, et.nome
order by indice_atencao desc nulls last;

-- Travas por ramo de pagamento (E8): onde a formalizacao mais empaca.
create or replace view vendas_v_travas_pagamento as
select coalesce(b.ramo, l.forma_pagamento)                       as ramo,
       b.tipo_bloqueio,
       count(*)                                                  as ocorrencias,
       count(*) filter (where b.resolvido_em is null)            as abertos,
       avg(coalesce(b.resolvido_em, now()) - b.aberto_em)        as tempo_medio_aberto
from vendas_bloqueios b
join vendas_leads l on l.id = b.lead_id
group by coalesce(b.ramo, l.forma_pagamento), b.tipo_bloqueio
order by ocorrencias desc;

-- Ciclo total do negocio ganho (E1 ate ganho).
create or replace view vendas_v_ciclo_total as
select l.id as lead_id, l.nome,
       min(ev.entrou_em)                                         as inicio,
       l.updated_at                                              as fechamento,
       l.updated_at - min(ev.entrou_em)                          as ciclo_total
from vendas_leads l
join vendas_lead_etapa_eventos ev on ev.lead_id = l.id
where l.status = 'ganho'
group by l.id, l.nome, l.updated_at;
