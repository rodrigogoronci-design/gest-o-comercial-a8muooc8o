import { supabase } from '@/lib/supabase/client'

export const getEventos = async () => {
  const { data, error } = await supabase
    .from('agenda_eventos')
    .select('*, cliente:clientes(nome)')
    .order('data_evento', { ascending: true })
  if (error) throw error
  return data || []
}

export const createEvento = async (evento: any) => {
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const payload = { ...evento }
  if (user?.id) {
    payload.user_id = user.id
  }

  const { data, error } = await supabase.from('agenda_eventos').insert([payload]).select().single()

  if (error) throw error
  return data
}

export const updateEvento = async (id: string, evento: any) => {
  const { data, error } = await supabase
    .from('agenda_eventos')
    .update(evento)
    .eq('id', id)
    .select()
    .single()
  if (error) throw error
  return data
}

export const deleteEvento = async (id: string) => {
  const { error } = await supabase.from('agenda_eventos').delete().eq('id', id)
  if (error) throw error
  return true
}

export const getClientesParaAgenda = async () => {
  const { data, error } = await supabase.from('clientes').select('id, nome').order('nome')
  if (error) throw error
  return data || []
}
