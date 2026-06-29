// =====================================================================
// PORTO REAL — Rota de servidor para CRIAR / EXCLUIR logins reais.
// =====================================================================
// Criar e excluir um login de verdade exige a Admin API do Supabase, que só
// funciona com a SERVICE_ROLE_KEY. Essa chave é dona do banco inteiro e NUNCA
// pode ir para o navegador — por isso a operação vive aqui, no servidor.
//
// Segurança em duas camadas:
//   1. O chamador precisa enviar seu access_token (Bearer). Validamos o token
//      e conferimos no profiles que o papel é 'superadmin' (gestor). Sem isso → 403.
//   2. A chave de serviço só existe no ambiente do servidor (SUPABASE_SERVICE_ROLE_KEY,
//      NUNCA com prefixo NEXT_PUBLIC_).
//
// Variáveis de ambiente necessárias (Vercel > Settings > Environment Variables):
//   NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY (já existem)
//   SUPABASE_SERVICE_ROLE_KEY  ← adicionar como secret de servidor
// =====================================================================

import { NextRequest, NextResponse } from 'next/server'
import { createClient, SupabaseClient } from '@supabase/supabase-js'

export const runtime = 'nodejs'

const URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

type Erro = { status: number; error: string }

// Valida o token do chamador e garante que ele é gestor (superadmin).
// Retorna o id do usuário logado, ou um erro pronto para responder.
async function exigirGestor(req: NextRequest): Promise<{ uid: string } | Erro> {
  if (!URL || !ANON_KEY) return { status: 500, error: 'Supabase não configurado no servidor.' }
  if (!SERVICE_ROLE_KEY) {
    return { status: 500, error: 'SUPABASE_SERVICE_ROLE_KEY ausente no servidor. Adicione o segredo no deploy.' }
  }

  const auth = req.headers.get('authorization') || ''
  const token = auth.toLowerCase().startsWith('bearer ') ? auth.slice(7).trim() : ''
  if (!token) return { status: 401, error: 'Não autenticado.' }

  // Cliente anon só para validar o token e descobrir quem é o chamador.
  const anon = createClient(URL, ANON_KEY, { auth: { persistSession: false } })
  const { data: userData, error: userErr } = await anon.auth.getUser(token)
  if (userErr || !userData?.user) return { status: 401, error: 'Sessão inválida.' }

  const { data: profile } = await anon
    .from('profiles')
    .select('metas_role')
    .eq('id', userData.user.id)
    .single()

  if (profile?.metas_role !== 'superadmin') {
    return { status: 403, error: 'Apenas gestores podem gerenciar logins.' }
  }
  return { uid: userData.user.id }
}

function admin(): SupabaseClient {
  return createClient(URL!, SERVICE_ROLE_KEY!, { auth: { autoRefreshToken: false, persistSession: false } })
}

function ehErro(x: { uid: string } | Erro): x is Erro {
  return (x as Erro).error !== undefined
}

// ---------------------------------------------------------------------
// POST — cria um login real (auth + profile + vendas_corretores se corretor)
// ---------------------------------------------------------------------
export async function POST(req: NextRequest) {
  const guard = await exigirGestor(req)
  if (ehErro(guard)) return NextResponse.json({ error: guard.error }, { status: guard.status })

  let body: any
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Corpo inválido.' }, { status: 400 })
  }

  const nome = String(body.nome || '').trim()
  const email = String(body.email || '').trim().toLowerCase()
  const senha = String(body.senha || '').trim()
  const role = body.role as 'superadmin' | 'vendas' | 'aluguel'
  const telefone = body.telefone ? String(body.telefone).trim() : null
  const creci = body.creci ? String(body.creci).trim() : null
  const equipe_id = body.equipe_id ? String(body.equipe_id) : null

  if (!nome || !email || !senha) {
    return NextResponse.json({ error: 'Nome, e-mail e senha são obrigatórios.' }, { status: 400 })
  }
  if (senha.length < 6) {
    return NextResponse.json({ error: 'A senha deve ter pelo menos 6 caracteres.' }, { status: 400 })
  }
  if (!['superadmin', 'vendas', 'aluguel'].includes(role)) {
    return NextResponse.json({ error: 'Perfil de acesso inválido.' }, { status: 400 })
  }

  const db = admin()

  // 1. Cria o usuário no Auth (e-mail já confirmado).
  const { data: created, error: createErr } = await db.auth.admin.createUser({
    email,
    password: senha,
    email_confirm: true,
    user_metadata: { full_name: nome },
  })
  if (createErr || !created?.user) {
    const msg = /already.*registered|exists/i.test(createErr?.message || '')
      ? 'Já existe um login com esse e-mail.'
      : `Erro ao criar login: ${createErr?.message || 'desconhecido'}`
    return NextResponse.json({ error: msg }, { status: 400 })
  }
  const userId = created.user.id

  // 2. Define o papel no profiles.
  const { error: profErr } = await db
    .from('profiles')
    .upsert({ id: userId, full_name: nome, metas_role: role })
  if (profErr) {
    // Desfaz o auth para não deixar login órfão sem papel.
    await db.auth.admin.deleteUser(userId)
    return NextResponse.json({ error: `Erro ao definir o papel: ${profErr.message}` }, { status: 500 })
  }

  // 3. Se for corretor, cria o vínculo em vendas_corretores (necessário p/ RLS).
  if (role === 'vendas' || role === 'aluguel') {
    const { error: corrErr } = await db
      .from('vendas_corretores')
      .insert([{ nome, email, telefone, creci, equipe_id, user_id: userId }])
    if (corrErr) {
      return NextResponse.json(
        { error: `Login criado, mas falhou ao vincular o corretor: ${corrErr.message}` },
        { status: 500 },
      )
    }
  }

  return NextResponse.json({ ok: true, id: userId }, { status: 201 })
}

// ---------------------------------------------------------------------
// DELETE — exclui um login real (limpa vendas_corretores e o auth user)
// ---------------------------------------------------------------------
export async function DELETE(req: NextRequest) {
  const guard = await exigirGestor(req)
  if (ehErro(guard)) return NextResponse.json({ error: guard.error }, { status: guard.status })

  let body: any
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Corpo inválido.' }, { status: 400 })
  }

  const id = String(body.id || '')
  if (!id) return NextResponse.json({ error: 'ID do usuário ausente.' }, { status: 400 })
  if (id === guard.uid) {
    return NextResponse.json({ error: 'Você não pode excluir o próprio login.' }, { status: 400 })
  }

  const db = admin()

  // Limpa o vínculo de corretor e o profile antes do auth (best-effort).
  // Apagar o profile aqui evita falha de FK caso ele não tenha ON DELETE CASCADE.
  await db.from('vendas_corretores').delete().eq('user_id', id)
  await db.from('profiles').delete().eq('id', id)

  // Exclui o login de fato.
  const { error: delErr } = await db.auth.admin.deleteUser(id)
  if (delErr) {
    return NextResponse.json({ error: `Erro ao excluir login: ${delErr.message}` }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
