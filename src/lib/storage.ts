import { supabase } from '@/lib/supabase/client'

export function extractStoragePath(url: string, bucket: string): string | null {
  if (!url) return null

  const publicPattern = `/storage/v1/object/public/${bucket}/`
  const publicIdx = url.indexOf(publicPattern)
  if (publicIdx !== -1) {
    return decodeURIComponent(url.substring(publicIdx + publicPattern.length))
  }

  const signedPattern = `/storage/v1/object/sign/${bucket}/`
  const signedIdx = url.indexOf(signedPattern)
  if (signedIdx !== -1) {
    const pathPart = url.substring(signedIdx + signedPattern.length)
    const queryIdx = pathPart.indexOf('?')
    return decodeURIComponent(queryIdx !== -1 ? pathPart.substring(0, queryIdx) : pathPart)
  }

  return null
}

async function verifyFileExists(bucket: string, path: string): Promise<boolean> {
  const parts = path.split('/')
  const fileName = parts.pop()
  const folder = parts.join('/')

  const { data, error } = await supabase.storage
    .from(bucket)
    .list(folder || '', { limit: 100, search: fileName })

  if (error) return false
  return data?.some((item) => item.name === fileName) ?? false
}

export async function getSignedContractUrl(
  url: string | null,
): Promise<{ url: string | null; error: string | null }> {
  if (!url) return { url: null, error: 'Nenhum contrato anexado' }

  const path = extractStoragePath(url, 'contracts')
  if (!path) return { url: url, error: null }

  const exists = await verifyFileExists('contracts', path)
  if (!exists) {
    return { url: null, error: 'Documento não encontrado' }
  }

  const { data, error } = await supabase.storage.from('contracts').createSignedUrl(path, 3600)

  if (error || !data?.signedUrl) {
    const { data: publicData } = supabase.storage.from('contracts').getPublicUrl(path)
    if (publicData?.publicUrl) {
      return { url: publicData.publicUrl, error: null }
    }
    return { url: null, error: 'Documento não encontrado' }
  }

  return { url: data.signedUrl, error: null }
}
