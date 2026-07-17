import 'jsr:@supabase/functions-js/edge-runtime.d.ts'
import { corsHeaders } from '../_shared/cors.ts'

interface CnpjData {
  nome: string
  email: string
  telefone: string
  endereco: string
}

async function fetchFromBrasilAPI(cleanCnpj: string): Promise<CnpjData> {
  const res = await fetch(`https://brasilapi.com.br/api/cnpj/v1/${cleanCnpj}`, {
    signal: AbortSignal.timeout(8000),
  })
  if (!res.ok) {
    if (res.status === 404) throw new Error('CNPJ_NAO_ENCONTRADO')
    throw new Error(`BrasilAPI error: ${res.status}`)
  }
  const d = await res.json()
  const addr = [d.logradouro, d.numero, d.bairro, d.municipio, d.uf].filter(Boolean).join(', ')
  return {
    nome: d.razao_social || d.nome_fantasia || '',
    email: d.email || '',
    telefone: d.ddd_telefone_1 || '',
    endereco: addr,
  }
}

async function fetchFromReceitaWS(cleanCnpj: string): Promise<CnpjData> {
  const res = await fetch(`https://receitaws.com.br/v1/cnpj/${cleanCnpj}`, {
    headers: { Accept: 'application/json' },
    signal: AbortSignal.timeout(8000),
  })
  if (!res.ok) {
    if (res.status === 404) throw new Error('CNPJ_NAO_ENCONTRADO')
    throw new Error(`ReceitaWS error: ${res.status}`)
  }
  const d = await res.json()
  if (d.status === 'ERROR') throw new Error('CNPJ_NAO_ENCONTRADO')
  const addr = [d.logradouro, d.numero, d.bairro, d.municipio, d.uf].filter(Boolean).join(', ')
  return {
    nome: d.nome || d.fantasia || '',
    email: d.email || '',
    telefone: d.telefone || '',
    endereco: addr,
  }
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { cnpj }: { cnpj: string } = await req.json()
    const cleanCnpj = (cnpj || '').replace(/\D/g, '')

    if (cleanCnpj.length !== 14) {
      return new Response(JSON.stringify({ error: 'CNPJ inválido. Deve conter 14 dígitos.' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    let data: CnpjData | null = null
    let errors: string[] = []

    try {
      data = await fetchFromBrasilAPI(cleanCnpj)
    } catch (e) {
      errors.push(`BrasilAPI: ${(e as Error).message}`)
      if ((e as Error).message === 'CNPJ_NAO_ENCONTRADO') {
        return new Response(
          JSON.stringify({
            error: 'CNPJ não encontrado. Por favor, verifique os dados ou preencha manualmente.',
          }),
          { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
        )
      }
    }

    if (!data) {
      try {
        data = await fetchFromReceitaWS(cleanCnpj)
      } catch (e) {
        errors.push(`ReceitaWS: ${(e as Error).message}`)
        if ((e as Error).message === 'CNPJ_NAO_ENCONTRADO') {
          return new Response(
            JSON.stringify({
              error: 'CNPJ não encontrado. Por favor, verifique os dados ou preencha manualmente.',
            }),
            { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
          )
        }
      }
    }

    if (!data) {
      return new Response(
        JSON.stringify({
          error: 'Serviço de consulta indisponível no momento. Preencha os dados manualmente.',
          details: errors.join('; '),
        }),
        { status: 503, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      )
    }

    return new Response(JSON.stringify({ success: true, data }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (error: any) {
    return new Response(JSON.stringify({ error: 'Erro interno ao processar a solicitação.' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
