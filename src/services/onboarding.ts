import { supabase } from '@/lib/supabase/client'

export async function getOrCreateOnboardingToken(implId: string): Promise<string> {
  const { data } = await supabase
    .from('implementacoes' as any)
    .select('token_onboarding')
    .eq('id', implId)
    .single()

  if (data?.token_onboarding) return data.token_onboarding

  const newToken = crypto.randomUUID()
  const { data: updated, error } = await supabase
    .from('implementacoes' as any)
    .update({ token_onboarding: newToken })
    .eq('id', implId)
    .select('token_onboarding')
    .single()
  if (error) throw error
  return updated.token_onboarding
}

export function generateOnboardingUrl(token: string): string {
  return `${window.location.origin}/onboarding/${token}`
}
