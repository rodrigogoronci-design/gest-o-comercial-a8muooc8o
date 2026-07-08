import { supabase } from '@/lib/supabase/client'

export interface Atendimento {
  id: string
  cliente_id: string
  data_atendimento: string
  solicitacao: string
  relatorio: string
  created_at: string
  documento_url: string | null
}

export interface AtendimentoInput {
  cliente_id: string
  data_atendimento: string
  solicitacao: string
  relatorio: string
  documento_url?: string | null
}

export const getAtendimentosByCliente = async (clienteId: string): Promise<Atendimento[]> => {
  const { data, error } = await supabase
    .from('atendimentos_clientes')
    .select('*')
    .eq('cliente_id', clienteId)
    .order('data_atendimento', { ascending: false })
  if (error) throw error
  return (data as Atendimento[]) || []
}

export const createAtendimento = async (input: AtendimentoInput): Promise<Atendimento> => {
  const { data, error } = await supabase
    .from('atendimentos_clientes')
    .insert(input)
    .select()
    .single()
  if (error) throw error
  return data as Atendimento
}

export const deleteAtendimento = async (id: string): Promise<void> => {
  const { error } = await supabase.from('atendimentos_clientes').delete().eq('id', id)
  if (error) throw error
}

export async function uploadAtendimentoDocumento(clienteId: string, file: File): Promise<string> {
  const fileExt = file.name.split('.').pop()
  const safeName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_')
  const fileName = `${clienteId}/${Date.now()}-${safeName}`

  const { error: uploadError } = await supabase.storage
    .from('atendimentos')
    .upload(fileName, file, { upsert: true })

  if (uploadError) throw uploadError

  const { data: publicUrlData } = supabase.storage.from('atendimentos').getPublicUrl(fileName)

  return publicUrlData.publicUrl
}
