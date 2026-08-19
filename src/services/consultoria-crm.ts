import { supabase } from '@/lib/supabase/client'
import { CONSULTORIA_DEFAULT_TITULO, CONSULTORIA_DEFAULT_TEXTO } from '@/lib/consultoria-config'

export interface ConsultoriaProject {
  id: string
  cliente_id: string | null
  consultoria_titulo: string | null
  consultoria_texto: string | null
  consultoria_form_data: Record<string, any> | null
  consultoria_token: string | null
  status: string
  created_at: string
  clientes?: { nome: string; cnpj: string | null } | null
  // Handover Comercial
  handover_comercial: string | null
  handover_atualizado_em: string | null
  handover_atualizado_por: string | null
}

const SELECT_FIELDS =
  'id, cliente_id, consultoria_titulo, consultoria_texto, consultoria_form_data, consultoria_token, status, created_at, clientes(nome, cnpj), handover_comercial, handover_atualizado_em, handover_atualizado_por'

export async function getConsultorias(): Promise<ConsultoriaProject[]> {
  const { data, error } = await supabase
    .from('implementacoes' as any)
    .select(SELECT_FIELDS)
    .eq('tipo', 'consultoria')
    .order('created_at', { ascending: false })
  if (error) throw error
  return (data || []) as ConsultoriaProject[]
}

export async function getConsultoria(id: string): Promise<ConsultoriaProject | null> {
  const { data, error } = await supabase
    .from('implementacoes' as any)
    .select(SELECT_FIELDS)
    .eq('id', id)
    .single()
  if (error) {
    if (error.code === 'PGRST116') return null
    throw error
  }
  return data as ConsultoriaProject
}

export async function createConsultoria(clienteId: string): Promise<ConsultoriaProject> {
  const { data, error } = await supabase
    .from('implementacoes' as any)
    .insert({
      cliente_id: clienteId,
      tipo: 'consultoria',
      status: 'Em andamento',
      progresso: 0,
      consultoria_titulo: CONSULTORIA_DEFAULT_TITULO,
      consultoria_texto: CONSULTORIA_DEFAULT_TEXTO,
    })
    .select(SELECT_FIELDS)
    .single()
  if (error) throw error
  return data as ConsultoriaProject
}

export interface ConsultoriaUpdateInput {
  consultoria_titulo?: string | null
  consultoria_texto?: string | null
  status?: string | null
  handover_comercial?: string | null
  handover_atualizado_em?: string | null
  handover_atualizado_por?: string | null
}

export async function updateConsultoria(
  id: string,
  updates: ConsultoriaUpdateInput,
): Promise<void> {
  const { error } = await supabase
    .from('implementacoes' as any)
    .update(updates)
    .eq('id', id)
  if (error) throw error
}

export function getConsultoriaProjectName(clientName: string): string {
  return `Service Logic | ${clientName}`
}
