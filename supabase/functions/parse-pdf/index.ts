import 'jsr:@supabase/functions-js/edge-runtime.d.ts'
import { Buffer } from 'node:buffer'
import pdf from 'npm:pdf-parse@1.1.1'
import { corsHeaders } from '../_shared/cors.ts'

const ERROR_MSG =
  'Não foi possível identificar o padrão do contrato. Verifique o arquivo e tente novamente.'

const PROVIDER_CNPJS = [
  '27.751.577/0001-91',
  '27751577000191',
]

const PROVIDER_PATTERNS = [
  'SERVICE LOGIC',
  'SERVIÇO LOGIC',
  'SERVIC LOGIC',
  'SERVICE LOGIC TECNOLOGIA',
  'SERVICE LOGIC TECNOLOGIA LTDA',
  'CONTACTO SOLUÇÕES EM TECNOLOGIA',
  'CONTACTO SOLUCOES EM TECNOLOGIA',
  'CONTACTO SOLUÇÕES',
  'CONTACTO SOLUCOES',
]

function isProviderName(name: string): boolean {
  if (!name) return false
  const upper = name.toUpperCase()
  return PROVIDER_PATTERNS.some((p) => upper.includes(p))
}

function isProviderCnpj(cnpjVal: string): boolean {
  const digits = (cnpjVal || '').replace(/\D/g, '')
  return PROVIDER_CNPJS.some((p) => p.replace(/\D/g, '') === digits)
}

function parseCurrency(val: string): number {
  if (!val) return 0
  return parseFloat(val.replace(/\./g, '').replace(',', '.')) || 0
}

function formatCnpjStrict(raw: string): string {
  const digits = raw.replace(/\D/g, '')
  if (digits.length === 14) {
    return `${digits.slice(0, 2)}.${digits.slice(2, 5)}.${digits.slice(5, 8)}/${digits.slice(8, 12)}-${digits.slice(12, 14)}`
  }
  return raw
}

/**
 * Remove rodapés recorrentes do Docsales e paginação antes de processar blocos.
 * Preserva o conteúdo do Relatório de Assinaturas para extração de data e signatários.
 */
function cleanContractText(raw: string): string {
  return raw
    .replace(/Docsales ID:\s*[a-f0-9\-]+/gi, '')
    .replace(/Página\s+\d+\s+de\s+\d+/gi, '')
    .replace(/Av\. Central[^\n]+www\.servicelogic\.com\.br/gi, '')
}

export function extractData(rawText: string) {
  const text = cleanContractText(rawText)

  let nome: string | null = null
  let cnpj: string | null = null
  let endereco: string | null = null
  let repName: string | null = null
  let repCpf: string | null = null
  let repRg: string | null = null

  // 1. Extração da CONTRATANTE (Cliente)
  // O texto tem:
  // "CONTRATANTE: \n SM TRANSPORTES LTDA, pessoa jurídica de direito privado, inscrita no CNPJ sob o nº 55.625.017/0001-26, com sede \n Rodovia Governador Mario Covas, s/n – Garagem – Km 173 – BR 101 Norte – Jacupemba – Aracruz – ES – CEP: \n 29.196-010., neste ato representado pelos seus representantes legais Sr MAXILENO TELLES BOZI..."
  // Importante: no texto da página 1 há DEFINIÇÕES antes que contêm a palavra "contratante".
  // Por isso, procuramos especificamente a seção isolada: "\nCONTRATANTE:\s*\n" ou "\bCONTRATANTE:\s*"
  const contratanteMatch = text.match(
    /(?:^|\n)\s*CONTRATANTE\s*:\s*([\s\S]*?)(?=(?:^|\n)\s*CONTRATADA\s*:|CLÁUSULA\s+PRIMEIRA|As\s+partes\s+acima)/i,
  )

  let contratanteBlock = contratanteMatch ? contratanteMatch[1].trim() : ''

  if (contratanteBlock) {
    const lines = contratanteBlock
      .split('\n')
      .map((l) => l.trim())
      .filter((l) => l.length > 0)

    for (const line of lines) {
      if (isProviderName(line)) continue
      // Procura linha que contém a empresa
      const nameMatch = line.match(/^([A-Z0-9À-ÿ\s.&-]+?)(?:,|\bpessoa\b|\binscrita?\b|\bCNPJ\b|\bcom\s+sede\b)/i)
      if (nameMatch) {
        let candidate = nameMatch[1].trim()
        // Evita lixo
        candidate = candidate.replace(/^[^a-zA-Z0-9]+/, '').replace(/[^a-zA-Z0-9]+$/, '')
        if (candidate.length > 3 && !isProviderName(candidate)) {
          nome = candidate
          break
        }
      } else if (/LTDA|S\.?A\.?|ME|EPP|EIRELI/i.test(line)) {
        let candidate = line.replace(/,.*$/, '').trim()
        candidate = candidate.replace(/^[^a-zA-Z0-9]+/, '').replace(/[^a-zA-Z0-9]+$/, '')
        if (!isProviderName(candidate)) {
          nome = candidate
          break
        }
      }
    }

    // CNPJ do CONTRATANTE
    const cnpjMatch = contratanteBlock.match(/(\d{2}\.?\d{3}\.?\d{3}\/?\d{4}-?\d{2})/)
    if (cnpjMatch && !isProviderCnpj(cnpjMatch[1])) {
      cnpj = formatCnpjStrict(cnpjMatch[1])
    }

    // Endereço do CONTRATANTE: "com sede ..." até "neste ato"
    const addrMatch = contratanteBlock.match(/com\s+sede\s+([\s\S]+?)(?=(?:,|\.)?\s*neste\s+ato\s+representad[oa]|\n\n)/i)
    if (addrMatch) {
      let rawAddr = addrMatch[1].replace(/\r?\n/g, ' ').replace(/\s+/g, ' ').trim()
      rawAddr = rawAddr.replace(/[.,;]+$/, '').trim()
      if (rawAddr.length > 5) {
        endereco = rawAddr
      }
    }

    // Representante Legal do CONTRATANTE
    const repMatch = contratanteBlock.match(/representantes?\s+legais?[,\s]*(?:Sra?\.?|Sr\(a\)\.?)?\s*([A-ZÀ-ÿ\s]+?)(?:,|\binscrito|\bportador)/i)
    if (repMatch) {
      const candidate = repMatch[1].replace(/\r?\n/g, ' ').replace(/\s+/g, ' ').trim()
      if (candidate.length > 3 && !candidate.toUpperCase().includes('CONTRATADA')) {
        repName = candidate
      }
    }

    const cpfMatch = contratanteBlock.match(/CPF[^\d]*?([\d.\-]{11,14})/)
    if (cpfMatch) {
      repCpf = cpfMatch[1].trim()
    }

    const rgMatch = contratanteBlock.match(/RG[^\d]*?([\d.\-A-Za-z]+)\s*(?:[.,]|$)/)
    if (rgMatch) {
      repRg = rgMatch[1].trim()
    }
  }

  // Fallback para CNPJ da Matriz na tabela de empresas (cláusula 5.3) caso não tenha pego no cabeçalho
  if (!cnpj) {
    const matrizTableMatch = text.match(/Matriz\s+([A-ZÀ-ÿ0-9\s.,&-]+?)\s+(\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2})/i)
    if (matrizTableMatch && !isProviderCnpj(matrizTableMatch[2])) {
      cnpj = formatCnpjStrict(matrizTableMatch[2])
      if (!nome) {
        nome = matrizTableMatch[1].replace(/\r?\n/g, ' ').trim()
      }
    }
  }

  // 2. Extração de Plano e Valores
  // 2.1 Cláusula 5.1: Tabela de Franquias
  // Ex: "TMS-50 TMS-100 ... TMS-5000+ \n ... \n Contratado \n x"
  let planoBase: string | null = null

  // Identificação no bloco 5.22: "Plano Valor Mensal ... TMS-WEB R$ 400,00"
  let valorMensalidade = 0
  let valorImplantacao = 0

  const bloco522Match = text.match(/5\.22\)\s*Valor[\s\S]*?(?=CLÁUSULA\s+SEXTA|$)/i)
  if (bloco522Match) {
    const bText = bloco522Match[0]

    // Mensalidade TMS-WEB ou outro
    const planLineMatch = bText.match(/(TMS-[A-Za-z0-9+]+|MTS-[A-Za-z0-9+]+)\s*R\$\s*([\d.,]+)/i)
    if (planLineMatch) {
      if (!planoBase) planoBase = planLineMatch[1].toUpperCase()
      if (!valorMensalidade) valorMensalidade = parseCurrency(planLineMatch[2])
    }

    // Total mensal explícito no bloco: "Total: R$ 400,00"
    const totalMensalMatch = bText.match(/Total:\s*R\$\s*([\d.,]+)/i)
    if (totalMensalMatch) {
      const v = parseCurrency(totalMensalMatch[1])
      if (v > 0) valorMensalidade = v
    }

    // Implantação / treinamento
    const implMatch = bText.match(/Implantação\/treinamento\s*R\$\s*([\d.,]+)/i)
    if (implMatch) {
      valorImplantacao = parseCurrency(implMatch[1])
    }
  }

  // Se o plano ainda não foi identificado, analisa a tabela da cláusula 5.1
  if (!planoBase) {
    const t51Match = text.match(/PLANOS\s*\*?[\s\S]*?(?=\(\*\)\s*Módulos\s+inclusos|5\.2\))/i)
    if (t51Match) {
      const tableText = t51Match[0]
      const planColsMatch = tableText.match(/PLANOS\*?\s*([\s\S]*?)(?=\*\*|\n\n)/i)
      const contratadoLineMatch = tableText.match(/Contratado\s*([\s\S]*?)$/i)
      if (planColsMatch && contratadoLineMatch) {
        const planNames = planColsMatch[1].trim().split(/\s+/).filter((p) => /TMS|MTS/i.test(p))
        const marks = contratadoLineMatch[1].trim().split(/\s+/)
        const xIndex = marks.findIndex((m) => m.toLowerCase() === 'x')
        if (xIndex >= 0 && xIndex < planNames.length) {
          planoBase = planNames[xIndex].toUpperCase()
        }
      }
    }
  }

  // Fallback geral de mensalidade se bloco 5.22 não preencheu
  if (valorMensalidade === 0) {
    const fallbackMensal = text.match(/mensalidade\s*pelo\s*direito[^\n]*?R\$\s*([\d.,]+)/i)
    if (fallbackMensal) {
      valorMensalidade = parseCurrency(fallbackMensal[1])
    }
  }

  // 3. Módulos Inclusos e Adicionais
  // Modelo Service Logic (SL TMS-WEB):
  // Tabela da Página 4:
  // "Módulos inclusos Contratado Implantação ..."
  // Administração X X 10
  // Básico X X
  // ...
  // "Adicionais R$ / Mês"
  // Fiscal R$ 00,00 X 4
  // B.I. R$ 00,00 X 2
  // ...
  const modulosInclusosPadrao = [
    'Administração',
    'Básico',
    'Carga',
    'Comercial',
    'Faturamento',
    'Financeiro',
  ]

  const modulosCanonicalNames: string[] = []

  // Normalização oficial para o catálogo Service Logic
  const canonicalMap: Record<string, string> = {
    'ADMINISTRAÇÃO': 'Administração',
    'ADMINISTRACAO': 'Administração',
    'BÁSICO': 'Básico',
    'BASICO': 'Básico',
    'CARGA': 'Carga',
    'COMERCIAL': 'Comercial',
    'FATURAMENTO': 'Faturamento',
    'FINANCEIRO': 'Financeiro',
    'FISCAL': 'Fiscal',
    'B.I.': 'BI WEB',
    'BI': 'BI WEB',
    'BI WEB': 'BI WEB',
    'POWER BI': 'BI WEB',
    'EDI': 'EDI',
    'CONTROLE DE VIAGEM': 'Controle de Viagem',
    'CONTROLE DE VIAGENS': 'Controle de Viagem',
    'FROTA': 'Frota (até 10 placas)',
    'FROTA (ATÉ 10 PLACAS)': 'Frota (até 10 placas)',
    'FROTA – ATÉ 20 PLACAS': 'Frota – Até 20 Placas',
    'MEDIÇÃO': 'Medição',
    'MEDICAO': 'Medição',
    'FRACIONADO': 'Fracionado',
    'TRANSPORTE (BLOCO/TCE/TCI)': 'Transporte (Bloco TCI/TCE)',
    'TRANSPORTE (BLOCO TCI/TCE)': 'Transporte (Bloco TCI/TCE)',
    'BLOCO TCI E TCE (TRANSPORTES)': 'Transporte (Bloco TCI/TCE)',
    'FUNDO DE PROTEÇÃO': 'Fundo de proteção',
    'FUNDO DE PROTECAO': 'Fundo de proteção',
    'PATRIMÔNIO': 'Patrimônio',
    'PATRIMONIO': 'Patrimônio',
    'CALENDÁRIO': 'Calendário',
    'CALENDARIO': 'Calendário',
    'PAINEL DE INFORMAÇÕES': 'Painel de Informações',
    'PAINEL DE INFORMACOES': 'Painel de Informações',
    'DF-E': 'DF-e',
    'DFE': 'DF-e',
    'SL-TRIP': 'SL-Trip',
    'SL TRIP': 'SL-Trip',
    'SL-TRACK': 'SL-Track',
    'SL TRACK': 'SL-Track',
    'HOMOLOGAÇÃO BANCARIA': 'Homologação Bancaria',
    'HOMOLOGAÇÃO BANCÁRIA': 'Homologação Bancaria',
    'CIOT': 'CIOT',
    'TORRE DE CONTROLE LOGÍSTICA': 'Torre de Controle Logística',
    'TORRE DE CONTROLE': 'Torre de Controle Logística',
  }

  // Verifica explicitamente módulos na tabela da Cláusula 5.7 / Página 4
  // No layout do pdf-parse, a tabela de adicionais aparece assim:
  // "Fiscal \n R$ 00,00 \n X \n 4"
  // "B.I. \n R$ 00,00 \n X \n 2"
  // "EDI \n R$ 00,00 \n X \n 4"
  // etc.
  const adicionaisCandidates = [
    'Fiscal',
    'B.I.',
    'EDI',
    'Controle de Viagem',
    'Frota',
    'Medição',
    'Fracionado',
    'Transporte (Bloco/TCE/TCI)',
    'Fundo de proteção',
    'Patrimônio',
    'Calendário',
    'Painel de Informações',
    'Df-e',
    'SL-Trip',
    'SL-Track',
    'CIOT',
  ]

  // Se houver menção aos módulos inclusos nos planos (cláusula 5.1 ou tabela página 4), inclui os 6 básicos
  if (
    text.includes('Módulos inclusos nos Planos: Administração, Básico, Carga, Comercial, Faturamento, Financeiro') ||
    text.includes('SL TMS-WEB') ||
    planoBase
  ) {
    modulosInclusosPadrao.forEach((m) => {
      if (!modulosCanonicalNames.includes(m)) {
        modulosCanonicalNames.push(m)
      }
    })
  }

  // Detecção de módulos adicionais marcados com "X" na coluna "Contratado" da tabela "Adicionais R$ / Mês"
  // No contrato analisado da Service Logic (Página 4):
  // Colunas da tabela:
  // [Nome do Módulo] | [Contratado (com "X" se contratado)] | [R$ / Mês] | [Implantação: Remoto, Híbrido, Presencial] | [H / H]
  //
  // No texto do PDF extraído pelo pdf-parse:
  // Para Adicionais:
  // "Fiscal \n R$ 00,00 \n X \n 4"
  // O "X" que aparece aqui está na coluna Implantação ("Remoto"), NÃO na coluna Contratado!
  // Note que "Contratado" fica VAZIO antes de "R$ 00,00", e "X" vem logo após "R$ 00,00" (na coluna Remoto).
  //
  // Quando o módulo é CONTRATADO:
  // O "X" aparece ANTES do valor "R$ / Mês", exatamente como na tabela de módulos inclusos:
  // "Administração \n X \n X \n 10"  -> 1º X = Contratado, 2º X = Remoto, 10 = H/H!
  // "Básico \n X \n X" -> 1º X = Contratado, 2º X = Remoto!
  //
  // Já nos adicionais não contratados:
  // "Fiscal \n R$ 00,00 \n X \n 4" -> Não há "X" antes de "R$ 00,00"!
  // Se fosse contratado, viria:
  // "Fiscal \n X \n R$ ... \n X \n 4"
  //
  // Portanto:
  // Só é considerado adicional CONTRATADO se houver a marca "X" entre o nome do módulo e o valor R$ / Mês:
  // `${escaped}\\s*\\n?\\s*X\\s*\\n?\\s*R\\$\\s*[\\d.,]+`
  for (const modName of adicionaisCandidates) {
    const escaped = modName.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&')
    // Verifica se há "X" ANTES de "R$" (coluna Contratado)
    const contratadoRegex = new RegExp(`${escaped}\\s*\\n?\\s*X\\s*\\n?\\s*R\\$\\s*[\\d.,]+`, 'i')
    if (contratadoRegex.test(text)) {
      const canonical = canonicalMap[modName.toUpperCase()] || modName
      if (!modulosCanonicalNames.includes(canonical)) {
        modulosCanonicalNames.push(canonical)
      }
    }
  }

  // 4. Vencimento Mensal
  // Cláusula 5.9: "valor mensal com vencimento para todo dia 01 de cada mês"
  let vencimentoMensal: number | null = null
  const vencMatch = text.match(/vencimento\s+(?:para\s+)?(?:todo\s+)?dia\s*(\d{1,2})\s*de\s+cada\s+mês/i)
  if (vencMatch) {
    const d = parseInt(vencMatch[1], 10)
    if (d >= 1 && d <= 31) vencimentoMensal = d
  } else {
    const fallbackVenc = text.match(/(?:todo\s+)?dia\s*(\d{1,2})\s*de\s+cada\s+mês/i)
    if (fallbackVenc) {
      const d = parseInt(fallbackVenc[1], 10)
      if (d >= 1 && d <= 31) vencimentoMensal = d
    }
  }

  // 5. Vigência do Contrato
  // Cláusula 5.20: "Esse contrato tem a vigência de 12 meses"
  let vigencia: string | null = null
  const vigenciaMatch = text.match(/vigência\s+de\s*(\d+\s*meses|\d+\s*ano[s]?)/i)
  if (vigenciaMatch) {
    vigencia = vigenciaMatch[1].trim()
  }

  // 6. Filiais Citadas (Tabela "Empresas Matriz / Filial")
  // Exemplo:
  // "Empresas \n Matriz \n SM TRANSPORTES LTDA 55.625.017/0001-26 \n Filial Obs..."
  const filiais: Array<{ nome: string; cnpj: string; isenta?: boolean }> = []
  const filialTableMatch = text.match(/Empresas[\s\S]*?Matriz[\s\S]*?(?=5\.4\)|CLÁUSULA\s+SEXTA)/i)
  if (filialTableMatch) {
    const filialSection = filialTableMatch[0]
    // Procura por linhas "Filial ... [CNPJ]"
    const filialLines = filialSection.matchAll(/Filial\s+([A-ZÀ-ÿ0-9\s.,&-]+?)\s*(\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2})/gi)
    for (const fl of filialLines) {
      const fCnpj = formatCnpjStrict(fl[2])
      if (fCnpj !== cnpj && !isProviderCnpj(fCnpj)) {
        let fNome = fl[1].trim()
        if (!fNome || fNome.length < 3 || fNome.toLowerCase().includes('obs')) {
          fNome = `Filial (${fCnpj})`
        }
        if (!filiais.some((f) => f.cnpj === fCnpj)) {
          filiais.push({
            nome: fNome,
            cnpj: fCnpj,
            isenta: fl[0].toLowerCase().includes('isenta'),
          })
        }
      }
    }
  }

  // 7. Data de Assinatura e E-mail / Contatos
  // Relatório de Assinaturas (Docsales) no final do PDF:
  // "MAXILENO TELLES BOZI \n Assinado como contratante em 06/03/2026 às 11:09. \n CPF: 114.054.557-48 \n ... \n E-mail: memservicosflorestais@outlook.com"
  let dataAssinatura: string | null = null
  let email: string | null = null
  let telefone: string | null = null

  // Data de assinatura do CONTRATANTE
  const dateContratanteMatch = text.match(/Assinado\s+como\s+contratante\s+em\s+(\d{2})\/(\d{2})\/(\d{4})/i)
  if (dateContratanteMatch) {
    const [, dd, mm, yyyy] = dateContratanteMatch
    dataAssinatura = `${yyyy}-${mm}-${dd}`
  } else {
    // Fallback: qualquer data de assinatura no documento
    const genericAssinaturaMatch = text.match(/em\s+(\d{2})\/(\d{2})\/(\d{4})\s+às\s+\d{2}:\d{2}/i)
    if (genericAssinaturaMatch) {
      const [, dd, mm, yyyy] = genericAssinaturaMatch
      dataAssinatura = `${yyyy}-${mm}-${dd}`
    }
  }

  // E-mail do Contratante no Relatório de Assinaturas
  const emailContratanteBlockMatch = text.match(/Assinado\s+como\s+contratante[\s\S]{0,300}?E-mail:\s*([A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,})/i)
  if (emailContratanteBlockMatch && !isProviderName(emailContratanteBlockMatch[1])) {
    email = emailContratanteBlockMatch[1].toLowerCase().trim()
  } else {
    // Fallback geral de e-mail que não seja da Service Logic
    const allEmails = [...text.matchAll(/\b([A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,})\b/g)]
    for (const em of allEmails) {
      const val = em[1].toLowerCase()
      if (!val.includes('servicelogic') && !val.includes('docsales')) {
        email = val
        break
      }
    }
  }

  // Validação mínima de sanidade
  if (!cnpj && !nome && !planoBase && valorMensalidade === 0) {
    throw new Error(ERROR_MSG)
  }

  return {
    nome: nome || 'Não identificado no contrato',
    cnpj: cnpj || 'Não identificado no contrato',
    endereco: endereco || 'Não identificado no contrato',
    repName: repName || 'Não identificado no contrato',
    repCpf: repCpf || 'Não identificado no contrato',
    repRg: repRg || 'Não identificado no contrato',
    email: email || 'Não identificado no contrato',
    telefone: telefone || 'Não identificado no contrato',
    planoBase: planoBase || 'Não identificado no contrato',
    valor_total: valorMensalidade,
    valor_mensalidade: valorMensalidade,
    valor_implantacao: valorImplantacao,
    vencimento_mensal: vencimentoMensal,
    data_assinatura: dataAssinatura,
    vigencia: vigencia || 'Não identificado no contrato',
    modulos: modulosCanonicalNames,
    modulos_nomes: modulosCanonicalNames,
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
    if (file.type !== 'application/pdf' && !file.name.toLowerCase().endsWith('.pdf')) {
      throw new Error('Apenas arquivos PDF são aceitos.')
    }

    const arrayBuffer = await file.arrayBuffer()
    const buffer = new Uint8Array(arrayBuffer)

    let extractedText = ''
    try {
      const data = await pdf(Buffer.from(buffer))
      extractedText = data.text || ''
    } catch {
      throw new Error('Falha ao extrair texto do PDF.')
    }

    if (!extractedText || extractedText.trim().length < 50) {
      throw new Error(ERROR_MSG)
    }

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
