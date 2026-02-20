import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

export async function GET() {
  try {
    const [statsRes, temasRes, relatoresRes, anoRes] = await Promise.all([
      supabase.from('stats_jurisprudencia').select('*').single(),
      // Top temas
      supabase.rpc('buscar_decisoes', { p_query: '', p_limit: 1, p_offset: 0 }),
      // Relatores únicos
      supabase
        .from('decisoes')
        .select('relator')
        .not('relator', 'is', null)
        .order('relator'),
      // Distribuição por ano
      supabase
        .from('decisoes')
        .select('ano, resultado')
        .order('ano'),
    ])

    // Conta por relator
    const relatoresCount = {}
    relatoresRes.data?.forEach(d => {
      if (d.relator) relatoresCount[d.relator] = (relatoresCount[d.relator] || 0) + 1
    })
    const topRelatores = Object.entries(relatoresCount)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([nome, total]) => ({ nome, total }))

    // Distribuição por ano
    const porAno = {}
    anoRes.data?.forEach(d => {
      if (!d.ano) return
      if (!porAno[d.ano]) porAno[d.ano] = { ano: d.ano, total: 0, deferidos: 0, indeferidos: 0 }
      porAno[d.ano].total++
      if (['DEFERIDO', 'PROVIDO'].includes(d.resultado)) porAno[d.ano].deferidos++
      if (['INDEFERIDO', 'NÃO PROVIDO'].includes(d.resultado)) porAno[d.ano].indeferidos++
    })
    const distribuicaoAnos = Object.values(porAno).sort((a, b) => a.ano - b.ano)

    return NextResponse.json({
      geral: statsRes.data || {},
      topRelatores,
      distribuicaoAnos,
    })
  } catch (err) {
    console.error('Erro ao buscar stats:', err)
    return NextResponse.json({ error: 'Erro ao buscar estatísticas', detalhe: err.message }, { status: 500 })
  }
}
