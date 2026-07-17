import { supabase } from '@/lib/supabase/client'

export interface ExtractedContractData {
  nome: string
  cnpj: string
  endereco?: string | null
  repName?: string | null
  repCpf?: string | null
  repRg?: string | null
  valor_total: number
  valor_mensalidade?: number
  valor_implantacao?: number
  modulos: string[]
  planoBase?: string | null
  data_assinatura?: string | null
  detalhes?: {
    valorPlano: number
    numFiliais: number
    valorFiliais: number
    valorModulos: number
  }
}

export const parsePdfContract = async (file: File): Promise<ExtractedContractData> => {
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
  return result.data as ExtractedContractData
}
