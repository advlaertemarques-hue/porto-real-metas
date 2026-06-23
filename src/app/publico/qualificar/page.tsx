'use client'

import { useState, useEffect, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { createVendasCliente, getVendasCorretores } from '@/lib/api'
import { VendasCorretor } from '@/lib/types'
import { Check, Send, Sparkles } from 'lucide-react'

// Sub-component that actually uses searchParams
function QualificarForm() {
  const searchParams = useSearchParams()
  const corretorId = searchParams.get('corretor')

  const [corretores, setCorretores] = useState<VendasCorretor[]>([])
  const [loadingCorr, setLoadingCorr] = useState(true)
  const [success, setSuccess] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  const [form, setForm] = useState({
    nome: '',
    contato: '',
    email: '',
    objetivo: 'Comprar',
    faixa: '',
    local: '',
    pgto: 'Financiamento',
    tipoImovel: 'Casa',
    quartos: '3',
    p1: '',
    p2: '',
    p3: ''
  })

  useEffect(() => {
    async function loadCorretores() {
      try {
        const list = await getVendasCorretores()
        setCorretores(list)
      } catch (err) {
        console.error(err)
      } finally {
        setLoadingCorr(false)
      }
    }
    loadCorretores()
  }, [])

  const currentCorretor = corretores.find(c => c.id === corretorId)

  const PERFIL_QS = [
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.nome.trim()) {
      alert("Por favor, preencha o seu nome.")
      return
    }

    // Determine profile key based on final 3 questions answers
    const tal: Record<string, number> = {}
    const { p1, p2, p3 } = form
    if (p1) tal[p1] = (tal[p1] || 0) + 1
    if (p2) tal[p2] = (tal[p2] || 0) + 1
    if (p3) tal[p3] = (tal[p3] || 0) + 1

    let bestProfile = 'apoiador' // default fallback
    let max = 0
    for (const k in tal) {
      if (tal[k] > max) {
        max = tal[k]
        bestProfile = k
      }
    }

    setSubmitting(true)

    try {
      const res = await createVendasCliente({
        nome: form.nome.trim(),
        contato: form.contato.trim() || '—',
        email: form.email.trim() || '—',
        origem: 'Site / Google',
        valor: 0,
        etapa: 0, // Starts at stage 1 (Lead)
        perfil: bestProfile,
        temp: 'quente',
        expressa: true,
        objetivo: form.objetivo,
        faixa: form.faixa || 'R$ 200–350 mil',
        local: form.local || '',
        preferencia: `Imóvel: ${form.tipoImovel} com ${form.quartos} quartos. Pagamento: ${form.pgto}`,
        perfil_quiz: { "0": p1, "1": p2, "2": p3 },
        corretor_id: corretorId || null,
        finalizado: false
      })

      if (res) {
        setSuccess(true)
      } else {
        alert("Ocorreu um erro ao enviar suas respostas. Por favor, tente novamente.")
      }
    } catch (err) {
      console.error(err)
      alert("Erro de comunicação com o servidor.")
    } finally {
      setSubmitting(false)
    }
  }

  if (success) {
    return (
      <div className="bg-white/80 backdrop-blur-md border border-slate-200 rounded-3xl p-8 shadow-2xl text-center space-y-6 max-w-md w-full animate-scaleIn">
        <div className="w-16 h-16 bg-emerald-500 text-white rounded-full flex items-center justify-center mx-auto text-3xl shadow-lg shadow-emerald-200">
          ✓
        </div>
        <div className="space-y-2">
          <h2 className="text-2xl font-black text-slate-800">Formulário Enviado!</h2>
          <p className="text-sm text-slate-500 leading-relaxed">
            Obrigado pelas respostas. Nossa equipe analisará suas preferências para selecionar as melhores opções de imóveis para você.
          </p>
        </div>
        {currentCorretor && (
          <div className="bg-[#EEF4FA] border border-[#D6E4F0] rounded-2xl p-4 text-xs font-semibold text-[#1F4E79] flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-[#1F4E79] text-white flex items-center justify-center font-bold uppercase">
              {currentCorretor.nome.charAt(0)}
            </div>
            <div className="text-left">
              <span className="text-[10px] text-slate-400 font-extrabold uppercase block">Seu corretor responsável</span>
              <span className="text-slate-700 font-bold">{currentCorretor.nome}</span>
            </div>
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="bg-white/90 backdrop-blur-md border border-slate-100 rounded-3xl p-6 md:p-8 shadow-2xl space-y-6 max-w-lg w-full animate-scaleIn">
      <div className="text-center space-y-1.5 border-b border-slate-100 pb-4">
        <div className="inline-flex items-center gap-1.5 bg-[#EEF4FA] text-[#1F4E79] text-[10px] font-black tracking-wider px-3 py-1 rounded-full uppercase">
          <Sparkles size={10} /> Porto Real Imobiliária
        </div>
        <h2 className="text-xl md:text-2xl font-black text-slate-800">Encontre Seu Imóvel Ideal</h2>
        <p className="text-xs text-slate-500">Preencha as preferências abaixo para buscarmos as melhores opções.</p>
      </div>

      {currentCorretor && (
        <div className="bg-[#EEF4FA]/70 border border-[#D6E4F0] rounded-2xl p-3 flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-[#1F4E79] text-white flex items-center justify-center font-black uppercase text-sm">
            {currentCorretor.nome.charAt(0)}
          </div>
          <div className="text-left text-xs">
            <span className="text-[9px] text-slate-400 font-extrabold uppercase block">Você está sendo atendido por</span>
            <span className="text-slate-700 font-extrabold">{currentCorretor.nome}</span>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-1.5">
          <label className="text-xs font-extrabold text-slate-500 uppercase tracking-wider block">Seu Nome Completo</label>
          <input
            type="text"
            required
            placeholder="Ex: Roberto Silva"
            value={form.nome}
            onChange={(e) => setForm({ ...form, nome: e.target.value })}
            className="w-full border border-slate-200 rounded-xl p-3 text-xs md:text-sm outline-none focus:border-[#2E6CA8] bg-white transition-all"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-xs font-extrabold text-slate-500 uppercase tracking-wider block">Telefone (WhatsApp)</label>
            <input
              type="text"
              placeholder="Ex: (69) 99999-9999"
              value={form.contato}
              onChange={(e) => setForm({ ...form, contato: e.target.value })}
              className="w-full border border-slate-200 rounded-xl p-3 text-xs md:text-sm outline-none focus:border-[#2E6CA8] bg-white transition-all"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-extrabold text-slate-500 uppercase tracking-wider block">Seu E-mail</label>
            <input
              type="email"
              placeholder="Ex: email@exemplo.com"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              className="w-full border border-slate-200 rounded-xl p-3 text-xs md:text-sm outline-none focus:border-[#2E6CA8] bg-white transition-all"
            />
          </div>
        </div>

        <div className="border-t border-slate-100 pt-4 space-y-4">
          <span className="text-xs font-extrabold text-[#1F4E79] uppercase block tracking-wider">O que você procura? 🏠</span>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-extrabold text-slate-500 uppercase tracking-wider block">Objetivo</label>
              <select
                value={form.objetivo}
                onChange={(e) => setForm({ ...form, objetivo: e.target.value })}
                className="w-full border border-slate-200 rounded-xl p-3 text-xs md:text-sm outline-none bg-white cursor-pointer font-semibold"
              >
                <option value="Comprar">Comprar um Imóvel</option>
                <option value="Alugar">Alugar um Imóvel</option>
                <option value="Vender">Anunciar para Vender</option>
                <option value="Deixar para alugar">Anunciar para Alugar</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-extrabold text-slate-500 uppercase tracking-wider block">Faixa de Preço</label>
              <select
                value={form.faixa}
                onChange={(e) => setForm({ ...form, faixa: e.target.value })}
                className="w-full border border-slate-200 rounded-xl p-3 text-xs md:text-sm outline-none bg-white cursor-pointer font-semibold"
              >
                <option value="">Selecione...</option>
                <option value="Até R$ 200 mil">Até R$ 200 mil</option>
                <option value="R$ 200–350 mil">R$ 200–350 mil</option>
                <option value="R$ 350–500 mil">R$ 350–500 mil</option>
                <option value="Acima de R$ 500 mil">Acima de R$ 500 mil</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-extrabold text-slate-500 uppercase tracking-wider block">Tipo de Imóvel</label>
              <div className="grid grid-cols-3 gap-1.5">
                {['Casa', 'Apto', 'Terreno'].map(v => (
                  <button
                    key={v}
                    type="button"
                    onClick={() => setForm({ ...form, tipoImovel: v })}
                    className={`py-2 text-xs font-bold border rounded-xl transition-all ${
                      form.tipoImovel === v ? 'border-[#1F4E79] bg-[#EEF4FA] text-[#1F4E79]' : 'border-slate-200 text-slate-600 bg-white'
                    }`}
                  >
                    {v}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-extrabold text-slate-500 uppercase tracking-wider block">Quartos Mínimo</label>
              <div className="grid grid-cols-4 gap-1.5">
                {['1', '2', '3', '4+'].map(v => (
                  <button
                    key={v}
                    type="button"
                    onClick={() => setForm({ ...form, quartos: v })}
                    className={`py-2 text-xs font-bold border rounded-xl transition-all ${
                      form.quartos === v ? 'border-[#1F4E79] bg-[#EEF4FA] text-[#1F4E79]' : 'border-slate-200 text-slate-600 bg-white'
                    }`}
                  >
                    {v}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-extrabold text-slate-500 uppercase tracking-wider block">Localização / Bairro</label>
              <input
                type="text"
                placeholder="Ex: Centro, Jardim das Oliveiras"
                value={form.local}
                onChange={(e) => setForm({ ...form, local: e.target.value })}
                className="w-full border border-slate-200 rounded-xl p-3 text-xs md:text-sm outline-none focus:border-[#2E6CA8] bg-white transition-all"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-extrabold text-slate-500 uppercase tracking-wider block">Forma de Pagamento</label>
              <div className="grid grid-cols-3 gap-1.5">
                {['À Vista', 'Financ.', 'Permuta'].map(v => (
                  <button
                    key={v}
                    type="button"
                    onClick={() => setForm({ ...form, pgto: v })}
                    className={`py-2 text-[10px] md:text-xs font-bold border rounded-xl transition-all ${
                      form.pgto === v ? 'border-[#1F4E79] bg-[#EEF4FA] text-[#1F4E79]' : 'border-slate-200 text-slate-600 bg-white'
                    }`}
                  >
                    {v}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="border-t border-slate-100 pt-4 space-y-4">
          <span className="text-xs font-extrabold text-[#1F4E79] uppercase block tracking-wider">Para te atendermos melhor 💬</span>
          
          <div className="space-y-4">
            {PERFIL_QS.map((pq, idx) => {
              const pKey = `p${idx + 1}` as 'p1' | 'p2' | 'p3'
              const selVal = form[pKey]
              return (
                <div key={idx} className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 leading-tight block">{idx + 1}. {pq.q}</label>
                  <div className="flex flex-col gap-1.5">
                    {pq.opts.map(o => (
                      <button
                        key={o.k}
                        type="button"
                        onClick={() => setForm({ ...form, [pKey]: o.k })}
                        className={`w-full text-left px-3.5 py-2.5 rounded-xl border text-xs leading-snug transition-all ${
                          selVal === o.k ? 'border-[#1F4E79] bg-[#EEF4FA] text-[#1F4E79] font-bold' : 'border-slate-200 text-slate-600 bg-white hover:border-slate-300'
                        }`}
                      >
                        {o.t}
                      </button>
                    ))}
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        <div className="bg-slate-50 p-3.5 rounded-2xl text-[10px] text-slate-400 leading-normal border border-slate-100">
          🔒 Seus dados estão protegidos nos termos da LGPD e serão utilizados exclusivamente para selecionar os imóveis do seu interesse.
        </div>

        <button
          type="submit"
          disabled={submitting}
          className="w-full bg-[#1F4E79] hover:bg-[#2E6CA8] disabled:opacity-50 text-white text-xs font-bold py-3.5 rounded-xl transition-all shadow-lg shadow-blue-100 flex items-center justify-center gap-1.5 cursor-pointer"
        >
          <Send size={14} />
          {submitting ? 'Enviando...' : 'Enviar Preferências'}
        </button>
      </form>
    </div>
  )
}

export default function PublicoQualificarPage() {
  return (
    <main className="min-h-screen bg-gradient-to-tr from-[#123658] via-[#1F4E79] to-[#2E6CA8] flex items-center justify-center p-4 py-10 font-sans">
      <Suspense fallback={
        <div className="bg-white/90 backdrop-blur-md rounded-3xl p-8 shadow-2xl flex flex-col items-center justify-center space-y-3 max-w-sm w-full">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#1F4E79] border-t-transparent"></div>
          <span className="text-xs font-semibold text-slate-600">Carregando formulário...</span>
        </div>
      }>
        <QualificarForm />
      </Suspense>
    </main>
  )
}
