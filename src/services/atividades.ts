import { supabase } from '@/lib/supabase/client'

export type Atividade = {
  id: string
  cliente_id: string | null
  cliente_nome: string | null
  demanda: string
  data_atividade: string
  created_at: string
  clientes?: {
    nome: string
  }
}

export const getAtividades = async () => {
  const { data, error } = await supabase
    .from('atividades_comerciais' as any)
    .select('*, clientes(nome)')
    .order('data_atividade', { ascending: false })
  if (error) throw error
  return data as Atividade[]
}

export const getClientesParaAtividades = async () => {
  const { data, error } = await supabase.from('clientes').select('id, nome').order('nome')
  if (error) throw error
  return data
}

export const createAtividade = async (
  atividade: Omit<Atividade, 'id' | 'created_at' | 'clientes'>,
) => {
  const { data, error } = await supabase
    .from('atividades_comerciais' as any)
    .insert(atividade)
    .select()
    .single()
  if (error) throw error
  return data
}

export const deleteAtividade = async (id: string) => {
  const { error } = await supabase
    .from('atividades_comerciais' as any)
    .delete()
    .eq('id', id)
  if (error) throw error
}
