'use client'

import { useState } from 'react'
import { 
  BookOpen, 
  HelpCircle, 
  Copy, 
  Check, 
  Brain, 
  Zap, 
  Users, 
  Flame,
  DollarSign,
  AlertCircle,
  ClipboardList
} from 'lucide-react'

// Data for Objeções
const OBJECTIONS_DATA = [
  {
    id: 'preco',
    category: 'Preço',
    phrase: '"Está caro / Vi mais barato"',
    icon: <DollarSign className="text-amber-500" size={16} />,
    profiles: {
      analitico: {
        behavior: 'Quer dados e prova.',
        response: 'Faz sentido comparar. Imóveis semelhantes nessa região saíram por X a Y, e esse tem [diferenciais]. No m², ele está dentro — quer que eu te mande o comparativo?'
      },
      controlador: {
        behavior: 'Quer objetividade e sentir que decide.',
        response: 'Direto ao ponto: o valor reflete [diferencial concreto]. O que você precisa pra bater o martelo hoje?'
      },
      apoiador: {
        behavior: 'Quer segurança e relação.',
        response: 'Entendo, é uma decisão grande. Esse valor te dá segurança no que importa pra você, e a gente te acompanha em cada passo, sem surpresa.'
      },
      catalisador: {
        behavior: 'Quer agilidade e a visão do ganho.',
        response: 'Imagina você já morando aqui. Imóvel assim sai rápido nesse valor — vale travar a oportunidade.'
      }
    }
  },
  {
    id: 'concorrencia',
    category: 'Concorrência',
    phrase: '"Vi outro parecido mais barato"',
    icon: <AlertCircle className="text-rose-500" size={16} />,
    profiles: {
      analitico: {
        behavior: 'Quer dados e prova.',
        response: 'Vamos comparar item a item — o que está incluso em cada um? Às vezes o mais barato não tem [garantia/condição]. Te mostro lado a lado.'
      },
      controlador: {
        behavior: 'Quer objetividade e sentir que decide.',
        response: 'Pode ser. Mas você quer resolver, não só economizar. Esse entrega [resultado]. Quer que eu segure ele enquanto decide?'
      },
      apoiador: {
        behavior: 'É bom ter opções mesmo. A diferença é ter a Porto Real cuidando de tudo, sem dor de cabeça — isso vale tranquilidade. Comparamos com calma?'
      },
      catalisador: {
        response: 'Esse tem [diferencial marcante] que o outro não tem. Ele é a sua cara — não deixa passar.'
      }
    }
  },
  {
    id: 'indecisao',
    category: 'Vou Pensar / Indecisão',
    phrase: '"Vou pensar / Preciso de tempo"',
    icon: <HelpCircle className="text-blue-500" size={16} />,
    profiles: {
      analitico: {
        behavior: 'Quer dados e prova.',
        response: 'Decisão de cabeça fria é o certo. Só pra te ajudar: o que quer avaliar — valor, imóvel ou prazo? Te trago o que falta.'
      },
      controlador: {
        behavior: 'Quer objetividade e sentir que decide.',
        response: 'Sem problema. Me diz reto: o que falta pra ser sim? Se for [X], resolvemos agora.'
      },
      apoiador: {
        behavior: 'Quer segurança e relação.',
        response: 'Faz sentido, é importante ter certeza. Quer conversar com a família? Posso participar pra tirar as dúvidas, sem pressa.'
      },
      catalisador: {
        response: 'Te entendo! Mas oportunidade boa não espera. Que tal dar o próximo passo e sentir na prática? Marco pra [data]?'
      }
    }
  }
]

// SPIN Questions
const SPIN_DATA = [
  {
    letter: 'S',
    name: 'Situação',
    desc: 'Entender o contexto atual.',
    color: 'bg-blue-50 text-blue-700 border-blue-100',
    questions: [
      'Hoje você mora em imóvel próprio ou alugado?',
      'Quantas pessoas vão morar com você?',
      'Qual região você precisa ficar mais perto?',
      'Qual faixa de valor cabe no seu orçamento?'
    ]
  },
  {
    letter: 'P',
    name: 'Problema',
    desc: 'Investigar dores e limitações.',
    color: 'bg-amber-50 text-amber-700 border-amber-100',
    questions: [
      'O imóvel atual ficou pequeno para sua família?',
      'A distância até o trabalho está te incomodando?',
      'Você tem tido dificuldade de encontrar imóveis nessa faixa que aceitem pet?',
      'O fato de não ter garagem coberta é um problema para você?'
    ]
  },
  {
    letter: 'I',
    name: 'Implicação',
    desc: 'Ampliar a percepção do problema.',
    color: 'bg-rose-50 text-rose-700 border-rose-100',
    questions: [
      'Essa distância maior acaba aumentando muito seu gasto e tempo no trânsito?',
      'Sem um quarto adicional, como vocês fariam caso recebam visitas ou tenham um filho?',
      'Se o imóvel não tiver área de serviço adequada, isso vai dificultar sua rotina?',
      'Continuar procurando sem um critério mais definido pode te fazer perder imóveis bons que surgem rápido?'
    ]
  },
  {
    letter: 'N',
    name: 'Necessidade de Solução',
    desc: 'Focar no benefício prático.',
    color: 'bg-emerald-50 text-emerald-700 border-emerald-100',
    questions: [
      'Faria sentido priorizar um imóvel mais perto do trabalho, mesmo que seja um pouco menor?',
      'Ter uma garagem coberta te daria mais tranquilidade com o carro?',
      'Um imóvel já com móveis planejados ajudaria a reduzir o custo inicial?',
      'Se eu te mostrar até três opções que atendam esses critérios, facilita sua decisão?'
    ]
  }
]

// 5 Momentos da Visita
const MOMENTOS_VISITA = [
  {
    step: '1',
    title: 'Recepção & Acolhimento',
    desc: 'Quebre o gelo, estabeleça rapport e alinhe a expectativa.'
  },
  {
    step: '2',
    title: 'Apresentação Conectada',
    desc: 'Apresente o imóvel ligando cada detalhe ao que o cliente valoriza.'
  },
  {
    step: '3',
    title: 'Pontos de Atenção (Transparência)',
    desc: 'Mostre com honestidade o que o imóvel tem que exige atenção.'
  },
  {
    step: '4',
    title: 'Leitura & Sondagem de Interesse',
    desc: 'Observe as reações não verbais e peça impressões.'
  },
  {
    step: '5',
    title: 'Fechamento da Visita & Próximo Passo',
    desc: 'Defina a próxima ação imediata com data e hora específicas.'
  }
]

interface GuiasDeApoioProps {
  stageIndex?: number
}

export default function GuiasDeApoio({ stageIndex }: GuiasDeApoioProps) {
  const [subTab, setSubTab] = useState<'objecoes' | 'spin' | 'visita'>('objecoes')
  const [selectedProfile, setSelectedProfile] = useState<'analitico' | 'controlador' | 'apoiador' | 'catalisador'>('analitico')
  const [copiedText, setCopiedText] = useState<string | null>(null)

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text)
    setCopiedText(text)
    setTimeout(() => setCopiedText(null), 2000)
  }

  const profileConfig = {
    analitico: {
      name: 'Analítico',
      icon: <Brain className="text-[#1F4E79]" size={16} />,
      color: 'bg-blue-50 border-blue-200 text-[#1F4E79]',
      desc: 'Valoriza dados, fatos, comparações precisas e segurança baseada em números.'
    },
    controlador: {
      name: 'Controlador',
      icon: <Zap className="text-amber-600" size={16} />,
      color: 'bg-amber-50 border-amber-200 text-amber-800',
      desc: 'Prefere objetividade, agilidade, ir direto ao ponto e sentir que está no comando.'
    },
    apoiador: {
      name: 'Apoiador',
      icon: <Users className="text-emerald-600" size={16} />,
      color: 'bg-emerald-50 border-emerald-200 text-emerald-800',
      desc: 'Busca bom relacionamento, empatia, segurança pessoal e processos sem surpresa.'
    },
    catalisador: {
      name: 'Catalisador',
      icon: <Flame className="text-[#eb3238]" size={16} />,
      color: 'bg-rose-50 border-rose-200 text-[#eb3238]',
      desc: 'Motivado por novidades, rapidez, exclusividade e visão clara de ganhos futuros.'
    }
  }

  // --- EMBEDDED RENDER BY STAGE INDEX ---
  if (stageIndex !== undefined) {
    return (
      <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4.5 mt-3 space-y-4">
        
        {/* E1 · Triagem */}
        {stageIndex === 0 && (
          <div className="space-y-3">
            <div className="flex items-center gap-1.5 text-xs font-black text-slate-700 uppercase tracking-wider">
              <BookOpen size={14} className="text-[#eb3238]" />
              Manual E1 · Processo de Triagem
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-[11px] font-medium text-slate-600">
              <div className="bg-white border border-slate-150 rounded-xl p-3">
                <span className="text-slate-800 font-extrabold block mb-1">Portas de Entrada (Os 2 Números)</span>
                <ul className="list-disc pl-4 space-y-1">
                  <li><b>Porta A:</b> Entrou pela Lais (número comercial/placas).</li>
                  <li><b>Porta B:</b> Direto no humano (balcão, indicação).</li>
                  <li className="text-slate-400"><i>Administrativo (inquilinos/proprietários) fica fora.</i></li>
                </ul>
              </div>
              <div className="bg-white border border-slate-150 rounded-xl p-3">
                <span className="text-slate-800 font-extrabold block mb-1">Origens de Leads</span>
                <ul className="list-disc pl-4 space-y-1">
                  <li><b>Diretos:</b> Site, Telefone (placa).</li>
                  <li><b>Indiretos:</b> Instagram, Indicação.</li>
                </ul>
              </div>
            </div>
            <div className="bg-white border border-slate-150 rounded-xl p-3 text-[11px] text-slate-500 font-medium">
              💡 <b>Meta da Etapa:</b> Tempo de 1ª resposta inferior a <b>1h</b> (Andressa).
            </div>
          </div>
        )}

        {/* E2 · Atendimento & Match */}
        {stageIndex === 1 && (
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-slate-150 pb-2">
              <div className="flex items-center gap-1.5 text-xs font-black text-slate-700 uppercase tracking-wider">
                <BookOpen size={14} className="text-[#eb3238]" />
                Manual E2 · Perguntas SPIN
              </div>
              <span className="text-[10px] bg-rose-50 text-[#eb3238] px-2 py-0.5 rounded font-black uppercase">
                Regra de Ouro: Máximo 3 Imóveis
              </span>
            </div>

            <p className="text-[11px] text-slate-500 font-semibold leading-relaxed">
              Use a escada de canais (<b>Pessoal &gt; Ligação &gt; WhatsApp</b>) e qualifique a pessoa antes do imóvel usando o banco de perguntas SPIN abaixo (Roteiro de apoio, não questionário):
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {SPIN_DATA.map((item) => (
                <div key={item.letter} className="bg-white border border-slate-150 rounded-xl p-3 space-y-2">
                  <div className="flex items-center gap-2 border-b border-slate-100 pb-1.5">
                    <span className={`w-5 h-5 rounded-md flex items-center justify-center text-[10px] font-black border ${item.color}`}>
                      {item.letter}
                    </span>
                    <span className="text-[11px] font-black text-slate-800">{item.name}</span>
                  </div>
                  <ul className="space-y-1.5">
                    {item.questions.map((q, idx) => {
                      const isCopied = copiedText === q
                      return (
                        <li key={idx} className="flex items-center justify-between gap-2 text-[10px] font-medium text-slate-600 bg-slate-50 p-1.5 rounded-lg border border-slate-100/50">
                          <span className="line-clamp-2">{q}</span>
                          <button
                            onClick={() => handleCopy(q)}
                            className={`p-1 rounded transition-all cursor-pointer ${
                              isCopied ? 'bg-emerald-50 text-emerald-600' : 'text-slate-400 hover:text-slate-655'
                            }`}
                          >
                            {isCopied ? <Check size={10} /> : <Copy size={10} />}
                          </button>
                        </li>
                      )
                    })}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* E3 · Visita */}
        {stageIndex === 2 && (
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-slate-150 pb-2">
              <div className="flex items-center gap-1.5 text-xs font-black text-slate-700 uppercase tracking-wider">
                <BookOpen size={14} className="text-[#eb3238]" />
                Manual E3 · 5 Momentos da Visita
              </div>
              <span className="text-[10px] bg-slate-200 text-slate-700 px-2 py-0.5 rounded font-black uppercase">
                Mapeamento de Objeções
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-5 gap-2.5">
              {MOMENTOS_VISITA.map((m) => (
                <div key={m.step} className="bg-white border border-slate-150 rounded-xl p-3 space-y-1">
                  <div className="flex items-center gap-1">
                    <span className="w-4 h-4 bg-[#eb3238] text-white rounded-full flex items-center justify-center text-[9px] font-black">
                      {m.step}
                    </span>
                    <span className="text-[10px] font-black text-slate-800 line-clamp-1">{m.title}</span>
                  </div>
                  <p className="text-[9px] text-slate-500 font-semibold leading-relaxed">{m.desc}</p>
                </div>
              ))}
            </div>

            <div className="bg-amber-50/50 border border-amber-200 rounded-xl p-3 text-[11px] text-amber-800 font-medium">
              ⚠️ <b>Checklist de Preparação:</b> Confirmar agenda com proprietário, pegar chaves, conferir luz/água, alinhar pontos fortes e confirmar com o cliente para reduzir no-show.
            </div>
          </div>
        )}

        {/* E4 · Proposta */}
        {stageIndex === 3 && (
          <div className="space-y-2.5">
            <div className="flex items-center gap-1.5 text-xs font-black text-slate-700 uppercase tracking-wider">
              <BookOpen size={14} className="text-[#eb3238]" />
              Manual E4 · Conduta na Proposta
            </div>
            <div className="bg-white border border-slate-150 rounded-xl p-4 text-[11px] text-slate-600 font-medium leading-relaxed space-y-2">
              <p>📌 <b>Etapa Leve:</b> O cliente já escolheu e quer propor. Não encha de perguntas agora para não plantar dúvidas desnecessárias.</p>
              <p>🚫 <b>Sem Requalificação:</b> A intenção de pagamento já veio da etapa E2 e a proposta já traz o valor e as formas acordadas.</p>
            </div>
          </div>
        )}

        {/* E5 · Negociação */}
        {stageIndex === 4 && (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-150 pb-2.5">
              <div className="flex items-center gap-1.5 text-xs font-black text-slate-700 uppercase tracking-wider">
                <BookOpen size={14} className="text-[#eb3238]" />
                Manual E5 · Guia de Objeções
              </div>
              
              {/* Profile picker tabs */}
              <div className="flex bg-slate-200 p-0.5 rounded-lg gap-0.5">
                {(Object.keys(profileConfig) as Array<keyof typeof profileConfig>).map((pKey) => (
                  <button
                    key={pKey}
                    onClick={() => setSelectedProfile(pKey)}
                    className={`px-2 py-1 rounded text-[9px] font-black transition-all cursor-pointer ${
                      selectedProfile === pKey ? 'bg-white text-slate-800 shadow-xs' : 'text-slate-500'
                    }`}
                  >
                    {pKey.substring(0, 4).toUpperCase()}
                  </button>
                ))}
              </div>
            </div>

            <div className="bg-white border border-slate-150 rounded-xl p-3 text-[11px] text-slate-650">
              💡 Perfil do cliente selecionado: <b>{profileConfig[selectedProfile].name}</b> — <i>{profileConfig[selectedProfile].desc}</i>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {OBJECTIONS_DATA.map((obj) => {
                const currentResponse = obj.profiles[selectedProfile].response || ''
                const currentBehavior = obj.profiles[selectedProfile].behavior || 'Empatia.'
                const isCopied = copiedText === currentResponse

                return (
                  <div key={obj.id} className="bg-white border border-slate-150 rounded-xl p-3.5 flex flex-col justify-between space-y-3">
                    <div>
                      <div className="flex items-center gap-1 text-[9px] font-black uppercase text-slate-400">
                        {obj.icon} {obj.category}
                      </div>
                      <p className="text-[10px] font-extrabold text-slate-800 italic mt-1">{obj.phrase}</p>
                      <div className="mt-2 bg-slate-50/50 p-2.5 rounded-lg border border-slate-100 text-[10.5px] font-semibold text-slate-650 leading-relaxed">
                        <span className="text-[8px] bg-slate-200 px-1 py-0.5 rounded text-slate-500 font-bold block mb-1 w-max">{currentBehavior}</span>
                        {currentResponse}
                      </div>
                    </div>
                    <button
                      onClick={() => handleCopy(currentResponse)}
                      className={`w-full flex items-center justify-center gap-1 py-1.5 rounded-lg text-[9px] font-black uppercase border transition-all cursor-pointer ${
                        isCopied ? 'bg-emerald-50 border-emerald-250 text-emerald-600' : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                      }`}
                    >
                      {isCopied ? 'Copiado!' : 'Copiar fala'}
                    </button>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* E6 · Fechamento */}
        {stageIndex === 5 && (
          <div className="space-y-3">
            <div className="flex items-center gap-1.5 text-xs font-black text-slate-700 uppercase tracking-wider">
              <BookOpen size={14} className="text-[#eb3238]" />
              Manual E6 · Documentação & Fechamento
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-[10.5px] font-medium text-slate-600">
              <div className="bg-white border border-slate-150 rounded-xl p-3">
                <span className="text-slate-800 font-extrabold block mb-1">💸 À Vista</span>
                Docs do comprador (pessoais) + docs do vendedor e do imóvel para transferência imediata (caminho rápido).
              </div>
              <div className="bg-white border border-slate-150 rounded-xl p-3">
                <span className="text-slate-800 font-extrabold block mb-1">🏦 Financiamento Aprovado</span>
                Docs pessoais + carta de crédito/aprovação do banco + documentos do imóvel para o banco.
              </div>
              <div className="bg-white border border-slate-150 rounded-xl p-3">
                <span className="text-slate-800 font-extrabold block text-rose-600 mb-1">⚠️ Financiamento a Aprovar</span>
                Análise de crédito (renda, simulações) antes de pedir os documentos do imóvel. <b>É o que mais trava!</b>
              </div>
            </div>

            <div className="bg-white border border-slate-150 rounded-xl p-3 text-[11px] text-slate-500 font-medium">
              ℹ️ <b>Regra Geral:</b> Financiamento é sempre via <b>Caixa Econômica</b> com suporte e contato direto.
            </div>
          </div>
        )}

      </div>
    )
  }

  // --- STANDALONE RENDER (TAB SCREEN) ---
  return (
    <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm flex-1 flex flex-col">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-5 mb-6">
        <div>
          <h2 className="text-lg font-black text-slate-900 flex items-center gap-2">
            <BookOpen className="text-[#eb3238]" size={20} />
            Guias de Apoio do Corretor
          </h2>
          <p className="text-xs text-slate-500 font-medium mt-1">
            Ferramentas teóricas e práticas alinhadas ao Manual do Processo de Vendas da Porto Real.
          </p>
        </div>

        {/* Support Sub-Tabs */}
        <div className="flex bg-slate-100 p-1 rounded-xl self-start gap-0.5">
          <button
            onClick={() => setSubTab('objecoes')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              subTab === 'objecoes'
                ? 'bg-white text-slate-800 shadow-xs'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            🗣️ Guia de Objeções
          </button>
          <button
            onClick={() => setSubTab('spin')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              subTab === 'spin'
                ? 'bg-white text-slate-800 shadow-xs'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            🔄 Perguntas SPIN
          </button>
          <button
            onClick={() => setSubTab('visita')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              subTab === 'visita'
                ? 'bg-white text-slate-800 shadow-xs'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            📍 5 Momentos da Visita
          </button>
        </div>
      </div>

      {/* View Content */}
      <div className="flex-1 flex flex-col">
        
        {/* SUBTAB: OBJEÇÕES */}
        {subTab === 'objecoes' && (
          <div className="space-y-6 flex-1 flex flex-col">
            
            {/* Profile Selection Row */}
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">
                Selecione o perfil do cliente para ver a abordagem recomendada
              </label>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                {(Object.keys(profileConfig) as Array<keyof typeof profileConfig>).map((key) => {
                  const conf = profileConfig[key]
                  const isSelected = selectedProfile === key
                  return (
                    <button
                      key={key}
                      onClick={() => setSelectedProfile(key)}
                      className={`p-3.5 border rounded-2xl text-left transition-all hover:border-slate-350 hover:shadow-xs flex flex-col gap-1 w-full cursor-pointer ${
                        isSelected 
                          ? 'border-[#eb3238] ring-1 ring-[#eb3238] bg-white' 
                          : 'border-slate-200 bg-slate-50/50'
                      }`}
                    >
                      <div className="flex items-center gap-1.5">
                        {conf.icon}
                        <span className="font-extrabold text-xs text-slate-800">{conf.name}</span>
                      </div>
                      <p className="text-[9px] text-slate-500 font-medium leading-relaxed mt-0.5">
                        {conf.desc}
                      </p>
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Response Cards Grid */}
            <div className="flex-1 space-y-4">
              <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest px-1">
                Falas Sugeridas por Tipo de Objeção
              </h3>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                {OBJECTIONS_DATA.map((obj) => {
                  const currentResponse = obj.profiles[selectedProfile].response || ''
                  const currentBehavior = obj.profiles[selectedProfile].behavior || 'Empatia.'
                  const isCopied = copiedText === currentResponse

                  return (
                    <div 
                      key={obj.id} 
                      className="border border-slate-200 rounded-2xl p-4 bg-slate-50/20 hover:shadow-sm transition-all flex flex-col justify-between"
                    >
                      <div>
                        {/* Header */}
                        <div className="flex items-center justify-between border-b border-slate-100 pb-2.5 mb-3">
                          <span className="flex items-center gap-1 text-[9px] font-extrabold uppercase bg-white border border-slate-200 rounded-lg px-2 py-1 text-slate-650">
                            {obj.icon}
                            {obj.category}
                          </span>
                          <span className="text-[9px] font-black text-[#eb3238] uppercase">
                            Perfil: {profileConfig[selectedProfile].name}
                          </span>
                        </div>

                        {/* Customer Phrase */}
                        <div className="mb-4">
                          <span className="text-[10px] font-bold text-slate-400 block">O cliente diz:</span>
                          <p className="text-xs font-extrabold text-slate-800 italic mt-0.5">
                            {obj.phrase}
                          </p>
                        </div>

                        {/* Sugerido */}
                        <div className="bg-white border border-slate-150 rounded-xl p-3 shadow-xs">
                          <div className="flex items-center justify-between mb-1.5">
                            <span className="text-[9px] font-bold text-slate-400">Abordagem:</span>
                            <span className="text-[8px] bg-slate-100 text-slate-655 px-1.5 py-0.5 rounded-md font-bold">
                              {currentBehavior}
                            </span>
                          </div>
                          <p className="text-xs font-semibold text-slate-700 leading-relaxed">
                            {currentResponse}
                          </p>
                        </div>
                      </div>

                      {/* Copy Action */}
                      <button
                        onClick={() => handleCopy(currentResponse)}
                        className={`mt-4 w-full flex items-center justify-center gap-1.5 py-2 rounded-xl text-[10px] font-black uppercase transition-all duration-250 cursor-pointer ${
                          isCopied 
                            ? 'bg-emerald-50 border border-emerald-200 text-emerald-600' 
                            : 'bg-slate-100 border border-transparent text-slate-600 hover:bg-slate-200'
                        }`}
                      >
                        {isCopied ? <Check size={12} /> : <Copy size={12} />}
                        {isCopied ? 'Copiado!' : 'Copiar Abordagem'}
                      </button>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        )}

        {/* SUBTAB: SPIN QUESTIONS */}
        {subTab === 'spin' && (
          <div className="space-y-6">
            <div className="bg-[#EEF4FA] border border-[#D6E4F0] rounded-2xl p-4 flex gap-3">
              <HelpCircle className="text-[#1F4E79] flex-shrink-0 mt-0.5" size={18} />
              <div>
                <h4 className="text-xs font-black text-[#1F4E79]">Método SPIN de Qualificação</h4>
                <p className="text-[11px] text-slate-600 font-semibold leading-relaxed mt-0.5">
                  Esta é uma estrutura de apoio para ajudar a mapear a necessidade real do cliente. Use como um roteiro flexível de perguntas para obter rapport e entender a dor profunda do comprador, e não como um interrogatório rígido.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {SPIN_DATA.map((item) => (
                <div key={item.letter} className="border border-slate-200 rounded-2xl p-4 bg-white shadow-xs">
                  <div className="flex items-center gap-2.5 mb-3 border-b border-slate-100 pb-2.5">
                    <span className={`w-8 h-8 rounded-xl flex items-center justify-center text-sm font-black border ${item.color}`}>
                      {item.letter}
                    </span>
                    <div>
                      <h4 className="text-xs font-black text-slate-800">{item.name}</h4>
                      <p className="text-[9px] text-slate-400 font-semibold">{item.desc}</p>
                    </div>
                  </div>

                  <ul className="space-y-2">
                    {item.questions.map((q, idx) => {
                      const isCopied = copiedText === q
                      return (
                        <li 
                          key={idx}
                          className="flex items-center justify-between gap-3 bg-slate-50/50 hover:bg-slate-50 border border-slate-150/60 rounded-xl p-2.5 transition-colors group"
                        >
                          <span className="text-xs font-semibold text-slate-700 leading-snug">{q}</span>
                          <button
                            onClick={() => handleCopy(q)}
                            title="Copiar pergunta"
                            className={`p-1.5 rounded-lg border transition-all cursor-pointer flex-shrink-0 ${
                              isCopied 
                                ? 'bg-emerald-50 border-emerald-200 text-emerald-600' 
                                : 'bg-white border-slate-200 text-slate-400 hover:text-slate-655 hover:border-slate-350'
                            }`}
                          >
                            {isCopied ? <Check size={11} /> : <Copy size={11} />}
                          </button>
                        </li>
                      )
                    })}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* SUBTAB: 5 MOMENTOS DA VISITA */}
        {subTab === 'visita' && (
          <div className="space-y-6">
            <div className="bg-[#FFF8EC] border border-[#FFE7C4] rounded-2xl p-4 flex gap-3">
              <ClipboardList className="text-amber-600 flex-shrink-0 mt-0.5" size={18} />
              <div>
                <h4 className="text-xs font-black text-amber-800">Passagem de Bastão & Sucesso da Visita</h4>
                <p className="text-[11px] text-slate-600 font-semibold leading-relaxed mt-0.5">
                  A visita é conduzida pelo Corretor e marca a transição de atendimento da triagem/captação para o fechamento. Conduzir o cliente através dos momentos abaixo maximiza a probabilidade de conversão para proposta.
                </p>
              </div>
            </div>

            {/* Vertical Timeline */}
            <div className="relative pl-6 border-l-2 border-slate-200 ml-4 space-y-8">
              {MOMENTOS_VISITA.map((item, idx) => (
                <div key={item.step} className="relative group">
                  {/* Circle Indicator */}
                  <span className="absolute -left-[35px] top-0.5 w-6 h-6 rounded-full bg-white border-2 border-[#eb3238] flex items-center justify-center text-[10px] font-black text-slate-800 shadow-sm transition-all group-hover:scale-115">
                    {item.step}
                  </span>

                  <div>
                    <h4 className="text-xs font-black text-slate-800 flex items-center gap-2">
                      {item.title}
                    </h4>
                    <p className="text-[11px] text-slate-650 font-bold mt-1">
                      {item.desc}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
        
      </div>
    </div>
  )
}
