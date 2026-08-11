import { supabase } from '@/lib/supabase/client'

export interface Reuniao {
  id: string
  cliente_id: string
  titulo: string
  descricao: string | null
  data_evento: string
  tipo: string
  status: string
  link_reuniao: string | null
  gravacao_url: string | null
  created_at: string
}

export async function getReunioesByCliente(clienteId: string): Promise<Reuniao[]> {
  const { data, error } = await supabase
    .from('agenda_eventos')
    .select('*')
    .eq('cliente_id', clienteId)
    .eq('tipo', 'Reunião')
    .order('data_evento', { ascending: false })
  if (error) throw error
  return (data || []) as Reuniao[]
}

export async function createReuniao(reuniao: {
  cliente_id: string
  titulo: string
  descricao?: string | null
  data_evento: string
  link_reuniao?: string | null
  gravacao_url?: string | null
}): Promise<Reuniao> {
  const { data, error } = await supabase
    .from('agenda_eventos')
    .insert({
      ...reuniao,
      tipo: 'Reunião',
      status: 'Pendente',
    })
    .select()
    .single()
  if (error) throw error
  return data as Reuniao
}

export async function updateReuniao(
  id: string,
  updates: Partial<
    Pick<
      Reuniao,
      'titulo' | 'descricao' | 'data_evento' | 'link_reuniao' | 'gravacao_url' | 'status'
    >
  >,
): Promise<Reuniao> {
  const { data, error } = await supabase
    .from('agenda_eventos')
    .update(updates)
    .eq('id', id)
    .select()
    .single()
  if (error) throw error
  return data as Reuniao
}

export async function deleteReuniao(id: string): Promise<void> {
  const { error } = await supabase.from('agenda_eventos').delete().eq('id', id)
  if (error) throw error
}
