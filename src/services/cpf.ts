import { supabase } from '@/lib/supabase/client'

export interface CpfLookupResult {
  nome: string
  nome_mae: string
  nome_pai: string
  data_nascimento: string
  endereco: string
}

export interface CpfLookupResponse {
  data: CpfLookupResult | null
  error: string | null
  notFound: boolean
}

export async function fetchCpfData(cpf: string): Promise<CpfLookupResponse> {
  const cleanCpf = cpf.replace(/\D/g, '')

  if (cleanCpf.length !== 11) {
    return { data: null, error: 'CPF deve conter 11 dígitos.', notFound: false }
  }

  try {
    const { data, error } = await supabase.functions.invoke('fetch-cpf-data', {
      body: { cpf: cleanCpf },
    })

    if (error) {
      return {
        data: null,
        error: 'Serviço de consulta indisponível. Preencha os dados manualmente.',
        notFound: false,
      }
    }

    if (data?.error) {
      const notFound =
        data.error.includes('não encontrado') || data.error.includes('nao encontrados')
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
      error: 'Não foi possível conectar ao serviço de consulta CPF.',
      notFound: false,
    }
  }
}
