import 'jsr:@supabase/functions-js/edge-runtime.d.ts'
import { Buffer } from 'node:buffer'
import pdf from 'npm:pdf-parse@1.1.1'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const MODULE_NAMES_MAP: Record<string, { id: string; canonicalName: string }> = {
  'Administração': { id: 'mod-admin', canonicalName: 'Administração' },
  'Administracao': { id: 'mod-admin', canonicalName: 'Administração' },
  'Básicos': { id: 'mod-basico', canonicalName: 'Básico' },
  'Basicos': { id: 'mod-basico', canonicalName: 'Básico' },
  'Básico': { id: 'mod-basico', canonicalName: 'Básico' },
  'Basico': { id: 'mod-basico', canonicalName: 'Básico' },
  'Carga': { id: 'mod-carga', canonicalName: 'Carga' },
  'Comercial': { id: 'mod-comercial', canonicalName: 'Comercial' },
  'Faturamento': { id: 'mod-faturamento', canonicalName: 'Faturamento' },
  'Financeiro': { id: 'mod-financeiro', canonicalName: 'Financeiro' },
  'EDI': { id: 'mod-edi', canonicalName: 'EDI' },
  'Controle de Viagem': { id: 'mod-ctrl-viagem', canonicalName: 'Controle de Viagem' },
  'Controle de Viagens': { id: 'mod-ctrl-viagem', canonicalName: 'Controle de Viagem' },
  'Patrimônio': { id: 'mod-patrimonio', canonicalName: 'Patrimônio' },
  'Patrimonio': { id: 'mod-patrimonio', canonicalName: 'Patrimônio' },
  'Frota (até 10 placas)': { id: 'mod-frota', canonicalName: 'Frota (até 10 placas)' },
  'Frota – Até 20 Placas': { id: 'mod-frota-20', canonicalName: 'Frota – Até 20 Placas' },
  'Frota - Até 20 Placas': { id: 'mod-frota-20', canonicalName: 'Frota – Até 20 Placas' },
  'Frota': { id: 'mod-frota', canonicalName: 'Frota (até 10 placas)' },
  'Medição': { id: 'mod-medicao', canonicalName: 'Medição' },
  'Medicao': { id: 'mod-medicao', canonicalName: 'Medição' },
  'Fracionado': { id: 'mod-fracionado', canonicalName: 'Fracionado' },
  'Bloco TCI e TCE (Transportes)': { id: 'mod-transp', canonicalName: 'Bloco TCI e TCE (Transportes)' },
  'Bloco TCI e TCE': { id: 'mod-transp', canonicalName: 'Bloco TCI e TCE (Transportes)' },
  'Fundo de proteção': { id: 'mod-fundo-prot', canonicalName: 'Fundo de proteção' },
  'Fundo de Protecao': { id: 'mod-fundo-prot', canonicalName: 'Fundo de proteção' },
  'Calendário': { id: 'mod-calendario', canonicalName: 'Calendário' },
  'Calendario': { id: 'mod-calendario', canonicalName: 'Calendário' },
  'Painel de Informações': { id: 'mod-painel', canonicalName: 'Painel de Informações' },
  'Painel de Informacoes': { id: 'mod-painel', canonicalName: 'Painel de Informações' },
  'Fiscal': { id: 'mod-fiscal', canonicalName: 'Fiscal' },
  'DF-e': { id: 'mod-dfe', canonicalName: 'DF-e' },
  'DFE': { id: 'mod-dfe', canonicalName: 'DF-e' },
  'BI WEB': { id: 'mod-powerbi', canonicalName: 'BI WEB' },
  'BI Web': { id: 'mod-powerbi', canonicalName: 'BI WEB' },
  'BI-WEB': { id: 'mod-powerbi', canonicalName: 'BI WEB' },
  'BIWEB': { id: 'mod-powerbi', canonicalName: 'BI WEB' },
  'Power BI': { id: 'mod-powerbi', canonicalName: 'BI WEB' },
  'PowerBI': { id: 'mod-powerbi', canonicalName: 'BI WEB' },
  'Power Bi': { id: 'mod-powerbi', canonicalName: 'BI WEB' },
  'SL-Trip': { id: 'mod-sltrip', canonicalName: 'SL-Trip' },
  'SL Trip': { id: 'mod-sltrip', canonicalName: 'SL-Trip' },
  'SL-Track': { id: 'mod-sltrack', canonicalName: 'SL-Track' },
  'SL Track': { id: 'mod-sltrack', canonicalName: 'SL-Track' },
  'Homologação Bancaria': { id: 'mod-homolog-banc', canonicalName: 'Homologação Bancaria' },
  'Homologação Bancária': { id: 'mod-homolog-banc', canonicalName: 'Homologação Bancaria' },
  'Homologacao Bancaria': { id: 'mod-homolog-banc', canonicalName: 'Homologação Bancaria' },
  'CIOT': { id: 'mod-ciot', canonicalName: 'CIOT' },
  'Torre de Controle Logística': { id: 'mod-torre-controle', canonicalName: 'Torre de Controle Logística' },
  'Torre de Controle': { id: 'mod-torre-controle', canonicalName: 'Torre de Controle Logística' }
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
      `\\b${keyword}\\b\\s*:?\\s*([\\s\\S]*?)(?=\\b(?:CONTRATADA|PRESTADORA|SERVICE\\s+LOGIC|SERVIÇO\\s+LOGIC|DO\\s+OBJETO|As\\s+partes\\s+acima|CLÁUSULA|CONSIDERANDO)\\b|$)`,
      'i',
    )
    const match = text.match(regex)
    if (match && match[1].trim().length > 10) {
      contratanteBlock = match[1]
    }
  }

  if (!contratanteBlock) {
    const fallbackMatch = text.match(/\bCONTRATANTE\b:?\s*([\s\S]*?)(?:CONTRATADA|As partes acima|DO OBJETO)/i)
    if (fallbackMatch) {
      contratanteBlock = fallbackMatch[1]
    }
  }

  if (contratanteBlock) {
    const block = contratanteBlock.replace(/\n/g, ' ')

    const nameMatch = block.match(/^\s*(.+?)(?:,|\bpessoa\b|\binscrita?\b|\bCNPJ\b|\bcom sede\b)/i)
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

    const addrMatch = block.match(/sede (?:na|em)\s*(.+?)\s*(?:,.*?neste ato|\.\s*Neste ato)/i)
    if (addrMatch) endereco = addrMatch[1].trim()

    const repNameMatch = block.match(/representantes? legais?[,\s]*(?:Sra?\.?|Sr\(a\)\.?)?\s*(.+?)\s*,/i)
    if (repNameMatch) repName = repNameMatch[1].trim()

    const repCpfMatch = block.match(/CPF.*?([\d.\-]{11,14})/)
    if (repCpfMatch) repCpf = repCpfMatch[1]

    const repRgMatch = block.match(/RG.*?([\d.\-A-Za-z]+)\s*(?:[.,]|$)/)
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
    const summaryPlanMatch = text.match(new RegExp(`Plano \\(${planoBase.replace('+', '\\+')}\\)\\s*R\\$\\s*([\\d.,]+)`, 'i'))
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
    ['mod-admin', 'mod-basico', 'mod-carga', 'mod-comercial', 'mod-faturamento', 'mod-financeiro'].forEach(m => {
      if (!modulos.includes(m)) modulos.push(m)
    })
  }

  let dataAssinatura: string | null = null
  const signatureMatches = [...text.matchAll(/Assinado como contratante em (\d{2}\/\d{2}\/\d{4})/gi)]
  if (signatureMatches.length > 0) {
    const lastMatch = signatureMatches[signatureMatches.length - 1][1]
    const parts = lastMatch.split('/')
    if (parts.length === 3) {
      dataAssinatura = `${parts[2]}-${parts[1]}-${parts[0]}`
    }
  }

  if (!dataAssinatura) {
    // Procura formatos genéricos tipo "Assinado eletronicamente em DD/MM/AAAA" ou "Data: DD/MM/AAAA"
    const genericDateMatch = text.match(/(?:assinado|assinatura|firmado)[^\d\n]{0,30}(\d{2}\/\d{2}\/\d{4})/i)
    if (genericDateMatch) {
      const parts = genericDateMatch[1].split('/')
      if (parts.length === 3) {
        dataAssinatura = `${parts[2]}-${parts[1]}-${parts[0]}`
      }
    }
  }

  // Extração de módulos com nomes canônicos e reconhecimento de módulos extras
  const modulosCanonicalNames: string[] = []
  for (const line of lines) {
    for (const [modKey, modDef] of Object.entries(MODULE_NAMES_MAP)) {
      if (line.toLowerCase().includes(modKey.toLowerCase()) && line.match(/\bX\b/i)) {
        if (!modulos.includes(modDef.id)) {
          modulos.push(modDef.id)
        }
        if (!modulosCanonicalNames.includes(modDef.canonicalName)) {
          modulosCanonicalNames.push(modDef.canonicalName)
        }
      }
    }
  }

  const defaultBasicCanonical: Record<string, string> = {
    'mod-admin': 'Administração',
    'mod-basico': 'Básico',
    'mod-carga': 'Carga',
    'mod-comercial': 'Comercial',
    'mod-faturamento': 'Faturamento',
    'mod-financeiro': 'Financeiro',
  }
  if (planoBase) {
    Object.entries(defaultBasicCanonical).forEach(([mId, mName]) => {
      if (!modulos.includes(mId)) modulos.push(mId)
      if (!modulosCanonicalNames.includes(mName)) modulosCanonicalNames.push(mName)
    })
  }

  // Extração de Filiais citadas no contrato
  const filiais: Array<{ nome: string; cnpj: string; isenta?: boolean }> = []
  const filialRegex = /Filial\s+(\d+|[A-Za-z0-9_-]+)?[^\n]*?([A-Z0-9À-ÿ\s.,&-]+?)\s*(\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2})/gi
  const filialMatches = [...text.matchAll(filialRegex)]
  for (const fm of filialMatches) {
    const fCnpj = formatCnpjStrict(fm[3])
    if (fCnpj !== cnpj && !isProviderName(fCnpj)) {
      let fNome = fm[2].trim().replace(/^Filial\s*\d*\s*/i, '').replace(/[\s,;-]+$/, '')
      if (!fNome || fNome.length < 3 || fNome.toLowerCase().includes('preencher')) {
        fNome = `Filial (${fCnpj})`
      }
      if (!filiais.some((f) => f.cnpj === fCnpj)) {
        filiais.push({
          nome: fNome,
          cnpj: fCnpj,
          isenta: fm[0].toLowerCase().includes('isenta'),
        })
      }
    }
  }

  // Se não achou pelo formato acima, procura por qualquer CNPJ que não seja o da matriz e não seja da prestadora
  if (filiais.length === 0) {
    const allCnpjs = [...text.matchAll(/\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2}/g)]
    for (const cm of allCnpjs) {
      const foundCnpj = cm[0]
      if (foundCnpj !== cnpj && !isProviderName(foundCnpj)) {
        const start = Math.max(0, (cm.index || 0) - 100)
        const context = text.substring(start, (cm.index || 0) + 100)
        if (context.toLowerCase().includes('filial') || context.toLowerCase().includes('coligada')) {
          if (!filiais.some((f) => f.cnpj === foundCnpj)) {
            filiais.push({
              nome: `Filial (${foundCnpj})`,
              cnpj: foundCnpj,
              isenta: context.toLowerCase().includes('isenta'),
            })
          }
        }
      }
    }
  }

  // Extração de vencimento mensal e vigência se presentes
  let vencimentoMensal: number | null = null
  const vencimentoMatch = text.match(/(?:dia|vencimento|vencerá no dia)\s*(\d{1,2})\s*(?:de cada mês|do mês)/i)
  if (vencimentoMatch) {
    const dia = parseInt(vencimentoMatch[1], 10)
    if (dia >= 1 && dia <= 31) {
      vencimentoMensal = dia
    }
  }

  let vigencia: string | null = null
  const vigenciaMatch = text.match(/(?:vigência|prazo de vigência)[^\.\n]{0,50}?(\d+\s*(?:meses|anos|dias|ano|mês|mes))/i)
  if (vigenciaMatch) {
    vigencia = vigenciaMatch[1].trim()
  }

  // Contatos (e-mail, telefone)
  let email: string | null = null
  const emailMatch = text.match(/\b([A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,})\b/)
  if (emailMatch && !isProviderName(emailMatch[1]) && !emailMatch[1].toLowerCase().includes('servicelogic')) {
    email = emailMatch[1].toLowerCase()
  }

  let telefone: string | null = null
  const telMatch = text.match(/(?:\btelefone|\bfone|\bcelular|\bcontato)[^\d\n]{0,20}(\(?\d{2}\)?\s*9?\d{4}[-\s]?\d{4})/i)
  if (telMatch) {
    telefone = telMatch[1].trim()
  }

  if (!cnpj && !nome && !planoBase && valorMensalidade === 0) {
    throw new Error(ERROR_MSG)
  }

  return {
    nome: nome || '',
    cnpj: cnpj || '',
    endereco,
    repName,
    repCpf,
    repRg,
    email,
    telefone,
    valor_total: valorMensalidade,
    valor_mensalidade: valorMensalidade,
    valor_implantacao: valorImplantacao,
    modulos,
    modulos_nomes: modulosCanonicalNames,
    planoBase,
    data_assinatura: dataAssinatura,
    vencimento_mensal: vencimentoMensal,
    vigencia,
    filiais,
    detalhes: {
      valorPlano: valorMensalidade,
      numFiliais: filiais.length,
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
