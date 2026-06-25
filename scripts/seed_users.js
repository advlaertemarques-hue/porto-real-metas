// Cria usuários de teste no Supabase.
//
// As credenciais são lidas do ambiente — não hardcode chaves nem senhas:
//
//   SUPABASE_URL=https://<projeto>.supabase.co \
//   SUPABASE_ANON_KEY=<anon_key> \
//   SEED_PASSWORD=<senha> \
//   node scripts/seed_users.js

const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
const seedPassword = process.env.SEED_PASSWORD

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Defina SUPABASE_URL e SUPABASE_ANON_KEY no ambiente.')
  process.exit(1)
}
if (!seedPassword) {
  console.error('❌ Defina SEED_PASSWORD no ambiente (senha dos usuários de teste).')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function seed() {
  const users = [
    { email: 'admin@portoreal.com.br', role: 'superadmin' },
    { email: 'vendas@portoreal.com.br', role: 'vendas' },
    { email: 'aluguel@portoreal.com.br', role: 'aluguel' },
  ]

  for (const u of users) {
    const { data, error } = await supabase.auth.signUp({
      email: u.email,
      password: seedPassword,
    })

    if (error) {
      console.log(`Error signing up ${u.email}:`, error.message)
    } else {
      console.log(`Created user ${u.email}`)

      // Update profile role if user created
      if (data.user) {
        await supabase.from('profiles').upsert({
          id: data.user.id,
          full_name: u.email.split('@')[0],
          metas_role: u.role
        })
        console.log(`Profile updated for ${u.email}`)
      }
    }
  }
}

seed()
