'use client'

import { useState, useEffect, useCallback, useRef, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import {
  Search, Filter, Scale, GitCompare, ChevronDown, ChevronUp,
  X, ExternalLink, AlertTriangle, Calendar, User, Hash,
  Loader2, Copy, BookOpen, RefreshCw, SlidersHorizontal,
  HelpCircle, CheckCircle, XCircle, MinusCircle
} from 'lucide-react'

const RESULTADOS = ['DEFERIDO', 'INDEFERIDO', 'PARCIALMENTE DEFERIDO', 'EXTINTO', 'NÃO CONHECIDO', 'PROVIDO', 'NÃO PROVIDO']
const ANOS = Array.from({ length: 7 }, (_, i) => 2020 + i)

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
  const [buscarEmenta, setBuscarEmenta] = useState(true)
  const [buscarInteiroTeor, setBuscarInteiroTeor] = useState(false)
  const [ordenacao, setOrdenacao] = useState('relevancia')
  const [mostrarAvancado, setMostrarAvancado] = useState(false)

  const [secoes, setSecoes] = useState({ data: true, orgao: true, relator: true, resultado: true })
  const [pagina, setPagina] = useState(1)

  const [resultados, setResultados] = useState([])
  const [paginacao, setPaginacao] = useState(null)
  const [carregando, setCarregando] = useState(false)
  const [buscaFeita, setBuscaFeita] = useState(false)
  const [expandidos, setExpandidos] = useState({})

  const inputRef = useRef(null)

  const buscar = useCallback(async (q, f, p) => {
    setCarregando(true)
    setBuscaFeita(true)
    try {
      const params = new URLSearchParams()
      if (q) params.set('q', q)
      if (f.ano) params.set('ano', f.ano)
      if (f.resultado) params.set('resultado', f.resultado)
      if (f.relator) params.set('relator', f.relator)
      if (f.tema) params.set('tema', f.tema)
      params.set('page', p)
      params.set('limit', '10')

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

  useEffect(() => {
    const q = searchParams.get('q')
    if (q) buscar(q, filtros, 1)
  }, []) // eslint-disable-line

  const handleBuscar = (e) => {
    e?.preventDefault()
    setPagina(1)
    buscar(query, filtros, 1)
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
  }

  const mudarPagina = (nova) => {
    setPagina(nova)
    buscar(query, filtros, nova)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const toggleExpandir = (id) => {
    setExpandidos(prev => ({ ...prev, [id]: prev[id] === false ? true : false }))
  }

  const toggleSecao = (key) => {
    setSecoes(prev => ({ ...prev, [key]: !prev[key] }))
  }

  const filtrosAtivos = Object.values(filtros).some(v => v !== '')

  const badgeResultado = (resultado) => {
    if (!resultado) return null
    const r = resultado.toUpperCase()
    if (r.includes('DEFERIDO') && !r.includes('IN') && !r.includes('PARCIAL'))
      return 'bg-emerald-900/60 text-emerald-300 border border-emerald-700'
    if (r.includes('INDEFERIDO') || r === 'NÃO PROVIDO')
      return 'bg-red-900/60 text-red-300 border border-red-700'
    if (r.includes('PARCIAL') || r === 'PROVIDO')
      return 'bg-amber-900/60 text-amber-300 border border-amber-700'
    return 'bg-gray-800 text-gray-300 border border-gray-600'
  }

  return (
    <div className="min-h-screen bg-[#0b1520] text-gray-100 flex flex-col">
      {/* Estilos para highlights da busca */}
      <style>{`
        .ementa-highlight b, .ementa-highlight strong { color: #fb923c; font-weight: 600; }
        .ementa-highlight mark { background: #92400e; color: #fed7aa; border-radius: 2px; padding: 0 2px; font-style: normal; }
      `}</style>

      {/* Header */}
      <header className="bg-[#0d1f33] border-b border-[#1e3a5f] sticky top-0 z-40">
        <div className="px-4 py-2.5 flex items-center justify-between gap-4">
          <Link href="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity flex-shrink-0">
            <div className="w-8 h-8 bg-blue-600/20 border border-blue-500/30 rounded-full flex items-center justify-center">
              <Scale className="w-4 h-4 text-blue-400" />
            </div>
            <span className="text-white font-bold text-sm hidden sm:block">PMBA</span>
          </Link>

          <div className="text-center">
            <h1 className="text-white font-semibold text-sm sm:text-base leading-tight">
              Busca de Jurisprudência
            </h1>
            <p className="text-gray-400 text-[10px] sm:text-xs hidden sm:block">
              TJBA • Mandados de Segurança • PMBA • 2020–2026
            </p>
          </div>

          <div className="flex items-center gap-1.5 flex-shrink-0">
            <Link
              href="/jurisprudencia/comparar?modo=conflitos"
              className="p-1.5 text-gray-400 hover:text-orange-400 rounded transition-colors"
              title="Conflitos de jurisprudência"
            >
              <AlertTriangle className="w-4 h-4" />
            </Link>
            <button className="p-1.5 text-gray-400 hover:text-white rounded transition-colors" title="Ajuda">
              <HelpCircle className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Barra de busca */}
      <div className="bg-[#0d1f33] border-b border-[#1e3a5f] px-4 py-3">
        <form onSubmit={handleBuscar}>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={e => setQuery(e.target.value)}
                placeholder="Buscar por termos, legislação, assunto..."
                className="w-full pl-9 pr-9 py-2 bg-[#152236] border border-[#2a4a6b] rounded text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition-colors"
              />
              {query && (
                <button
                  type="button"
                  onClick={() => setQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
            <button
              type="submit"
              className="bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white px-5 py-2 rounded text-sm font-medium transition-colors flex items-center gap-2 flex-shrink-0"
            >
              {carregando ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
              <span className="hidden sm:inline">Buscar</span>
            </button>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-2 mt-2">
            <div className="flex items-center gap-4 text-xs text-gray-400">
              <span>Buscar em:</span>
              <label className="flex items-center gap-1.5 cursor-pointer hover:text-gray-200 transition-colors">
                <input
                  type="checkbox"
                  checked={buscarEmenta}
                  onChange={e => setBuscarEmenta(e.target.checked)}
                  className="w-3.5 h-3.5 accent-blue-500"
                />
                Ementa
              </label>
              <label className="flex items-center gap-1.5 cursor-pointer hover:text-gray-200 transition-colors">
                <input
                  type="checkbox"
                  checked={buscarInteiroTeor}
                  onChange={e => setBuscarInteiroTeor(e.target.checked)}
                  className="w-3.5 h-3.5 accent-blue-500"
                />
                Inteiro Teor
              </label>
            </div>

            <div className="flex items-center gap-2 text-xs text-gray-400">
              <SlidersHorizontal className="w-3.5 h-3.5" />
              <span>Ordenar:</span>
              <select
                value={ordenacao}
                onChange={e => setOrdenacao(e.target.value)}
                className="bg-[#152236] border border-[#2a4a6b] rounded px-2 py-1 text-xs text-gray-300 focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                <option value="relevancia">Relevância</option>
                <option value="data_desc">Mais recente</option>
                <option value="data_asc">Mais antiga</option>
              </select>
              <button
                type="button"
                onClick={() => setMostrarAvancado(!mostrarAvancado)}
                className="flex items-center gap-1 border border-[#2a4a6b] rounded px-2 py-1 text-gray-400 hover:text-gray-200 hover:border-[#3a6a9b] transition-colors"
              >
                + Avançado
                {mostrarAvancado ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
              </button>
            </div>
          </div>

          {/* Busca avançada */}
          {mostrarAvancado && (
            <div className="mt-2 pt-2 border-t border-[#1e3a5f] grid grid-cols-2 sm:grid-cols-4 gap-2">
              <div>
                <label className="text-[10px] text-gray-500 uppercase tracking-wider block mb-1">Tema</label>
                <input
                  type="text"
                  value={filtros.tema}
                  onChange={e => setFiltros(prev => ({ ...prev, tema: e.target.value }))}
                  placeholder="Ex: PROMOÇÃO, PUNIÇÃO..."
                  className="w-full bg-[#152236] border border-[#2a4a6b] rounded px-2 py-1.5 text-xs text-gray-200 placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
            </div>
          )}
        </form>
      </div>

      {/* Layout principal */}
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar de filtros */}
        <aside className="w-56 lg:w-64 shrink-0 border-r border-[#1e3a5f] bg-[#0b1520] p-3 flex flex-col gap-3 overflow-y-auto hidden md:flex">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-blue-400 text-sm font-medium">
              <Filter className="w-3.5 h-3.5" />
              Filtrar Resultados
            </div>
            {filtrosAtivos && (
              <button
                onClick={limparFiltros}
                className="flex items-center gap-1 text-xs text-gray-500 hover:text-gray-200 transition-colors"
              >
                <RefreshCw className="w-3 h-3" /> Limpar
              </button>
            )}
          </div>

          {/* Data de Publicação */}
          <div className="border border-[#1e3a5f] rounded-lg overflow-hidden">
            <button
              onClick={() => toggleSecao('data')}
              className="w-full flex items-center justify-between px-3 py-2 bg-[#0f1f30] text-xs font-medium text-gray-200 hover:bg-[#152236] transition-colors"
            >
              <span>Data de Julgamento</span>
              {secoes.data ? <ChevronUp className="w-3.5 h-3.5 text-gray-500" /> : <ChevronDown className="w-3.5 h-3.5 text-gray-500" />}
            </button>
            {secoes.data && (
              <div className="px-3 py-2.5 bg-[#0b1520]">
                <select
                  value={filtros.ano}
                  onChange={e => setFiltros(prev => ({ ...prev, ano: e.target.value }))}
                  className="w-full bg-[#152236] border border-[#2a4a6b] rounded px-2 py-1.5 text-xs text-gray-200 focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                  <option value="">Todos os anos</option>
                  {ANOS.map(a => <option key={a} value={a}>{a}</option>)}
                </select>
              </div>
            )}
          </div>

          {/* Relator */}
          <div className="border border-[#1e3a5f] rounded-lg overflow-hidden">
            <button
              onClick={() => toggleSecao('relator')}
              className="w-full flex items-center justify-between px-3 py-2 bg-[#0f1f30] text-xs font-medium text-gray-200 hover:bg-[#152236] transition-colors"
            >
              <span>Relator</span>
              {secoes.relator ? <ChevronUp className="w-3.5 h-3.5 text-gray-500" /> : <ChevronDown className="w-3.5 h-3.5 text-gray-500" />}
            </button>
            {secoes.relator && (
              <div className="px-3 py-2.5 bg-[#0b1520]">
                <input
                  type="text"
                  value={filtros.relator}
                  onChange={e => setFiltros(prev => ({ ...prev, relator: e.target.value }))}
                  placeholder="Filtrar por relator..."
                  className="w-full bg-[#152236] border border-[#2a4a6b] rounded px-2 py-1.5 text-xs text-gray-200 placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
            )}
          </div>

          {/* Resultado */}
          <div className="border border-[#1e3a5f] rounded-lg overflow-hidden">
            <button
              onClick={() => toggleSecao('resultado')}
              className="w-full flex items-center justify-between px-3 py-2 bg-[#0f1f30] text-xs font-medium text-gray-200 hover:bg-[#152236] transition-colors"
            >
              <span>Resultado</span>
              {secoes.resultado ? <ChevronUp className="w-3.5 h-3.5 text-gray-500" /> : <ChevronDown className="w-3.5 h-3.5 text-gray-500" />}
            </button>
            {secoes.resultado && (
              <div className="px-3 py-2.5 bg-[#0b1520] space-y-1.5">
                {RESULTADOS.map(r => (
                  <label key={r} className="flex items-center gap-2 cursor-pointer text-xs text-gray-400 hover:text-gray-200 transition-colors py-0.5">
                    <input
                      type="radio"
                      name="resultado"
                      checked={filtros.resultado === r}
                      onChange={() => setFiltros(prev => ({ ...prev, resultado: r }))}
                      className="w-3 h-3 accent-blue-500"
                    />
                    {r}
                  </label>
                ))}
                {filtros.resultado && (
                  <button
                    onClick={() => setFiltros(prev => ({ ...prev, resultado: '' }))}
                    className="text-xs text-blue-400 hover:text-blue-300 mt-1"
                  >
                    Limpar seleção
                  </button>
                )}
              </div>
            )}
          </div>

          <button
            onClick={handleBuscar}
            className="w-full bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white py-2 rounded text-xs font-medium transition-colors"
          >
            Aplicar Filtros
          </button>

          {/* Comparar */}
          <div className="mt-auto pt-3 border-t border-[#1e3a5f]">
            <Link
              href="/jurisprudencia/comparar?modo=conflitos"
              className="flex items-center gap-2 text-xs text-orange-400 hover:text-orange-300 transition-colors"
            >
              <AlertTriangle className="w-3.5 h-3.5" />
              Ver conflitos de jurisprudência
            </Link>
          </div>
        </aside>

        {/* Área de resultados */}
        <main className="flex-1 p-4 overflow-y-auto min-w-0">
          {!buscaFeita ? (
            /* Estado inicial */
            <div className="flex flex-col items-center justify-center py-16 text-center max-w-2xl mx-auto">
              <div className="w-20 h-20 rounded-full bg-[#0f1f30] border border-[#2a4a6b] flex items-center justify-center mb-6">
                <Search className="w-8 h-8 text-blue-400" />
              </div>
              <h2 className="text-xl font-semibold text-white mb-2">
                Pesquise na base de jurisprudência
              </h2>
              <p className="text-gray-400 text-sm mb-8 max-w-md">
                Pesquise decisões, acórdãos e jurisprudência do Tribunal de Justiça da Bahia relacionados à PMBA.
              </p>
              <div className="text-left text-xs text-gray-400 space-y-2 bg-[#0f1f30] border border-[#1e3a5f] rounded-lg p-5 w-full">
                <p className="font-medium text-gray-300 mb-3 text-sm">Dicas de busca:</p>
                <p>• Use aspas para busca exata: <span className="text-blue-300">"punição disciplinar"</span></p>
                <p>• Combine termos com OR: <span className="text-blue-300">promoção OR transferência</span></p>
                <p>• Exclua termos com traço: <span className="text-blue-300">promoção -cargo</span></p>
                <p>• Busque por número de processo: <span className="text-blue-300">"8029027-03.2025.8.05.0000"</span></p>
                <p>• Use os filtros na lateral para refinar por ano, relator ou resultado</p>
              </div>
            </div>
          ) : carregando ? (
            <div className="flex flex-col items-center justify-center py-20 text-gray-400">
              <Loader2 className="w-8 h-8 animate-spin mb-3 text-blue-400" />
              <span className="text-sm">Buscando decisões...</span>
            </div>
          ) : (
            <>
              {/* Cabeçalho dos resultados */}
              {paginacao && (
                <div className="flex flex-wrap items-center justify-between gap-2 mb-4 text-sm text-gray-400">
                  <span>
                    {paginacao.total === 0
                      ? 'Nenhum resultado encontrado'
                      : `Mostrando ${(pagina - 1) * 10 + 1}–${Math.min(pagina * 10, paginacao.total)} de ${paginacao.total} resultado${paginacao.total !== 1 ? 's' : ''}`}
                    {query && <span className="text-gray-500"> para <span className="text-gray-300">"{query}"</span></span>}
                  </span>

                  {paginacao.totalPaginas > 1 && (
                    <div className="flex items-center gap-2 text-xs">
                      <button
                        onClick={() => mudarPagina(pagina - 1)}
                        disabled={pagina === 1}
                        className="px-2.5 py-1.5 rounded border border-[#2a4a6b] disabled:opacity-40 hover:bg-[#152236] disabled:cursor-not-allowed transition-colors"
                      >
                        ‹ Anterior
                      </button>
                      <span className="px-2 text-gray-500">
                        Página {pagina} de {paginacao.totalPaginas}
                      </span>
                      <button
                        onClick={() => mudarPagina(pagina + 1)}
                        disabled={pagina === paginacao.totalPaginas}
                        className="px-2.5 py-1.5 rounded border border-[#2a4a6b] disabled:opacity-40 hover:bg-[#152236] disabled:cursor-not-allowed transition-colors"
                      >
                        Próxima ›
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* Cards de resultado */}
              <div className="space-y-3">
                {resultados.length === 0 ? (
                  <div className="bg-[#0f1f30] border border-[#1e3a5f] rounded-lg p-12 text-center">
                    <Scale className="w-12 h-12 text-gray-700 mx-auto mb-3" />
                    <h3 className="text-gray-300 font-medium mb-1">Nenhuma decisão encontrada</h3>
                    <p className="text-gray-500 text-sm">Tente outros termos ou remova os filtros</p>
                    {(query || filtrosAtivos) && (
                      <button
                        onClick={() => { setQuery(''); limparFiltros(); setBuscaFeita(false) }}
                        className="mt-4 text-blue-400 hover:text-blue-300 text-sm"
                      >
                        Limpar busca e filtros
                      </button>
                    )}
                  </div>
                ) : (
                  resultados.map((decisao, idx) => {
                    const isExpanded = expandidos[decisao.id] !== false
                    const num = (pagina - 1) * 10 + idx + 1
                    const badge = badgeResultado(decisao.resultado)

                    return (
                      <div key={decisao.id} className="border border-[#2a4a6b] rounded-lg overflow-hidden hover:border-[#3a6a9b] transition-colors">
                        {/* Cabeçalho do card */}
                        <div className="bg-[#152236] px-3 py-2 flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2 min-w-0 flex-1">
                            <button
                              onClick={() => toggleExpandir(decisao.id)}
                              className="text-gray-500 hover:text-gray-200 transition-colors flex-shrink-0"
                              title={isExpanded ? 'Recolher' : 'Expandir'}
                            >
                              {isExpanded
                                ? <ChevronUp className="w-4 h-4" />
                                : <ChevronDown className="w-4 h-4" />}
                            </button>
                            <span className="text-gray-500 text-xs flex-shrink-0">#{num}</span>
                            <span className="text-white text-sm font-medium truncate">
                              Mandado de Segurança {decisao.numero_processo || '—'}
                            </span>
                          </div>
                          <div className="flex items-center gap-1 flex-shrink-0">
                            {decisao.numero_processo && (
                              <button
                                onClick={() => navigator.clipboard?.writeText(decisao.numero_processo)}
                                className="p-1 text-gray-500 hover:text-gray-200 transition-colors"
                                title="Copiar número"
                              >
                                <Copy className="w-3.5 h-3.5" />
                              </button>
                            )}
                            <Link
                              href={`/jurisprudencia/${decisao.id}`}
                              className="p-1 text-gray-500 hover:text-blue-400 transition-colors"
                              title="Ver decisão completa"
                            >
                              <ExternalLink className="w-3.5 h-3.5" />
                            </Link>
                            <button
                              onClick={() => setExpandidos(prev => ({ ...prev, [decisao.id]: false }))}
                              className="p-1 text-gray-500 hover:text-gray-200 transition-colors"
                              title="Recolher"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>

                        {/* Corpo do card */}
                        {isExpanded && (
                          <div className="bg-[#0b1520] border-t border-[#1e3a5f] p-4">
                            {/* Metadados */}
                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-4 pb-3 border-b border-[#1e3a5f]">
                              <div>
                                <div className="text-[10px] font-semibold text-gray-600 uppercase tracking-wider mb-0.5 flex items-center gap-1">
                                  <User className="w-3 h-3" /> Relator
                                </div>
                                <div className="text-xs text-gray-200">{decisao.relator || '—'}</div>
                              </div>
                              <div>
                                <div className="text-[10px] font-semibold text-gray-600 uppercase tracking-wider mb-0.5 flex items-center gap-1">
                                  <Hash className="w-3 h-3" /> Órgão Julgador
                                </div>
                                <div className="text-xs text-gray-200">{decisao.orgao_julgador || '—'}</div>
                              </div>
                              <div>
                                <div className="text-[10px] font-semibold text-gray-600 uppercase tracking-wider mb-0.5 flex items-center gap-1">
                                  <Calendar className="w-3 h-3" /> Data de Julgamento
                                </div>
                                <div className="text-xs text-blue-400">
                                  {decisao.data_julgamento
                                    ? new Date(decisao.data_julgamento).toLocaleDateString('pt-BR')
                                    : '—'}
                                </div>
                              </div>
                            </div>

                            {/* Badge resultado */}
                            {decisao.resultado && badge && (
                              <div className="mb-3">
                                <span className={`inline-flex items-center text-xs font-semibold px-2.5 py-1 rounded ${badge}`}>
                                  {decisao.resultado}
                                </span>
                              </div>
                            )}

                            {/* Ementa */}
                            <div>
                              <div className="text-[10px] font-semibold text-gray-600 uppercase tracking-wider mb-2">
                                Ementa
                              </div>
                              <div
                                className="text-sm text-gray-300 leading-relaxed ementa-highlight"
                                dangerouslySetInnerHTML={{
                                  __html: decisao.headline || decisao.ementa?.slice(0, 800) || ''
                                }}
                              />
                            </div>

                            {/* Temas */}
                            {decisao.temas?.length > 0 && (
                              <div className="flex flex-wrap gap-1.5 mt-3">
                                {decisao.temas.slice(0, 5).map(t => (
                                  <button
                                    key={t}
                                    onClick={() => {
                                      setFiltros(prev => ({ ...prev, tema: t }))
                                      buscar(query, { ...filtros, tema: t }, 1)
                                    }}
                                    className="text-[11px] bg-[#152236] hover:bg-[#1e3a5f] text-blue-400 border border-[#2a4a6b] px-2 py-0.5 rounded-full transition-colors"
                                  >
                                    {t}
                                  </button>
                                ))}
                              </div>
                            )}

                            {/* Link íntegra */}
                            <div className="mt-3 pt-3 border-t border-[#1e3a5f] flex items-center justify-between">
                              <Link
                                href={`/jurisprudencia/${decisao.id}`}
                                className="inline-flex items-center gap-1.5 text-xs text-blue-400 hover:text-blue-300 transition-colors"
                              >
                                <BookOpen className="w-3.5 h-3.5" />
                                Ver decisão completa
                                <ExternalLink className="w-3 h-3" />
                              </Link>
                              <span className="text-xs text-gray-600">#{decisao.id}</span>
                            </div>
                          </div>
                        )}
                      </div>
                    )
                  })
                )}
              </div>

              {/* Paginação inferior */}
              {paginacao && paginacao.totalPaginas > 1 && (
                <div className="flex items-center justify-center gap-2 pt-6">
                  <button
                    onClick={() => mudarPagina(pagina - 1)}
                    disabled={pagina === 1}
                    className="px-3 py-1.5 rounded border border-[#2a4a6b] text-sm text-gray-300 disabled:opacity-40 hover:bg-[#152236] disabled:cursor-not-allowed transition-colors"
                  >
                    ← Anterior
                  </button>
                  {Array.from({ length: Math.min(paginacao.totalPaginas, 7) }, (_, i) => {
                    const p = i + 1
                    return (
                      <button
                        key={p}
                        onClick={() => mudarPagina(p)}
                        className={`w-9 h-9 rounded text-sm font-medium transition-colors ${
                          p === pagina
                            ? 'bg-blue-600 text-white'
                            : 'border border-[#2a4a6b] hover:bg-[#152236] text-gray-300'
                        }`}
                      >
                        {p}
                      </button>
                    )
                  })}
                  {paginacao.totalPaginas > 7 && <span className="text-gray-600">...</span>}
                  <button
                    onClick={() => mudarPagina(pagina + 1)}
                    disabled={pagina === paginacao.totalPaginas}
                    className="px-3 py-1.5 rounded border border-[#2a4a6b] text-sm text-gray-300 disabled:opacity-40 hover:bg-[#152236] disabled:cursor-not-allowed transition-colors"
                  >
                    Próxima →
                  </button>
                </div>
              )}
            </>
          )}
        </main>
      </div>

      {/* Footer */}
      <footer className="bg-[#0d1f33] border-t border-[#1e3a5f] mt-auto">
        <div className="max-w-5xl mx-auto px-6 py-5 grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <h3 className="text-xs font-semibold text-gray-300 mb-2 uppercase tracking-wider">Sobre</h3>
            <p className="text-xs text-gray-500">
              Ferramenta de pesquisa de jurisprudência do TJBA relacionada à PMBA. Projeto pessoal sem fins comerciais.
            </p>
          </div>
          <div>
            <h3 className="text-xs font-semibold text-gray-300 mb-2 uppercase tracking-wider">Links Úteis</h3>
            <div className="space-y-1 text-xs">
              <a href="https://www.tjba.jus.br" target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-blue-400 hover:text-blue-300 transition-colors">
                Portal TJBA <ExternalLink className="w-2.5 h-2.5" />
              </a>
              <a href="https://esaj.tjba.jus.br/jurisprudencia/pesquisar.do" target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-blue-400 hover:text-blue-300 transition-colors">
                Jurisprudência TJBA <ExternalLink className="w-2.5 h-2.5" />
              </a>
            </div>
          </div>
          <div className="sm:text-right">
            <h3 className="text-xs font-semibold text-gray-300 mb-2 uppercase tracking-wider">Desenvolvido por</h3>
            <p className="text-xs text-gray-500">@projetoselva</p>
          </div>
        </div>
        <div className="border-t border-[#1e3a5f] py-3 text-center text-xs text-gray-600">
          Não é uma ferramenta oficial do TJBA • © 2026 ProjetoSelva
        </div>
      </footer>
    </div>
  )
}

export default function JurisprudenciaPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#0b1520] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-400" />
      </div>
    }>
      <JurisprudenciaContent />
    </Suspense>
  )
}
