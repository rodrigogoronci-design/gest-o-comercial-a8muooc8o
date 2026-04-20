import { supabase } from '@/lib/supabase/client'

export const getClientes = async () => {
  const { data, error } = await supabase
    .from('clientes')
    .select('*')
    .order('created_at', { ascending: false })
  if (error) throw error
  return data
}

export const createCliente = async (cliente: any) => {
  const { data, error } = await supabase.from('clientes').insert(cliente).select().single()
  if (error) throw error
  return data
}

export const updateCliente = async (id: string, cliente: any) => {
  const { data, error } = await supabase
    .from('clientes')
    .update(cliente)
    .eq('id', id)
    .select()
    .single()
  if (error) throw error
  return data
}

export const deleteCliente = async (id: string) => {
  const { error } = await supabase.from('clientes').delete().eq('id', id)
  if (error) throw error
  return true
}
