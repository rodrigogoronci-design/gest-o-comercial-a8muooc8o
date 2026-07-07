import { supabase } from '@/lib/supabase/client'

export interface CnpjLookupResult {
  nome: string
  email: string
  telefone: string
  endereco: string
}

export interface CnpjLookupResponse {
  data: CnpjLookupResult | null
  error: string | null
  notFound: boolean
}

export async function fetchCnpjData(cnpj: string): Promise<CnpjLookupResponse> {
  const cleanCnpj = cnpj.replace(/\D/g, '')

  if (cleanCnpj.length !== 14) {
    return { data: null, error: 'CNPJ deve conter 14 dígitos.', notFound: false }
  }

  try {
    const { data, error } = await supabase.functions.invoke('fetch-cnpj-data', {
      body: { cnpj: cleanCnpj },
    })

    if (error) {
      return {
        data: null,
        error: 'Serviço de consulta indisponível. Preencha os dados manualmente.',
        notFound: false,
      }
    }

    if (data?.error) {
      const notFound = data.error.includes('não encontrado')
      return { data: null, error: data.error, notFound }
    }

    if (data?.success && data?.data) {
      return { data: data.data, error: null, notFound: false }
    }

    return {
      data: null,
      error: 'Resposta inesperada do serviço de consulta.',
      notFound: false,
    }
  } catch {
    return {
      data: null,
      error: 'Não foi possível conectar ao serviço de consulta CNPJ.',
      notFound: false,
    }
  }
}
