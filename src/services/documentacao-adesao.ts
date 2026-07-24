import { supabase } from '@/lib/supabase/client'
import { ADESAO_CHECKLIST } from '@/lib/document-requirements'

export interface DocumentacaoAdesaoItem {
  id: string
  cliente_id: string
  categoria: string
  item: string
  status: string
  arquivo_url: string | null
  uploaded_at: string | null
  observacoes: string | null
  created_at: string
  updated_at: string
}

export interface DocumentacaoStatusCliente {
  id: string
  cliente_id: string
  status_geral: string
  created_at: string
  updated_at: string
}

export async function ensureChecklistForClient(
  clienteId: string,
): Promise<DocumentacaoAdesaoItem[]> {
  const { data: existing, error } = await supabase
    .from('documentacao_adesao')
    .select('*')
    .eq('cliente_id', clienteId)
    .order('created_at', { ascending: true })

  if (error) throw error
  const existingItems = (existing || []) as DocumentacaoAdesaoItem[]

  const existingKeys = new Set(existingItems.map((e) => `${e.categoria}|${e.item}`))
  const missingRows = ADESAO_CHECKLIST.flatMap((cat) =>
    cat.items
      .filter((item) => !existingKeys.has(`${cat.category}|${item.label}`))
      .map((item) => ({
        cliente_id: clienteId,
        categoria: cat.category,
        item: item.label,
        status: 'Pendente',
        arquivo_url: null,
        uploaded_at: null,
        observacoes: null,
      })),
  )

  if (missingRows.length > 0) {
    const { data: newRows, error: insertError } = await supabase
      .from('documentacao_adesao')
      .insert(missingRows)
      .select('*')
    if (insertError) throw insertError
    return [...existingItems, ...((newRows || []) as DocumentacaoAdesaoItem[])]
  }

  return existingItems
}

export async function getStatusCliente(
  clienteId: string,
): Promise<DocumentacaoStatusCliente | null> {
  const { data, error } = await supabase
    .from('documentacao_status_cliente')
    .select('*')
    .eq('cliente_id', clienteId)
    .maybeSingle()
  if (error) throw error
  return data as DocumentacaoStatusCliente | null
}

export async function ensureStatusCliente(clienteId: string): Promise<DocumentacaoStatusCliente> {
  const existing = await getStatusCliente(clienteId)
  if (existing) return existing
  const { data, error } = await supabase
    .from('documentacao_status_cliente')
    .insert({ cliente_id: clienteId })
    .select('*')
    .single()
  if (error) throw error
  return data as DocumentacaoStatusCliente
}

export async function updateStatusCliente(clienteId: string, statusGeral: string): Promise<void> {
  await ensureStatusCliente(clienteId)
  const { error } = await supabase
    .from('documentacao_status_cliente')
    .update({ status_geral: statusGeral, updated_at: new Date().toISOString() })
    .eq('cliente_id', clienteId)
  if (error) throw error
}

export async function uploadDocumentacaoFile(
  clienteId: string,
  itemId: string,
  file: File,
): Promise<string> {
  const fileExt = file.name.split('.').pop()?.toLowerCase() || 'file'
  const fileName = `${clienteId}/${itemId}/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`

  const { error: uploadError } = await supabase.storage
    .from('documentos_adesao')
    .upload(fileName, file)
  if (uploadError) throw uploadError

  const { data: publicUrlData } = supabase.storage.from('documentos_adesao').getPublicUrl(fileName)

  const { error: updateError } = await supabase
    .from('documentacao_adesao')
    .update({
      arquivo_url: publicUrlData.publicUrl,
      uploaded_at: new Date().toISOString(),
      status: 'Recebida',
      updated_at: new Date().toISOString(),
    })
    .eq('id', itemId)
  if (updateError) throw updateError

  return publicUrlData.publicUrl
}

export async function updateItemStatus(
  itemId: string,
  status: string,
  observacoes?: string,
): Promise<void> {
  const update: Record<string, any> = { status, updated_at: new Date().toISOString() }
  if (observacoes !== undefined) update.observacoes = observacoes
  const { error } = await supabase.from('documentacao_adesao').update(update).eq('id', itemId)
  if (error) throw error
}

export async function removeDocumentacaoFile(itemId: string): Promise<void> {
  const { error } = await supabase
    .from('documentacao_adesao')
    .update({
      arquivo_url: null,
      uploaded_at: null,
      status: 'Pendente',
      updated_at: new Date().toISOString(),
    })
    .eq('id', itemId)
  if (error) throw error
}
