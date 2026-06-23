# Porto Real — Sistema de Metas

Sistema de gestão de metas para corretores da Porto Real Imobiliária.

## Arquitetura

```
Roles:
  - superadmin → acesso a Vendas + Aluguel + Dashboards consolidados
  - vendas     → acesso apenas ao módulo Vendas
  - aluguel    → acesso apenas ao módulo Aluguel

Switch no Header:
  - Superadmin vê tabs "Vendas | Aluguel" no topo
  - Roles específicos veem apenas badge do módulo
```

## Stack

- **Framework**: Next.js 14 (App Router)
- **Styling**: Tailwind CSS
- **Auth**: Supabase (mock incluído para dev)
- **Deploy**: Vercel
- **Icons**: Lucide React

## Setup

```bash
# Instalar dependências
npm install

# Copiar variáveis de ambiente
cp .env.local.example .env.local

# Preencher as variáveis do Supabase no .env.local

# Rodar em desenvolvimento
npm run dev
```

## Contas de Teste (Mock)

| Email | Role | Acesso |
|---|---|---|
| admin@portoreal.com.br | superadmin | Vendas + Aluguel + Dashboards |
| vendas@portoreal.com.br | vendas | Apenas Vendas |
| aluguel@portoreal.com.br | aluguel | Apenas Aluguel |

Senha: qualquer valor (mock)

## Estrutura de Pastas

```
src/
├── app/
│   ├── globals.css
│   ├── layout.tsx          # Root layout (providers)
│   ├── page.tsx            # Redirect → login ou dashboard
│   ├── login/
│   │   └── page.tsx        # Tela de login
│   └── (dashboard)/
│       ├── layout.tsx      # Layout com Sidebar + Header
│       ├── gestao-geral/   # Dashboard principal
│       ├── corretores/     # Gestão de corretores
│       ├── metas/          # Config de metas globais
│       ├── lancamentos/    # Registro de imóveis
│       ├── vendas-vgv/     # Vendas/Aluguéis e VGV/VGL
│       ├── relatorios/     # Análises
│       ├── reunioes/       # Reuniões
│       └── auditoria/      # Logs do sistema
├── components/
│   ├── Sidebar.tsx
│   ├── Header.tsx          # Inclui switch Vendas/Aluguel
│   ├── StatCard.tsx
│   ├── TopCorretores.tsx
│   ├── AcessoRapido.tsx
│   ├── CorretorCard.tsx
│   └── MetasForm.tsx
├── contexts/
│   ├── AuthContext.tsx      # Auth + role management
│   └── ModuleContext.tsx    # Vendas/Aluguel switching
├── data/
│   └── mock.ts             # Dados mock para desenvolvimento
└── lib/
    ├── types.ts            # TypeScript types
    └── supabase.ts         # Supabase client
```

## Cores da Marca

| Nome | Hex | Uso |
|---|---|---|
| Navy | #1a2332 | Sidebar, backgrounds escuros |
| Slate | #334050 | Textos, cards escuros |
| Red | #eb3238 | CTA principal, alertas, módulo vendas |
| Blue | #3b82f6 | Links, destaque, módulo aluguel |
