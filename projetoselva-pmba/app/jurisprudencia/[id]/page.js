'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  ArrowLeft, Scale, Calendar, User, Hash, Tag, ExternalLink,
  CheckCircle, XCircle, MinusCircle, Copy, GitCompare, Loader2,
  FileText, AlertTriangle, ChevronDown, ChevronUp
} from 'lucide-react'

const badgeResultado = (resultado) => {
  if (!resultado) return null
  const r = resultado.toUpperCase()
  if (r.includes('DEFERIDO') && !r.includes('IN') && !r.includes('PARCIAL')) {
    return { bg: 'bg-emerald-100 text-emerald-800 border-emerald-200', icon: <CheckCircle className="w-4 h-4" />, label: resultado }
  }
  if (r.includes('INDEFERIDO') || r.includes('NÃO PROVIDO')) {
    return { bg: 'bg-red-100 text-red-800 border-red-200', icon: <XCircle className="w-4 h-4" />, label: resultado }
  }
  if (r.includes('PARCIAL') || r.includes('PROVIDO')) {
    return { bg: 'bg-yellow-100 text-yellow-800 border-yellow-200', icon: <MinusCircle className="w-4 h-4" />, label: resultado }
  }
  return { bg: 'bg-gray-100 text-gray-700 border-gray-200', icon: <MinusCircle className="w-4 h-4" />, label: resultado }
}

export default function DecisaoPage() {
  const { id } = useParams()
  const router = useRouter()

  const [decisao, setDecisao] = useState(null)
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState(null)
  const [copiado, setCopiado] = useState(false)
  const [mostrarIntegra, setMostrarIntegra] = useState(false)
  const [decisoesSemelhantes, setDecisoesSemelhantes] = useState([])

  useEffect(() => {
    if (!id) return
    fetch(`/api/jurisprudencia/decisao?id=${id}`)
      .then(r => r.json())
      .then(data => {
        if (data.error) { setErro(data.error); return }
        setDecisao(data.decisao)
        // Busca decisões semelhantes (mesmo tema)
        if (data.decisao?.temas?.length) {
          const tema = data.decisao.temas[0]
          fetch(`/api/jurisprudencia/search?tema=${encodeURIComponent(tema)}&limit=5`)
            .then(r => r.json())
            .then(d => {
              setDecisoesSemelhantes((d.resultados || []).filter(r => r.id !== id))
            })
            .catch(() => {})
        }
      })
      .catch(() => setErro('Erro ao carregar decisão'))
      .finally(() => setCarregando(false))
  }, [id])

  const copiarEmenta = () => {
    if (!decisao?.ementa) return
    navigator.clipboard.writeText(decisao.ementa).then(() => {
      setCopiado(true)
      setTimeout(() => setCopiado(false), 2000)
    })
  }

  if (carregando) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-3 text-gray-400">
          <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
          <span className="text-sm">Carregando decisão...</span>
        </div>
      </div>
    )
  }

  if (erro || !decisao) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <AlertTriangle className="w-12 h-12 text-red-400 mx-auto mb-3" />
          <h2 className="text-gray-700 font-medium mb-1">{erro || 'Decisão não encontrada'}</h2>
          <Link href="/jurisprudencia" className="text-emerald-600 hover:underline text-sm">← Voltar ao buscador</Link>
        </div>
      </div>
    )
  }

  const badge = badgeResultado(decisao.resultado)

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b sticky top-0 z-40 shadow-sm">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
          <Link href="/jurisprudencia" className="flex items-center gap-2 text-gray-600 hover:text-gray-800 text-sm">
            <ArrowLeft className="w-4 h-4" />
            Buscador de Jurisprudência
          </Link>
          <div className="flex items-center gap-2">
            <button
              onClick={copiarEmenta}
              className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800 border rounded-lg px-3 py-1.5 hover:bg-gray-50"
            >
              <Copy className="w-3.5 h-3.5" />
              {copiado ? 'Copiado!' : 'Copiar ementa'}
            </button>
            <Link
              href={`/jurisprudencia/comparar?ids=${id}`}
              className="flex items-center gap-1.5 text-sm text-blue-600 border border-blue-200 rounded-lg px-3 py-1.5 hover:bg-blue-50"
            >
              <GitCompare className="w-3.5 h-3.5" />
              Comparar
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* Conteúdo principal */}
          <div className="lg:col-span-2 space-y-4">

            {/* Card principal */}
            <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
              {/* Badge resultado - topo */}
              {badge && (
                <div className={`px-4 py-2.5 border-b flex items-center gap-2 ${badge.bg}`}>
                  {badge.icon}
                  <span className="font-bold text-sm">{badge.label}</span>
                </div>
              )}

              <div className="p-5">
                {/* Número do processo */}
                {decisao.numero_processo && (
                  <div className="font-mono text-sm text-gray-500 bg-gray-100 inline-flex px-2 py-1 rounded mb-3">
                    {decisao.numero_processo}
                  </div>
                )}

                {/* Tipo de ação */}
                {decisao.tipo_acao && (
                  <div className="text-xs font-semibold text-emerald-700 uppercase tracking-wider mb-2">
                    {decisao.tipo_acao}
                  </div>
                )}

                {/* Ementa */}
                <div className="mb-4">
                  <h2 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Ementa</h2>
                  <p className="text-gray-800 text-sm leading-relaxed font-medium">
                    {decisao.ementa}
                  </p>
                </div>

                {/* Temas */}
                {decisao.temas?.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {decisao.temas.map(t => (
                      <Link
                        key={t}
                        href={`/jurisprudencia?tema=${encodeURIComponent(t)}`}
                        className="text-xs bg-emerald-50 text-emerald-700 hover:bg-emerald-100 px-2.5 py-1 rounded-full border border-emerald-200 transition-colors"
                      >
                        {t}
                      </Link>
                    ))}
                    {decisao.palavras_chave?.map(t => (
                      <span key={t} className="text-xs bg-gray-100 text-gray-500 px-2.5 py-1 rounded-full">
                        {t}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Texto íntegra (colapsável) */}
            {decisao.texto_integra && (
              <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
                <button
                  onClick={() => setMostrarIntegra(!mostrarIntegra)}
                  className="w-full px-5 py-3 flex items-center justify-between hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                    <FileText className="w-4 h-4 text-gray-400" />
                    Texto Íntegro do Acórdão
                  </div>
                  {mostrarIntegra ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
                </button>
                {mostrarIntegra && (
                  <div className="px-5 pb-5 border-t">
                    <pre className="mt-4 text-xs text-gray-700 leading-relaxed whitespace-pre-wrap font-sans max-h-[600px] overflow-y-auto">
                      {decisao.texto_integra}
                    </pre>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-4">

            {/* Dados do julgamento */}
            <div className="bg-white rounded-xl border shadow-sm p-4">
              <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Dados do Julgamento</h3>
              <dl className="space-y-3">
                {decisao.data_julgamento && (
                  <div>
                    <dt className="text-xs text-gray-400 flex items-center gap-1 mb-0.5">
                      <Calendar className="w-3 h-3" /> Data
                    </dt>
                    <dd className="text-sm font-medium text-gray-800">
                      {new Date(decisao.data_julgamento).toLocaleDateString('pt-BR', {
                        day: '2-digit', month: 'long', year: 'numeric'
                      })}
                    </dd>
                  </div>
                )}
                {decisao.relator && (
                  <div>
                    <dt className="text-xs text-gray-400 flex items-center gap-1 mb-0.5">
                      <User className="w-3 h-3" /> Relator
                    </dt>
                    <dd className="text-sm font-medium text-gray-800">{decisao.relator}</dd>
                  </div>
                )}
                {decisao.orgao_julgador && (
                  <div>
                    <dt className="text-xs text-gray-400 flex items-center gap-1 mb-0.5">
                      <Hash className="w-3 h-3" /> Órgão Julgador
                    </dt>
                    <dd className="text-sm font-medium text-gray-800">{decisao.orgao_julgador}</dd>
                  </div>
                )}
                {decisao.requerente && (
                  <div>
                    <dt className="text-xs text-gray-400 mb-0.5">Requerente</dt>
                    <dd className="text-sm text-gray-700">{decisao.requerente}</dd>
                  </div>
                )}
                {decisao.requerido && (
                  <div>
                    <dt className="text-xs text-gray-400 mb-0.5">Requerido</dt>
                    <dd className="text-sm text-gray-700">{decisao.requerido}</dd>
                  </div>
                )}
                {decisao.fonte_url && (
                  <div>
                    <a
                      href={decisao.fonte_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1.5 text-xs text-emerald-600 hover:text-emerald-800 mt-2"
                    >
                      <ExternalLink className="w-3 h-3" />
                      Ver no TJBA
                    </a>
                  </div>
                )}
              </dl>
            </div>

            {/* Decisões semelhantes */}
            {decisoesSemelhantes.length > 0 && (
              <div className="bg-white rounded-xl border shadow-sm p-4">
                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Decisões Semelhantes</h3>
                <div className="space-y-3">
                  {decisoesSemelhantes.slice(0, 4).map(d => {
                    const b = badgeResultado(d.resultado)
                    return (
                      <Link key={d.id} href={`/jurisprudencia/${d.id}`} className="block hover:bg-gray-50 -mx-1 px-1 py-1.5 rounded-lg transition-colors">
                        {b && (
                          <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full mb-1 ${b.bg}`}>
                            {b.icon} {d.resultado}
                          </span>
                        )}
                        <p className="text-xs text-gray-600 line-clamp-2 leading-relaxed">
                          {d.ementa?.slice(0, 100)}...
                        </p>
                        <span className="text-xs text-gray-400">
                          {d.data_julgamento && new Date(d.data_julgamento).getFullYear()}
                          {d.relator && ` • ${d.relator.split(' ').slice(-2).join(' ')}`}
                        </span>
                      </Link>
                    )
                  })}
                </div>
              </div>
            )}

            {/* Ações */}
            <div className="bg-white rounded-xl border shadow-sm p-4 space-y-2">
              <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Ações</h3>
              <Link
                href={`/jurisprudencia/comparar?ids=${id}`}
                className="w-full flex items-center gap-2 text-sm text-blue-600 border border-blue-200 rounded-lg px-3 py-2 hover:bg-blue-50 transition-colors"
              >
                <GitCompare className="w-4 h-4" />
                Comparar com outras decisões
              </Link>
              {decisao.temas?.[0] && (
                <Link
                  href={`/jurisprudencia/comparar?modo=conflitos&tema=${encodeURIComponent(decisao.temas[0])}`}
                  className="w-full flex items-center gap-2 text-sm text-orange-600 border border-orange-200 rounded-lg px-3 py-2 hover:bg-orange-50 transition-colors"
                >
                  <AlertTriangle className="w-4 h-4" />
                  Ver conflitos sobre "{decisao.temas[0]}"
                </Link>
              )}
              <Link
                href={`/jurisprudencia?relator=${encodeURIComponent(decisao.relator || '')}`}
                className="w-full flex items-center gap-2 text-sm text-gray-600 border rounded-lg px-3 py-2 hover:bg-gray-50 transition-colors"
              >
                <User className="w-4 h-4" />
                Outras decisões deste relator
              </Link>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
