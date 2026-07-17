import { supabase } from '@/lib/supabase/client'

export interface SendContractEmailParams {
  to: string
  clientName: string
  repName?: string
  signatureLink: string
  contractUrl?: string
}

export const sendContractEmail = async (params: SendContractEmailParams) => {
  const { data, error } = await supabase.functions.invoke('send-contract-email', {
    body: params,
  })
  if (error) throw error
  return data
}
