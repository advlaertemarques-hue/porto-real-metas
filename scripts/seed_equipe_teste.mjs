// Cria a equipe de TESTE (5 pessoas) no Supabase usando a Admin API.
// 1 gestor (superadmin) + 4 corretores (role 'vendas'), cada corretor já com
// um registro em vendas_corretores ligado ao user_id — necessário para o RLS
// "cada um só o seu".
//
// NUNCA hardcode a service_role key. Passe por ambiente / arquivo .env.seed.local:
//
//   SUPABASE_URL=...              (ou NEXT_PUBLIC_SUPABASE_URL)
//   SUPABASE_SERVICE_ROLE_KEY=... (Dashboard > Project Settings > API)
//   SEED_PASSWORD=...             (senha comum dos usuários de teste)
//   SEED_DOMAIN=portoreal.com.br  (opcional; domínio dos e-mails)
//
//   node scripts/seed_equipe_teste.mjs
//
// É idempotente: reaproveita usuário/equipe/corretor que já existirem.

import { createClient } from '@supabase/supabase-js'

const URL = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL
const KEY = process.env.SUPABASE_SERVICE_ROLE_KEY
const SENHA = process.env.SEED_PASSWORD
const DOMINIO = process.env.SEED_DOMAIN || 'portoreal.com.br'
const EQUIPE_NOME = process.env.SEED_EQUIPE || 'Equipe Teste'

function exigir(v, n) { if (!v) { console.error(`❌ Falta a variável: ${n}`); process.exit(1) } }
exigir(URL, 'SUPABASE_URL'); exigir(KEY, 'SUPABASE_SERVICE_ROLE_KEY'); exigir(SENHA, 'SEED_PASSWORD')

const db = createClient(URL, KEY, { auth: { autoRefreshToken: false, persistSession: false } })

const MEMBROS = [
  { nome: 'Gestor Teste', email: `gestor@${DOMINIO}`, role: 'superadmin', corretor: false },
  { nome: 'Corretor 1', email: `corretor1@${DOMINIO}`, role: 'vendas', corretor: true },
  { nome: 'Corretor 2', email: `corretor2@${DOMINIO}`, role: 'vendas', corretor: true },
  { nome: 'Corretor 3', email: `corretor3@${DOMINIO}`, role: 'vendas', corretor: true },
  { nome: 'Corretor 4', email: `corretor4@${DOMINIO}`, role: 'vendas', corretor: true },
]

async function garantirUsuario(m) {
  // Cria direto (mais robusto que listar). Se já existir, segue sem travar.
  const { data, error } = await db.auth.admin.createUser({
    email: m.email, password: SENHA, email_confirm: true, user_metadata: { full_name: m.nome },
  })
  if (error) {
    console.log(`  ⚠️ ${m.email}: ${error.message}`)
    return null
  }
  const user = data.user
  console.log(`  ✅ usuário criado: ${m.email}`)
  await db.from('profiles').upsert({ id: user.id, full_name: m.nome, metas_role: m.role })
  return user
}

async function garantirEquipe() {
  const { data: existe } = await db.from('vendas_equipes').select('id').eq('nome', EQUIPE_NOME).maybeSingle()
  if (existe?.id) return existe.id
  const { data, error } = await db.from('vendas_equipes').insert([{ nome: EQUIPE_NOME }]).select('id').single()
  if (error) throw error
  console.log(`  ✅ equipe criada: ${EQUIPE_NOME}`)
  return data.id
}

async function garantirCorretor(m, userId, equipeId) {
  const { data: existe } = await db.from('vendas_corretores').select('id').eq('user_id', userId).maybeSingle()
  if (existe?.id) { console.log(`  ↺ corretor já existia: ${m.nome}`); return }
  const { error } = await db.from('vendas_corretores').insert([{ nome: m.nome, email: m.email, equipe_id: equipeId, user_id: userId }])
  if (error) throw error
  console.log(`  ✅ corretor vinculado: ${m.nome}`)
}

async function main() {
  console.log(`🔄 Semeando "${EQUIPE_NOME}" (${MEMBROS.length} pessoas)...`)
  const equipeId = await garantirEquipe()
  for (const m of MEMBROS) {
    const user = await garantirUsuario(m)
    if (m.corretor && user) await garantirCorretor(m, user.id, equipeId)
  }
  console.log('\n✅ Pronto! Logins de teste:')
  for (const m of MEMBROS) console.log(`   ${m.email}  ·  ${m.role}`)
  console.log(`   Senha (todos): a que você definiu em SEED_PASSWORD`)
}

main().catch((e) => { console.error('❌ Erro:', e.message || e); process.exit(1) })
