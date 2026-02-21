'use client'

import { useState, useEffect, useCallback, useRef, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import {
  Search, Filter, Scale, ChevronDown, ChevronUp,
  X, ExternalLink, AlertTriangle, Calendar, User, Hash,
  Loader2, Copy, BookOpen, RefreshCw, SlidersHorizontal, HelpCircle
} from 'lucide-react'

const RESULTADOS = [
  'DEFERIDO', 'INDEFERIDO', 'PARCIALMENTE DEFERIDO',
  'EXTINTO', 'NÃO CONHECIDO', 'PROVIDO', 'NÃO PROVIDO'
]
const ANOS = Array.from({ length: 7 }, (_, i) => 2020 + i)

function badgeClass(resultado) {
  if (!resultado) return null
  const r = resultado.toUpperCase()
  if (r.includes('DEFERIDO') && !r.includes('IN') && !r.includes('PARCIAL'))
    return 'bg-green-900/50 text-green-300 border border-green-700/60'
  if (r.includes('INDEFERIDO') || r === 'NÃO PROVIDO')
    return 'bg-red-900/50 text-red-300 border border-red-700/60'
  if (r.includes('PARCIAL') || r === 'PROVIDO')
    return 'bg-amber-900/50 text-amber-300 border border-amber-700/60'
  return 'bg-secondary text-muted-foreground border border-border'
}

function JurisprudenciaContent() {
  const router = useRouter()
  const searchParams = useSearchParams()

  const [query, setQuery]   = useState(searchParams.get('q') || '')
  const [filtros, setFiltros] = useState({
    ano:       searchParams.get('ano') || '',
    resultado: searchParams.get('resultado') || '',
    relator:   searchParams.get('relator') || '',
    tema:      searchParams.get('tema') || '',
  })
  const [buscarEmenta,      setBuscarEmenta]      = useState(true)
  const [buscarInteiroTeor, setBuscarInteiroTeor] = useState(false)
  const [ordenacao,         setOrdenacao]         = useState('relevancia')
  const [mostrarAvancado,   setMostrarAvancado]   = useState(false)

  const [secoes, setSecoes] = useState({ data: true, orgao: true, relator: true, classe: true })
  const [dataInicio, setDataInicio] = useState('')
  const [dataFim,    setDataFim]    = useState('')
  const [pagina, setPagina] = useState(1)

  const [resultados,   setResultados]   = useState([])
  const [paginacao,    setPaginacao]    = useState(null)
  const [carregando,   setCarregando]   = useState(false)
  const [buscaFeita,   setBuscaFeita]   = useState(false)
  const [expandidos,   setExpandidos]   = useState({})

  const inputRef = useRef(null)

  const buscar = useCallback(async (q, f, p) => {
    setCarregando(true)
    setBuscaFeita(true)
    try {
      const params = new URLSearchParams()
      if (q)         params.set('q',         q)
      if (f.ano)     params.set('ano',       f.ano)
      if (f.resultado) params.set('resultado', f.resultado)
      if (f.relator) params.set('relator',   f.relator)
      if (f.tema)    params.set('tema',      f.tema)
      params.set('page',  p)
      params.set('limit', '10')

      const res  = await fetch(`/api/jurisprudencia/search?${params}`)
      const data = await res.json()
      setResultados(data.resultados || [])
      setPaginacao(data.paginacao   || null)
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
    if (query)          params.set('q',         query)
    if (filtros.ano)    params.set('ano',       filtros.ano)
    if (filtros.resultado) params.set('resultado', filtros.resultado)
    if (filtros.relator) params.set('relator',  filtros.relator)
    if (filtros.tema)   params.set('tema',      filtros.tema)
    router.replace(`/jurisprudencia?${params}`, { scroll: false })
  }

  const limparFiltros = () => setFiltros({ ano: '', resultado: '', relator: '', tema: '' })

  const mudarPagina = (nova) => {
    setPagina(nova)
    buscar(query, filtros, nova)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const toggleExpandir = (id) =>
    setExpandidos(prev => ({ ...prev, [id]: prev[id] === false ? true : false }))

  const toggleSecao = (key) =>
    setSecoes(prev => ({ ...prev, [key]: !prev[key] }))

  const filtrosAtivos = Object.values(filtros).some(v => v !== '')

  return (
    /* dark wrapper → activa as CSS vars escuras em toda a página */
    <div className="dark">
      <style>{`
        /* highlight de termos da busca */
        .ementa-hl b, .ementa-hl strong { color: #fb923c; font-weight: 600; }
        .ementa-hl mark {
          background: rgba(251,146,60,.15);
          color: #fb923c;
          border-radius: 2px;
          padding: 0 2px;
          font-style: normal;
        }
      `}</style>

      <div className="min-h-screen bg-background text-foreground flex flex-col">

        {/* ── Header ─────────────────────────────────────────── */}
        <header className="bg-secondary border-b border-border sticky top-0 z-40">
          <div className="px-4 py-2.5 flex items-center justify-between gap-4">

            <Link href="/" className="flex items-center gap-2 opacity-80 hover:opacity-100 transition-opacity flex-shrink-0">
              <div className="w-8 h-8 rounded-full bg-primary/20 border border-primary/30 flex items-center justify-center">
                <Scale className="w-4 h-4 text-primary" />
              </div>
              <span className="font-bold text-sm text-foreground hidden sm:block">PMBA</span>
            </Link>

            <div className="text-center">
              <h1 className="font-semibold text-sm sm:text-base text-foreground leading-tight">
                Busca de Jurisprudência
              </h1>
              <p className="text-[10px] sm:text-xs text-muted-foreground hidden sm:block">
                TJBA • Mandados de Segurança • PMBA • 2020–2026
              </p>
            </div>

            <div className="flex items-center gap-1 flex-shrink-0">
              <Link
                href="/jurisprudencia/comparar?modo=conflitos"
                className="p-1.5 text-muted-foreground hover:text-amber-400 rounded transition-colors"
                title="Conflitos de jurisprudência"
              >
                <AlertTriangle className="w-4 h-4" />
              </Link>
              <button className="p-1.5 text-muted-foreground hover:text-foreground rounded transition-colors" title="Ajuda">
                <HelpCircle className="w-4 h-4" />
              </button>
            </div>
          </div>
        </header>

        {/* ── Barra de busca ─────────────────────────────────── */}
        <div className="bg-secondary border-b border-border px-4 py-3">
          <form onSubmit={handleBuscar}>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                <input
                  ref={inputRef}
                  type="text"
                  value={query}
                  onChange={e => setQuery(e.target.value)}
                  placeholder="Buscar por termos, legislação, assunto..."
                  className="w-full pl-9 pr-9 py-2 bg-background border border-input rounded text-sm text-foreground placeholder-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring focus:border-ring transition-colors"
                />
                {query && (
                  <button
                    type="button"
                    onClick={() => setQuery('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
              <button
                type="submit"
                className="bg-primary hover:bg-primary/90 text-primary-foreground px-5 py-2 rounded text-sm font-medium transition-colors flex items-center gap-2 flex-shrink-0"
              >
                {carregando
                  ? <Loader2 className="w-4 h-4 animate-spin" />
                  : <Search className="w-4 h-4" />}
                <span className="hidden sm:inline">Buscar</span>
              </button>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-2 mt-2">
              {/* Checkboxes buscar em */}
              <div className="flex items-center gap-4 text-xs text-muted-foreground">
                <span>Buscar em:</span>
                <label className="flex items-center gap-1.5 cursor-pointer hover:text-foreground transition-colors">
                  <input
                    type="checkbox"
                    checked={buscarEmenta}
                    onChange={e => setBuscarEmenta(e.target.checked)}
                    className="w-3.5 h-3.5 accent-primary"
                  />
                  Ementa
                </label>
                <label className="flex items-center gap-1.5 cursor-pointer hover:text-foreground transition-colors">
                  <input
                    type="checkbox"
                    checked={buscarInteiroTeor}
                    onChange={e => setBuscarInteiroTeor(e.target.checked)}
                    className="w-3.5 h-3.5 accent-primary"
                  />
                  Inteiro Teor
                </label>
              </div>

              {/* Ordenação + avançado */}
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <SlidersHorizontal className="w-3.5 h-3.5" />
                <span>Ordenar:</span>
                <select
                  value={ordenacao}
                  onChange={e => setOrdenacao(e.target.value)}
                  className="bg-background border border-input rounded px-2 py-1 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
                >
                  <option value="relevancia">Relevância</option>
                  <option value="data_desc">Mais recente</option>
                  <option value="data_asc">Mais antiga</option>
                </select>
                <button
                  type="button"
                  onClick={() => setMostrarAvancado(!mostrarAvancado)}
                  className="flex items-center gap-1 border border-border rounded px-2 py-1 text-muted-foreground hover:text-foreground hover:border-ring transition-colors"
                >
                  + Avançado
                  {mostrarAvancado ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                </button>
              </div>
            </div>

            {/* Busca avançada */}
            {mostrarAvancado && (
              <div className="mt-2 pt-2 border-t border-border grid grid-cols-2 sm:grid-cols-4 gap-2">
                <div>
                  <label className="text-[10px] text-muted-foreground uppercase tracking-wider block mb-1">Tema</label>
                  <input
                    type="text"
                    value={filtros.tema}
                    onChange={e => setFiltros(prev => ({ ...prev, tema: e.target.value }))}
                    placeholder="Ex: PROMOÇÃO, PUNIÇÃO..."
                    className="w-full bg-background border border-input rounded px-2 py-1.5 text-xs text-foreground placeholder-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
                  />
                </div>
              </div>
            )}
          </form>
        </div>

        {/* ── Layout principal ───────────────────────────────── */}
        <div className="flex flex-1">

          {/* Sidebar de filtros */}
          <aside className="w-56 lg:w-64 shrink-0 border-r border-border bg-background p-3 flex-col gap-3 hidden md:flex">

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-primary text-sm font-medium">
                <Filter className="w-3.5 h-3.5" />
                Filtrar Resultados
              </div>
              {filtrosAtivos && (
                <button
                  onClick={limparFiltros}
                  className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
                >
                  <RefreshCw className="w-3 h-3" /> Limpar
                </button>
              )}
            </div>

            {/* Data de Publicação */}
            <FilterSection
              label="Data de Publicação"
              open={secoes.data}
              onToggle={() => toggleSecao('data')}
            >
              <div className="flex items-center gap-1.5">
                <input
                  type="date"
                  value={dataInicio}
                  onChange={e => setDataInicio(e.target.value)}
                  className="flex-1 min-w-0 bg-secondary border border-border rounded px-2 py-1.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
                />
                <span className="text-xs text-muted-foreground flex-shrink-0">a</span>
                <input
                  type="date"
                  value={dataFim}
                  onChange={e => setDataFim(e.target.value)}
                  className="flex-1 min-w-0 bg-secondary border border-border rounded px-2 py-1.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
                />
              </div>
              <div className="mt-2">
                <select
                  value={filtros.ano}
                  onChange={e => setFiltros(prev => ({ ...prev, ano: e.target.value }))}
                  className="w-full bg-secondary border border-border rounded px-2 py-1.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
                >
                  <option value="">Ou filtrar por ano</option>
                  {ANOS.map(a => <option key={a} value={a}>{a}</option>)}
                </select>
              </div>
            </FilterSection>

            {/* Órgão Julgador */}
            <FilterSection
              label="Órgão Julgador"
              open={secoes.orgao}
              onToggle={() => toggleSecao('orgao')}
            >
              <p className="text-xs text-muted-foreground italic">
                {buscaFeita && resultados.length > 0
                  ? resultados
                      .map(d => d.orgao_julgador)
                      .filter(Boolean)
                      .filter((v, i, a) => a.indexOf(v) === i)
                      .slice(0, 5)
                      .map(o => (
                        <button
                          key={o}
                          onClick={() => { setFiltros(prev => ({ ...prev })); buscar(query, filtros, 1) }}
                          className="block w-full text-left text-xs text-muted-foreground hover:text-foreground py-0.5 transition-colors"
                        >
                          {o}
                        </button>
                      ))
                  : 'Faça uma busca para ver opções'}
              </p>
            </FilterSection>

            {/* Relator */}
            <FilterSection
              label="Relator"
              open={secoes.relator}
              onToggle={() => toggleSecao('relator')}
            >
              {buscaFeita && resultados.length > 0 ? (
                <input
                  type="text"
                  value={filtros.relator}
                  onChange={e => setFiltros(prev => ({ ...prev, relator: e.target.value }))}
                  placeholder="Filtrar por relator..."
                  className="w-full bg-secondary border border-border rounded px-2 py-1.5 text-xs text-foreground placeholder-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
                />
              ) : (
                <p className="text-xs text-muted-foreground italic">Faça uma busca para ver opções</p>
              )}
            </FilterSection>

            {/* Classe Processual */}
            <FilterSection
              label="Classe Processual"
              open={secoes.classe}
              onToggle={() => toggleSecao('classe')}
            >
              {buscaFeita && resultados.length > 0 ? (
                <div className="space-y-1.5">
                  {RESULTADOS.map(r => (
                    <label key={r} className="flex items-center gap-2 cursor-pointer text-xs text-muted-foreground hover:text-foreground transition-colors py-0.5">
                      <input
                        type="radio"
                        name="resultado"
                        checked={filtros.resultado === r}
                        onChange={() => setFiltros(prev => ({ ...prev, resultado: r }))}
                        className="w-3 h-3 accent-primary"
                      />
                      {r}
                    </label>
                  ))}
                  {filtros.resultado && (
                    <button
                      onClick={() => setFiltros(prev => ({ ...prev, resultado: '' }))}
                      className="text-xs text-primary hover:text-primary/80 mt-1"
                    >
                      Limpar seleção
                    </button>
                  )}
                </div>
              ) : (
                <p className="text-xs text-muted-foreground italic">Faça uma busca para ver opções</p>
              )}
            </FilterSection>

            <button
              onClick={handleBuscar}
              className="w-full bg-primary hover:bg-primary/90 text-primary-foreground py-2 rounded text-xs font-medium transition-colors"
            >
              Aplicar Filtros
            </button>

            <div className="mt-auto pt-3 border-t border-border">
              <Link
                href="/jurisprudencia/comparar?modo=conflitos"
                className="flex items-center gap-2 text-xs text-amber-500 hover:text-amber-400 transition-colors"
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
                <div className="w-20 h-20 rounded-full bg-secondary border border-border flex items-center justify-center mb-6">
                  <Search className="w-8 h-8 text-primary" />
                </div>
                <h2 className="text-xl font-semibold text-foreground mb-2">
                  Pesquise na base de jurisprudência
                </h2>
                <p className="text-sm text-muted-foreground mb-8 max-w-md">
                  Digite termos de busca acima para encontrar decisões, acórdãos e jurisprudência do Tribunal de Justiça da Bahia relacionados à PMBA.
                </p>
                <div className="text-left text-xs text-muted-foreground space-y-2 bg-secondary border border-border rounded-lg p-5 w-full">
                  <p className="font-medium text-foreground mb-3 text-sm">Dicas de busca:</p>
                  <p>• Use aspas para busca exata: <span className="text-primary">"punição disciplinar"</span></p>
                  <p>• Use <span className="text-primary">OR</span> para combinar termos: <span className="text-primary">promoção OR transferência</span></p>
                  <p>• Use <span className="text-primary">-</span> para excluir termos: <span className="text-primary">promoção -cargo</span> (vai mostrar os resultados que contém "promoção" e excluir os que contenham "cargo")</p>
                  <p>• Use <span className="text-primary">( )</span> para agrupar termos: <span className="text-primary">punição -(advertência OR repreensão)</span></p>
                  <p>• Caso queira pesquisar por número de processo no inteiro teor ou ementa, coloque-o entre aspas: <span className="text-primary">"8029027-03.2025.8.05.0000"</span>.</p>
                  <p className="text-muted-foreground/70">Se não colocar aspas, o sistema vai buscar processos com filtro de número de processo.</p>
                </div>
              </div>

            ) : carregando ? (
              <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
                <Loader2 className="w-8 h-8 animate-spin mb-3 text-primary" />
                <span className="text-sm">Buscando decisões...</span>
              </div>

            ) : (
              <>
                {/* Cabeçalho dos resultados + paginação topo */}
                {paginacao && (
                  <div className="flex flex-wrap items-center justify-between gap-2 mb-4 text-sm text-muted-foreground">
                    <span>
                      {paginacao.total === 0
                        ? 'Nenhum resultado encontrado'
                        : `Mostrando ${(pagina - 1) * 10 + 1}–${Math.min(pagina * 10, paginacao.total)} de ${paginacao.total} resultado${paginacao.total !== 1 ? 's' : ''}`}
                      {query && (
                        <span className="text-muted-foreground"> para <span className="text-foreground">"{query}"</span></span>
                      )}
                    </span>

                    {paginacao.totalPaginas > 1 && (
                      <div className="flex items-center gap-2 text-xs">
                        <button
                          onClick={() => mudarPagina(pagina - 1)}
                          disabled={pagina === 1}
                          className="px-2.5 py-1.5 rounded border border-border text-foreground disabled:opacity-40 hover:bg-secondary disabled:cursor-not-allowed transition-colors"
                        >
                          ‹ Anterior
                        </button>
                        <span className="px-2 text-muted-foreground">
                          Página {pagina} de {paginacao.totalPaginas}
                        </span>
                        <button
                          onClick={() => mudarPagina(pagina + 1)}
                          disabled={pagina === paginacao.totalPaginas}
                          className="px-2.5 py-1.5 rounded border border-border text-foreground disabled:opacity-40 hover:bg-secondary disabled:cursor-not-allowed transition-colors"
                        >
                          Próxima ›
                        </button>
                      </div>
                    )}
                  </div>
                )}

                {/* Cards */}
                <div className="space-y-3">
                  {resultados.length === 0 ? (
                    <div className="bg-secondary border border-border rounded-lg p-12 text-center">
                      <Scale className="w-12 h-12 text-muted-foreground/40 mx-auto mb-3" />
                      <h3 className="text-foreground font-medium mb-1">Nenhuma decisão encontrada</h3>
                      <p className="text-muted-foreground text-sm">Tente outros termos ou remova os filtros</p>
                      {(query || filtrosAtivos) && (
                        <button
                          onClick={() => { setQuery(''); limparFiltros(); setBuscaFeita(false) }}
                          className="mt-4 text-primary hover:text-primary/80 text-sm"
                        >
                          Limpar busca e filtros
                        </button>
                      )}
                    </div>
                  ) : (
                    resultados.map((decisao, idx) => {
                      const isExpanded = expandidos[decisao.id] !== false
                      const num = (pagina - 1) * 10 + idx + 1
                      const badge = badgeClass(decisao.resultado)

                      return (
                        <div
                          key={decisao.id}
                          className="border border-border rounded-lg overflow-hidden hover:border-ring/50 transition-colors"
                        >
                          {/* Cabeçalho do card */}
                          <div className="bg-secondary px-3 py-2 flex items-center justify-between gap-2">
                            <div className="flex items-center gap-2 min-w-0 flex-1">
                              <button
                                onClick={() => toggleExpandir(decisao.id)}
                                className="text-muted-foreground hover:text-foreground transition-colors flex-shrink-0"
                                title={isExpanded ? 'Recolher' : 'Expandir'}
                              >
                                {isExpanded
                                  ? <ChevronUp className="w-4 h-4" />
                                  : <ChevronDown className="w-4 h-4" />}
                              </button>
                              <span className="text-muted-foreground text-xs flex-shrink-0">#{num}</span>
                              <span className="text-foreground text-sm font-medium truncate">
                                Mandado de Segurança {decisao.numero_processo || '—'}
                              </span>
                            </div>
                            <div className="flex items-center gap-0.5 flex-shrink-0">
                              {decisao.numero_processo && (
                                <button
                                  onClick={() => navigator.clipboard?.writeText(decisao.numero_processo)}
                                  className="p-1.5 text-muted-foreground hover:text-foreground transition-colors"
                                  title="Copiar número"
                                >
                                  <Copy className="w-3.5 h-3.5" />
                                </button>
                              )}
                              <Link
                                href={`/jurisprudencia/${decisao.id}`}
                                className="p-1.5 text-muted-foreground hover:text-primary transition-colors"
                                title="Ver decisão completa"
                              >
                                <ExternalLink className="w-3.5 h-3.5" />
                              </Link>
                              <button
                                onClick={() => setExpandidos(prev => ({ ...prev, [decisao.id]: false }))}
                                className="p-1.5 text-muted-foreground hover:text-foreground transition-colors"
                                title="Recolher"
                              >
                                <X className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>

                          {/* Corpo do card */}
                          {isExpanded && (
                            <div className="bg-background border-t border-border p-4">
                              {/* Metadados */}
                              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-4 pb-3 border-b border-border">
                                <div>
                                  <div className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-0.5 flex items-center gap-1">
                                    <User className="w-3 h-3" /> Relator
                                  </div>
                                  <div className="text-xs text-foreground">{decisao.relator || '—'}</div>
                                </div>
                                <div>
                                  <div className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-0.5 flex items-center gap-1">
                                    <Hash className="w-3 h-3" /> Órgão Julgador
                                  </div>
                                  <div className="text-xs text-foreground">{decisao.orgao_julgador || '—'}</div>
                                </div>
                                <div>
                                  <div className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-0.5 flex items-center gap-1">
                                    <Calendar className="w-3 h-3" /> Data de Julgamento
                                  </div>
                                  <div className="text-xs text-primary">
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
                                <div className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                                  Ementa
                                </div>
                                <div
                                  className="text-sm text-foreground/90 leading-relaxed ementa-hl"
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
                                      className="text-[11px] bg-secondary hover:bg-accent text-primary border border-border px-2 py-0.5 rounded-full transition-colors"
                                    >
                                      {t}
                                    </button>
                                  ))}
                                </div>
                              )}

                              {/* Link íntegra */}
                              <div className="mt-3 pt-3 border-t border-border flex items-center justify-between">
                                <Link
                                  href={`/jurisprudencia/${decisao.id}`}
                                  className="inline-flex items-center gap-1.5 text-xs text-primary hover:text-primary/80 transition-colors"
                                >
                                  <BookOpen className="w-3.5 h-3.5" />
                                  Ver decisão completa
                                  <ExternalLink className="w-3 h-3" />
                                </Link>
                                <span className="text-xs text-muted-foreground/60">#{decisao.id}</span>
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
                      className="px-3 py-1.5 rounded border border-border text-sm text-foreground disabled:opacity-40 hover:bg-secondary disabled:cursor-not-allowed transition-colors"
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
                              ? 'bg-primary text-primary-foreground'
                              : 'border border-border hover:bg-secondary text-foreground'
                          }`}
                        >
                          {p}
                        </button>
                      )
                    })}
                    {paginacao.totalPaginas > 7 && (
                      <span className="text-muted-foreground">...</span>
                    )}
                    <button
                      onClick={() => mudarPagina(pagina + 1)}
                      disabled={pagina === paginacao.totalPaginas}
                      className="px-3 py-1.5 rounded border border-border text-sm text-foreground disabled:opacity-40 hover:bg-secondary disabled:cursor-not-allowed transition-colors"
                    >
                      Próxima →
                    </button>
                  </div>
                )}
              </>
            )}
          </main>
        </div>

        {/* ── Footer ─────────────────────────────────────────── */}
        <footer className="bg-secondary border-t border-border mt-auto">
          <div className="max-w-5xl mx-auto px-6 py-5 grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <h3 className="text-xs font-semibold text-foreground mb-2 uppercase tracking-wider">Sobre</h3>
              <p className="text-xs text-muted-foreground">
                Ferramenta de pesquisa de jurisprudência do TJBA relacionada à PMBA. Projeto pessoal sem fins comerciais.
              </p>
            </div>
            <div>
              <h3 className="text-xs font-semibold text-foreground mb-2 uppercase tracking-wider">Links Úteis</h3>
              <div className="space-y-1 text-xs">
                <a
                  href="https://www.tjba.jus.br"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 text-primary hover:text-primary/80 transition-colors"
                >
                  Portal TJBA <ExternalLink className="w-2.5 h-2.5" />
                </a>
                <a
                  href="https://esaj.tjba.jus.br/jurisprudencia/pesquisar.do"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 text-primary hover:text-primary/80 transition-colors"
                >
                  Jurisp. TJBA <ExternalLink className="w-2.5 h-2.5" />
                </a>
                <a
                  href="https://scon.stj.jus.br/SCON/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 text-primary hover:text-primary/80 transition-colors"
                >
                  Jurisp. STJ <ExternalLink className="w-2.5 h-2.5" />
                </a>
                <a
                  href="https://jurisprudencia.stf.jus.br/pages/search"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 text-primary hover:text-primary/80 transition-colors"
                >
                  Jurisp. STF <ExternalLink className="w-2.5 h-2.5" />
                </a>
              </div>
            </div>
            <div className="sm:text-right">
              <h3 className="text-xs font-semibold text-foreground mb-2 uppercase tracking-wider">Desenvolvido por</h3>
              <p className="text-xs text-muted-foreground">@projetoselva</p>
            </div>
          </div>
          <div className="border-t border-border py-3 text-center text-xs text-muted-foreground/60">
            Não é uma ferramenta oficial do TJBA • © 2026 ProjetoSelva
          </div>
        </footer>

      </div>
    </div>
  )
}

/* ── Componente auxiliar: seção colapsável ───────────────────── */
function FilterSection({ label, open, onToggle, children }) {
  return (
    <div className="border border-border rounded-lg overflow-hidden">
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between px-3 py-2 bg-secondary text-xs font-medium text-foreground hover:bg-accent transition-colors"
      >
        <span>{label}</span>
        {open
          ? <ChevronUp   className="w-3.5 h-3.5 text-muted-foreground" />
          : <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" />}
      </button>
      {open && (
        <div className="px-3 py-2.5 bg-background">
          {children}
        </div>
      )}
    </div>
  )
}

export default function JurisprudenciaPage() {
  return (
    <Suspense fallback={
      <div className="dark">
        <div className="min-h-screen bg-background flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </div>
    }>
      <JurisprudenciaContent />
    </Suspense>
  )
}
