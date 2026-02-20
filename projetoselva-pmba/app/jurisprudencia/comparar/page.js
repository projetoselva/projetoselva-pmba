'use client'

import { useState, useEffect, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import {
  ArrowLeft, Scale, GitCompare, AlertTriangle, Loader2,
  CheckCircle, XCircle, MinusCircle, Calendar, User, Hash,
  Search, X, Plus, ChevronDown, ChevronUp, TrendingUp, TrendingDown
} from 'lucide-react'

const badgeResultado = (resultado) => {
  if (!resultado) return null
  const r = resultado.toUpperCase()
  if (r.includes('DEFERIDO') && !r.includes('IN') && !r.includes('PARCIAL')) {
    return { bg: 'bg-emerald-100 text-emerald-800 border-emerald-200', icon: <CheckCircle className="w-3 h-3" />, cor: 'emerald' }
  }
  if (r.includes('INDEFERIDO') || r.includes('NÃO PROVIDO')) {
    return { bg: 'bg-red-100 text-red-800 border-red-200', icon: <XCircle className="w-3 h-3" />, cor: 'red' }
  }
  return { bg: 'bg-yellow-100 text-yellow-800 border-yellow-200', icon: <MinusCircle className="w-3 h-3" />, cor: 'yellow' }
}

function ComparacaoManual({ idsIniciais }) {
  const [decisoes, setDecisoes] = useState([])
  const [carregando, setCarregando] = useState(false)
  const [buscaAberta, setBuscaAberta] = useState(false)
  const [queryBusca, setQueryBusca] = useState('')
  const [resultadosBusca, setResultadosBusca] = useState([])
  const [buscando, setBuscando] = useState(false)
  const [expandidos, setExpandidos] = useState({})

  useEffect(() => {
    if (idsIniciais?.length) {
      setCarregando(true)
      fetch(`/api/jurisprudencia/decisao?ids=${idsIniciais.join(',')}`)
        .then(r => r.json())
        .then(d => setDecisoes(d.decisoes || []))
        .finally(() => setCarregando(false))
    }
  }, [])

  const buscarParaAdicionar = async () => {
    if (!queryBusca.trim()) return
    setBuscando(true)
    try {
      const res = await fetch(`/api/jurisprudencia/search?q=${encodeURIComponent(queryBusca)}&limit=8`)
      const data = await res.json()
      setResultadosBusca(data.resultados || [])
    } finally {
      setBuscando(false)
    }
  }

  const adicionarDecisao = async (id) => {
    if (decisoes.find(d => d.id === id) || decisoes.length >= 5) return
    const res = await fetch(`/api/jurisprudencia/decisao?id=${id}`)
    const data = await res.json()
    if (data.decisao) setDecisoes(prev => [...prev, data.decisao])
    setBuscaAberta(false)
    setQueryBusca('')
    setResultadosBusca([])
  }

  const removerDecisao = (id) => setDecisoes(prev => prev.filter(d => d.id !== id))
  const toggleExpandir = (id) => setExpandidos(prev => ({ ...prev, [id]: !prev[id] }))

  if (carregando) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
      </div>
    )
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <GitCompare className="w-4 h-4" />
          <span>{decisoes.length} decisão(ões) em comparação</span>
          {decisoes.length < 5 && (
            <button
              onClick={() => setBuscaAberta(!buscaAberta)}
              className="ml-2 flex items-center gap-1 text-emerald-600 hover:text-emerald-800 font-medium"
            >
              <Plus className="w-3.5 h-3.5" />
              Adicionar
            </button>
          )}
        </div>
        {decisoes.length === 0 && (
          <span className="text-sm text-gray-400">Nenhuma decisão selecionada</span>
        )}
      </div>

      {/* Busca para adicionar decisão */}
      {buscaAberta && (
        <div className="bg-gray-50 border rounded-xl p-4 mb-4">
          <div className="flex gap-2 mb-3">
            <input
              type="text"
              value={queryBusca}
              onChange={e => setQueryBusca(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && buscarParaAdicionar()}
              placeholder="Buscar decisão por ementa, número, tema..."
              className="flex-1 border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              autoFocus
            />
            <button
              onClick={buscarParaAdicionar}
              className="bg-emerald-600 text-white px-3 py-2 rounded-lg text-sm hover:bg-emerald-700"
            >
              {buscando ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
            </button>
            <button onClick={() => setBuscaAberta(false)} className="text-gray-400 hover:text-gray-600">
              <X className="w-4 h-4" />
            </button>
          </div>
          {resultadosBusca.length > 0 && (
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {resultadosBusca.map(r => {
                const jaAdicionada = decisoes.find(d => d.id === r.id)
                const badge = badgeResultado(r.resultado)
                return (
                  <button
                    key={r.id}
                    onClick={() => !jaAdicionada && adicionarDecisao(r.id)}
                    disabled={!!jaAdicionada}
                    className={`w-full text-left p-3 rounded-lg border transition-all ${
                      jaAdicionada
                        ? 'bg-gray-100 border-gray-200 opacity-50 cursor-not-allowed'
                        : 'bg-white border-gray-200 hover:border-emerald-400 hover:bg-emerald-50'
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      {badge && (
                        <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full ${badge.bg}`}>
                          {badge.icon} {r.resultado}
                        </span>
                      )}
                      {r.numero_processo && <span className="font-mono text-xs text-gray-400">{r.numero_processo}</span>}
                      {jaAdicionada && <span className="text-xs text-gray-400">(já adicionada)</span>}
                    </div>
                    <p className="text-xs text-gray-600 line-clamp-2">{r.ementa?.slice(0, 150)}</p>
                  </button>
                )
              })}
            </div>
          )}
        </div>
      )}

      {decisoes.length === 0 ? (
        <div className="bg-white rounded-xl border p-12 text-center">
          <GitCompare className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <h3 className="text-gray-600 font-medium mb-2">Nenhuma decisão para comparar</h3>
          <p className="text-gray-400 text-sm mb-4">Adicione decisões usando o botão acima ou selecione no buscador</p>
          <Link href="/jurisprudencia" className="text-emerald-600 hover:underline text-sm flex items-center gap-1 justify-center">
            <Search className="w-3.5 h-3.5" /> Ir para o Buscador
          </Link>
        </div>
      ) : (
        <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(${Math.min(decisoes.length, 3)}, 1fr)` }}>
          {decisoes.map((decisao) => {
            const badge = badgeResultado(decisao.resultado)
            const expandido = expandidos[decisao.id]
            return (
              <div key={decisao.id} className="bg-white rounded-xl border shadow-sm overflow-hidden flex flex-col">
                {/* Badge resultado */}
                {badge && (
                  <div className={`px-4 py-2 border-b flex items-center justify-between ${badge.bg}`}>
                    <span className="flex items-center gap-1.5 font-bold text-sm">
                      {badge.icon} {decisao.resultado}
                    </span>
                    <button onClick={() => removerDecisao(decisao.id)} className="opacity-60 hover:opacity-100">
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}

                <div className="p-4 flex-1">
                  {/* Número */}
                  {decisao.numero_processo && (
                    <div className="font-mono text-xs text-gray-400 mb-2">{decisao.numero_processo}</div>
                  )}

                  {/* Meta */}
                  <dl className="space-y-1.5 text-xs mb-3 pb-3 border-b">
                    {decisao.data_julgamento && (
                      <div className="flex items-center gap-1.5 text-gray-500">
                        <Calendar className="w-3 h-3 flex-shrink-0" />
                        {new Date(decisao.data_julgamento).toLocaleDateString('pt-BR')}
                      </div>
                    )}
                    {decisao.relator && (
                      <div className="flex items-center gap-1.5 text-gray-500">
                        <User className="w-3 h-3 flex-shrink-0" />
                        {decisao.relator}
                      </div>
                    )}
                    {decisao.orgao_julgador && (
                      <div className="flex items-center gap-1.5 text-gray-500">
                        <Hash className="w-3 h-3 flex-shrink-0" />
                        {decisao.orgao_julgador}
                      </div>
                    )}
                  </dl>

                  {/* Ementa */}
                  <div>
                    <p className={`text-xs text-gray-700 leading-relaxed ${expandido ? '' : 'line-clamp-6'}`}>
                      {decisao.ementa}
                    </p>
                    {decisao.ementa?.length > 300 && (
                      <button
                        onClick={() => toggleExpandir(decisao.id)}
                        className="text-xs text-emerald-600 hover:text-emerald-800 mt-1 flex items-center gap-1"
                      >
                        {expandido ? <><ChevronUp className="w-3 h-3" /> Recolher</> : <><ChevronDown className="w-3 h-3" /> Expandir</>}
                      </button>
                    )}
                  </div>

                  {/* Temas */}
                  {decisao.temas?.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-3">
                      {decisao.temas.map(t => (
                        <span key={t} className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">{t}</span>
                      ))}
                    </div>
                  )}
                </div>

                <div className="p-3 border-t bg-gray-50">
                  <Link
                    href={`/jurisprudencia/${decisao.id}`}
                    className="text-xs text-emerald-600 hover:text-emerald-800 font-medium"
                  >
                    Ver íntegra →
                  </Link>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

function ConflitosAutomaticos({ temaInicial }) {
  const [conflitos, setConflitos] = useState([])
  const [carregando, setCarregando] = useState(true)
  const [temaBusca, setTemaBusca] = useState(temaInicial || '')
  const [expandidos, setExpandidos] = useState({})

  const buscarConflitos = (tema) => {
    setCarregando(true)
    const params = tema ? `?tema=${encodeURIComponent(tema)}` : ''
    fetch(`/api/jurisprudencia/conflitos${params}&limit=30`)
      .then(r => r.json())
      .then(d => setConflitos(d.conflitos || []))
      .finally(() => setCarregando(false))
  }

  useEffect(() => { buscarConflitos(temaBusca) }, [])

  const toggleExpandir = (tema) => setExpandidos(prev => ({ ...prev, [tema]: !prev[tema] }))

  return (
    <div>
      <div className="bg-orange-50 border border-orange-200 rounded-xl p-4 mb-6 flex items-start gap-3">
        <AlertTriangle className="w-5 h-5 text-orange-500 flex-shrink-0 mt-0.5" />
        <div>
          <h3 className="font-semibold text-orange-800 text-sm">Detecção de Conflitos Jurisprudenciais</h3>
          <p className="text-orange-700 text-xs mt-0.5">
            Abaixo estão temas onde o TJBA proferiu decisões com resultados contraditórios (deferidos e indeferidos),
            indicando divergência jurisprudencial sobre o mesmo assunto.
          </p>
        </div>
      </div>

      {/* Filtro por tema */}
      <div className="flex gap-2 mb-4">
        <input
          type="text"
          value={temaBusca}
          onChange={e => setTemaBusca(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && buscarConflitos(temaBusca)}
          placeholder="Filtrar por tema (ex: PROMOÇÃO, PUNIÇÃO...)"
          className="flex-1 border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
        />
        <button
          onClick={() => buscarConflitos(temaBusca)}
          className="bg-orange-500 text-white px-4 py-2 rounded-lg text-sm hover:bg-orange-600"
        >
          {carregando ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Buscar'}
        </button>
        {temaBusca && (
          <button onClick={() => { setTemaBusca(''); buscarConflitos('') }} className="text-gray-400 hover:text-gray-600">
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {carregando ? (
        <div className="flex justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-orange-500" />
        </div>
      ) : conflitos.length === 0 ? (
        <div className="bg-white rounded-xl border p-12 text-center">
          <Scale className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <h3 className="text-gray-600 font-medium">Nenhum conflito detectado</h3>
          <p className="text-gray-400 text-sm mt-1">
            {temaBusca ? `Não há divergência encontrada para o tema "${temaBusca}"` : 'Não há divergências detectadas na base atual'}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          <p className="text-sm text-gray-500">{conflitos.length} tema(s) com decisões conflitantes encontrado(s)</p>
          {conflitos.map((conflito) => {
            const expandido = expandidos[conflito.tema]
            const totalDef = Number(conflito.total_deferidos) || 0
            const totalInd = Number(conflito.total_indeferidos) || 0
            const total = totalDef + totalInd
            const pctDef = total > 0 ? Math.round(totalDef / total * 100) : 0

            return (
              <div key={conflito.tema} className="bg-white rounded-xl border shadow-sm overflow-hidden">
                <div
                  className="p-4 cursor-pointer hover:bg-gray-50 transition-colors"
                  onClick={() => toggleExpandir(conflito.tema)}
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4 text-orange-500" />
                      <h3 className="font-bold text-gray-800">{conflito.tema}</h3>
                    </div>
                    {expandido ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
                  </div>

                  {/* Barra de conflito */}
                  <div className="flex items-center gap-3 mb-2">
                    <div className="flex-1 h-4 rounded-full overflow-hidden bg-gray-100 flex">
                      <div
                        className="bg-emerald-400 transition-all"
                        style={{ width: `${pctDef}%` }}
                      />
                      <div
                        className="bg-red-400 transition-all"
                        style={{ width: `${100 - pctDef}%` }}
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-4">
                      <span className="flex items-center gap-1.5 text-emerald-700 font-semibold">
                        <TrendingUp className="w-3.5 h-3.5" />
                        {totalDef} deferido{totalDef !== 1 ? 's' : ''} ({pctDef}%)
                      </span>
                      <span className="flex items-center gap-1.5 text-red-700 font-semibold">
                        <TrendingDown className="w-3.5 h-3.5" />
                        {totalInd} indeferido{totalInd !== 1 ? 's' : ''}
                      </span>
                    </div>
                    <span className="text-xs text-gray-400">{total} decisões</span>
                  </div>
                </div>

                {expandido && (
                  <div className="border-t">
                    <div className="grid grid-cols-1 md:grid-cols-2">
                      {/* Coluna deferidos */}
                      <div className="p-4 border-r">
                        <h4 className="text-xs font-bold text-emerald-700 uppercase tracking-wider mb-3 flex items-center gap-1">
                          <CheckCircle className="w-3.5 h-3.5" /> Deferidos
                        </h4>
                        <div className="space-y-2">
                          {(conflito.exemplos_deferidos || []).slice(0, 3).map((ex, i) => (
                            <Link
                              key={i}
                              href={`/jurisprudencia/${ex.id}`}
                              className="block p-2.5 bg-emerald-50 rounded-lg hover:bg-emerald-100 transition-colors"
                            >
                              <div className="text-xs text-gray-500 mb-1 flex items-center gap-2">
                                {ex.data && <span>{new Date(ex.data).toLocaleDateString('pt-BR')}</span>}
                                {ex.relator && <span className="truncate">{ex.relator.split(' ').slice(-2).join(' ')}</span>}
                              </div>
                              <p className="text-xs text-gray-700 line-clamp-2">{ex.ementa}</p>
                            </Link>
                          ))}
                        </div>
                      </div>

                      {/* Coluna indeferidos */}
                      <div className="p-4">
                        <h4 className="text-xs font-bold text-red-700 uppercase tracking-wider mb-3 flex items-center gap-1">
                          <XCircle className="w-3.5 h-3.5" /> Indeferidos
                        </h4>
                        <div className="space-y-2">
                          {(conflito.exemplos_indeferidos || []).slice(0, 3).map((ex, i) => (
                            <Link
                              key={i}
                              href={`/jurisprudencia/${ex.id}`}
                              className="block p-2.5 bg-red-50 rounded-lg hover:bg-red-100 transition-colors"
                            >
                              <div className="text-xs text-gray-500 mb-1 flex items-center gap-2">
                                {ex.data && <span>{new Date(ex.data).toLocaleDateString('pt-BR')}</span>}
                                {ex.relator && <span className="truncate">{ex.relator.split(' ').slice(-2).join(' ')}</span>}
                              </div>
                              <p className="text-xs text-gray-700 line-clamp-2">{ex.ementa}</p>
                            </Link>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Comparar direto */}
                    {conflito.ids_deferidos?.length && conflito.ids_indeferidos?.length && (
                      <div className="p-3 border-t bg-gray-50">
                        <Link
                          href={`/jurisprudencia/comparar?ids=${[...(conflito.ids_deferidos || []).slice(0, 2), ...(conflito.ids_indeferidos || []).slice(0, 2)].join(',')}`}
                          className="text-xs text-blue-600 hover:text-blue-800 font-medium flex items-center gap-1"
                        >
                          <GitCompare className="w-3.5 h-3.5" />
                          Comparar decisões conflitantes lado a lado →
                        </Link>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

function CompararContent() {
  const searchParams = useSearchParams()
  const ids = searchParams.get('ids')?.split(',').filter(Boolean) || []
  const modo = searchParams.get('modo')
  const tema = searchParams.get('tema')

  const [abaModo, setAbaModo] = useState(modo === 'conflitos' ? 'conflitos' : 'manual')

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b sticky top-0 z-40 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/jurisprudencia" className="flex items-center gap-2 text-gray-600 hover:text-gray-800 text-sm">
              <ArrowLeft className="w-4 h-4" />
              <span className="hidden sm:inline">Buscador</span>
            </Link>
            <div className="w-px h-5 bg-gray-200" />
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 bg-blue-600 rounded-lg flex items-center justify-center">
                <GitCompare className="w-4 h-4 text-white" />
              </div>
              <h1 className="text-base font-bold text-gray-800">Comparativo de Decisões</h1>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-6">
        {/* Tabs */}
        <div className="flex gap-1 bg-gray-100 p-1 rounded-xl mb-6 w-fit">
          <button
            onClick={() => setAbaModo('manual')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              abaModo === 'manual' ? 'bg-white text-blue-700 shadow-sm' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <GitCompare className="w-4 h-4" />
            Comparação Manual
          </button>
          <button
            onClick={() => setAbaModo('conflitos')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              abaModo === 'conflitos' ? 'bg-white text-orange-700 shadow-sm' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <AlertTriangle className="w-4 h-4" />
            Conflitos Automáticos
          </button>
        </div>

        {abaModo === 'manual' ? (
          <ComparacaoManual idsIniciais={ids} />
        ) : (
          <ConflitosAutomaticos temaInicial={tema} />
        )}
      </main>
    </div>
  )
}

export default function CompararPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    }>
      <CompararContent />
    </Suspense>
  )
}
