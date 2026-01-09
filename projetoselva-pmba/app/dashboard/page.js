import { createClient } from '@/lib/supabase-server'
import { redirect } from 'next/navigation'
import DashboardClient from './dashboard-client'

export default async function DashboardPage() {
  const supabase = createClient()
  
  const { data: { user }, error } = await supabase.auth.getUser()
  
  if (error || !user) {
    redirect('/auth/login')
  }

  // Buscar dados do perfil
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  // Buscar progresso
  const { data: progresso } = await supabase
    .from('progresso')
    .select('*')
    .eq('user_id', user.id)

  return (
    <DashboardClient 
      user={user} 
      profile={profile} 
      progressoInicial={progresso || []} 
    />
  )
}
