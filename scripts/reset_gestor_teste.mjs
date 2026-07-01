// Garante que o login de teste do gestor (gestor@<dominio>) existe e tem a
// senha de SEED_PASSWORD — usado para validar mudanças de UI no preview local.
// NÃO toca em vendas_corretores nem em dados de clientes.
//
// Env (via .env.local + .env.seed.local):
//   SUPABASE_URL / NEXT_PUBLIC_SUPABASE_URL
//   SUPABASE_SERVICE_ROLE_KEY
//   SEED_PASSWORD
//
//   set -a; . ./.env.local; . ./.env.seed.local; set +a; node scripts/reset_gestor_teste.mjs

import { createClient } from '@supabase/supabase-js'

const URL = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL
const KEY = process.env.SUPABASE_SERVICE_ROLE_KEY
const SENHA = process.env.SEED_PASSWORD
const EMAIL = `gestor@${process.env.SEED_DOMAIN || 'portoreal.com.br'}`

function exigir(v, n) { if (!v) { console.error(`❌ Falta a variável: ${n}`); process.exit(1) } }
exigir(URL, 'SUPABASE_URL'); exigir(KEY, 'SUPABASE_SERVICE_ROLE_KEY'); exigir(SENHA, 'SEED_PASSWORD')

const db = createClient(URL, KEY, { auth: { autoRefreshToken: false, persistSession: false } })

async function acharIdPorEmail(email) {
  // generateLink funciona por e-mail e devolve o usuário — mais confiável que
  // listUsers neste projeto ("Database error finding users").
  const { data, error } = await db.auth.admin.generateLink({ type: 'recovery', email })
  if (error) return null
  return data?.user?.id || null
}

async function main() {
  console.log(`🔄 Garantindo login de teste: ${EMAIL}`)
  const { data, error } = await db.auth.admin.createUser({
    email: EMAIL, password: SENHA, email_confirm: true, user_metadata: { full_name: 'Gestor Teste' },
  })

  let userId = data?.user?.id
  if (error) {
    console.log(`  ↺ já existia (${error.message}) — redefinindo a senha...`)
    userId = await acharIdPorEmail(EMAIL)
    if (!userId) { console.error('❌ Não achei o usuário pelo e-mail.'); process.exit(1) }
    const { error: upErr } = await db.auth.admin.updateUserById(userId, { password: SENHA, email_confirm: true })
    if (upErr) { console.error('❌ Falha ao redefinir senha:', upErr.message); process.exit(1) }
    console.log('  ✅ senha redefinida')
  } else {
    console.log('  ✅ usuário criado')
  }

  const { error: pErr } = await db.from('profiles').upsert({ id: userId, full_name: 'Gestor Teste', metas_role: 'superadmin' })
  if (pErr) { console.error('❌ Falha no profile:', pErr.message); process.exit(1) }
  console.log(`✅ Pronto: ${EMAIL} · superadmin · senha = SEED_PASSWORD`)
}

main().catch((e) => { console.error('❌ Erro:', e.message || e); process.exit(1) })
