import { supabase } from '@/lib/supabase/client'

export interface AvaliacaoTreinamento {
  id: string
  implementacao_id: string
  token: string
  nota: number | null
  comentarios: string | null
  status: string
  data_envio: string | null
  data_avaliacao: string | null
  created_at: string
  updated_at: string
}

export async function getOrCreateAvaliacaoTreinamento(
  implementacaoId: string,
): Promise<AvaliacaoTreinamento> {
  const { data: existing } = await supabase
    .from('avaliacoes_treinamento' as any)
    .select('*')
    .eq('implementacao_id', implementacaoId)
    .maybeSingle()

  if (existing) return existing as unknown as AvaliacaoTreinamento

  const { data, error } = await supabase
    .from('avaliacoes_treinamento' as any)
    .insert({ implementacao_id: implementacaoId, status: 'nao_enviada' })
    .select()
    .single()

  if (error) throw error
  return data as unknown as AvaliacaoTreinamento
}

export async function getAvaliacaoByImplementacao(
  implementacaoId: string,
): Promise<AvaliacaoTreinamento | null> {
  const { data, error } = await supabase
    .from('avaliacoes_treinamento' as any)
    .select('*')
    .eq('implementacao_id', implementacaoId)
    .maybeSingle()

  if (error) throw error
  return (data as unknown as AvaliacaoTreinamento) || null
}

export async function markAvaliacaoEnviada(avaliacaoId: string): Promise<void> {
  const { error } = await supabase
    .from('avaliacoes_treinamento' as any)
    .update({ status: 'enviada', data_envio: new Date().toISOString() })
    .eq('id', avaliacaoId)
  if (error) throw error
}

export function generateAvaliacaoUrl(token: string): string {
  return `${window.location.origin}/avaliacao-treinamento/${token}`
}

export async function sendAvaliacaoEmail(params: {
  to: string
  clientName: string
  evaluationLink: string
  trainingTitle?: string
  senderName?: string
}): Promise<void> {
  const { error } = await supabase.functions.invoke('send-training-evaluation-email', {
    body: params,
  })
  if (error) throw error
}
