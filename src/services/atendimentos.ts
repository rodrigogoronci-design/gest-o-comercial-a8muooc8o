import { supabase } from '@/lib/supabase/client'

export interface Atendimento {
  id: string
  cliente_id: string
  data_atendimento: string
  solicitacao: string
  relatorio: string
  created_at: string
  documento_url: string | null
  enviado_implantacao?: boolean
  origem?: string | null
  responsavel?: string | null
  cnpj?: string | null
  contato?: string | null
  assunto?: string | null
  resumo?: string | null
  tipo_atendimento?: string | null
  area_responsavel?: string | null
  fluxo?: string | null
  situacao?: string | null
  data_ultimo_movimento?: string | null
  qtd_mensagens_recebidas?: number | null
  qtd_mensagens_enviadas?: number | null
  remetentes_destinatarios?: any
  uid_emails?: any
  conversa_id?: string | null
  anexos?: any
  importacao_status?: string | null
  observacoes_revisao?: string | null
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

export interface AtendimentoWithCliente extends Atendimento {
  clientes: { nome: string | null; cnpj: string | null } | null
}

export const getAtendimentosWithClientes = async (
  startDate: string,
  endDate: string,
): Promise<AtendimentoWithCliente[]> => {
  const endOfDay = `${endDate}T23:59:59.999Z`
  const { data, error } = await supabase
    .from('atendimentos_clientes')
    .select(
      `
      *,
      clientes (
        nome,
        cnpj
      )
    `,
    )
    .gte('data_atendimento', startDate)
    .lte('data_atendimento', endOfDay)
    .order('data_atendimento', { ascending: false })
  if (error) throw error
  return (data as AtendimentoWithCliente[]) || []
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
