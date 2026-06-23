'use client'

import { useState, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { createVendasPesquisa } from '@/lib/api'
import { Check, Send, Star, Sparkles } from 'lucide-react'

function PesquisaForm() {
  const searchParams = useSearchParams()
  const tipoParam = searchParams.get('tipo') || 'comprador' // comprador, proprietario, visitante

  const [success, setSuccess] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  // Standard fields
  const [nome, setNome] = useState('')
  const [comprouConosco, setComprouConosco] = useState<boolean | null>(null) // For comprador path

  // Ratings (1-10)
  const [ratings, setRatings] = useState<Record<number, number>>({})
  // Texts
  const [texts, setTexts] = useState<Record<number, string>>({})

  // Map of questions
  const QS_PUBLICO = {
    comprador: [
      { q: "Sua opinião sobre o imóvel que viu", type: "rating", dbField: "nota_imovel" },
      { q: "Sobre o corretor que te atendeu", type: "rating", dbField: "nota_corretor" },
      { q: "Sobre o atendimento (rapidez, clareza, respeito)", type: "rating", dbField: "nota_atend" },
      { q: "Sobre a experiência geral com a Porto Real", type: "rating", dbField: "nota_site" },
      { q: "Sobre o nosso site / anúncios", type: "rating", dbField: "nota_site" },
      { q: "O que faltou para você fechar a compra?", type: "text", dbField: "motivo" },
      { q: "Por que decidiu não comprar conosco?", type: "text", dbField: "motivo" }
    ],
    proprietario: [
      { q: "Sobre o corretor responsável pelo seu imóvel", type: "rating", dbField: "nota_corretor" },
      { q: "Sobre a comunicação e os retornos que recebeu", type: "rating", dbField: "nota_atend" },
      { q: "Sobre a experiência geral com a Porto Real", type: "rating", dbField: "nota_imovel" },
      { q: "Sobre a divulgação do seu imóvel (fotos, anúncios, site)", type: "rating", dbField: "nota_site" },
      { q: "O que poderíamos melhorar no atendimento ao proprietário?", type: "text", dbField: "motivo" }
    ],
    visitante: [
      { q: "Como você nos encontrou?", type: "text", dbField: "motivo" },
      { q: "Sobre a facilidade de navegar no nosso site", type: "rating", dbField: "nota_site" },
      { q: "Encontrou o tipo de imóvel que procurava?", type: "text", dbField: "interesse" },
      { q: "O que faltou para você entrar em contato?", type: "text", dbField: "motivo" }
    ]
  }

  const activeKey = (tipoParam === 'proprietario' || tipoParam === 'visitante') ? tipoParam : 'comprador'
  
  // Filter questions based on query param 'q' (indices separated by comma)
  let questions = QS_PUBLICO[activeKey]
  const qParam = searchParams.get('q')
  if (qParam !== null) {
    const selectedIndices = qParam.split(',').map(x => parseInt(x, 10)).filter(x => !isNaN(x))
    questions = questions.filter((_, idx) => selectedIndices.includes(idx))
  }

  const handleRatingChange = (idx: number, val: number) => {
    setRatings(prev => ({ ...prev, [idx]: val }))
  }

  const handleTextChange = (idx: number, val: string) => {
    setTexts(prev => ({ ...prev, [idx]: val }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!nome.trim()) {
      alert("Por favor, informe seu nome.")
      return
    }

    if (activeKey === 'comprador' && comprouConosco === null) {
      alert("Por favor, selecione se você fechou negócio conosco.")
      return
    }

    setSubmitting(true)

    // Determine finalized tipo
    let finalTipo: 'comprou' | 'naocomprou' | 'proprietario' | 'visitante' = 'visitante'
    if (activeKey === 'proprietario') {
      finalTipo = 'proprietario'
    } else if (activeKey === 'visitante') {
      finalTipo = 'visitante'
    } else {
      finalTipo = comprouConosco ? 'comprou' : 'naocomprou'
    }

    // Map ratings and texts to DB fields
    let nota_imovel: number | null = null
    let nota_corretor: number | null = null
    let nota_atend: number | null = null
    let nota_site: number | null = null
    const feedbacks: string[] = []
    let interesseText = ''

    questions.forEach((q, idx) => {
      if (q.type === 'rating') {
        const val = ratings[idx] || null
        if (val !== null) {
          if (q.dbField === 'nota_imovel') nota_imovel = val
          else if (q.dbField === 'nota_corretor') nota_corretor = val
          else if (q.dbField === 'nota_atend') nota_atend = val
          else if (q.dbField === 'nota_site') nota_site = val
        }
      } else {
        const txt = texts[idx]?.trim()
        if (txt) {
          if (q.dbField === 'interesse') {
            interesseText = txt
          } else {
            feedbacks.push(`${q.q}: ${txt}`)
          }
        }
      }
    })

    const motivo = feedbacks.length ? feedbacks.join(' | ') : null

    try {
      const res = await createVendasPesquisa({
        nome: nome.trim(),
        tipo: finalTipo,
        data: new Date().toLocaleDateString('pt-BR'),
        nota_imovel,
        nota_corretor,
        nota_atend,
        nota_site,
        motivo,
        perfil: null,
        interesse: finalTipo === 'visitante' ? { local: interesseText } : {}
      })

      if (res) {
        setSuccess(true)
      } else {
        alert("Ocorreu um erro ao enviar sua pesquisa. Por favor, tente novamente.")
      }
    } catch (err) {
      console.error(err)
      alert("Erro ao conectar com o servidor.")
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
          <h2 className="text-2xl font-black text-slate-800">Pesquisa Enviada!</h2>
          <p className="text-sm text-slate-500 leading-relaxed">
            Muito obrigado por dedicar seu tempo para nos avaliar. Sua opinião é essencial para aprimorarmos continuamente nossos serviços.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white/90 backdrop-blur-md border border-slate-100 rounded-3xl p-6 md:p-8 shadow-2xl space-y-6 max-w-lg w-full animate-scaleIn">
      <div className="text-center space-y-1.5 border-b border-slate-100 pb-4">
        <div className="inline-flex items-center gap-1.5 bg-[#EEF4FA] text-[#1F4E79] text-[10px] font-black tracking-wider px-3 py-1 rounded-full uppercase">
          <Sparkles size={10} /> Porto Real Imobiliária
        </div>
        <h2 className="text-xl md:text-2xl font-black text-slate-800">Pesquisa de Satisfação</h2>
        <p className="text-xs text-slate-500">Sua avaliação sincera ajuda a melhorar o nosso atendimento.</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="space-y-1.5">
          <label className="text-xs font-extrabold text-slate-500 uppercase tracking-wider block">Seu Nome Completo</label>
          <input
            type="text"
            required
            placeholder="Ex: Ana Souza"
            value={nome}
            onChange={(e) => setNome(e.target.value)}
            className="w-full border border-slate-200 rounded-xl p-3 text-xs md:text-sm outline-none focus:border-[#2E6CA8] bg-white transition-all font-medium"
          />
        </div>

        {activeKey === 'comprador' && (
          <div className="space-y-2">
            <label className="text-xs font-extrabold text-slate-500 uppercase tracking-wider block">Você chegou a fechar negócio conosco?</label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setComprouConosco(true)}
                className={`py-3 text-xs font-bold border rounded-xl transition-all ${
                  comprouConosco === true ? 'border-[#1F4E79] bg-[#EEF4FA] text-[#1F4E79]' : 'border-slate-200 text-slate-600 bg-white'
                }`}
              >
                Sim, fechei negócio
              </button>
              <button
                type="button"
                onClick={() => setComprouConosco(false)}
                className={`py-3 text-xs font-bold border rounded-xl transition-all ${
                  comprouConosco === false ? 'border-[#1F4E79] bg-[#EEF4FA] text-[#1F4E79]' : 'border-slate-200 text-slate-600 bg-white'
                }`}
              >
                Não/Apenas avaliando
              </button>
            </div>
          </div>
        )}

        <div className="border-t border-slate-100 pt-4 space-y-5">
          <span className="text-xs font-extrabold text-[#1F4E79] uppercase block tracking-wider">Perguntas de Avaliação</span>

          {questions.map((q, idx) => (
            <div key={idx} className="space-y-2.5">
              <label className="text-xs font-bold text-slate-700 leading-snug block">{idx + 1}. {q.q}</label>
              
              {q.type === 'rating' ? (
                <div className="flex flex-wrap items-center justify-between gap-1.5 bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(val => {
                    const isSelected = ratings[idx] === val
                    return (
                      <button
                        key={val}
                        type="button"
                        onClick={() => handleRatingChange(idx, val)}
                        className={`w-8.5 h-8.5 text-xs font-black rounded-lg transition-all flex items-center justify-center border ${
                          isSelected 
                            ? 'bg-[#1F4E79] border-[#1F4E79] text-white shadow-sm'
                            : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'
                        }`}
                      >
                        {val}
                      </button>
                    )
                  })}
                  <div className="w-full flex justify-between text-[9px] font-extrabold text-slate-400 px-1 mt-1 uppercase">
                    <span>Ruim</span>
                    <span>Excelente</span>
                  </div>
                </div>
              ) : (
                <textarea
                  placeholder="Escreva sua resposta ou feedback..."
                  rows={3}
                  value={texts[idx] || ''}
                  onChange={(e) => handleTextChange(idx, e.target.value)}
                  className="w-full border border-slate-200 rounded-xl p-3 text-xs md:text-sm outline-none focus:border-[#2E6CA8] bg-white transition-all font-medium resize-none"
                />
              )}
            </div>
          ))}
        </div>

        <button
          type="submit"
          disabled={submitting}
          className="w-full bg-[#1F4E79] hover:bg-[#2E6CA8] disabled:opacity-50 text-white text-xs font-bold py-3.5 rounded-xl transition-all shadow-lg shadow-blue-100 flex items-center justify-center gap-1.5 cursor-pointer mt-4"
        >
          <Send size={14} />
          {submitting ? 'Enviando Avaliação...' : 'Enviar Avaliação'}
        </button>
      </form>
    </div>
  )
}

export default function PublicoPesquisaPage() {
  return (
    <main className="min-h-screen bg-gradient-to-tr from-[#123658] via-[#1F4E79] to-[#2E6CA8] flex items-center justify-center p-4 py-10 font-sans">
      <Suspense fallback={
        <div className="bg-white/90 backdrop-blur-md rounded-3xl p-8 shadow-2xl flex flex-col items-center justify-center space-y-3 max-w-sm w-full">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#1F4E79] border-t-transparent"></div>
          <span className="text-xs font-semibold text-slate-600">Carregando formulário...</span>
        </div>
      }>
        <PesquisaForm />
      </Suspense>
    </main>
  )
}
