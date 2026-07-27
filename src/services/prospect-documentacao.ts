import { supabase } from '@/lib/supabase/client'
import { ADESAO_CHECKLIST } from '@/lib/document-requirements'

export interface ProspectDocumentacaoItem {
  id: string
  prospect_id: string
  categoria: string
  item: string
  status: string
  observacoes: string | null
  arquivo_url: string | null
  created_at: string
  updated_at: string
}

export async function ensureChecklistForProspect(
  prospectId: string,
): Promise<ProspectDocumentacaoItem[]> {
  const { data: existing, error } = await supabase
    .from('prospect_documentacao')
    .select('*')
    .eq('prospect_id', prospectId)
    .order('created_at', { ascending: true })
  if (error) throw error
  const existingItems = (existing || []) as ProspectDocumentacaoItem[]

  const existingKeys = new Set(existingItems.map((e) => `${e.categoria}|${e.item}`))
  const missingRows = ADESAO_CHECKLIST.flatMap((cat) =>
    cat.items
      .filter((item) => !existingKeys.has(`${cat.category}|${item.label}`))
      .map((item) => ({
        prospect_id: prospectId,
        categoria: cat.category,
        item: item.label,
        status: 'Aguardando',
        observacoes: null,
        arquivo_url: null,
      })),
  )

  if (missingRows.length > 0) {
    const { data: newRows, error: insertError } = await supabase
      .from('prospect_documentacao')
      .insert(missingRows)
      .select('*')
    if (insertError) throw insertError
    return [...existingItems, ...((newRows || []) as ProspectDocumentacaoItem[])]
  }
  return existingItems
}

export async function uploadProspectDocumentFile(
  prospectId: string,
  itemId: string,
  file: File,
): Promise<string> {
  const fileExt = file.name.split('.').pop()?.toLowerCase() || 'file'
  const fileName = `${prospectId}/${itemId}/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`
  const { error: uploadError } = await supabase.storage
    .from('prospect-documents')
    .upload(fileName, file)
  if (uploadError) throw uploadError
  const { data: publicUrlData } = supabase.storage.from('prospect-documents').getPublicUrl(fileName)
  const { error: updateError } = await supabase
    .from('prospect_documentacao')
    .update({
      arquivo_url: publicUrlData.publicUrl,
      status: 'Recebido',
      updated_at: new Date().toISOString(),
    })
    .eq('id', itemId)
  if (updateError) throw updateError
  return publicUrlData.publicUrl
}

export async function updateProspectItemStatus(itemId: string, status: string): Promise<void> {
  const { error } = await supabase
    .from('prospect_documentacao')
    .update({ status, updated_at: new Date().toISOString() })
    .eq('id', itemId)
  if (error) throw error
}

export async function updateProspectItemObservacoes(
  itemId: string,
  observacoes: string,
): Promise<void> {
  const { error } = await supabase
    .from('prospect_documentacao')
    .update({ observacoes: observacoes || null, updated_at: new Date().toISOString() })
    .eq('id', itemId)
  if (error) throw error
}

export async function removeProspectDocumentFile(itemId: string): Promise<void> {
  const { error } = await supabase
    .from('prospect_documentacao')
    .update({
      arquivo_url: null,
      status: 'Aguardando',
      updated_at: new Date().toISOString(),
    })
    .eq('id', itemId)
  if (error) throw error
}

export async function checkAllMandatoryApproved(prospectId: string): Promise<boolean> {
  const { data, error } = await supabase
    .from('prospect_documentacao')
    .select('status')
    .eq('prospect_id', prospectId)
  if (error) throw error
  return (data || []).every((item) => item.status === 'Aprovado')
}

export async function transferDocumentacaoToCliente(
  prospectId: string,
  clienteId: string,
): Promise<void> {
  const { data: items, error } = await supabase
    .from('prospect_documentacao')
    .select('*')
    .eq('prospect_id', prospectId)
  if (error) throw error
  if (!items || items.length === 0) return

  const rows = items.map((item) => ({
    cliente_id: clienteId,
    categoria: item.categoria,
    item: item.item,
    status:
      item.status === 'Aguardando'
        ? 'Pendente'
        : item.status === 'Recebido'
          ? 'Recebida'
          : 'Aprovada',
    arquivo_url: item.arquivo_url,
    observacoes: item.observacoes,
  }))

  const { error: insertError } = await supabase.from('documentacao_adesao').insert(rows)
  if (insertError) throw insertError

  const { error: statusError } = await supabase
    .from('documentacao_status_cliente')
    .upsert(
      { cliente_id: clienteId, status_geral: 'Documentação recebida' },
      { onConflict: 'cliente_id' },
    )
  if (statusError) throw statusError
}
