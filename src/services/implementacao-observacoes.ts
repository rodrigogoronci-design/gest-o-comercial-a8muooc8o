import { supabase } from '@/lib/supabase/client'

export interface ImplementacaoObservacao {
  id: string
  implementacao_id: string
  observacao: string
  created_at: string
  updated_at: string
}

export const getObservacoes = async (
  implementacaoId: string,
): Promise<ImplementacaoObservacao[]> => {
  const { data, error } = await (supabase.from('implementacao_observacoes') as any)
    .select('*')
    .eq('implementacao_id', implementacaoId)
    .order('created_at', { ascending: false })
  if (error) throw error
  return (data || []) as unknown as ImplementacaoObservacao[]
}

export const createObservacao = async (
  implementacaoId: string,
  observacao: string,
): Promise<ImplementacaoObservacao> => {
  const { data, error } = await (supabase.from('implementacao_observacoes') as any)
    .insert({ implementacao_id: implementacaoId, observacao })
    .select()
    .single()
  if (error) throw error
  return data as unknown as ImplementacaoObservacao
}

export const updateObservacao = async (
  id: string,
  observacao: string,
): Promise<ImplementacaoObservacao> => {
  const { data, error } = await (supabase.from('implementacao_observacoes') as any)
    .update({ observacao })
    .eq('id', id)
    .select()
    .single()
  if (error) throw error
  return data as unknown as ImplementacaoObservacao
}

export const deleteObservacao = async (id: string): Promise<void> => {
  const { error } = await supabase
    .from('implementacao_observacoes' as any)
    .delete()
    .eq('id', id)
  if (error) throw error
}
