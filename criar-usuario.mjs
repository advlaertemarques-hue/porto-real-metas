// Script para criar o usuário atoginho18@gmail.com com acesso superadmin
// Execute: node criar-usuario.mjs

const SUPABASE_URL = 'https://hscailoakoaujugpxlcn.supabase.co'

// Você precisa colocar a Service Role Key aqui
// Acesse: https://supabase.com/dashboard/project/hscailoakoaujugpxlcn/settings/api
// Copie a "service_role" key (não a anon key)
const SERVICE_ROLE_KEY = 'COLE_SUA_SERVICE_ROLE_KEY_AQUI'

async function criarUsuario() {
  console.log('🔄 Criando usuário atoginho18@gmail.com...')

  // 1. Criar o usuário no Auth
  const res = await fetch(`${SUPABASE_URL}/auth/v1/admin/users`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'apikey': SERVICE_ROLE_KEY,
      'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
    },
    body: JSON.stringify({
      email: 'atoginho18@gmail.com',
      password: 'Porto@2026',
      email_confirm: true,
      user_metadata: { full_name: 'Atoginho' }
    }),
  })

  const data = await res.json()

  if (!res.ok) {
    console.error('❌ Erro ao criar usuário:', data)
    return
  }

  const userId = data.id
  console.log('✅ Usuário criado! ID:', userId)

  // 2. Criar/atualizar o profile com superadmin
  const resProfile = await fetch(`${SUPABASE_URL}/rest/v1/profiles`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'apikey': SERVICE_ROLE_KEY,
      'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
      'Prefer': 'resolution=merge-duplicates',
    },
    body: JSON.stringify({
      id: userId,
      full_name: 'Atoginho',
      metas_role: 'superadmin',
    }),
  })

  if (resProfile.ok || resProfile.status === 201) {
    console.log('✅ Profile superadmin criado com sucesso!')
    console.log('')
    console.log('📋 Credenciais de acesso:')
    console.log('   Email: atoginho18@gmail.com')
    console.log('   Senha: Porto@2026')
    console.log('   Acesso: TOTAL (superadmin)')
  } else {
    const errProfile = await resProfile.text()
    console.error('❌ Erro ao criar profile:', errProfile)
  }
}

criarUsuario()
