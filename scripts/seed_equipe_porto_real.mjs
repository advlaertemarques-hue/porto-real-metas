// Cria a equipe REAL da Porto Real no Supabase (Admin API).
// Gestores = superadmin (veem tudo). Corretores = role 'vendas' (cada um só o seu),
// já com registro em vendas_corretores ligado ao user_id (necessário para o RLS).
//
// Variáveis (use .env.seed.local + .env.local):
//   SUPABASE_URL / NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, SEED_PASSWORD
//   SEED_EQUIPE (opcional, padrão "Porto Real")
//
//   set -a; . ./.env.local; . ./.env.seed.local; set +a; node scripts/seed_equipe_porto_real.mjs
//
// Idempotente: reaproveita usuário/equipe/corretor que já existirem.

import { createClient } from '@supabase/supabase-js'

const URL = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL
const KEY = process.env.SUPABASE_SERVICE_ROLE_KEY
const SENHA = process.env.SEED_PASSWORD
const EQUIPE_NOME = process.env.SEED_EQUIPE || 'Porto Real'

function exigir(v, n) { if (!v) { console.error(`❌ Falta a variável: ${n}`); process.exit(1) } }
exigir(URL, 'SUPABASE_URL'); exigir(KEY, 'SUPABASE_SERVICE_ROLE_KEY'); exigir(SENHA, 'SEED_PASSWORD')

const db = createClient(URL, KEY, { auth: { autoRefreshToken: false, persistSession: false } })

const MEMBROS = [
  // Gestores (superadmin — veem tudo)
  { nome: 'Laerte Marques', email: 'laertejm@hotmail.com', role: 'superadmin', corretor: false },
  { nome: 'Andressa Marques', email: 'atoginho18@gmail.com', role: 'superadmin', corretor: false },
  // Corretores (role 'vendas' — cada um só o seu)
  { nome: 'Amanda Pamplona', email: 'mndpmpln@gmail.com', role: 'vendas', corretor: true },
  { nome: 'Gustavo', email: 'gustavohonoriomartins@gmail.com', role: 'vendas', corretor: true },
  { nome: 'José Henrique', email: 'jrt.moreira@creci.org.br', role: 'vendas', corretor: true },
  { nome: 'Kauã Felipe', email: 'contato@porto-real.com', role: 'vendas', corretor: true },
]

async function garantirUsuario(m) {
  const { data, error } = await db.auth.admin.createUser({
    email: m.email, password: SENHA, email_confirm: true, user_metadata: { full_name: m.nome },
  })
  if (error) {
    console.log(`  ⚠️ ${m.email}: ${error.message} (seguindo)`)
    return null
  }
  const user = data.user
  console.log(`  ✅ usuário criado: ${m.nome} <${m.email}> · ${m.role}`)
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
  if (existe?.id) { console.log(`  ↺ corretor já vinculado: ${m.nome}`); return }
  const { error } = await db.from('vendas_corretores').insert([{ nome: m.nome, email: m.email, equipe_id: equipeId, user_id: userId }])
  if (error) throw error
  console.log(`  ✅ corretor vinculado: ${m.nome}`)
}

async function main() {
  console.log(`🔄 Semeando equipe real "${EQUIPE_NOME}"...`)
  const equipeId = await garantirEquipe()
  for (const m of MEMBROS) {
    const user = await garantirUsuario(m)
    if (m.corretor && user) await garantirCorretor(m, user.id, equipeId)
  }
  console.log('\n✅ Pronto! Logins:')
  for (const m of MEMBROS) console.log(`   ${m.email}  ·  ${m.role}${m.corretor ? ' (corretor)' : ' (gestor)'}`)
  console.log('   Senha inicial (todos): a definida em SEED_PASSWORD — peça para cada um trocar.')
}

main().catch((e) => { console.error('❌ Erro:', e.message || e); process.exit(1) })
