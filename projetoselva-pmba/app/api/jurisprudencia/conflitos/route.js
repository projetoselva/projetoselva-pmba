import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

export async function GET(request) {
  const { searchParams } = new URL(request.url)
  const tema = searchParams.get('tema') || null
  const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 50)

  try {
    const { data, error } = await supabase.rpc('detectar_conflitos', {
      p_tema: tema,
      p_limit: limit,
    })

    if (error) throw error

    return NextResponse.json({ conflitos: data || [] })
  } catch (err) {
    console.error('Erro ao detectar conflitos:', err)
    return NextResponse.json({ error: 'Erro ao buscar conflitos', detalhe: err.message }, { status: 500 })
  }
}
