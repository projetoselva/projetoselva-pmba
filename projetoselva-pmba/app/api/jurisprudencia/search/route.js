import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

export async function GET(request) {
  const { searchParams } = new URL(request.url)

  const query = searchParams.get('q') || ''
  const ano = searchParams.get('ano') ? parseInt(searchParams.get('ano')) : null
  const resultado = searchParams.get('resultado') || null
  const relator = searchParams.get('relator') || null
  const tema = searchParams.get('tema') || null
  const page = parseInt(searchParams.get('page') || '1')
  const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 50)
  const offset = (page - 1) * limit

  try {
    // Usa a função SQL de busca com FTS
    const { data, error } = await supabase.rpc('buscar_decisoes', {
      p_query: query,
      p_ano: ano,
      p_resultado: resultado,
      p_relator: relator,
      p_tema: tema,
      p_limit: limit,
      p_offset: offset,
    })

    if (error) throw error

    const total = data?.[0]?.total_count || 0
    const totalPages = Math.ceil(total / limit)

    return NextResponse.json({
      resultados: data || [],
      paginacao: {
        total: parseInt(total),
        pagina: page,
        totalPaginas: totalPages,
        limite: limit,
        offset,
      },
      filtros: { query, ano, resultado, relator, tema },
    })
  } catch (err) {
    console.error('Erro na busca:', err)
    return NextResponse.json({ error: 'Erro ao buscar decisões', detalhe: err.message }, { status: 500 })
  }
}
