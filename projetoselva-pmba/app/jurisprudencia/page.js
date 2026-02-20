'use client'

import { useState, useEffect, useCallback, useRef, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import {
  Search, Filter, Scale, GitCompare, BookOpen, ChevronDown,
  ChevronUp, X, ExternalLink, TrendingUp, AlertTriangle,
  CheckCircle, XCircle, MinusCircle, BarChart3, ArrowLeft,
  Calendar, User, Hash, Tag, Loader2, Info
} from 'lucide-react'

const RESULTADOS = ['DEFERIDO', 'INDEFERIDO', 'PARCIALMENTE DEFERIDO', 'EXTINTO', 'NÃO CONHECIDO', 'PROVIDO', 'NÃO PROVIDO']
const ANOS = Array.from({ length: 7 }, (_, i) => 2020 + i)

const badgeResultado = (resultado) => {
  if (!resultado) return null
  const r = resultado.toUpperCase()
  if (r.includes('DEFERIDO') && !r.includes('IN') && !r.includes('PARCIAL')) {
    return { bg: 'bg-emerald-100 text-emerald-800', icon: <CheckCircle className="w-3 h-3" /> }
  }
  if (r.includes('INDEFERIDO') || r.includes('NÃO PROVIDO')) {
    return { bg: 'bg-red-100 text-red-800', icon: <XCircle className="w-3 h-3" /> }
  }
  if (r.includes('PARCIAL') || r.includes('PROVIDO')) {
    return { bg: 'bg-yellow-100 text-yellow-800', icon: <MinusCircle className="w-3 h-3" /> }
  }
  return { bg: 'bg-gray-100 text-gray-700', icon: <MinusCircle className="w-3 h-3" /> }
}

function JurisprudenciaContent() {
  const router = useRouter()
  const searchParams = useSearchParams()

  const [query, setQuery] = useState(searchParams.get('q') || '')
  const [filtros, setFiltros] = useState({
    ano: searchParams.get('ano') || '',
    resultado: searchParams.get('resultado') || '',
    relator: searchParams.get('relator') || '',
    tema: searchParams.get('tema') || '',
  })
  const [mostrarFiltros, setMostrarFiltros] = useState(false)
  const [pagina, setPagina] = useState(1)

  const [resultados, setResultados] = useState([])
  const [paginacao, setPaginacao] = useState(null)
  const [carregando, setCarregando] = useState(false)
  const [stats, setStats] = useState(null)

  const [selecionadas, setSelecionadas] = useState([])
  const [modoSelecao, setModoSelecao] = useState(false)

  const inputRef = useRef(null)

  // Busca
  const buscar = useCallback(async (q, f, p) => {
    setCarregando(true)
    try {
      const params = new URLSearchParams()
      if (q) params.set('q', q)
      if (f.ano) params.set('ano', f.ano)
      if (f.resultado) params.set('resultado', f.resultado)
      if (f.relator) params.set('relator', f.relator)
      if (f.tema) params.set('tema', f.tema)
      params.set('page', p)
      params.set('limit', '20')

      const res = await fetch(`/api/jurisprudencia/search?${params}`)
      const data = await res.json()
      setResultados(data.resultados || [])
      setPaginacao(data.paginacao || null)
    } catch (err) {
      console.error(err)
    } finally {
      setCarregando(false)
    }
  }, [])

  // Stats iniciais
  useEffect(() => {
    fetch('/api/jurisprudencia/stats')
      .then(r => r.json())
      .then(d => setStats(d))
      .catch(() => {})
  }, [])

  // Busca inicial ou quando URL muda
  useEffect(() => {
    buscar(query, filtros, pagina)
  }, []) // eslint-disable-line

  const handleBuscar = (e) => {
    e?.preventDefault()
    setPagina(1)
    buscar(query, filtros, 1)
    // Atualiza URL
    const params = new URLSearchParams()
    if (query) params.set('q', query)
    if (filtros.ano) params.set('ano', filtros.ano)
    if (filtros.resultado) params.set('resultado', filtros.resultado)
    if (filtros.relator) params.set('relator', filtros.relator)
    if (filtros.tema) params.set('tema', filtros.tema)
    router.replace(`/jurisprudencia?${params}`, { scroll: false })
  }

  const limparFiltros = () => {
    setFiltros({ ano: '', resultado: '', relator: '', tema: '' })
    setQuery('')
    setPagina(1)
    buscar('', { ano: '', resultado: '', relator: '', tema: '' }, 1)
    router.replace('/jurisprudencia', { scroll: false })
  }

  const mudarPagina = (nova) => {
    setPagina(nova)
    buscar(query, filtros, nova)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const toggleSelecao = (id) => {
    setSelecionadas(prev =>
      prev.includes(id) ? prev.filter(i => i !== id) : prev.length < 5 ? [...prev, id] : prev
    )
  }

  const filtrosAtivos = Object.values(filtros).some(v => v !== '')

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b sticky top-0 z-40 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Link href="/" className="flex items-center gap-2 text-gray-600 hover:text-gray-800">
              <ArrowLeft className="w-4 h-4" />
              <span className="hidden sm:inline text-sm">Início</span>
            </Link>
            <div className="w-px h-5 bg-gray-200" />
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-emerald-600 rounded-lg flex items-center justify-center">
                <Scale className="w-4 h-4 text-white" />
              </div>
              <div>
                <h1 className="text-base font-bold text-gray-800 leading-tight">Jurisprudência TJBA</h1>
                <p className="text-xs text-gray-500 hidden sm:block">Mandados de Segurança • PMBA • 2020–2026</p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {stats?.geral?.total_decisoes && (
              <span className="hidden md:flex items-center gap-1 text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
                <BarChart3 className="w-3 h-3" />
                {stats.geral.total_decisoes} decisões
              </span>
            )}
            <button
              onClick={() => { setModoSelecao(!modoSelecao); setSelecionadas([]) }}
              className={`flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-lg border transition-all ${
                modoSelecao
                  ? 'bg-blue-600 text-white border-blue-600'
                  : 'text-gray-600 border-gray-200 hover:border-blue-400 hover:text-blue-600'
              }`}
            >
              <GitCompare className="w-4 h-4" />
              <span className="hidden sm:inline">Comparar</span>
              {selecionadas.length > 0 && (
                <span className="bg-white text-blue-600 rounded-full text-xs font-bold w-4 h-4 flex items-center justify-center">
                  {selecionadas.length}
                </span>
              )}
            </button>
            <Link
              href="/jurisprudencia/comparar?modo=conflitos"
              className="flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-lg border border-orange-200 text-orange-700 hover:bg-orange-50 transition-all"
            >
              <AlertTriangle className="w-4 h-4" />
              <span className="hidden sm:inline">Conflitos</span>
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-6">
        {/* Stats rápidos */}
        {stats?.geral && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
            {[
              { label: 'Total Decisões', value: stats.geral.total_decisoes, color: 'text-gray-800' },
              { label: '% Deferidos', value: `${stats.geral.pct_deferidos || 0}%`, color: 'text-emerald-600' },
              { label: 'Relatores', value: stats.geral.total_relatores, color: 'text-blue-600' },
              { label: 'Anos', value: `${stats.geral.ano_inicial}–${stats.geral.ano_final}`, color: 'text-purple-600' },
            ].map((s) => (
              <div key={s.label} className="bg-white rounded-xl border p-3">
                <div className={`text-xl font-bold ${s.color}`}>{s.value ?? '–'}</div>
                <div className="text-xs text-gray-500">{s.label}</div>
              </div>
            ))}
          </div>
        )}

        {/* Barra de busca */}
        <div className="bg-white rounded-xl border shadow-sm p-4 mb-4">
          <form onSubmit={handleBuscar} className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={e => setQuery(e.target.value)}
                placeholder="Buscar por ementa, número do processo, relator, tema..."
                className="w-full pl-9 pr-4 py-2.5 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              />
              {query && (
                <button type="button" onClick={() => setQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
            <button
              type="button"
              onClick={() => setMostrarFiltros(!mostrarFiltros)}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg border text-sm transition-all ${
                filtrosAtivos || mostrarFiltros
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-300'
                  : 'text-gray-600 border-gray-200 hover:bg-gray-50'
              }`}
            >
              <Filter className="w-4 h-4" />
              <span className="hidden sm:inline">Filtros</span>
              {filtrosAtivos && <span className="bg-emerald-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center">!</span>}
              {mostrarFiltros ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
            </button>
            <button
              type="submit"
              className="bg-emerald-600 text-white px-5 py-2 rounded-lg text-sm font-medium hover:bg-emerald-700 transition-colors flex items-center gap-2"
            >
              {carregando ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
              <span className="hidden sm:inline">Buscar</span>
            </button>
          </form>

          {/* Filtros expandíveis */}
          {mostrarFiltros && (
            <div className="mt-3 pt-3 border-t grid grid-cols-2 md:grid-cols-4 gap-3">
              <div>
                <label className="text-xs font-medium text-gray-600 mb-1 block flex items-center gap-1">
                  <Calendar className="w-3 h-3" /> Ano
                </label>
                <select
                  value={filtros.ano}
                  onChange={e => setFiltros(prev => ({ ...prev, ano: e.target.value }))}
                  className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="">Todos</option>
                  {ANOS.map(a => <option key={a} value={a}>{a}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs font-medium text-gray-600 mb-1 block flex items-center gap-1">
                  <Scale className="w-3 h-3" /> Resultado
                </label>
                <select
                  value={filtros.resultado}
                  onChange={e => setFiltros(prev => ({ ...prev, resultado: e.target.value }))}
                  className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="">Todos</option>
                  {RESULTADOS.map(r => <option key={r} value={r}>{r}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs font-medium text-gray-600 mb-1 block flex items-center gap-1">
                  <User className="w-3 h-3" /> Relator
                </label>
                <input
                  type="text"
                  value={filtros.relator}
                  onChange={e => setFiltros(prev => ({ ...prev, relator: e.target.value }))}
                  placeholder="Nome do relator..."
                  className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-gray-600 mb-1 block flex items-center gap-1">
                  <Tag className="w-3 h-3" /> Tema
                </label>
                <input
                  type="text"
                  value={filtros.tema}
                  onChange={e => setFiltros(prev => ({ ...prev, tema: e.target.value }))}
                  placeholder="Ex: PROMOÇÃO, PUNIÇÃO..."
                  className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
              <div className="col-span-2 md:col-span-4 flex justify-between items-center pt-1">
                <button
                  type="button"
                  onClick={limparFiltros}
                  className="text-sm text-red-500 hover:text-red-700 flex items-center gap-1"
                >
                  <X className="w-3 h-3" /> Limpar tudo
                </button>
                <button
                  type="button"
                  onClick={handleBuscar}
                  className="bg-emerald-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-emerald-700 transition-colors"
                >
                  Aplicar Filtros
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Banner comparação */}
        {modoSelecao && (
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 mb-4 flex items-center justify-between">
            <div className="flex items-center gap-2 text-blue-800 text-sm">
              <GitCompare className="w-4 h-4" />
              <span>
                {selecionadas.length === 0
                  ? 'Selecione 2 a 5 decisões para comparar lado a lado'
                  : `${selecionadas.length} decisão(ões) selecionada(s) — selecione até ${5 - selecionadas.length} mais`}
              </span>
            </div>
            <div className="flex items-center gap-2">
              {selecionadas.length >= 2 && (
                <Link
                  href={`/jurisprudencia/comparar?ids=${selecionadas.join(',')}`}
                  className="bg-blue-600 text-white px-3 py-1.5 rounded-lg text-sm font-medium hover:bg-blue-700"
                >
                  Comparar ({selecionadas.length})
                </Link>
              )}
              <button onClick={() => { setModoSelecao(false); setSelecionadas([]) }} className="text-blue-600 hover:text-blue-800">
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* Resultados */}
        <div className="space-y-3">
          {/* Header resultados */}
          {paginacao && (
            <div className="flex items-center justify-between text-sm text-gray-500">
              <span>
                {carregando ? 'Buscando...' : (
                  paginacao.total === 0
                    ? 'Nenhum resultado encontrado'
                    : `${paginacao.total} resultado${paginacao.total !== 1 ? 's' : ''}${query ? ` para "${query}"` : ''}`
                )}
              </span>
              {paginacao.total > 0 && (
                <span>Página {paginacao.pagina} de {paginacao.totalPaginas}</span>
              )}
            </div>
          )}

          {carregando ? (
            <div className="flex flex-col items-center justify-center py-16 text-gray-400">
              <Loader2 className="w-8 h-8 animate-spin mb-3" />
              <span className="text-sm">Buscando decisões...</span>
            </div>
          ) : resultados.length === 0 && paginacao ? (
            <div className="bg-white rounded-xl border p-12 text-center">
              <Scale className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <h3 className="text-gray-600 font-medium mb-1">Nenhuma decisão encontrada</h3>
              <p className="text-gray-400 text-sm">Tente outros termos ou remova os filtros</p>
              {(query || filtrosAtivos) && (
                <button onClick={limparFiltros} className="mt-4 text-emerald-600 hover:text-emerald-800 text-sm underline">
                  Limpar busca e filtros
                </button>
              )}
            </div>
          ) : (
            resultados.map((decisao) => {
              const badge = badgeResultado(decisao.resultado)
              const selecionada = selecionadas.includes(decisao.id)
              return (
                <div
                  key={decisao.id}
                  className={`bg-white rounded-xl border transition-all hover:shadow-md ${
                    selecionada ? 'border-blue-400 ring-2 ring-blue-100' : 'border-gray-200 hover:border-emerald-300'
                  }`}
                >
                  <div className="p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        {/* Número e data */}
                        <div className="flex flex-wrap items-center gap-2 mb-2">
                          {modoSelecao && (
                            <input
                              type="checkbox"
                              checked={selecionada}
                              onChange={() => toggleSelecao(decisao.id)}
                              className="w-4 h-4 rounded border-gray-300 text-blue-600 cursor-pointer"
                            />
                          )}
                          {decisao.numero_processo && (
                            <span className="font-mono text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded">
                              {decisao.numero_processo}
                            </span>
                          )}
                          {decisao.data_julgamento && (
                            <span className="text-xs text-gray-400 flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              {new Date(decisao.data_julgamento).toLocaleDateString('pt-BR')}
                            </span>
                          )}
                          {badge && (
                            <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full ${badge.bg}`}>
                              {badge.icon} {decisao.resultado}
                            </span>
                          )}
                        </div>

                        {/* Ementa / headline */}
                        <div
                          className="text-sm text-gray-700 leading-relaxed line-clamp-3 mb-2"
                          dangerouslySetInnerHTML={{
                            __html: decisao.headline || decisao.ementa?.slice(0, 300) || ''
                          }}
                        />

                        {/* Meta */}
                        <div className="flex flex-wrap gap-3 text-xs text-gray-400">
                          {decisao.relator && (
                            <span className="flex items-center gap-1">
                              <User className="w-3 h-3" /> {decisao.relator}
                            </span>
                          )}
                          {decisao.orgao_julgador && (
                            <span className="flex items-center gap-1">
                              <Hash className="w-3 h-3" /> {decisao.orgao_julgador}
                            </span>
                          )}
                          {decisao.temas?.slice(0, 3).map(t => (
                            <button
                              key={t}
                              onClick={() => { setFiltros(prev => ({ ...prev, tema: t })); setPagina(1); buscar(query, { ...filtros, tema: t }, 1) }}
                              className="bg-gray-100 hover:bg-emerald-100 hover:text-emerald-700 px-2 py-0.5 rounded-full transition-colors"
                            >
                              {t}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div className="flex flex-col gap-2 flex-shrink-0">
                        <Link
                          href={`/jurisprudencia/${decisao.id}`}
                          className="flex items-center gap-1 text-xs text-emerald-600 hover:text-emerald-800 font-medium whitespace-nowrap"
                        >
                          Ver íntegra <ExternalLink className="w-3 h-3" />
                        </Link>
                        {!modoSelecao && (
                          <button
                            onClick={() => { setModoSelecao(true); setSelecionadas([decisao.id]) }}
                            className="text-xs text-gray-400 hover:text-blue-600 flex items-center gap-1"
                          >
                            <GitCompare className="w-3 h-3" /> Comparar
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )
            })
          )}

          {/* Paginação */}
          {paginacao && paginacao.totalPaginas > 1 && (
            <div className="flex items-center justify-center gap-2 pt-4">
              <button
                onClick={() => mudarPagina(pagina - 1)}
                disabled={pagina === 1}
                className="px-3 py-2 rounded-lg border text-sm disabled:opacity-40 hover:bg-gray-50 disabled:cursor-not-allowed"
              >
                ← Anterior
              </button>
              {Array.from({ length: Math.min(paginacao.totalPaginas, 7) }, (_, i) => {
                const p = i + 1
                return (
                  <button
                    key={p}
                    onClick={() => mudarPagina(p)}
                    className={`w-9 h-9 rounded-lg text-sm font-medium transition-all ${
                      p === pagina ? 'bg-emerald-600 text-white' : 'border hover:bg-gray-50'
                    }`}
                  >
                    {p}
                  </button>
                )
              })}
              {paginacao.totalPaginas > 7 && pagina < paginacao.totalPaginas - 3 && (
                <span className="text-gray-400">...</span>
              )}
              <button
                onClick={() => mudarPagina(pagina + 1)}
                disabled={pagina === paginacao.totalPaginas}
                className="px-3 py-2 rounded-lg border text-sm disabled:opacity-40 hover:bg-gray-50 disabled:cursor-not-allowed"
              >
                Próxima →
              </button>
            </div>
          )}
        </div>
      </main>

      <footer className="border-t bg-white mt-8 py-4">
        <p className="text-center text-sm text-gray-400">
          Jurisprudência TJBA • Seção Cível de Direito Público • 2020–2026 •{' '}
          <span className="font-medium text-emerald-600">@projetoselva</span>
        </p>
      </footer>
    </div>
  )
}

export default function JurisprudenciaPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
      </div>
    }>
      <JurisprudenciaContent />
    </Suspense>
  )
}
