export interface PerfilInfo {
  nome: string
  emo: string
  busca: string
  sinais: string[]
  estrategia: string[]
  frase: string
  frase_momento: {
    abordagem: string
    contorno: string
    fechamento: string
  }
  evitar: string[]
}

export const ETAPAS = [
  {
    nome: "Triagem",
    chk: [
      "Origem do lead registrada",
      "Primeira resposta enviada (< 1h)",
      "Nome e contato salvos",
      "Origem registrada",
      "Etiqueta de status aplicada"
    ]
  },
  {
    nome: "Atendimento & Match",
    chk: [
      "Rapport feito (a pessoa antes do imóvel)",
      "Canal de atendimento definido",
      "Cliente engajado na conversa",
      "Perguntas SPIN feitas",
      "Necessidade real mapeada",
      "Perfil dominante identificado",
      "Sondagem: orçamento e forma de pagamento",
      "Plano por perfil definido",
      "Cadência de contato definida",
      "Roteiro de apresentação ajustado",
      "Imóveis cruzados com o perfil",
      "Imóveis estudados antes de oferecer",
      "Quantidade certa selecionada",
      "Apresentação adaptada ao perfil",
      "Fotos / vídeo enviados",
      "Interesse despertado"
    ]
  },
  {
    nome: "Visita",
    chk: [
      "Checklist de preparação feito",
      "Visita conduzida pelos 5 momentos",
      "Pontos de atenção apresentados",
      "Leitura de interesse feita"
    ]
  },
  {
    nome: "Proposta",
    chk: [
      "As 4 perguntas antes da proposta",
      "Qualificação financeira concluída",
      "Proposta registrada"
    ]
  },
  {
    nome: "Negociação",
    chk: [
      "Interesses (não posições) mapeados",
      "Ancoragem e concessões planejadas",
      "Objeções tratadas",
      "Acordo entre as partes"
    ]
  },
  {
    nome: "Fechamento",
    chk: [
      "Documentos do comprador",
      "Documentos do vendedor / imóvel",
      "Financiamento encaminhado",
      "Aprovação acompanhada",
      "Conferência pré-assinatura",
      "Contrato assinado",
      "Comissão acordada",
      "Chaves entregues"
    ]
  },
  {
    nome: "Pós-venda",
    chk: [
      "Contato pós-fechamento feito",
      "Satisfação verificada"
    ]
  },
  {
    nome: "Depoimento",
    chk: [
      "Depoimento solicitado",
      "Depoimento publicado"
    ]
  },
  {
    nome: "Indicação",
    chk: [
      "Indicação solicitada",
      "Indicação registrada como novo lead"
    ]
  }
]

export const I_VISITA = 2
export const I_PROPOSTA = 3
export const I_FECHAMENTO = 5

export const RESP = [
  "Andressa",          // 0 Triagem
  "Andressa + Corretor",// 1 Atendimento & Match
  "Corretor",           // 2 Visita
  "Corretor",           // 3 Proposta
  "Corretor",           // 4 Negociação
  "Andressa + Corretor",// 5 Fechamento
  "Pós-venda",          // 6 Pós-venda
  "Pós-venda",          // 7 Depoimento
  "Pós-venda"           // 8 Indicação
]

export const RESP_COR: Record<string, string> = {
  "Andressa": "#1F4E79",
  "Corretor": "#1f9d6b",
  "Andressa + Corretor": "#2E6CA8",
  "Pós-venda": "#c77d2e"
}

export const RESP_EMO: Record<string, string> = {
  "Andressa": "⭐",
  "Corretor": "🏠",
  "Andressa + Corretor": "⭐🏠",
  "Pós-venda": "💬"
}

export const TEMP_CFG = {
  quente: { rotulo: "Quente", cor: "#ef4444" },
  morno: { rotulo: "Morno", cor: "#f59e0b" },
  frio: { rotulo: "Frio", cor: "#3b82f6" }
}

export const TIPO_CFG = {
  comprou: { l: "Comprou", bg: "#e6f5ee", c: "#1f9d6b" },
  naocomprou: { l: "Não comprou", bg: "#fdeceb", c: "#d6453d" },
  proprietario: { l: "Proprietário", bg: "#D6E4F0", c: "#1F4E79" },
  visitante: { l: "Visitante", bg: "#EEF4FA", c: "#475569" }
}

export const PERFIL_QUIZ = [
  {
    q: "O que o cliente reparou ou perguntou primeiro?",
    opts: [
      { t: "Metragem, documentação, números", k: "analitico" },
      { t: "Preço e praticidade", k: "controlador" },
      { t: "Espaços de convivência (sala, quintal)", k: "apoiador" },
      { t: "Arquitetura, planta, diferenciais", k: "catalisador" }
    ]
  },
  {
    q: "Como ele fala e decide?",
    opts: [
      { t: "Devagar, compara, pensa antes de responder", k: "analitico" },
      { t: "Direto e objetivo, quer agilidade", k: "controlador" },
      { t: "Caloroso, fala da família, decide no sentimento", k: "apoiador" },
      { t: "Animado e curioso, empolga com o diferente", k: "catalisador" }
    ]
  },
  {
    q: "Qual foi a primeira pergunta dele?",
    opts: [
      { t: "“Qual a metragem? Está tudo certo na documentação?”", k: "analitico" },
      { t: "“Quanto fica? Tem margem de negociação?”", k: "controlador" },
      { t: "“Tem quintal? Cabe a família?”", k: "apoiador" },
      { t: "“Como é o projeto? Tem algo diferente?”", k: "catalisador" }
    ]
  },
  {
    q: "O que mais importa para ele?",
    opts: [
      { t: "Segurança e certeza de que é um bom negócio", k: "analitico" },
      { t: "Resolver rápido com bom custo-benefício", k: "controlador" },
      { t: "Pertencimento, conforto, a família junta", k: "apoiador" },
      { t: "Novidade, exclusividade, sair do comum", k: "catalisador" }
    ]
  },
  {
    q: "Como ele reage quando você mostra entusiasmo?",
    opts: [
      { t: "Desconfia e quer provas", k: "analitico" },
      { t: "Corta e vai direto ao ponto", k: "controlador" },
      { t: "Embarca junto, gosta da energia", k: "apoiador" },
      { t: "Se empolga ainda mais", k: "catalisador" }
    ]
  },
  {
    q: "O que costuma fazer ele travar?",
    opts: [
      { t: "Medo de errar ou falta de dados", k: "analitico" },
      { t: "Achar que está pagando caro", k: "controlador" },
      { t: "Não sentir que é a casa certa", k: "apoiador" },
      { t: "Achar o imóvel comum demais", k: "catalisador" }
    ]
  },
  {
    q: "Como ele prefere receber as informações?",
    opts: [
      { t: "Planilha, comparativo, documentos", k: "analitico" },
      { t: "Resumo rápido e direto", k: "controlador" },
      { t: "Conversa, história, exemplos", k: "apoiador" },
      { t: "Fotos, vídeo e o que tem de único", k: "catalisador" }
    ]
  }
]

export const PERFIS: Record<string, PerfilInfo> = {
  analitico: {
    nome: "Analítico", emo: "🧠", busca: "Busca segurança",
    sinais: [
      "Pergunta metragem, documentação, histórico",
      "Compara imóveis antes de decidir",
      "Fala devagar, pensa antes de responder",
      "Desconfia de entusiasmo excessivo",
      "Prefere dados técnicos detalhados e tabelas"
    ],
    estrategia: [
      "Leve dados reais, certidões e precisão matemática em mãos.",
      "Se não souber responder algo, admita e pesquise; credibilidade é tudo.",
      "Nunca pressione por fechamento rápido ou argumentos puramente emocionais.",
      "Deixe espaço e tempo de reflexão para ele processar a proposta.",
      "Estruture a comunicação por escrito (e-mail ou relatórios organizados).",
      "Enfatize a solidez da construtora, histórico da região e regularidade jurídica."
    ],
    frase: "“Conforme a simulação detalhada e certidões anexas, este imóvel apresenta o menor custo por m² útil e segurança jurídica total.”",
    frase_momento: {
      abordagem: "“Olá! Preparei este dossiê completo do imóvel, incluindo planta detalhada, histórico da região e taxas condominiais dos últimos 12 meses. Vamos avaliar os números?”",
      contorno: "“Entendo seu ponto. Em termos de custo-benefício, fiz um comparativo das últimas 3 vendas desse condomínio. O valor do m² atual está 8.2% abaixo da média.”",
      fechamento: "“Com a minuta contratual pré-aprovada pelo nosso jurídico, podemos assinar garantindo todas as certidões negativas em até 48 horas. Podemos prosseguir com estes termos?”"
    },
    evitar: [
      "Pressionar com senso de urgência artificial ('É pra hoje ou perde').",
      "Usar adjetivos vagos e exagerados ('Imóvel maravilhoso, perfeito, dos sonhos').",
      "Omitir problemas ou responder sem precisão sobre valores ou taxas."
    ]
  },
  controlador: {
    nome: "Controlador", emo: "⚡", busca: "Busca resultado/poder",
    sinais: [
      "Pergunta o preço final ou margem de desconto no início do contato",
      "Vai direto ao ponto e tende a interromper explicações longas",
      "Demonstra pressa nas visitas e quer ver o essencial primeiro",
      "Gosta de assumir o comando e ditar as regras da negociação",
      "Usa tom de voz firme, assertivo e decidido"
    ],
    estrategia: [
      "Seja extremamente direto, objective e focado em soluções práticas.",
      "Apresente sempre o resumo executivo antes dos detalhes técnicos.",
      "Mostre o ganho real de tempo, comodidade ou dinheiro.",
      "Tenha as informações de valores e margens de negociação na ponta da língua.",
      "Evite tentar 'ensinar' ou rebater pontos; dê opções e deixe-o decidir.",
      "Foque em resultados tangíveis e vantagens exclusivas de fechamento rápido."
    ],
    frase: "“Imóvel abaixo da avaliação de mercado com grande liquidez. Proprietário com pressa de venda aceita proposta imediata.”",
    frase_momento: {
      abordagem: "“Olá! Direto ao ponto: este imóvel entrou hoje no sistema, 15% abaixo do valor médio da região. Excelente oportunidade de ganho rápido de capital. Quer agendar?”",
      contorno: "“Se o proprietário não aceitar a oferta de imediato, passamos para a próxima opção. O mercado está aquecido e não podemos perder tempo com propostas sem liquidez.”",
      fechamento: "“Tenho a procuração do vendedor em mãos. Se fizermos o sinal agora, o negócio está fechado hoje sem delongas. Assinamos o pré-contrato agora?”"
    },
    evitar: [
      "Fazer rodeios, puxar conversa informal longa ('Small talk').",
      "Apresentar justificativas emocionais para o preço ou atrasos.",
      "Demonstrar hesitação ou insegurança na comunicação."
    ]
  },
  apoiador: {
    nome: "Apoiador", emo: "❤️", busca: "Busca pertencimento/segurança",
    sinais: [
      "Foca em espaços de convivência familiar, quintal e sala",
      "Comenta bastante sobre filhos, cônjuge, pets e rotina",
      "Utiliza muito pronomes coletivos ('a gente', 'nós')",
      "Toma decisões de forma pausada e busca consenso familiar",
      "Valoriza conversas amigáveis, relacionamento e tom acolhedor"
    ],
    estrategia: [
      "Inicie o atendimento estreitando a relação pessoal e familiar.",
      "Utilize linguagem emocional que ajude a idealizar a vida no imóvel.",
      "Respeite o ritmo mais lento e o tempo de maturação da decisão.",
      "Auxilie a envolver e acalmar todos os membros da família na conversa.",
      "Demonstre empatia e seja um consultor parceiro, não um vendedor impositivo.",
      "Destaque pontos de lazer coletivo, vizinhança segura e aconchego familiar."
    ],
    frase: "“Espaço ideal para reunir quem você ama, com um quintal ensolarado e vizinhança tranquila e segura.”",
    frase_momento: {
      abordagem: "“Olá! Fiquei pensando na conversa que tivemos sobre seus filhos e pets. Encontrei uma casa com um quintal espaçoso e ensolarado perfeito para eles brincarem à tarde. Vamos conhecer?”",
      contorno: "“Compreendo sua preocupação com a segurança. A rua é sem saída, monitorada 24h pelos vizinhos, e as crianças do condomínio brincam juntas sem qualquer perigo.”",
      fechamento: "“Podemos formalizar este passo com calma. Vou te apoiar em cada etapa da papelada para que sua família faça uma transição tranquila e sem estresse. Vamos juntos?”"
    },
    evitar: [
      "Falar de maneira puramente transacional ou fria.",
      "Pressionar a decisão isolando outros membros da família.",
      "Minimizar preocupações sentimentais do cliente com o imóvel."
    ]
  },
  catalisador: {
    nome: "Catalisador", emo: "🚀", busca: "Busca novidade/exclusividade",
    sinais: [
      "Entusiasma-se com design diferenciado, arquitetura moderna e tecnologia",
      "Busca o inédito, novidades de mercado e ideias inovadoras",
      "Aborrece-se com layouts tradicionais ou imóveis padronizados",
      "Comunicação entusiasmada, rápida e gesticulada",
      "Decide por impacto emocional de distinção e sofisticação"
    ],
    estrategia: [
      "Enfatize a exclusividade e a singularidade daquela oportunidade.",
      "Use tom animado, dinâmico e acompanhe a empolgação dele.",
      "Destaque elementos de prestígio, design assinado ou inovações tecnológicas.",
      "Deixe-o sentir que está descobrindo um segredo ou tendência do mercado.",
      "Apresente opções que saiam do padrão, estimulando sua imaginação.",
      "Foque na valorização social e no estilo de vida moderno que o imóvel proporciona."
    ],
    frase: "“Projeto único com arquitetura premiada e automação completa, feito para quem busca se destacar com estilo.”",
    frase_momento: {
      abordagem: "“Olá! Acabou de liberar um loft exclusivo com conceito industrial, pé-direito duplo e automação por voz. É o único com essa assinatura na região. Vamos lá dar uma olhada?”",
      contorno: "“Realmente, o valor reflete a exclusividade. O acabamento em concreto aparente e as esquadrias minimalistas importadas são raridades difíceis de encontrar em outros projetos.”",
      fechamento: "“Esse imóvel é para poucos. Se fecharmos a reserva agora, garantimos que ele seja seu antes do lançamento oficial na próxima semana. O que acha de darmos esse passo exclusivo?”"
    },
    evitar: [
      "Vender o básico ('Esta casa tem 3 quartos normais').",
      "Apresentar uma comunicação burocrática, morna ou cansativa.",
      "Tratar a compra como algo comum e padronizado."
    ]
  }
}

export const SINAIS_COMPORTAMENTAIS = {
  analitico: [
    "Solicita certidões, matrícula ou histórico do imóvel",
    "Compara minuciosamente dados de outros imóveis",
    "Prefere envio de relatórios e mensagens por escrito",
    "Formulação de perguntas muito técnicas (ex: IPTU, condomínio)",
    "Expressão corporal neutra e tom de voz moderado"
  ],
  controlador: [
    "Pergunta o preço final ou margem de desconto de imediato",
    "Demonstra pressa e tende a interromper explicações longas",
    "Foco obstinado no tempo, prazos e retorno financeiro",
    "Quer estar no controle das decisões, impondo condições",
    "Comunicação direta, firme, por vezes ríspida"
  ],
  apoiador: [
    "Foca em espaços de convivência (sala, cozinha, quintal)",
    "Frequente uso de 'a gente', 'nós' (envolvendo a família)",
    "Menciona rotina familiar, pets, filhos ou bem-estar",
    "Necessita de tempo para sentir confiança e conversar",
    "Decide de forma mais lenta e busca consenso familiar"
  ],
  catalisador: [
    "Entusiasma-se com design, arquitetura moderna ou inovação",
    "Valoriza muito a exclusividade ou a história do projeto",
    "Aborrece-se facilmente com imóveis tradicionais ou genéricos",
    "Fala rápido, gesticula bastante e demonstra empolgação",
    "Toma decisões impulsionado por distinção ou status"
  ]
}

export const QS_PUBLICO = {
  comprador: [
    "Sua opinião sobre o imóvel que viu",
    "Sobre o corretor que te atendeu",
    "Sobre o atendimento (rapidez, clareza, respeito)",
    "Sobre a experiência geral com a Porto Real",
    "Sobre o nosso site / anúncios",
    "O que faltou para você fechar a compra?",
    "Por que decidiu não comprar conosco?"
  ],
  proprietario: [
    "Sobre o corretor responsável pelo seu imóvel",
    "Sobre a comunicação e os retornos que recebeu",
    "Sobre a experiência geral com a Porto Real",
    "Sobre a divulgação do seu imóvel (fotos, anúncios, site)",
    "O que poderíamos melhorar no atendimento ao proprietário?"
  ],
  visitante: [
    "Como você nos encontrou?",
    "Sobre a facilidade de navegar no nosso site",
    "Encontrou o tipo de imóvel que procurava?",
    "O que faltou para você entrar em contato?"
  ]
}

export const PUB_LABEL = {
  comprador: "Comprador interessado",
  proprietario: "Proprietário",
  visitante: "Visitante do site"
}

export const PERFIL_QS = [
  {
    q: "O que mais pesa na sua decisão?",
    opts: [
      { t: "Ter todos os dados e a documentação em ordem", k: "analitico" },
      { t: "Resolver rápido, com o melhor custo-benefício", k: "controlador" },
      { t: "Imaginar minha família vivendo ali", k: "apoiador" },
      { t: "Um imóvel diferente, com personalidade", k: "catalisador" }
    ]
  },
  {
    q: "Num imóvel, você repara primeiro em…",
    opts: [
      { t: "Metragem e detalhes técnicos", k: "analitico" },
      { t: "Preço e praticidade", k: "controlador" },
      { t: "Espaços de convivência (sala, quintal)", k: "apoiador" },
      { t: "Arquitetura e diferenciais do projeto", k: "catalisador" }
    ]
  },
  {
    q: "Como prefere ser atendido?",
    opts: [
      { t: "Com informação e sem pressa", k: "analitico" },
      { t: "De forma direta e objetiva", k: "controlador" },
      { t: "Com calma, entendendo minha rotina", k: "apoiador" },
      { t: "Vendo o que aquele imóvel tem de único", k: "catalisador" }
    ]
  }
]

export const fmtBRL = (n: number) => "R$ " + n.toLocaleString('pt-BR')
