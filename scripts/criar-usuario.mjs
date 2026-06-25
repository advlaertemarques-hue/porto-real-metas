// Cria um usuário superadmin via Admin API do Supabase.
//
// NUNCA cole a service_role key neste arquivo. Ela é passada por ambiente:
//
//   SUPABASE_URL=https://<projeto>.supabase.co \
//   SUPABASE_SERVICE_ROLE_KEY=<service_role_key> \
//   NOVO_USUARIO_EMAIL=fulano@exemplo.com \
//   NOVO_USUARIO_SENHA=<senha> \
//   node scripts/criar-usuario.mjs
//
// A service_role key está em: Supabase Dashboard > Project Settings > API.

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY
const EMAIL = process.env.NOVO_USUARIO_EMAIL
const SENHA = process.env.NOVO_USUARIO_SENHA
const NOME = process.env.NOVO_USUARIO_NOME || (EMAIL ? EMAIL.split('@')[0] : 'Usuário')

function exigir(valor, nome) {
  if (!valor) {
    console.error(`❌ Variável de ambiente obrigatória ausente: ${nome}`)
    process.exit(1)
  }
}

exigir(SUPABASE_URL, 'SUPABASE_URL')
exigir(SERVICE_ROLE_KEY, 'SUPABASE_SERVICE_ROLE_KEY')
exigir(EMAIL, 'NOVO_USUARIO_EMAIL')
exigir(SENHA, 'NOVO_USUARIO_SENHA')

async function criarUsuario() {
  console.log(`🔄 Criando usuário ${EMAIL}...`)

  // 1. Criar o usuário no Auth
  const res = await fetch(`${SUPABASE_URL}/auth/v1/admin/users`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'apikey': SERVICE_ROLE_KEY,
      'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
    },
    body: JSON.stringify({
      email: EMAIL,
      password: SENHA,
      email_confirm: true,
      user_metadata: { full_name: NOME }
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
      full_name: NOME,
      metas_role: 'superadmin',
    }),
  })

  if (resProfile.ok || resProfile.status === 201) {
    console.log('✅ Profile superadmin criado com sucesso!')
    console.log(`   Email: ${EMAIL}  |  Acesso: TOTAL (superadmin)`)
  } else {
    const errProfile = await resProfile.text()
    console.error('❌ Erro ao criar profile:', errProfile)
  }
}

criarUsuario()
