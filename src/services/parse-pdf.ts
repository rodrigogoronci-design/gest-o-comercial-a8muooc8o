import { supabase } from '@/lib/supabase/client'

export const parsePdfContract = async (file: File) => {
  const formData = new FormData()
  formData.append('file', file)

  const {
    data: { session },
  } = await supabase.auth.getSession()

  const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/parse-pdf`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${session?.access_token}`,
    },
    body: formData,
  })

  const result = await response.json()
  if (!response.ok) throw new Error(result.error || 'Failed to parse PDF')
  return result.data
}
