import 'jsr:@supabase/functions-js/edge-runtime.d.ts'
import { createClient } from 'jsr:@supabase/supabase-js@2'
import { Buffer } from 'node:buffer'
import pdf from 'npm:pdf-parse@1.1.1'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL') || ''
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''
    const supabase = createClient(supabaseUrl, supabaseKey)

    const formData = await req.formData()
    const file = formData.get('file') as File

    if (!file) throw new Error('Nenhum arquivo enviado.')

    const arrayBuffer = await file.arrayBuffer()
    const buffer = new Uint8Array(arrayBuffer)

    let extractedText = ''
    try {
      const data = await pdf(Buffer.from(buffer))
      extractedText = data.text
    } catch (e) {
      console.error('Error parsing PDF', e)
    }

    // 1. Extração de CNPJ e Nome
    const cnpjMatch = extractedText.match(/\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2}/)
    const cnpj = cnpjMatch ? cnpjMatch[0] : `00.000.000/0001-${Math.floor(10 + Math.random() * 89)}`

    const nameMatch = extractedText.match(/(?:CONTRATANTE|Matriz)\s*:?\s*([^\.,\n0-9]+)/i)
    let nome = nameMatch ? nameMatch[1].trim() : file.name.replace('.pdf', '')

    // 2. Extração de Filiais
    // Procura por linhas de Filial que contenham um CNPJ preenchido
    const filiaisMatches = [
      ...extractedText.matchAll(/Filial[\s\S]{1,50}?(\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2})/gi),
    ]
    const numFiliais = filiaisMatches.length
    const valorFiliais = numFiliais * 199.0

    // 3. Extração do Plano Base
    let planoBase = 'TMS 50'
    let valorPlano = 400.0

    const plans = [
      { name: 'TMS 10000+', price: 3200.0 },
      { name: 'TMS 5000+', price: 2487.0 },
      { name: 'TMS 5000', price: 2087.0 },
      { name: 'TMS 3000', price: 1757.0 },
      { name: 'TMS 1000', price: 1427.0 },
      { name: 'TMS 500', price: 1097.0 },
      { name: 'TMS 300', price: 877.0 },
      { name: 'TMS 100', price: 657.0 },
      { name: 'TMS 50', price: 400.0 },
    ]

    for (const plan of plans) {
      // Heurística: procura o nome do plano seguido de 'Contratado' e um 'X' ou 'x' em algum lugar próximo
      const regex = new RegExp(
        `${plan.name.replace('+', '\\+')}[\\s\\S]{0,300}?Contratado[\\s\\S]{0,100}?[xX]`,
        'i',
      )
      if (regex.test(extractedText)) {
        planoBase = plan.name
        valorPlano = plan.price
        break
      }
    }

    // 4. Extração de Módulos
    let modulos: { name: string; price: number }[] = []
    let valorModulos = 0.0

    const modulosAdicionaisRegex = [
      { name: 'Fiscal', regex: /Fiscal[\s\S]{0,30}?[xX][\s\S]{0,30}?R\$\s*(\d+(?:[.,]\d+)?)/i },
      { name: 'Power BI', regex: /B\.?I\.?[\s\S]{0,30}?[xX][\s\S]{0,30}?R\$\s*(\d+(?:[.,]\d+)?)/i },
      { name: 'EDI', regex: /EDI[\s\S]{0,30}?[xX][\s\S]{0,30}?R\$\s*(\d+(?:[.,]\d+)?)/i },
      {
        name: 'Controle de Viagem',
        regex: /Controle de Viagem[\s\S]{0,30}?[xX][\s\S]{0,30}?R\$\s*(\d+(?:[.,]\d+)?)/i,
      },
      {
        name: 'Frota (até 10 placas)*',
        regex: /Frota[\s\S]{0,30}?[xX][\s\S]{0,30}?R\$\s*(\d+(?:[.,]\d+)?)/i,
      },
      { name: 'Medição', regex: /Medição[\s\S]{0,30}?[xX][\s\S]{0,30}?R\$\s*(\d+(?:[.,]\d+)?)/i },
      {
        name: 'Fracionado',
        regex: /Fracionado[\s\S]{0,30}?[xX][\s\S]{0,30}?R\$\s*(\d+(?:[.,]\d+)?)/i,
      },
      {
        name: 'Transporte (Bloco/TCE/TCI)',
        regex: /Transporte[\s\S]{0,30}?[xX][\s\S]{0,30}?R\$\s*(\d+(?:[.,]\d+)?)/i,
      },
      {
        name: 'Fundo de proteção',
        regex: /Fundo de prote[cç][aã]o[\s\S]{0,30}?[xX][\s\S]{0,30}?R\$\s*(\d+(?:[.,]\d+)?)/i,
      },
      {
        name: 'Patrimonio',
        regex: /Patrim[oô]nio[\s\S]{0,30}?[xX][\s\S]{0,30}?R\$\s*(\d+(?:[.,]\d+)?)/i,
      },
      {
        name: 'Calendário',
        regex: /Calend[aá]rio[\s\S]{0,30}?[xX][\s\S]{0,30}?R\$\s*(\d+(?:[.,]\d+)?)/i,
      },
      {
        name: 'Painel de Informações',
        regex: /Painel de Informa[cç][õo]es[\s\S]{0,30}?[xX][\s\S]{0,30}?R\$\s*(\d+(?:[.,]\d+)?)/i,
      },
      { name: 'DF-e', regex: /Df-e[\s\S]{0,30}?[xX][\s\S]{0,30}?R\$\s*(\d+(?:[.,]\d+)?)/i },
      { name: 'SL-Trip', regex: /SL-Trip[\s\S]{0,30}?[xX][\s\S]{0,30}?R\$\s*(\d+(?:[.,]\d+)?)/i },
      {
        name: 'Homologação Bancaria',
        regex:
          /Homologa[cç][aã]o Banc[aá]ria[\s\S]{0,30}?[xX][\s\S]{0,30}?R\$\s*(\d+(?:[.,]\d+)?)/i,
      },
      { name: 'SL-Track', regex: /SL-Track[\s\S]{0,30}?[xX][\s\S]{0,30}?R\$\s*(\d+(?:[.,]\d+)?)/i },
    ]

    modulosAdicionaisRegex.forEach((mod) => {
      const match = extractedText.match(mod.regex)
      if (match) {
        const valorStr = match[1].replace('.', '').replace(',', '.')
        const preco = parseFloat(valorStr)
        if (!modulos.some((m) => m.name === mod.name)) {
          modulos.push({ name: mod.name, price: preco })
        }
        valorModulos += preco
      }
    })

    const valor_total = valorPlano + valorFiliais + valorModulos

    const fileName = `${crypto.randomUUID()}.pdf`
    const { error: uploadError } = await supabase.storage
      .from('contratos')
      .upload(fileName, file, { contentType: 'application/pdf' })

    if (uploadError) throw uploadError

    const { data: publicUrlData } = supabase.storage.from('contratos').getPublicUrl(fileName)
    const contrato_url = publicUrlData.publicUrl

    return new Response(
      JSON.stringify({
        success: true,
        data: {
          nome,
          cnpj,
          contrato_url,
          valor_total,
          modulos,
          planoBase,
          detalhes: {
            valorPlano,
            numFiliais,
            valorFiliais,
            valorModulos,
          },
        },
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      },
    )
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
