'use client'

// ============================================================
// GUIA DE ESTUDO INTERATIVO DO CORRETOR
// Material prático para PREPARAR atendimentos e negociações reais.
// Não grava nenhum dado — é só estudo/consulta.
// Fonte: Manual do Processo de Vendas + POP Curadoria Inteligente (Porto Real).
// ============================================================

import { useState } from 'react'
import {
  Brain, Zap, Users, Flame, Copy, Check, Search, Eye, Handshake,
  Home, Route, ClipboardCheck, Quote, Target, ChevronRight, Lightbulb,
} from 'lucide-react'
import { PERFIS } from '@/lib/constants'

type ProfileKey = 'analitico' | 'controlador' | 'apoiador' | 'catalisador'

const PROFILE_META: Record<ProfileKey, { name: string; emo: string; icon: any; cor: string; bg: string; border: string; resumo: string }> = {
  analitico: { name: 'Analítico', emo: '🧠', icon: Brain, cor: '#2563eb', bg: 'bg-blue-50', border: 'border-blue-200', resumo: 'Quer dados e prova.' },
  controlador: { name: 'Controlador', emo: '⚡', icon: Zap, cor: '#d97706', bg: 'bg-amber-50', border: 'border-amber-200', resumo: 'Quer objetividade e decidir.' },
  apoiador: { name: 'Apoiador', emo: '❤️', icon: Users, cor: '#059669', bg: 'bg-emerald-50', border: 'border-emerald-200', resumo: 'Quer segurança e relação.' },
  catalisador: { name: 'Catalisador', emo: '🚀', icon: Flame, cor: '#eb3238', bg: 'bg-rose-50', border: 'border-rose-200', resumo: 'Quer agilidade e o ganho.' },
}
const PROFILE_KEYS: ProfileKey[] = ['analitico', 'controlador', 'apoiador', 'catalisador']

// ---- SPIN ----
const SPIN = [
  { letter: 'S', name: 'Situação', desc: 'Entender o contexto atual (use com moderação).', cor: 'bg-blue-50 text-blue-700 border-blue-200', qs: ['Hoje você mora em imóvel próprio ou alugado?', 'Quantas pessoas vão morar com você?', 'Qual região você precisa ficar mais perto?', 'Qual faixa de valor cabe no seu orçamento?'] },
  { letter: 'P', name: 'Problema', desc: 'Fazer o cliente reconhecer uma dor — não invente, investigue.', cor: 'bg-amber-50 text-amber-700 border-amber-200', qs: ['O imóvel atual ficou pequeno para sua família?', 'A distância até o trabalho está te incomodando?', 'Tem tido dificuldade de achar imóveis nessa faixa que aceitem pet?', 'O fato de não ter garagem coberta é um problema?'] },
  { letter: 'I', name: 'Implicação', desc: 'Ampliar a consequência da dor — a parte mais forte do método.', cor: 'bg-rose-50 text-rose-700 border-rose-200', qs: ['Essa distância maior aumenta muito seu gasto e tempo no trânsito?', 'Sem um quarto a mais, como fariam se receberem visitas ou tiverem um filho?', 'Sem área de serviço adequada, isso dificulta sua rotina?', 'Procurar sem critério definido pode fazer você perder imóveis bons que saem rápido?'] },
  { letter: 'N', name: 'Necessidade de Solução', desc: 'O cliente verbaliza o benefício de resolver.', cor: 'bg-emerald-50 text-emerald-700 border-emerald-200', qs: ['Faria sentido priorizar um imóvel mais perto do trabalho, mesmo um pouco menor?', 'Ter garagem coberta te daria mais tranquilidade com o carro?', 'Um imóvel já com planejados ajudaria a reduzir o custo inicial?', 'Se eu te mostrar até 3 opções que atendam esses critérios, facilita sua decisão?'] },
]

// ---- OBJEÇÕES (8 categorias × 4 perfis) ----
type ObjResp = { behavior: string; response: string }
const OBJECOES: { id: string; cat: string; phrase: string; profiles: Record<ProfileKey, ObjResp> }[] = [
  {
    id: 'preco', cat: 'Preço', phrase: '"Está caro / Vi mais barato"',
    profiles: {
      analitico: { behavior: 'Dados e prova', response: 'Faz sentido comparar. Imóveis semelhantes nessa região saíram por X a Y, e esse tem [diferenciais]. No m², ele está dentro — quer que eu te mande o comparativo?' },
      controlador: { behavior: 'Objetivo', response: 'Direto ao ponto: o valor reflete [diferencial concreto]. O que você precisa pra bater o martelo hoje?' },
      apoiador: { behavior: 'Segurança', response: 'Entendo, é uma decisão grande. Esse valor te dá segurança no que importa pra você, e a gente te acompanha em cada passo, sem surpresa.' },
      catalisador: { behavior: 'Ganho', response: 'Imagina você já morando aqui. Imóvel assim sai rápido nesse valor — vale travar a oportunidade.' },
    },
  },
  {
    id: 'concorrencia', cat: 'Concorrência', phrase: '"Vi outro parecido mais barato"',
    profiles: {
      analitico: { behavior: 'Comparar item a item', response: 'Vamos comparar item a item — o que está incluso em cada um? Às vezes o mais barato não tem [garantia/condição]. Te mostro lado a lado.' },
      controlador: { behavior: 'Resolver', response: 'Pode ser. Mas você quer resolver, não só economizar. Esse entrega [resultado]. Quer que eu segure ele enquanto decide?' },
      apoiador: { behavior: 'Tranquilidade', response: 'É bom ter opções mesmo. A diferença é ter a Porto Real cuidando de tudo, sem dor de cabeça — isso vale tranquilidade. Comparamos com calma?' },
      catalisador: { behavior: 'Exclusividade', response: 'Esse tem [diferencial marcante] que o outro não tem. Ele é a sua cara — não deixa passar.' },
    },
  },
  {
    id: 'indecisao', cat: 'Vou Pensar', phrase: '"Vou pensar / Preciso de tempo"',
    profiles: {
      analitico: { behavior: 'O que falta avaliar', response: 'Decisão de cabeça fria é o certo. Só pra te ajudar: o que quer avaliar — valor, imóvel ou prazo? Te trago o que falta.' },
      controlador: { behavior: 'Reto', response: 'Sem problema. Me diz reto: o que falta pra ser sim? Se for [X], resolvemos agora.' },
      apoiador: { behavior: 'Sem pressa', response: 'Faz sentido, é importante ter certeza. Quer conversar com a família? Posso participar pra tirar as dúvidas, sem pressa.' },
      catalisador: { behavior: 'Próximo passo', response: 'Te entendo! Mas oportunidade boa não espera. Que tal dar o próximo passo e sentir na prática? Marco pra [data]?' },
    },
  },
  {
    id: 'adequacao', cat: 'Adequação', phrase: '"Faltou algo que eu precisava"',
    profiles: {
      analitico: { behavior: 'Critérios', response: 'Vamos voltar aos seus critérios: dos inegociáveis, esse atende [lista]. O que faltou é negociável ou eliminatório pra você?' },
      controlador: { behavior: 'Trade-off', response: 'Nenhum atende 100% no seu teto. Esse entrega o que mais pesa pra você. O que falta vale abrir mão de [outro ponto]?' },
      apoiador: { behavior: 'Encaixe na rotina', response: 'Entendo, tem que encaixar na rotina de vocês. Me conta o que faltou que eu vejo se compensa com o que ele tem de melhor.' },
      catalisador: { behavior: 'Potencial', response: 'Esse item dá pra resolver/adaptar depois. O que ele já tem de diferente é o difícil de achar — olha o potencial.' },
    },
  },
  {
    id: 'condicao', cat: 'Condição/Estado', phrase: '"Precisa de reforma / Tem desgaste"',
    profiles: {
      analitico: { behavior: 'Custo real', response: 'Boa observação. Estimando a reforma em ~R$ X, o total ainda fica abaixo do equivalente pronto na região. Te passo a conta fechada.' },
      controlador: { behavior: 'Margem', response: 'Justamente: é por isso que ele está nesse preço. Dá margem pra negociar e ainda sair na frente. Quer que eu já sonde o proprietário?' },
      apoiador: { behavior: 'Acompanhamento', response: 'Reforma assusta, eu sei. A gente te indica profissionais de confiança e acompanha — você não fica sozinho nessa.' },
      catalisador: { behavior: 'Personalizar', response: 'Olha o lado bom: você deixa com a sua cara. Imóvel pronto já vem pronto pro gosto do outro — esse vira o seu projeto.' },
    },
  },
  {
    id: 'decisor', cat: 'Decisor', phrase: '"Preciso falar com [cônjuge/sócio]"',
    profiles: {
      analitico: { behavior: 'Material p/ decisor', response: 'Perfeito. Te preparo um resumo com números e fotos pra você apresentar — assim a conversa em casa fica fácil e sem dúvida.' },
      controlador: { behavior: 'Agilizar', response: 'Faz sentido. Quando vocês conseguem alinhar? Já deixo a próxima conversa marcada pra não esfriar a oportunidade.' },
      apoiador: { behavior: 'Incluir a família', response: 'Claro, decisão de família se faz junto. Quer que eu participe pra explicar tudo pra vocês dois ao mesmo tempo?' },
      catalisador: { behavior: 'Senso de oportunidade', response: 'Bora alinhar logo — esse imóvel não espera. Que tal trazer [decisor] pra ver junto ainda essa semana?' },
    },
  },
  {
    id: 'pagamento', cat: 'Pagamento', phrase: '"Não sei como viabilizar / Financiamento"',
    profiles: {
      analitico: { behavior: 'Simulação', response: 'Vamos aos números: te faço a simulação na Caixa com entrada, parcela e prazo. Aí você decide com tudo na mão.' },
      controlador: { behavior: 'Caminho rápido', response: 'Resolvo isso pra você: monto a simulação e já adianto a análise de crédito. Em [prazo] você sabe exatamente o que cabe.' },
      apoiador: { behavior: 'Passo a passo', response: 'Fica tranquilo, eu te explico cada etapa do financiamento sem pressa e cuido da papelada com você. Vamos juntos.' },
      catalisador: { behavior: 'Destravar', response: 'A parte chata eu resolvo. Vamos deixar o crédito aprovado pra você poder fechar quando bater o sim.' },
    },
  },
  {
    id: 'prazo', cat: 'Prazo/Urgência', phrase: '"Não tenho pressa / É pra mais pra frente"',
    profiles: {
      analitico: { behavior: 'Janela de mercado', response: 'Tudo bem planejar. Só pra você decidir com dado: nessa faixa, imóveis assim ficam ~[X] dias no mercado. Vale acompanhar de perto.' },
      controlador: { behavior: 'Sem perder tempo', response: 'Sem pressa, mas sem perder bom negócio. Te aviso só quando surgir algo realmente alinhado — você não gasta tempo à toa.' },
      apoiador: { behavior: 'No seu tempo', response: 'No seu tempo. Vou mantendo você informado das oportunidades certas, sem te pressionar, pra quando fizer sentido pra família.' },
      catalisador: { behavior: 'Não deixar passar', response: 'Combinado — mas oportunidade boa não avisa. Se aparecer A oportunidade, eu te chamo na hora pra não deixar passar.' },
    },
  },
]

// ---- NEGOCIAÇÃO (ZOPA / BATNA / Ancoragem / AIDA) ----
const NEGOCIACAO = [
  {
    sigla: 'ZOPA', nome: 'Zona de Possível Acordo', cor: '#2563eb', icon: Target,
    oque: 'A faixa entre o máximo que o comprador paga e o mínimo que o proprietário aceita. Se elas se cruzam, há acordo possível.',
    comoUsar: 'Capture o valor que o comprador procura (já vem da Triagem) e o valor pedido pelo proprietário (vem do cadastro do imóvel). A sobreposição é onde o negócio fecha.',
    exemplo: 'Comprador vai até R$ 480k; proprietário aceita a partir de R$ 460k → ZOPA = R$ 460–480k. Conduza para o centro dela.',
  },
  {
    sigla: 'BATNA', nome: 'Melhor Alternativa ao Acordo', cor: '#059669', icon: Route,
    oque: 'O que cada lado faz se NÃO fechar. Quem tem a melhor alternativa tem mais poder. Vale para você, para o comprador e para o proprietário.',
    comoUsar: 'Fortaleça a sua: tenha outro comprador ou outro imóvel no bolso. Entenda a do outro: um proprietário sem outros interessados tende a ceder mais.',
    exemplo: '"Tenho outro cliente interessado neste imóvel" (se for verdade) muda a régua. Sonde: "Faz quanto tempo que está anunciado?"',
  },
  {
    sigla: 'Ancoragem', nome: 'O primeiro número manda', cor: '#d97706', icon: Zap,
    oque: 'O primeiro valor citado vira a referência da negociação inteira. Ancorar bem é abrir com um número justificado — não aleatório.',
    comoUsar: 'Planeje a âncora ANTES. Abra com base em dados (comparativos, m²), nunca chute. Se o outro ancora primeiro, reancore com fato, não com reação.',
    exemplo: 'Proprietário pede R$ 500k. Reancore: "Pelas últimas 3 vendas do condomínio, o justo fica em R$ 465k — posso te mostrar."',
  },
  {
    sigla: 'AIDA', nome: 'Atenção · Interesse · Desejo · Ação', cor: '#eb3238', icon: Flame,
    oque: 'A estrutura da comunicação que conduz da curiosidade até a decisão. Útil para apresentar imóvel e conduzir o fechamento.',
    comoUsar: 'Atenção (gancho que importa pro cliente) → Interesse (benefício ligado à dor dele) → Desejo (ele se imagina morando ali) → Ação (próximo passo com data).',
    exemplo: '"Apareceu o 3 quartos na sua rua-alvo (A). Tem a suíte e a garagem que você pediu (I). Imagina as crianças no quintal (D). Vejo sábado 10h? (Ação)"',
  },
]

const NEGOC_PRINCIPIOS = [
  { t: 'Interesses, não posições', d: 'Posição é "quero R$ 480k". Interesse é "preciso sair em 60 dias". Negocie o interesse dos DOIS lados — abre soluções que o preço sozinho não abre.' },
  { t: 'Planeje a ancoragem e as concessões antes', d: 'Defina sua âncora e o que você pode ceder — e em troca de quê. Concessão nunca é de graça: toda cedência pede uma contrapartida.' },
  { t: 'Andressa como retaguarda', d: 'A Andressa acompanha toda negociação para controle e suporte. O controle das concessões passa por ela.' },
  { t: 'Cruzamento automático de valores', d: 'No fechamento você registra só o valor fechado. Os gaps (quanto o comprador subiu e quanto o proprietário cedeu) saem automáticos.' },
]

// ---- CURADORIA DE IMÓVEIS (POP) ----
const CURADORIA_FLUXO = ['Diagnóstico profundo', 'Perfil e critérios', 'Curadoria interna do mercado', 'Lote de até 3 imóveis', 'Visita dirigida', 'Aprendizado → novo lote']

const CRITERIOS = [
  { nome: 'Inegociável', cor: '#eb3238', def: 'Sem isso, o imóvel deve ser eliminado.', ex: 'Teto financeiro, nº de suítes, cidade/bairro ou raio, financiamento possível, segurança mínima.' },
  { nome: 'Muito importante', cor: '#d97706', def: 'Pesa forte, mas admite concessão.', ex: 'Garagem, quintal, proximidade de trabalho/escola, rua tranquila, estado de conservação.' },
  { nome: 'Desejável', cor: '#2563eb', def: 'Melhora a experiência, mas não impede uma boa compra.', ex: 'Piscina, gourmet, planejados, fachada moderna, casa nova, área maior.' },
  { nome: 'Indiferente', cor: '#64748b', def: 'Não agrega valor percebido para aquele cliente.', ex: 'Itens que o cliente não usa ou não valoriza.' },
  { nome: 'Exclusão', cor: '#0f172a', def: 'Sinal de que o imóvel não deve nem entrar no lote.', ex: 'Obra estrutural, rua inadequada, documentação inviável, preço fora da capacidade, layout impossível.' },
]

const LOTE_PAPEIS = [
  { papel: 'Opção 1 — Melhor equilíbrio', d: 'A recomendação técnica do corretor. Atende os inegociáveis e entrega o melhor conjunto de critérios prioritários dentro da realidade financeira.' },
  { papel: 'Opção 2 — Prioridade A', d: 'Ganha em um atributo que o cliente valoriza muito. Ex.: melhor localização, bairro superior, rua mais tranquila, proximidade do trabalho.' },
  { papel: 'Opção 3 — Prioridade B', d: 'Outra troca legítima e diferente. Ex.: casa maior, imóvel mais novo, acabamento melhor, quintal maior ou valor mais baixo.' },
]

const APRESENTACAO_ITENS = ['Resumo objetivo (preço, localização, área, suítes, garagem, condição)', 'Por que entrou no lote (liga a um critério importante)', 'Principal ganho (o que faz melhor que as outras)', 'Principal renúncia (o que abre mão ao escolher)', 'Adequação ao perfil (pra quem faz mais sentido)', 'Próximo passo (visitar, manter como referência, eliminar ou comparar)']

const POS_VISITA_QS = [
  'O que este imóvel confirmou que é importante para vocês?',
  'O que mais pesou negativamente?',
  'Ficou acima, dentro ou abaixo da expectativa que vocês tinham?',
  'Isso é uma objeção eliminatória, uma renúncia aceitável ou algo que podemos negociar?',
  'Mantemos como referência, eliminamos ou avançamos?',
]

const CARTAO_BOLSO = [
  { n: '1', t: 'Diagnostique', d: 'Pessoa, rotina, dor, prioridade e capacidade financeira — antes de abrir o site.' },
  { n: '2', t: 'Filtre', d: 'Analise o mercado internamente; elimine o que não atende à demanda.' },
  { n: '3', t: 'Selecione', d: 'Apresente até 3 alternativas legítimas, cada uma com papel claro.' },
  { n: '4', t: 'Compare', d: 'Mostre ganho e renúncia. O cliente escolhe o caminho, não o anúncio mais bonito.' },
  { n: '5', t: 'Visite', d: 'Visite com objetivo. Preferência por 1; até 2 quando a comparação presencial fizer sentido.' },
  { n: '6', t: 'Aprenda', d: 'Registre o que confirmou, o que eliminou e o que mudou. Só então monte novo lote.' },
]

// ---- MOMENTOS DA VISITA ----
const MOMENTOS = [
  { step: '1', title: 'Recepção / Acolhimento', desc: 'Quebre o gelo, crie rapport e alinhe a expectativa da visita.' },
  { step: '2', title: 'Apresentação conectada', desc: 'Apresente o imóvel ligando cada detalhe ao que o cliente valoriza.' },
  { step: '3', title: 'Pontos de atenção', desc: 'Mostre com transparência o que o imóvel exige atenção — gera confiança.' },
  { step: '4', title: 'Leitura & sondagem', desc: 'Observe reações não verbais e peça as impressões do cliente.' },
  { step: '5', title: 'Fechamento da visita', desc: 'Defina o próximo passo com data e hora específicas.' },
]
const VISITA_PREP = ['Confirmar disponibilidade e agendar com o proprietário/inquilino', 'Pegar as chaves / acesso', 'Conferir condições do imóvel (limpo, água, luz)', 'Estudar pontos fortes e de atenção, alinhados à necessidade', 'Confirmar o horário com o cliente (reduz no-show)']
const VISITA_OBJ_QS = [
  { q: 'O que você achou do valor, em relação ao que esperava?', tag: 'preço' },
  { q: 'Esse imóvel atende tudo que você precisa, ou faltou algo?', tag: 'adequação' },
  { q: 'Tem algo aqui que te preocupa ou que você mudaria?', tag: 'condição' },
  { q: 'Quem mais decide isso com você?', tag: 'decisor' },
  { q: 'Comparando com outros que viu, como esse fica?', tag: 'concorrência' },
  { q: 'Como pensa em viabilizar a compra (à vista, financiamento)?', tag: 'pagamento' },
  { q: 'Tem um prazo que você precisa cumprir pra se mudar?', tag: 'urgência' },
  { q: 'Se fosse decidir hoje, o que te faria dizer sim — e o que te faria hesitar?', tag: 'objeção direta' },
]

// ---- PROCESSOS E1–E6 ----
const PROCESSOS = [
  { cod: 'E1', nome: 'Triagem', resp: 'Andressa', obj: 'Receber o lead e dar o primeiro passo certo, sem perder tempo.', faz: ['Responder o 1º contato em < 1h', 'Salvar nome/contato e origem', 'Aplicar etiqueta de status', 'Ler o que o lead já trouxe', 'Decidir: via expressa (→ Visita) ou Atendimento'], metrica: 'Tempo até a 1ª resposta (meta < 1h)' },
  { cod: 'E2', nome: 'Atendimento & Match', resp: 'Andressa + Corretor', obj: 'Entender de verdade o cliente e colocar o imóvel certo na frente dele.', faz: ['Qualificar a pessoa antes do imóvel (SPIN, rapport)', 'Sondar orçamento e forma de pagamento', 'Definir estratégia pelo perfil', 'Match: no máximo 3 imóveis, estudados antes'], metrica: 'Conversão E2 → E3 (a principal do funil)' },
  { cod: 'E3', nome: 'Visita', resp: 'Corretor', obj: 'Transformar o interesse em vontade de comprar.', faz: ['Checklist de preparação da visita', 'Agendar (passagem de bastão p/ o corretor)', 'Conduzir pelos 5 momentos', 'Confirmar o perfil e mapear objeções', 'Registrar visita agendada e realizada'], metrica: 'Conversão visita → proposta · No-show' },
  { cod: 'E4', nome: 'Proposta', resp: 'Corretor', obj: 'Registrar uma proposta sólida (etapa leve, sem requalificar).', faz: ['Registrar imóvel-alvo, valor ofertado e condições', 'Não encher de perguntas — o cliente já decidiu'], metrica: 'Conversão E4 → E5' },
  { cod: 'E5', nome: 'Negociação', resp: 'Corretor + Andressa', obj: 'Chegar a um acordo bom para as duas partes.', faz: ['Mapear interesses dos dois lados', 'Planejar ancoragem e concessões antes', 'Tratar objeções pelo perfil', 'Conduzir até o acordo de valor e condições'], metrica: 'Conversão E5 → E6 · Gaps de negociação' },
  { cod: 'E6', nome: 'Fechamento', resp: 'Andressa + Corretor', obj: 'Formalizar, assinar e marcar a venda como ganha.', faz: ['Formalizar e assinar o acordo', 'Documentação ramifica pela forma de pagamento', 'Financiamento sempre via Caixa', 'Lançar a venda como ganha (valor fechado)'], metrica: 'Ciclo total (E1 → ganho) · Conversão E5 → E6' },
]

type Secao = 'perfil' | 'spin' | 'objecoes' | 'visita' | 'negociacao' | 'curadoria' | 'processos'
const SECOES: { id: Secao; label: string; icon: any }[] = [
  { id: 'perfil', label: 'Perfil do Cliente', icon: Users },
  { id: 'spin', label: 'Perguntas SPIN', icon: Search },
  { id: 'objecoes', label: 'Objeções por Perfil', icon: Quote },
  { id: 'visita', label: '5 Momentos da Visita', icon: Eye },
  { id: 'negociacao', label: 'Negociação', icon: Handshake },
  { id: 'curadoria', label: 'Curadoria de Imóveis', icon: Home },
  { id: 'processos', label: 'Guia de Processos', icon: Route },
]

export default function GuiaEstudo() {
  const [secao, setSecao] = useState<Secao>('perfil')
  const [perfil, setPerfil] = useState<ProfileKey>('analitico')
  const [copied, setCopied] = useState<string | null>(null)

  const copy = (t: string) => {
    navigator.clipboard.writeText(t)
    setCopied(t)
    setTimeout(() => setCopied(null), 1800)
  }

  return (
    <div className="bg-white border border-slate-200 rounded-3xl shadow-sm flex-1 flex flex-col overflow-hidden">
      {/* Header */}
      <div className="px-6 pt-5 pb-4 border-b border-slate-100 bg-gradient-to-r from-[#33415C] to-[#47587A]">
        <h2 className="text-lg font-black text-white flex items-center gap-2">
          <ClipboardCheck size={20} className="text-[#ff9ea1]" />
          Guia de Estudo do Corretor
        </h2>
        <p className="text-[11px] text-slate-200 font-medium mt-0.5">
          Material prático para preparar atendimentos e negociações reais. Estude, copie falas e vá preparado — nada aqui grava dados.
        </p>
      </div>

      <div className="flex flex-col lg:flex-row flex-1 min-h-0">
        {/* Nav de seções */}
        <nav className="lg:w-56 flex-shrink-0 border-b lg:border-b-0 lg:border-r border-slate-100 p-3 flex lg:flex-col gap-1 overflow-x-auto">
          {SECOES.map((s) => {
            const Icon = s.icon
            const on = secao === s.id
            return (
              <button
                key={s.id}
                onClick={() => setSecao(s.id)}
                className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap flex-shrink-0 text-left ${on ? 'bg-[#EEF4FA] text-[#33415C]' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-700'}`}
              >
                <Icon size={15} className={on ? 'text-[#eb3238]' : ''} />
                <span>{s.label}</span>
              </button>
            )
          })}
        </nav>

        {/* Conteúdo */}
        <div className="flex-1 p-5 md:p-6 overflow-y-auto min-h-0">
          {/* ---------- PERFIL ---------- */}
          {secao === 'perfil' && (
            <div className="space-y-5">
              <SectionIntro icon={Users} title="Perfil comportamental do cliente" text="Adapte abordagem, ritmo e fala ao perfil. É hipótese no atendimento e se confirma no contato pessoal (a visita). Selecione um perfil para ver a tática completa." />
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                {PROFILE_KEYS.map((k) => {
                  const m = PROFILE_META[k]; const Icon = m.icon; const on = perfil === k
                  return (
                    <button key={k} onClick={() => setPerfil(k)} className={`p-3 rounded-2xl border text-left transition-all ${on ? `${m.bg} ${m.border} ring-1` : 'bg-slate-50/50 border-slate-200 hover:border-slate-300'}`} style={on ? { boxShadow: `inset 0 0 0 1px ${m.cor}` } : {}}>
                      <div className="flex items-center gap-1.5">
                        <Icon size={15} style={{ color: m.cor }} />
                        <span className="font-extrabold text-xs text-slate-800">{m.name}</span>
                      </div>
                      <p className="text-[9.5px] text-slate-500 font-semibold mt-1">{m.resumo}</p>
                    </button>
                  )
                })}
              </div>
              {(() => {
                const p = PERFIS[perfil]; const m = PROFILE_META[perfil]
                return (
                  <div className="space-y-4">
                    <div className={`rounded-2xl border ${m.border} ${m.bg} p-4`}>
                      <div className="flex items-center gap-2 text-sm font-black" style={{ color: m.cor }}>
                        <span className="text-lg">{m.emo}</span> {p.nome} <span className="text-[11px] font-bold text-slate-500">— {p.busca}</span>
                      </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <Card title="Sinais para reconhecer" tone="slate">
                        <ul className="space-y-1.5">{p.sinais.map((s, i) => <Li key={i}>{s}</Li>)}</ul>
                      </Card>
                      <Card title="Estratégia de atendimento" tone="blue">
                        <ul className="space-y-1.5">{p.estrategia.map((s, i) => <Li key={i}>{s}</Li>)}</ul>
                      </Card>
                    </div>
                    <Card title="Falas por momento" tone="emerald">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        {([['Abordagem', p.frase_momento.abordagem], ['Contorno', p.frase_momento.contorno], ['Fechamento', p.frase_momento.fechamento]] as const).map(([lbl, txt]) => (
                          <FalaBox key={lbl} label={lbl} text={txt} copied={copied} onCopy={copy} />
                        ))}
                      </div>
                    </Card>
                    <Card title="O que evitar" tone="rose">
                      <ul className="space-y-1.5">{p.evitar.map((s, i) => <Li key={i} bad>{s}</Li>)}</ul>
                    </Card>
                  </div>
                )
              })()}
            </div>
          )}

          {/* ---------- SPIN ---------- */}
          {secao === 'spin' && (
            <div className="space-y-5">
              <SectionIntro icon={Search} title="Método SPIN de qualificação" text="Roteiro de apoio para mapear a necessidade REAL — não um interrogatório. Qualifique a pessoa antes do imóvel. Clique para copiar." />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {SPIN.map((b) => (
                  <Card key={b.letter} title="" tone="slate" noTitle>
                    <div className="flex items-center gap-2.5 mb-3 border-b border-slate-100 pb-2.5">
                      <span className={`w-9 h-9 rounded-xl flex items-center justify-center text-base font-black border ${b.cor}`}>{b.letter}</span>
                      <div>
                        <h4 className="text-xs font-black text-slate-800">{b.name}</h4>
                        <p className="text-[9.5px] text-slate-400 font-semibold">{b.desc}</p>
                      </div>
                    </div>
                    <ul className="space-y-2">
                      {b.qs.map((q, i) => <CopyLine key={i} text={q} copied={copied} onCopy={copy} />)}
                    </ul>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* ---------- OBJEÇÕES ---------- */}
          {secao === 'objecoes' && (
            <div className="space-y-5">
              <SectionIntro icon={Quote} title="Objeções por perfil" text="A mesma objeção pede uma abordagem diferente para cada perfil. Escolha o perfil do cliente e veja a fala recomendada para cada tipo de objeção." />
              <ProfilePicker perfil={perfil} setPerfil={setPerfil} />
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
                {OBJECOES.map((o) => {
                  const r = o.profiles[perfil]
                  return (
                    <div key={o.id} className="border border-slate-200 rounded-2xl p-4 bg-slate-50/30 flex flex-col">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-[9px] font-black uppercase tracking-wide bg-white border border-slate-200 rounded-lg px-2 py-1 text-slate-600">{o.cat}</span>
                        <span className="text-[9px] font-black uppercase" style={{ color: PROFILE_META[perfil].cor }}>{PROFILE_META[perfil].name}</span>
                      </div>
                      <p className="text-xs font-extrabold text-slate-800 italic mb-3">{o.phrase}</p>
                      <div className="bg-white border border-slate-150 rounded-xl p-3 flex-1">
                        <span className="text-[8px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded font-bold inline-block mb-1.5">{r.behavior}</span>
                        <p className="text-[11px] font-semibold text-slate-700 leading-relaxed">{r.response}</p>
                      </div>
                      <button onClick={() => copy(r.response)} className={`mt-3 w-full flex items-center justify-center gap-1.5 py-2 rounded-xl text-[10px] font-black uppercase transition-all ${copied === r.response ? 'bg-emerald-50 text-emerald-600 border border-emerald-200' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>
                        {copied === r.response ? <Check size={12} /> : <Copy size={12} />}{copied === r.response ? 'Copiado!' : 'Copiar fala'}
                      </button>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* ---------- VISITA ---------- */}
          {secao === 'visita' && (
            <div className="space-y-5">
              <SectionIntro icon={Eye} title="Os 5 momentos da visita" text="A visita transforma interesse em vontade de comprar. Conduza pelos 5 momentos, prepare antes e sonde as objeções para a negociação." />
              <div className="relative pl-6 border-l-2 border-slate-200 ml-3 space-y-6">
                {MOMENTOS.map((m) => (
                  <div key={m.step} className="relative">
                    <span className="absolute -left-[34px] top-0 w-6 h-6 rounded-full bg-white border-2 border-[#eb3238] flex items-center justify-center text-[10px] font-black text-slate-800">{m.step}</span>
                    <h4 className="text-xs font-black text-slate-800">{m.title}</h4>
                    <p className="text-[11px] text-slate-500 font-semibold mt-0.5">{m.desc}</p>
                  </div>
                ))}
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card title="Checklist de preparação" tone="amber">
                  <ul className="space-y-1.5">{VISITA_PREP.map((s, i) => <Li key={i}>{s}</Li>)}</ul>
                </Card>
                <Card title="Perguntas para mapear objeções" tone="slate">
                  <p className="text-[10px] text-slate-400 font-semibold mb-2">Sonde na visita, use na negociação (E5).</p>
                  <ul className="space-y-1.5">
                    {VISITA_OBJ_QS.map((o, i) => (
                      <li key={i} className="flex items-start justify-between gap-2 bg-slate-50/60 border border-slate-100 rounded-lg p-2">
                        <span className="text-[11px] font-semibold text-slate-700 leading-snug">{o.q}</span>
                        <span className="text-[8px] font-black uppercase text-slate-400 bg-white border border-slate-200 rounded px-1.5 py-0.5 flex-shrink-0 mt-0.5">{o.tag}</span>
                      </li>
                    ))}
                  </ul>
                </Card>
              </div>
            </div>
          )}

          {/* ---------- NEGOCIAÇÃO ---------- */}
          {secao === 'negociacao' && (
            <div className="space-y-5">
              <SectionIntro icon={Handshake} title="Técnicas de negociação" text="Você conduz comprador e proprietário a um acordo bom para os dois. Estude as 4 ferramentas e os princípios antes de sentar para negociar." />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {NEGOCIACAO.map((n) => {
                  const Icon = n.icon
                  return (
                    <div key={n.sigla} className="border border-slate-200 rounded-2xl p-4 bg-white">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="w-8 h-8 rounded-lg flex items-center justify-center text-white flex-shrink-0" style={{ background: n.cor }}><Icon size={16} /></span>
                        <div>
                          <div className="text-sm font-black text-slate-800">{n.sigla}</div>
                          <div className="text-[9.5px] font-bold text-slate-400 uppercase tracking-wide">{n.nome}</div>
                        </div>
                      </div>
                      <p className="text-[11px] text-slate-600 font-semibold leading-relaxed">{n.oque}</p>
                      <div className="mt-2.5 space-y-2">
                        <div className="bg-slate-50 border border-slate-100 rounded-lg p-2.5">
                          <span className="text-[8.5px] font-black uppercase text-slate-400 block mb-0.5">Como usar no imóvel</span>
                          <p className="text-[10.5px] text-slate-600 font-medium leading-relaxed">{n.comoUsar}</p>
                        </div>
                        <div className="border-l-2 rounded-r-lg pl-2.5 py-1" style={{ borderColor: n.cor }}>
                          <span className="text-[8.5px] font-black uppercase block mb-0.5" style={{ color: n.cor }}>Exemplo</span>
                          <p className="text-[10.5px] text-slate-700 font-semibold italic leading-relaxed">{n.exemplo}</p>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
              <Card title="Princípios da negociação (Porto Real)" tone="blue">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {NEGOC_PRINCIPIOS.map((p, i) => (
                    <div key={i} className="bg-white border border-slate-150 rounded-xl p-3">
                      <div className="text-[11px] font-black text-[#33415C] flex items-center gap-1.5"><ChevronRight size={12} className="text-[#eb3238]" />{p.t}</div>
                      <p className="text-[10.5px] text-slate-500 font-medium leading-relaxed mt-1">{p.d}</p>
                    </div>
                  ))}
                </div>
              </Card>
            </div>
          )}

          {/* ---------- CURADORIA ---------- */}
          {secao === 'curadoria' && (
            <div className="space-y-5">
              <SectionIntro icon={Home} title="Curadoria inteligente de imóveis" text="Não apresentamos catálogo: entendemos a pessoa, selecionamos o mercado e conduzimos uma decisão segura. O imóvel perfeito raramente existe no orçamento — seu papel é achar o melhor equilíbrio." />

              <Card title="Fluxo padrão" tone="slate">
                <div className="flex flex-wrap items-center gap-2">
                  {CURADORIA_FLUXO.map((f, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <span className="bg-[#EEF4FA] text-[#33415C] text-[10px] font-bold px-2.5 py-1.5 rounded-lg border border-[#D6E4F0]">{i + 1}. {f}</span>
                      {i < CURADORIA_FLUXO.length - 1 && <ChevronRight size={13} className="text-slate-300" />}
                    </div>
                  ))}
                </div>
              </Card>

              <Card title="Classificação de critérios" tone="slate">
                <div className="space-y-2">
                  {CRITERIOS.map((c) => (
                    <div key={c.nome} className="flex items-start gap-3 bg-slate-50/60 border border-slate-100 rounded-xl p-2.5">
                      <span className="text-[9px] font-black uppercase text-white px-2 py-1 rounded-md flex-shrink-0 mt-0.5" style={{ background: c.cor }}>{c.nome}</span>
                      <div>
                        <p className="text-[11px] font-bold text-slate-700">{c.def}</p>
                        <p className="text-[10px] text-slate-400 font-medium mt-0.5">Ex.: {c.ex}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card title="Como compor o lote (até 3)" tone="emerald">
                  <div className="space-y-2.5">
                    {LOTE_PAPEIS.map((l, i) => (
                      <div key={i} className="bg-white border border-slate-150 rounded-xl p-2.5">
                        <div className="text-[11px] font-black text-slate-800">{l.papel}</div>
                        <p className="text-[10px] text-slate-500 font-medium mt-0.5 leading-relaxed">{l.d}</p>
                      </div>
                    ))}
                    <p className="text-[10px] text-rose-600 font-bold bg-rose-50 border border-rose-100 rounded-lg p-2">⛔ Proibido usar um imóvel ruim só para "forçar" a escolha da recomendada. A comparação tem que ser honesta.</p>
                  </div>
                </Card>
                <Card title="Apresentar cada imóvel" tone="blue">
                  <ul className="space-y-1.5">{APRESENTACAO_ITENS.map((s, i) => <Li key={i}>{s}</Li>)}</ul>
                  <div className="mt-3 bg-[#EEF4FA] border border-[#D6E4F0] rounded-xl p-2.5">
                    <span className="text-[9px] font-black uppercase text-[#33415C] block mb-1">Pergunta de decisão</span>
                    <p className="text-[10.5px] text-slate-700 font-semibold italic">"Entre esses três caminhos, qual está mais próximo da vida que vocês querem: localização melhor, casa melhor ou o melhor equilíbrio geral?"</p>
                  </div>
                </Card>
              </div>

              <Card title="Perguntas pós-visita" tone="amber">
                <ul className="space-y-1.5">{POS_VISITA_QS.map((q, i) => <CopyLine key={i} text={q} copied={copied} onCopy={copy} />)}</ul>
              </Card>

              <div className="rounded-2xl border border-[#47587A]/20 bg-gradient-to-br from-[#EEF4FA] to-white p-4">
                <div className="text-xs font-black text-[#33415C] flex items-center gap-1.5 mb-3"><Lightbulb size={15} className="text-[#eb3238]" /> Cartão de bolso</div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                  {CARTAO_BOLSO.map((c) => (
                    <div key={c.n} className="bg-white border border-slate-150 rounded-xl p-3">
                      <div className="flex items-center gap-1.5"><span className="w-5 h-5 bg-[#33415C] text-white rounded-md flex items-center justify-center text-[10px] font-black">{c.n}</span><span className="text-[11px] font-black text-slate-800">{c.t}</span></div>
                      <p className="text-[10px] text-slate-500 font-medium mt-1 leading-relaxed">{c.d}</p>
                    </div>
                  ))}
                </div>
                <p className="text-[11px] text-[#33415C] font-bold italic text-center mt-3">"Não vendemos o imóvel perfeito. Conduzimos a melhor decisão possível para a vida real do cliente."</p>
              </div>
            </div>
          )}

          {/* ---------- PROCESSOS ---------- */}
          {secao === 'processos' && (
            <div className="space-y-5">
              <SectionIntro icon={Route} title="Guia prático dos processos (E1–E6)" text="O funil de 6 etapas, da chegada do lead à venda ganha. Nada é obrigatório para avançar — os checklists são orientação. Exceção: a regra dos 3 imóveis é obrigatória." />
              <div className="space-y-3">
                {PROCESSOS.map((p) => (
                  <div key={p.cod} className="border border-slate-200 rounded-2xl overflow-hidden">
                    <div className="flex items-center gap-3 bg-slate-50 px-4 py-3 border-b border-slate-100">
                      <span className="text-[11px] font-black text-white bg-[#33415C] px-2 py-1 rounded-md">{p.cod}</span>
                      <span className="text-sm font-black text-slate-800">{p.nome}</span>
                      <span className="text-[10px] font-bold text-slate-400 ml-auto">{p.resp}</span>
                    </div>
                    <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div>
                        <p className="text-[11px] text-slate-600 font-semibold italic mb-2">🎯 {p.obj}</p>
                        <ul className="space-y-1.5">{p.faz.map((f, i) => <Li key={i}>{f}</Li>)}</ul>
                      </div>
                      <div className="bg-[#EEF4FA]/60 border border-[#D6E4F0] rounded-xl p-3 self-start">
                        <span className="text-[9px] font-black uppercase text-[#33415C] block mb-1">📊 Métrica da etapa</span>
                        <p className="text-[11px] font-bold text-slate-700">{p.metrica}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

/* ---------------- subcomponentes ---------------- */
function SectionIntro({ icon: Icon, title, text }: { icon: any; title: string; text: string }) {
  return (
    <div className="flex gap-3 bg-slate-50/60 border border-slate-150 rounded-2xl p-4">
      <Icon size={18} className="text-[#eb3238] flex-shrink-0 mt-0.5" />
      <div>
        <h3 className="text-sm font-black text-slate-800">{title}</h3>
        <p className="text-[11px] text-slate-500 font-medium leading-relaxed mt-0.5">{text}</p>
      </div>
    </div>
  )
}

const TONES: Record<string, string> = {
  slate: 'border-slate-200', blue: 'border-blue-200', emerald: 'border-emerald-200', amber: 'border-amber-200', rose: 'border-rose-200',
}
function Card({ title, tone, children, noTitle }: { title: string; tone: string; children: React.ReactNode; noTitle?: boolean }) {
  return (
    <div className={`border ${TONES[tone] || 'border-slate-200'} rounded-2xl p-4 bg-white`}>
      {!noTitle && <h4 className="text-xs font-black text-slate-700 uppercase tracking-wide mb-3">{title}</h4>}
      {children}
    </div>
  )
}
function Li({ children, bad }: { children: React.ReactNode; bad?: boolean }) {
  return (
    <li className="flex items-start gap-2 text-[11px] font-medium text-slate-600 leading-relaxed">
      <span className={`mt-1.5 w-1 h-1 rounded-full flex-shrink-0 ${bad ? 'bg-rose-400' : 'bg-slate-300'}`} />
      <span>{children}</span>
    </li>
  )
}
function FalaBox({ label, text, copied, onCopy }: { label: string; text: string; copied: string | null; onCopy: (t: string) => void }) {
  return (
    <div className="bg-white border border-slate-150 rounded-xl p-3 flex flex-col">
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-[9px] font-black uppercase text-slate-400">{label}</span>
        <button onClick={() => onCopy(text)} className={`p-1 rounded ${copied === text ? 'text-emerald-600' : 'text-slate-300 hover:text-slate-500'}`}>{copied === text ? <Check size={11} /> : <Copy size={11} />}</button>
      </div>
      <p className="text-[10.5px] font-semibold text-slate-700 leading-relaxed italic flex-1">{text}</p>
    </div>
  )
}
function CopyLine({ text, copied, onCopy }: { text: string; copied: string | null; onCopy: (t: string) => void }) {
  return (
    <li className="flex items-center justify-between gap-2 bg-slate-50/60 hover:bg-slate-50 border border-slate-100 rounded-lg p-2 transition-colors">
      <span className="text-[11px] font-semibold text-slate-700 leading-snug">{text}</span>
      <button onClick={() => onCopy(text)} title="Copiar" className={`p-1.5 rounded-lg border flex-shrink-0 transition-all ${copied === text ? 'bg-emerald-50 border-emerald-200 text-emerald-600' : 'bg-white border-slate-200 text-slate-400 hover:text-slate-600'}`}>{copied === text ? <Check size={11} /> : <Copy size={11} />}</button>
    </li>
  )
}
function ProfilePicker({ perfil, setPerfil }: { perfil: ProfileKey; setPerfil: (p: ProfileKey) => void }) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
      {PROFILE_KEYS.map((k) => {
        const m = PROFILE_META[k]; const Icon = m.icon; const on = perfil === k
        return (
          <button key={k} onClick={() => setPerfil(k)} className={`flex items-center gap-1.5 px-3 py-2.5 rounded-xl border text-xs font-extrabold transition-all ${on ? `${m.bg} ${m.border}` : 'bg-slate-50/50 border-slate-200 text-slate-500 hover:border-slate-300'}`} style={on ? { color: m.cor } : {}}>
            <Icon size={14} style={{ color: on ? m.cor : undefined }} /> {m.name}
          </button>
        )
      })}
    </div>
  )
}
