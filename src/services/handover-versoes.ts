import { supabase } from '@/lib/supabase/client'

/**
 * Serviço para histórico de versões do Handover Comercial.
 * Cada salvamento cria uma nova versão na tabela handover_versoes.
 */

export interface HandoverVersao {
  id: string
  implementacao_id: string | null
  consultoria_id: string | null
  conteudo: string | null
  responsavel_comercial: string | null
  responsavel_execucao: string | null
  criado_em: string
  criado_por: string | null
}

/**
 * Cria uma nova versão do handover.
 * O contexto define em qual coluna a referência é gravada:
 *   - "implementacao" → implementacao_id
 *   - "consultoria"    → consultoria_id
 */
export async function createHandoverVersao(params: {
  contexto: 'implementacao' | 'consultoria'
  registroId: string
  conteudo: string
  responsavelComercial?: string
  responsavelExecucao?: string
  criadoPor?: string | null
}): Promise<HandoverVersao | null> {
  const payload: Record<string, any> = {
    conteudo: params.conteudo,
    responsavel_comercial: params.responsavelComercial || null,
    responsavel_execucao: params.responsavelExecucao || null,
    criado_por: params.criadoPor || null,
  }
  if (params.contexto === 'implementacao') {
    payload.implementacao_id = params.registroId
    payload.consultoria_id = null
  } else {
    payload.consultoria_id = params.registroId
    payload.implementacao_id = null
  }

  const { data, error } = await (supabase.from('handover_versoes') as any)
    .insert(payload)
    .select(
      'id, implementacao_id, consultoria_id, conteudo, responsavel_comercial, responsavel_execucao, criado_em, criado_por',
    )
    .single()
  if (error) throw error
  return (data as unknown as HandoverVersao) || null
}

/**
 * Lista as últimas N versões do handover de um registro.
 */
export async function listHandoverVersoes(
  contexto: 'implementacao' | 'consultoria',
  registroId: string,
  limit = 5,
): Promise<HandoverVersao[]> {
  const col = contexto === 'implementacao' ? 'implementacao_id' : 'consultoria_id'
  const { data, error } = await (supabase.from('handover_versoes') as any)
    .select(
      'id, implementacao_id, consultoria_id, conteudo, responsavel_comercial, responsavel_execucao, criado_em, criado_por',
    )
    .eq(col, registroId)
    .order('criado_em', { ascending: false })
    .limit(limit)
  if (error) throw error
  return (data || []) as unknown as HandoverVersao[]
}
