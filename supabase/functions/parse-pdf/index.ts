import 'jsr:@supabase/functions-js/edge-runtime.d.ts'
import { Buffer } from 'node:buffer'
import pdf from 'npm:pdf-parse@1.1.1'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const MODULE_NAMES_MAP: Record<string, string> = {
  Administração: 'mod-admin',
  Básicos: 'mod-basico',
  Carga: 'mod-carga',
  Comercial: 'mod-comercial',
  Faturamento: 'mod-faturamento',
  Financeiro: 'mod-financeiro',
  EDI: 'mod-edi',
  'Controle de Viagem': 'mod-ctrl-viagem',
  'Frota (até 10 placas)': 'mod-frota',
  'Frota – Até 20 Placas': 'mod-frota-20',
  Frota: 'mod-frota',
  Medição: 'mod-medicao',
  Fracionado: 'mod-fracionado',
  'Bloco TCI e TCE': 'mod-transp',
  'Fundo de proteção': 'mod-fundo-prot',
  Calendário: 'mod-calendario',
  'Painel de Informações': 'mod-painel',
  Fiscal: 'mod-fiscal',
  'DF-e': 'mod-dfe',
  'Power BI': 'mod-powerbi',
  'SL-Trip': 'mod-sltrip',
  'SL-Track': 'mod-sltrack',
  'Homologação Bancaria': 'mod-homolog-banc',
  CIOT: 'mod-ciot',
  'Torre de Controle Logística': 'mod-torre-controle',
}

const ERROR_MSG =
  'Não foi possível identificar o padrão do contrato. Verifique o arquivo e tente novamente.'

const PROVIDER_PATTERNS = [
  'SERVICE LOGIC',
  'SERVIÇO LOGIC',
  'SERVIC LOGIC',
  'SERVICE LOGIC TECNOLOGIA',
  'SERVICE LOGIC TECNOLOGIA LTDA',
]

function isProviderName(name: string): boolean {
  const upper = name.toUpperCase()
  return PROVIDER_PATTERNS.some((p) => upper.includes(p.toUpperCase()))
}

function parseCurrency(val: string): number {
  return parseFloat(val.replace(/\./g, '').replace(',', '.')) || 0
}

function formatCnpjStrict(raw: string): string {
  const digits = raw.replace(/\D/g, '')
  if (digits.length === 14) {
    return `${digits.slice(0, 2)}.${digits.slice(2, 5)}.${digits.slice(5, 8)}/${digits.slice(8, 12)}-${digits.slice(12, 14)}`
  }
  return raw
}

function extractData(text: string) {
  let nome: string | null = null
  let cnpj: string | null = null
  let endereco: string | null = null
  let repName: string | null = null
  let repCpf: string | null = null
  let repRg: string | null = null

  const clientKeywords = ['CONTRATANTE', 'CLIENTE', 'TOMADOR']

  let contratanteBlock: string | null = null

  for (const keyword of clientKeywords) {
    if (contratanteBlock) break
    const regex = new RegExp(
      `${keyword}\\s*:?\\s*([\\s\\S]*?)(?=\\b(?:CONTRATADA|PRESTADORA|SERVICE\\s+LOGIC|SERVIÇO\\s+LOGIC|DO\\s+OBJETO|As\\s+partes\\s+acima|CLÁUSULA|CONSIDERANDO)\\b|$)`,
      'i',
    )
    const match = text.match(regex)
    if (match && match[1].trim().length > 10) {
      contratanteBlock = match[1]
    }
  }

  if (!contratanteBlock) {
    const fallbackMatch = text.match(
      /CONTRATANTE:?\s*([\s\S]*?)(?:CONTRATADA|As partes acima|DO OBJETO)/i,
    )
    if (fallbackMatch) {
      contratanteBlock = fallbackMatch[1]
    }
  }

  if (contratanteBlock) {
    const block = contratanteBlock.replace(/\n/g, ' ')

    const nameMatch = block.match(/^\s*(.+?)(?:,|\binscrita?\b|\bCNPJ\b|\bcom sede\b)/i)
    if (nameMatch) {
      let rawName = nameMatch[1].trim()
      rawName = rawName.replace(/^[^a-zA-ZÀ-ÿ0-9]+/, '')
      rawName = rawName.replace(/[^a-zA-ZÀ-ÿ0-9]+$/, '')
      rawName = rawName.replace(/^"(.+)"$/, '$1')
      if (!isProviderName(rawName)) {
        nome = rawName.trim()
      }
    }

    if (!nome) {
      const altNameMatch = block.match(/([A-Z][A-ZÀ-ÿ0-9\s,.]+(?:LTDA|S\.?A\.?|ME|EPP|EIRELI))/i)
      if (altNameMatch) {
        const altName = altNameMatch[1].trim()
        if (!isProviderName(altName)) nome = altName
      }
    }

    const cnpjMatch = block.match(/(?:\bCNPJ[^\d]*?|)(\d{2}\.?\d{3}\.?\d{3}\/?\d{4}-?\d{2})/i)
    if (cnpjMatch) {
      cnpj = formatCnpjStrict(cnpjMatch[1])
    }

    if (!cnpj) {
      const unformattedCnpjMatch = block.match(/CNPJ[:\s]*(\d{14})/i)
      if (unformattedCnpjMatch) {
        cnpj = formatCnpjStrict(unformattedCnpjMatch[1])
      }
    }

    const addrMatch = block.match(/sede na\s*(.+?)\s*,.*?neste ato/i)
    if (addrMatch) endereco = addrMatch[1].trim()

    const repNameMatch = block.match(/representantes? legais? Sr\.?\s*(.+?)\s*,/i)
    if (repNameMatch) repName = repNameMatch[1].trim()

    const repCpfMatch = block.match(/CPF.*?([\d.\-]{11,14})/)
    if (repCpfMatch) repCpf = repCpfMatch[1]

    const repRgMatch = block.match(/RG.*?([\d.\-A-Za-z]+)\s*\./)
    if (repRgMatch) repRg = repRgMatch[1]
  }

  if (!cnpj) {
    for (const keyword of clientKeywords) {
      if (cnpj) break
      const regex = new RegExp(
        `${keyword}[\\s\\S]{0,500}?(\\d{2}\\.?\\d{3}\\.?\\d{3}\\/?\\d{4}-?\\d{2})`,
        'i',
      )
      const match = text.match(regex)
      if (match) {
        cnpj = formatCnpjStrict(match[1])
      }
    }
  }

  if (!cnpj) {
    const allCnpjs = [...text.matchAll(/\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2}/g)]
    for (const cnpjMatch of allCnpjs) {
      const start = Math.max(0, (cnpjMatch.index || 0) - 200)
      const context = text.substring(start, (cnpjMatch.index || 0) + cnpjMatch[0].length + 50)
      if (!isProviderName(context)) {
        cnpj = cnpjMatch[0]
        break
      }
    }
    if (!cnpj && allCnpjs.length > 0) {
      cnpj = allCnpjs[0][0]
    }
  }

  let planoBase: string | null = null
  const planLines = text.match(/(?:TMS-\d+(?:\+)?|MTS-\d+).*?R\$\s*[\d.,]+.*?R\$\s*[\d.,]+.*?X/gi)
  if (planLines && planLines.length > 0) {
    const matchedPlan = planLines[planLines.length - 1].match(/(TMS-\d+(?:\+)?|MTS-\d+)/i)
    if (matchedPlan) planoBase = matchedPlan[1].toUpperCase()
  }

  if (!planoBase) {
    const summaryPlanMatch = text.match(/Plano \((TMS-\d+(?:\+)?|MTS-\d+)\)/i)
    if (summaryPlanMatch) {
      planoBase = summaryPlanMatch[1].toUpperCase()
    }
  }

  let valorMensalidade = 0
  let valorImplantacao = 0

  const mensalMatch = text.match(/Total Mensal Inicial\s*R\$\s*([\d.,]+)/i)
  if (mensalMatch) valorMensalidade = parseCurrency(mensalMatch[1])

  const implMatch = text.match(/Total Visitas \/ Implantação\s*R\$\s*([\d.,]+)/i)
  if (implMatch) valorImplantacao = parseCurrency(implMatch[1])

  if (valorMensalidade === 0 && planoBase) {
    const summaryPlanMatch = text.match(
      new RegExp(`Plano \\(${planoBase.replace('+', '\\+')}\\)\\s*R\\$\\s*([\\d.,]+)`, 'i'),
    )
    if (summaryPlanMatch) {
      valorMensalidade = parseCurrency(summaryPlanMatch[1])
    }
  }

  const modulos: string[] = []
  const lines = text.split('\n')
  for (const line of lines) {
    for (const [modName, modId] of Object.entries(MODULE_NAMES_MAP)) {
      if (line.toLowerCase().includes(modName.toLowerCase()) && line.match(/\bX\b/i)) {
        if (!modulos.includes(modId)) {
          modulos.push(modId)
        }
      }
    }
  }
  if (planoBase) {
    ;[
      'mod-admin',
      'mod-basico',
      'mod-carga',
      'mod-comercial',
      'mod-faturamento',
      'mod-financeiro',
    ].forEach((m) => {
      if (!modulos.includes(m)) modulos.push(m)
    })
  }

  let dataAssinatura: string | null = null
  const signatureMatches = [
    ...text.matchAll(/Assinado como contratante em (\d{2}\/\d{2}\/\d{4})/gi),
  ]
  if (signatureMatches.length > 0) {
    const lastMatch = signatureMatches[signatureMatches.length - 1][1]
    const parts = lastMatch.split('/')
    if (parts.length === 3) {
      dataAssinatura = `${parts[2]}-${parts[1]}-${parts[0]}`
    }
  }

  if (!cnpj && !nome && !planoBase && valorMensalidade === 0) {
    throw new Error(ERROR_MSG)
  }

  return {
    nome: nome || 'Empresa não identificada',
    cnpj: cnpj || '',
    endereco,
    repName,
    repCpf,
    repRg,
    valor_total: valorMensalidade,
    valor_mensalidade: valorMensalidade,
    valor_implantacao: valorImplantacao,
    modulos,
    planoBase,
    data_assinatura: dataAssinatura,
    detalhes: {
      valorPlano: valorMensalidade,
      numFiliais: 0,
      valorFiliais: 0,
      valorModulos: 0,
    },
  }
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const formData = await req.formData()
    const file = formData.get('file') as File
    if (!file) throw new Error('Nenhum arquivo enviado.')
    if (file.type !== 'application/pdf') throw new Error('Apenas arquivos PDF são aceitos.')

    const arrayBuffer = await file.arrayBuffer()
    const buffer = new Uint8Array(arrayBuffer)

    let extractedText = ''
    try {
      const data = await pdf(Buffer.from(buffer))
      extractedText = data.text
    } catch {
      throw new Error('Falha ao extrair texto do PDF.')
    }

    if (!extractedText || extractedText.trim().length < 50) throw new Error(ERROR_MSG)

    const extractedData = extractData(extractedText)

    return new Response(JSON.stringify({ success: true, data: extractedData }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
