import { supabase } from '@/lib/supabase/client'

export interface Atendimento {
  id: string
  cliente_id: string
  data_atendimento: string
  solicitacao: string
  relatorio: string
  created_at: string
}

export interface AtendimentoInput {
  cliente_id: string
  data_atendimento: string
  solicitacao: string
  relatorio: string
}

export const getAtendimentosByCliente = async (clienteId: string): Promise<Atendimento[]> => {
  const { data, error } = await supabase
    .from('atendimentos_clientes')
    .select('*')
    .eq('cliente_id', clienteId)
    .order('data_atendimento', { ascending: false })
  if (error) throw error
  return data || []
}

export const createAtendimento = async (input: AtendimentoInput): Promise<Atendimento> => {
  const { data, error } = await supabase
    .from('atendimentos_clientes')
    .insert(input)
    .select()
    .single()
  if (error) throw error
  return data
}

export const deleteAtendimento = async (id: string): Promise<void> => {
  const { error } = await supabase.from('atendimentos_clientes').delete().eq('id', id)
  if (error) throw error
}
