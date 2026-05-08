import { supabase } from '@/lib/supabase/client'

export const getSolicitacoesByCliente = async (clienteId: string) => {
  const { data, error } = await supabase
    .from('solicitacoes_servico' as any)
    .select('*')
    .eq('cliente_id', clienteId)
    .order('created_at', { ascending: false })
  if (error) throw error
  return data
}

export const createSolicitacao = async (solicitacao: any) => {
  const { data, error } = await supabase
    .from('solicitacoes_servico' as any)
    .insert(solicitacao)
    .select()
    .single()
  if (error) throw error
  return data
}

export const updateSolicitacao = async (id: string, solicitacao: any) => {
  const { data, error } = await supabase
    .from('solicitacoes_servico' as any)
    .update(solicitacao)
    .eq('id', id)
    .select()
    .single()
  if (error) throw error
  return data
}

export const deleteSolicitacao = async (id: string) => {
  const { error } = await supabase
    .from('solicitacoes_servico' as any)
    .delete()
    .eq('id', id)
  if (error) throw error
  return true
}
