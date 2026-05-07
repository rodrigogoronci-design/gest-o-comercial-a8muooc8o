import { supabase } from '@/lib/supabase/client'

export const getHistoricoByCliente = async (clienteId: string) => {
  const { data, error } = await supabase
    .from('historico_contratos')
    .select('*')
    .eq('cliente_id', clienteId)
    .order('created_at', { ascending: false })
    .order('data_solicitacao', { ascending: false })
  if (error) throw error
  return data
}

export const createHistorico = async (payload: any) => {
  const { data, error } = await supabase
    .from('historico_contratos')
    .insert(payload)
    .select()
    .single()
  if (error) throw error
  return data
}
