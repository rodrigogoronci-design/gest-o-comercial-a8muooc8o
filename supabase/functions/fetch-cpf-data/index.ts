import 'jsr:@supabase/functions-js/edge-runtime.d.ts'
import { corsHeaders } from '../_shared/cors.ts'

interface CpfData {
  nome: string
  nome_mae: string
  nome_pai: string
  data_nascimento: string
  endereco: string
}

function validateCpf(cpf: string): boolean {
  if (cpf.length !== 11) return false
  if (/^(\d)\1{10}$/.test(cpf)) return false
  let sum = 0
  for (let i = 0; i < 9; i++) sum += parseInt(cpf[i]) * (10 - i)
  let rem = (sum * 10) % 11
  if (rem === 10) rem = 0
  if (rem !== parseInt(cpf[9])) return false
  sum = 0
  for (let i = 0; i < 10; i++) sum += parseInt(cpf[i]) * (11 - i)
  rem = (sum * 10) % 11
  if (rem === 10) rem = 0
  if (rem !== parseInt(cpf[10])) return false
  return true
}

async function fetchFromBrasilAPI(cleanCpf: string): Promise<CpfData> {
  const res = await fetch(`https://brasilapi.com.br/api/cpf/v1/${cleanCpf}`, {
    signal: AbortSignal.timeout(8000),
  })
  if (!res.ok) {
    if (res.status === 404) throw new Error('CPF_NAO_ENCONTRADO')
    throw new Error(`BrasilAPI error: ${res.status}`)
  }
  const d = await res.json()
  return {
    nome: d.nome || '',
    nome_mae: d.nome_mae || '',
    nome_pai: '',
    data_nascimento: d.data_nascimento || '',
    endereco: '',
  }
}

async function fetchFromExternal(cleanCpf: string): Promise<CpfData> {
  const res = await fetch(`https://api.invertexto.com/v1/cpf/${cleanCpf}`, {
    signal: AbortSignal.timeout(8000),
  })
  if (!res.ok) {
    if (res.status === 404) throw new Error('CPF_NAO_ENCONTRADO')
    throw new Error(`External API error: ${res.status}`)
  }
  const d = await res.json()
  return {
    nome: d.nome || d.name || '',
    nome_mae: d.nome_mae || d.mae || '',
    nome_pai: d.nome_pai || d.pai || '',
    data_nascimento: d.data_nascimento || d.birth_date || '',
    endereco: d.endereco || d.address || '',
  }
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }
  try {
    const { cpf }: { cpf: string } = await req.json()
    const cleanCpf = (cpf || '').replace(/\D/g, '')

    if (cleanCpf.length !== 11) {
      return new Response(JSON.stringify({ error: 'CPF inválido. Deve conter 11 dígitos.' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    if (!validateCpf(cleanCpf)) {
      return new Response(
        JSON.stringify({ error: 'CPF inválido. Dígitos verificadores não conferem.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      )
    }

    let data: CpfData | null = null
    const errors: string[] = []

    try {
      data = await fetchFromBrasilAPI(cleanCpf)
    } catch (e) {
      errors.push(`BrasilAPI: ${(e as Error).message}`)
      if ((e as Error).message === 'CPF_NAO_ENCONTRADO') {
        return new Response(
          JSON.stringify({ error: 'CPF não encontrado. Por favor, preencha manualmente.' }),
          { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
        )
      }
    }

    if (!data) {
      try {
        data = await fetchFromExternal(cleanCpf)
      } catch (e) {
        errors.push(`External: ${(e as Error).message}`)
        if ((e as Error).message === 'CPF_NAO_ENCONTRADO') {
          return new Response(
            JSON.stringify({ error: 'CPF não encontrado. Por favor, preencha manualmente.' }),
            { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
          )
        }
      }
    }

    if (!data) {
      return new Response(
        JSON.stringify({
          error: 'Dados não encontrados automaticamente. Por favor, preencha manualmente.',
          details: errors.join('; '),
        }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      )
    }

    if (!data.nome) {
      return new Response(
        JSON.stringify({
          error: 'Dados não encontrados automaticamente. Por favor, preencha manualmente.',
        }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      )
    }

    return new Response(JSON.stringify({ success: true, data }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch {
    return new Response(JSON.stringify({ error: 'Erro interno ao processar a solicitação.' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
