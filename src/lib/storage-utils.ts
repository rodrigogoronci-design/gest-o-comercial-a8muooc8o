import { supabase } from '@/lib/supabase/client'

const CONTRACTS_BUCKET = 'contracts'

export function extractStoragePath(url: string | null): string | null {
  if (!url) return null
  if (!url.startsWith('http')) return url

  try {
    const parsed = new URL(url)
    const match = parsed.pathname.match(/\/storage\/v1\/object\/(?:public|signed)\/contracts\/(.+)/)
    if (match && match[1]) return decodeURIComponent(match[1])
    return null
  } catch {
    return null
  }
}

export async function getSignedContractUrl(contratoUrl: string | null): Promise<string | null> {
  if (!contratoUrl) return null

  const path = extractStoragePath(contratoUrl)
  if (!path) return contratoUrl

  const { data, error } = await supabase.storage.from(CONTRACTS_BUCKET).createSignedUrl(path, 3600)

  if (error || !data?.signedUrl) return null
  return data.signedUrl
}

export async function checkContractExists(contratoUrl: string | null): Promise<boolean> {
  if (!contratoUrl) return false

  const path = extractStoragePath(contratoUrl)
  if (!path) return true

  const folder = path.includes('/') ? path.substring(0, path.lastIndexOf('/')) : ''
  const fileName = path.includes('/') ? path.substring(path.lastIndexOf('/') + 1) : path

  const { data, error } = await supabase.storage
    .from(CONTRACTS_BUCKET)
    .list(folder || undefined, { limit: 1000 })

  if (error) return false
  return data?.some((item) => item.name === fileName) ?? false
}
