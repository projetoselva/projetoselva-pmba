'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase-browser'
import { DISCIPLINAS, getTotalTopicos } from '@/lib/edital-pmba'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { BookOpen, Target, TrendingUp, Clock, CheckCircle, Circle, ChevronRight, LogOut, User, Menu, X, Home, BarChart3, Plus, Minus, RefreshCw } from 'lucide-react'

export default function DashboardClient({ user, profile, progressoInicial }) {
  const router = useRouter()
  const supabase = createClient()
  
  const [progresso, setProgresso] = useState({})
  const [disciplinaAtiva, setDisciplinaAtiva] = useState(null)
  const [menuAberto, setMenuAberto] = useState(false)
  const [salvando, setSalvando] = useState(false)

  useEffect(() => {
    const progressoMap = {}
    Object.keys(DISCIPLINAS).forEach(disc => {
      progressoMap[disc] = DISCIPLINAS[disc].topicos.map((_, idx) => {
        const encontrado = progressoInicial.find(p => p.disciplina === disc && p.topico_index === idx)
        return encontrado || { concluido: false, acertos: 0, erros: 0, revisoes: 0 }
      })
    })
    setProgresso(progressoMap)
  }, [progressoInicial])

  const salvarProgresso = useCallback(async (disc, idx, dados) => {
    setSalvando(true)
    try {
      await supabase.from('progresso').upsert({
        user_id: user.id, disciplina: disc, topico_index: idx, ...dados, updated_at: new Date().toISOString()
      }, { onConflict: 'user_id,disciplina,topico_index' })
    } catch (err) { console.error(err) }
    finally { setSalvando(false) }
  }, [supabase, user.id])

  const toggleConcluido = async (disc, idx) => {
    const novoValor = !progresso[disc][idx].concluido
    setProgresso(prev => {
      const novo = { ...prev }; novo[disc] = [...prev[disc]]; novo[disc][idx] = { ...prev[disc][idx], concluido: novoValor }
      return novo
    })
    await salvarProgresso(disc, idx, { concluido: novoValor, acertos: progresso[disc][idx].acertos, erros: progresso[disc][idx].erros })
  }

  const updateQuestoes = async (disc, idx, tipo, delta) => {
    const novoValor = Math.max(0, (progresso[disc][idx][tipo] || 0) + delta)
    setProgresso(prev => {
      const novo = { ...prev }; novo[disc] = [...prev[disc]]; novo[disc][idx] = { ...prev[disc][idx], [tipo]: novoValor }
      return novo
    })
    await salvarProgresso(disc, idx, {
      concluido: progresso[disc][idx].concluido,
      acertos: tipo === 'acertos' ? novoValor : progresso[disc][idx].acertos,
      erros: tipo === 'erros' ? novoValor : progresso[disc][idx].erros
    })
  }

  const calcularStats = (disc) => {
    if (!progresso[disc]) return { total: 0, concluidos: 0, acertos: 0, erros: 0, progresso: 0, desempenho: 0 }
    const topicos = progresso[disc]
    const total = topicos.length, concluidos = topicos.filter(t => t.concluido).length
    const acertos = topicos.reduce((s, t) => s + (t.acertos || 0), 0), erros = topicos.reduce((s, t) => s + (t.erros || 0), 0)
    const totalQ = acertos + erros
    return { total, concluidos, acertos, erros, progresso: total > 0 ? (concluidos / total * 100) : 0, desempenho: totalQ > 0 ? (acertos / totalQ * 100) : 0 }
  }

  const statsGerais = () => {
    let total = 0, concluidos = 0, acertos = 0, erros = 0
    Object.keys(DISCIPLINAS).forEach(disc => { const s = calcularStats(disc); total += s.total; concluidos += s.concluidos; acertos += s.acertos; erros += s.erros })
    const totalQ = acertos + erros
    return { total, concluidos, progresso: total > 0 ? (concluidos / total * 100) : 0, acertos, erros, desempenho: totalQ > 0 ? (acertos / totalQ * 100) : 0 }
  }

  const chartData = Object.keys(DISCIPLINAS).map(disc => {
    const s = calcularStats(disc)
    return { name: disc.length > 12 ? disc.substring(0, 12) + '...' : disc, progresso: Math.round(s.progresso) }
  })

  const handleLogout = async () => { await supabase.auth.signOut(); router.push('/'); router.refresh() }

  const stats = statsGerais()
  const statsDisc = disciplinaAtiva ? calcularStats(disciplinaAtiva) : null

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-emerald-500 text-white shadow-lg sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={() => setMenuAberto(!menuAberto)} className="md:hidden p-2 hover:bg-emerald-600 rounded-lg">
              {menuAberto ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
            <div className="w-9 h-9 bg-white rounded-lg flex items-center justify-center">
              <BookOpen className="w-5 h-5 text-emerald-500" />
            </div>
            <div><h1 className="text-lg font-bold">@projetoselva</h1><p className="text-emerald-100 text-xs hidden sm:block">PMBA 2025</p></div>
          </div>
          <div className="flex items-center gap-3">
            {salvando && <div className="flex items-center gap-1 text-emerald-100 text-sm"><RefreshCw className="w-4 h-4 animate-spin" /></div>}
            <div className="hidden md:flex items-center gap-2 bg-emerald-600 px-3 py-1.5 rounded-lg"><User className="w-4 h-4" /><span className="text-sm">{profile?.nome || user.email}</span></div>
            <button onClick={handleLogout} className="p-2 hover:bg-emerald-600 rounded-lg" title="Sair"><LogOut className="w-5 h-5" /></button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-6">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div className="stat-card"><div className="flex items-center gap-2 text-gray-500 text-xs mb-1"><Clock className="w-4 h-4" /><span>PROGRESSO</span></div><div className="text-2xl font-bold text-gray-800">{stats.progresso.toFixed(0)}%</div><div className="text-xs text-gray-500">{stats.concluidos}/{stats.total} tópicos</div><div className="progress-bar mt-2"><div className="progress-bar-fill" style={{ width: `${stats.progresso}%` }} /></div></div>
          <div className="stat-card"><div className="flex items-center gap-2 text-gray-500 text-xs mb-1"><Target className="w-4 h-4" /><span>DESEMPENHO</span></div><div className="text-2xl font-bold text-gray-800">{stats.desempenho.toFixed(0)}%</div><div className="text-xs"><span className="text-emerald-500">{stats.acertos} ✓</span><span className="text-gray-300 mx-1">•</span><span className="text-red-500">{stats.erros} ✗</span></div></div>
          <div className="stat-card"><div className="flex items-center gap-2 text-gray-500 text-xs mb-1"><BookOpen className="w-4 h-4" /><span>DISCIPLINAS</span></div><div className="text-2xl font-bold text-gray-800">{Object.keys(DISCIPLINAS).length}</div><div className="text-xs text-gray-500">matérias</div></div>
          <div className="stat-card"><div className="flex items-center gap-2 text-gray-500 text-xs mb-1"><TrendingUp className="w-4 h-4" /><span>QUESTÕES</span></div><div className="text-2xl font-bold text-gray-800">{stats.acertos + stats.erros}</div><div className="text-xs text-gray-500">resolvidas</div></div>
        </div>

        {!disciplinaAtiva ? (
          <>
            <div className="card p-6 mb-6">
              <h3 className="font-bold text-gray-800 mb-4">📈 Progresso por Disciplina</h3>
              <div className="h-72"><ResponsiveContainer width="100%" height="100%"><BarChart data={chartData} layout="vertical" margin={{ left: 10 }}><CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" /><XAxis type="number" domain={[0, 100]} tickFormatter={v => `${v}%`} /><YAxis type="category" dataKey="name" width={110} tick={{ fontSize: 10 }} /><Tooltip formatter={v => `${v}%`} /><Bar dataKey="progresso" fill="#10B981" radius={[0, 4, 4, 0]} /></BarChart></ResponsiveContainer></div>
            </div>
            <div className="card overflow-hidden">
              <div className="p-4 border-b bg-gray-50"><h3 className="font-bold text-gray-800">📋 Disciplinas</h3></div>
              <div className="divide-y">
                {Object.keys(DISCIPLINAS).map(disc => {
                  const s = calcularStats(disc)
                  return (
                    <div key={disc} className="p-4 hover:bg-gray-50 cursor-pointer transition-all" onClick={() => setDisciplinaAtiva(disc)}>
                      <div className="flex items-center justify-between"><div className="flex-1 min-w-0"><h4 className="font-medium text-gray-800 truncate">{disc}</h4><div className="flex items-center gap-3 mt-1 text-sm"><span className="text-gray-500">{s.concluidos}/{s.total}</span><span className="text-emerald-500">{s.acertos} ✓</span><span className="text-red-500">{s.erros} ✗</span></div></div><div className="flex items-center gap-3 ml-4"><div className="text-lg font-bold text-emerald-600">{s.progresso.toFixed(0)}%</div><ChevronRight className="w-5 h-5 text-gray-400" /></div></div>
                      <div className="progress-bar mt-2"><div className="progress-bar-fill" style={{ width: `${s.progresso}%` }} /></div>
                    </div>
                  )
                })}
              </div>
            </div>
          </>
        ) : (
          <>
            <button onClick={() => setDisciplinaAtiva(null)} className="mb-4 text-emerald-600 hover:text-emerald-700 font-medium">← Voltar</button>
            <div className="bg-emerald-500 text-white rounded-xl p-6 mb-6">
              <h2 className="text-2xl font-bold mb-4">{disciplinaAtiva}</h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-white/20 rounded-lg p-3"><div className="text-emerald-100 text-sm">Progresso</div><div className="text-2xl font-bold">{statsDisc?.progresso.toFixed(0)}%</div></div>
                <div className="bg-white/20 rounded-lg p-3"><div className="text-emerald-100 text-sm">Desempenho</div><div className="text-2xl font-bold">{statsDisc?.desempenho.toFixed(0)}%</div></div>
                <div className="bg-white/20 rounded-lg p-3"><div className="text-emerald-100 text-sm">Concluídos</div><div className="text-2xl font-bold">{statsDisc?.concluidos}/{statsDisc?.total}</div></div>
                <div className="bg-white/20 rounded-lg p-3"><div className="text-emerald-100 text-sm">Questões</div><div className="text-2xl font-bold">{(statsDisc?.acertos || 0) + (statsDisc?.erros || 0)}</div></div>
              </div>
            </div>
            <div className="card overflow-hidden">
              <div className="p-4 border-b bg-gray-50"><h3 className="font-bold text-gray-800">📝 Edital Verticalizado</h3></div>
              <div className="hidden md:grid grid-cols-12 gap-2 p-3 bg-gray-100 text-sm font-medium text-gray-600 border-b"><div className="col-span-1 text-center">✓</div><div className="col-span-5">Tópico</div><div className="col-span-2 text-center">Acertos</div><div className="col-span-2 text-center">Erros</div><div className="col-span-2 text-center">%</div></div>
              <div className="divide-y">
                {progresso[disciplinaAtiva]?.map((topico, idx) => {
                  const totalQ = (topico.acertos || 0) + (topico.erros || 0)
                  const desemp = totalQ > 0 ? ((topico.acertos || 0) / totalQ * 100) : 0
                  const nome = DISCIPLINAS[disciplinaAtiva].topicos[idx]
                  return (
                    <div key={idx} className="p-3 hover:bg-gray-50">
                      <div className="md:hidden flex items-start gap-3">
                        <button onClick={() => toggleConcluido(disciplinaAtiva, idx)} className="mt-1">{topico.concluido ? <CheckCircle className="w-6 h-6 text-emerald-500" /> : <Circle className="w-6 h-6 text-gray-300" />}</button>
                        <div className="flex-1"><p className={`text-sm ${topico.concluido ? 'text-gray-400 line-through' : 'text-gray-800'}`}>{idx + 1}. {nome}</p>
                          <div className="flex items-center gap-4 mt-2">
                            <div className="flex items-center gap-1"><button onClick={() => updateQuestoes(disciplinaAtiva, idx, 'acertos', -1)} className="w-7 h-7 rounded bg-gray-100 flex items-center justify-center"><Minus className="w-4 h-4" /></button><span className="w-8 text-center text-emerald-600 font-medium">{topico.acertos || 0}</span><button onClick={() => updateQuestoes(disciplinaAtiva, idx, 'acertos', 1)} className="w-7 h-7 rounded bg-emerald-500 text-white flex items-center justify-center"><Plus className="w-4 h-4" /></button></div>
                            <div className="flex items-center gap-1"><button onClick={() => updateQuestoes(disciplinaAtiva, idx, 'erros', -1)} className="w-7 h-7 rounded bg-gray-100 flex items-center justify-center"><Minus className="w-4 h-4" /></button><span className="w-8 text-center text-red-500 font-medium">{topico.erros || 0}</span><button onClick={() => updateQuestoes(disciplinaAtiva, idx, 'erros', 1)} className="w-7 h-7 rounded bg-red-500 text-white flex items-center justify-center"><Plus className="w-4 h-4" /></button></div>
                            <span className={`text-sm font-medium ${desemp >= 70 ? 'text-emerald-500' : desemp >= 50 ? 'text-yellow-500' : 'text-red-500'}`}>{totalQ > 0 ? `${desemp.toFixed(0)}%` : '-'}</span>
                          </div>
                        </div>
                      </div>
                      <div className="hidden md:grid grid-cols-12 gap-2 items-center">
                        <div className="col-span-1 text-center"><button onClick={() => toggleConcluido(disciplinaAtiva, idx)}>{topico.concluido ? <CheckCircle className="w-5 h-5 text-emerald-500 mx-auto" /> : <Circle className="w-5 h-5 text-gray-300 mx-auto" />}</button></div>
                        <div className={`col-span-5 text-sm ${topico.concluido ? 'text-gray-400 line-through' : 'text-gray-800'}`}>{idx + 1}. {nome}</div>
                        <div className="col-span-2 flex items-center justify-center gap-1"><button onClick={() => updateQuestoes(disciplinaAtiva, idx, 'acertos', -1)} className="w-6 h-6 rounded bg-gray-100 flex items-center justify-center"><Minus className="w-3 h-3" /></button><span className="w-8 text-center text-emerald-600 font-medium">{topico.acertos || 0}</span><button onClick={() => updateQuestoes(disciplinaAtiva, idx, 'acertos', 1)} className="w-6 h-6 rounded bg-emerald-500 text-white flex items-center justify-center"><Plus className="w-3 h-3" /></button></div>
                        <div className="col-span-2 flex items-center justify-center gap-1"><button onClick={() => updateQuestoes(disciplinaAtiva, idx, 'erros', -1)} className="w-6 h-6 rounded bg-gray-100 flex items-center justify-center"><Minus className="w-3 h-3" /></button><span className="w-8 text-center text-red-500 font-medium">{topico.erros || 0}</span><button onClick={() => updateQuestoes(disciplinaAtiva, idx, 'erros', 1)} className="w-6 h-6 rounded bg-red-500 text-white flex items-center justify-center"><Plus className="w-3 h-3" /></button></div>
                        <div className="col-span-2 text-center"><span className={`text-sm font-medium px-2 py-1 rounded ${desemp >= 70 ? 'bg-emerald-100 text-emerald-700' : desemp >= 50 ? 'bg-yellow-100 text-yellow-700' : totalQ > 0 ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-500'}`}>{totalQ > 0 ? `${desemp.toFixed(0)}%` : '-'}</span></div>
                      </div>
                    </div>
                  )
                })}
              </div>
              <div className="p-4 bg-gray-50 border-t"><div className="flex items-center justify-between text-sm"><span className="font-bold text-gray-700">TOTAL</span><div className="flex items-center gap-6"><span className="text-emerald-600 font-bold">{statsDisc?.acertos} ✓</span><span className="text-red-500 font-bold">{statsDisc?.erros} ✗</span><span className="font-bold">{statsDisc?.desempenho.toFixed(0)}%</span></div></div><div className="progress-bar mt-2"><div className="progress-bar-fill" style={{ width: `${statsDisc?.progresso}%` }} /></div></div>
            </div>
          </>
        )}
      </main>
      <footer className="bg-gray-100 border-t mt-8 py-4"><p className="text-center text-sm text-gray-500">📚 @projetoselva • PMBA 2025</p></footer>
    </div>
  )
}
