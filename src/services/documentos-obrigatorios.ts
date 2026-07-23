import { supabase } from '@/lib/supabase/client'

export interface DocumentoObrigatorio {
  id: string
  plano_id: string | null
  nome_documento: string
  descricao: string | null
  ativo: boolean
  created_at: string
}

export async function getDocumentosObrigatorios(
  planoId?: string | null,
): Promise<DocumentoObrigatorio[]> {
  let query = supabase
    .from('documentos_obrigatorios')
    .select('*')
    .eq('ativo', true)
    .order('nome_documento')

  if (planoId) {
    query = query.or(`plano_id.eq.${planoId},plano_id.is.null`)
  } else {
    query = query.is('plano_id', null)
  }

  const { data, error } = await query
  if (error) throw error
  return (data || []) as DocumentoObrigatorio[]
}
