import 'jsr:@supabase/functions-js/edge-runtime.d.ts'
import { createClient } from 'npm:@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'

interface LeadPayload {
  nome?: unknown
  empresa?: unknown
  whatsapp?: unknown
  email?: unknown
  cidade_estado?: unknown
  quantidade_veiculos?: unknown
  dificuldade?: unknown
  mensagem?: unknown
}

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

Deno.serve(async (req: Request) => {
  // CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  if (req.method !== 'POST') {
    return new Response(
      JSON.stringify({ ok: false, error: 'Método não permitido. Use POST.' }),
      {
        status: 405,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      },
    )
  }

  try {
    let body: LeadPayload
    try {
      body = await req.json()
    } catch {
      return new Response(
        JSON.stringify({ ok: false, error: 'JSON inválido no corpo da requisição.' }),
        {
          status: 400,
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json',
          },
        },
      )
    }

    const nome = typeof body.nome === 'string' ? body.nome.trim() : ''
    const empresa = typeof body.empresa === 'string' ? body.empresa.trim() : ''
    const whatsapp = typeof body.whatsapp === 'string' ? body.whatsapp.trim() : ''
    const email = typeof body.email === 'string' ? body.email.trim() : ''
    const cidadeEstado =
      typeof body.cidade_estado === 'string' ? body.cidade_estado.trim() : ''
    const quantidadeVeiculosRaw =
      body.quantidade_veiculos !== undefined && body.quantidade_veiculos !== null
        ? String(body.quantidade_veiculos).trim()
        : ''
    const dificuldade =
      typeof body.dificuldade === 'string' ? body.dificuldade.trim() : ''
    const mensagem =
      typeof body.mensagem === 'string' ? body.mensagem.trim() : ''

    // Validação dos campos obrigatórios
    const missing: string[] = []
    if (!nome) missing.push('nome')
    if (!empresa) missing.push('empresa')
    if (!whatsapp) missing.push('whatsapp')
    if (!email) missing.push('email')
    if (!cidadeEstado) missing.push('cidade_estado')
    if (!quantidadeVeiculosRaw) missing.push('quantidade_veiculos')
    if (!dificuldade) missing.push('dificuldade')

    if (missing.length > 0) {
      return new Response(
        JSON.stringify({
          ok: false,
          error: `Campos obrigatórios ausentes: ${missing.join(', ')}`,
          missing,
        }),
        {
          status: 400,
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json',
          },
        },
      )
    }

    // Validação de formato de e-mail simples
    if (!EMAIL_REGEX.test(email)) {
      return new Response(
        JSON.stringify({
          ok: false,
          error: 'Formato de e-mail inválido.',
        }),
        {
          status: 400,
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json',
          },
        },
      )
    }

    // Formatação da quantidade de veículos:
    // "se mensagem vazia, omitir a parte 'Mensagem:'; se quantidade não numérica, incluir como veio"
    // Formato exato: "≈25 veículos · Dificuldade: Pneus · Mensagem: ..."
    const qtdClean = quantidadeVeiculosRaw.replace(/\s+/g, '')
    const isDigitsOnly = /^\d+$/.test(qtdClean)
    const veiculosTexto = isDigitsOnly ? `≈${qtdClean} veículos` : `${quantidadeVeiculosRaw} veículos`

    const obsParts: string[] = [
      veiculosTexto,
      `Dificuldade: ${dificuldade}`,
    ]

    if (mensagem) {
      obsParts.push(`Mensagem: ${mensagem}`)
    }

    const observacoes = obsParts.join(' · ')

    // Inicializar cliente Supabase usando Service Role (sem RLS bypass restritivo, acesso interno do servidor)
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ''
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''

    if (!supabaseUrl || !supabaseServiceKey) {
      console.error('Configuração do servidor incompleta: SUPABASE_URL ou SUPABASE_SERVICE_ROLE_KEY ausente.')
      return new Response(
        JSON.stringify({ ok: false, error: 'Erro de configuração do servidor.' }),
        {
          status: 500,
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json',
          },
        },
      )
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    })

    // Mapeamento para o CRM (campos existentes na tabela crm_prospects):
    // Nome → contato_nome
    // Empresa → empresa
    // WhatsApp → telefone
    // E-mail → email
    // Cidade e Estado → endereco
    // Quantidade de veículos + Principal dificuldade + Mensagem → observacoes
    // Status do lead: "Novo Lead"
    // Classificação: "Frio"
    // Origem: "Landing Page — Consultoria de Frota"
    const { error: insertError } = await supabase.from('crm_prospects').insert({
      empresa,
      contato_nome: nome,
      telefone: whatsapp,
      email,
      endereco: cidadeEstado,
      observacoes,
      status: 'Novo Lead',
      classificacao: 'Frio',
      origem: 'Landing Page — Consultoria de Frota',
    })

    if (insertError) {
      console.error('Erro ao gravar lead no CRM:', insertError.message)
      return new Response(
        JSON.stringify({ ok: false, error: 'Erro ao processar o cadastro do lead.' }),
        {
          status: 500,
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json',
          },
        },
      )
    }

    return new Response(
      JSON.stringify({ ok: true }),
      {
        status: 200,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      },
    )
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err)
    console.error('Exceção inesperada em receber-lead:', errorMsg)
    return new Response(
      JSON.stringify({ ok: false, error: 'Erro interno ao processar a requisição.' }),
      {
        status: 500,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      },
    )
  }
})
