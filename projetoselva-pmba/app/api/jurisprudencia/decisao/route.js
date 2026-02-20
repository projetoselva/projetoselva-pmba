import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

// GET /api/jurisprudencia/decisao?id=xxx
// GET /api/jurisprudencia/decisao?ids=xxx,yyy,zzz  (para comparação)
export async function GET(request) {
  const { searchParams } = new URL(request.url)
  const id = searchParams.get('id')
  const ids = searchParams.get('ids')

  try {
    if (ids) {
      // Múltiplas decisões para comparação
      const idArray = ids.split(',').map(s => s.trim()).filter(Boolean).slice(0, 5)
      const { data, error } = await supabase
        .from('decisoes')
        .select('*')
        .in('id', idArray)

      if (error) throw error
      return NextResponse.json({ decisoes: data || [] })
    }

    if (id) {
      const { data, error } = await supabase
        .from('decisoes')
        .select('*')
        .eq('id', id)
        .single()

      if (error) {
        if (error.code === 'PGRST116') {
          return NextResponse.json({ error: 'Decisão não encontrada' }, { status: 404 })
        }
        throw error
      }
      return NextResponse.json({ decisao: data })
    }

    return NextResponse.json({ error: 'Parâmetro id ou ids obrigatório' }, { status: 400 })
  } catch (err) {
    console.error('Erro ao buscar decisão:', err)
    return NextResponse.json({ error: 'Erro ao buscar decisão', detalhe: err.message }, { status: 500 })
  }
}
