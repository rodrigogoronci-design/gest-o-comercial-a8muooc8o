import { supabase } from '@/lib/supabase/client'

export async function getOrCreateConsultoriaToken(implId: string): Promise<string> {
  const { data } = await supabase
    .from('implementacoes' as any)
    .select('consultoria_token')
    .eq('id', implId)
    .single()

  if (data?.consultoria_token) return data.consultoria_token

  const newToken = crypto.randomUUID()
  const { data: updated, error } = await supabase
    .from('implementacoes' as any)
    .update({ consultoria_token: newToken })
    .eq('id', implId)
    .select('consultoria_token')
    .single()
  if (error) throw error
  return updated.consultoria_token
}

export function generateConsultoriaUrl(token: string): string {
  return `${window.location.origin}/consultoria/${token}`
}
