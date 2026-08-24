import { supabase } from '@/lib/supabase/client'

const BUCKET = 'implementation-docs'
const MAX_FILE_SIZE = 15 * 1024 * 1024

export interface ImplementacaoArquivo {
  id: string
  implementacao_id: string
  file_path: string
  file_name: string
  file_size: number | null
  file_type: string | null
  created_at: string
}

export async function getArquivos(implementacaoId: string): Promise<ImplementacaoArquivo[]> {
  const { data, error } = await (supabase.from('implementacao_arquivos') as any)
    .select('*')
    .eq('implementacao_id', implementacaoId)
    .order('created_at', { ascending: false })
  if (error) throw error
  return (data || []) as unknown as ImplementacaoArquivo[]
}

export async function uploadArquivo(
  implementacaoId: string,
  file: File,
): Promise<ImplementacaoArquivo> {
  if (file.size > MAX_FILE_SIZE) {
    throw new Error(`Arquivo "${file.name}" excede o limite de 15MB`)
  }
  const safeName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_')
  const filePath = `${implementacaoId}/${Date.now()}-${safeName}`
  const { error: uploadError } = await supabase.storage
    .from(BUCKET)
    .upload(filePath, file, { upsert: false })
  if (uploadError) throw uploadError
  const { data, error } = await (supabase.from('implementacao_arquivos') as any)
    .insert({
      implementacao_id: implementacaoId,
      file_path: filePath,
      file_name: file.name,
      file_size: file.size,
      file_type: file.type,
    })
    .select()
    .single()
  if (error) throw error
  return data as unknown as ImplementacaoArquivo
}

export async function deleteArquivo(id: string, filePath: string): Promise<void> {
  const { error: storageError } = await supabase.storage.from(BUCKET).remove([filePath])
  if (storageError) throw storageError
  const { error } = await supabase
    .from('implementacao_arquivos' as any)
    .delete()
    .eq('id', id)
  if (error) throw error
}

export async function getArquivoSignedUrl(filePath: string): Promise<string | null> {
  const { data, error } = await supabase.storage.from(BUCKET).createSignedUrl(filePath, 3600)
  if (error || !data?.signedUrl) return null
  return data.signedUrl
}
