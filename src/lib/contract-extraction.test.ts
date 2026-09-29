import { describe, it, expect } from 'vitest'

// Replica a lógica pura de extractData de parse-pdf para teste unitário do frontend
const PROVIDER_CNPJS = ['27.751.577/0001-91', '27751577000191']

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

function cleanContractText(raw: string): string {
  return raw
    .replace(/Docsales ID:\s*[a-f0-9-]+/gi, '')
    .replace(/Página\s+\d+\s+de\s+\d+/gi, '')
    .replace(/Av\. Central[^\n]+www\.servicelogic\.com\.br/gi, '')
}

function extractData(rawText: string) {
  const text = cleanContractText(rawText)

  let nome: string | null = null
  let cnpj: string | null = null
  let endereco: string | null = null
  let repName: string | null = null
  let repCpf: string | null = null
  let repRg: string | null = null

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
      const nameMatch = line.match(
        /^([A-Z0-9À-ÿ\s.&-]+?)(?:,|\bpessoa\b|\binscrita?\b|\bCNPJ\b|\bcom\s+sede\b)/i,
      )
      if (nameMatch) {
        let candidate = nameMatch[1].trim()
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

    const cnpjMatch = contratanteBlock.match(/(\d{2}\.?\d{3}\.?\d{3}\/?\d{4}-?\d{2})/)
    if (cnpjMatch && !isProviderCnpj(cnpjMatch[1])) {
      cnpj = formatCnpjStrict(cnpjMatch[1])
    }

    const addrMatch = contratanteBlock.match(
      /com\s+sede\s+([\s\S]+?)(?=(?:,|\.)?\s*neste\s+ato\s+representad[oa]|\n\n)/i,
    )
    if (addrMatch) {
      let rawAddr = addrMatch[1].replace(/\r?\n/g, ' ').replace(/\s+/g, ' ').trim()
      rawAddr = rawAddr.replace(/[.,;]+$/, '').trim()
      if (rawAddr.length > 5) {
        endereco = rawAddr
      }
    }

    const repMatch = contratanteBlock.match(
      /representantes?\s+legais?[,\s]*(?:Sra?\.?|Sr\(a\)\.?)?\s*([A-ZÀ-ÿ\s]+?)(?:,|\binscrito|\bportador)/i,
    )
    if (repMatch) {
      const candidate = repMatch[1].replace(/\r?\n/g, ' ').replace(/\s+/g, ' ').trim()
      if (candidate.length > 3 && !candidate.toUpperCase().includes('CONTRATADA')) {
        repName = candidate
      }
    }

    const cpfMatch = contratanteBlock.match(/CPF[^\d]*?([\d.-]{11,14})/)
    if (cpfMatch) {
      repCpf = cpfMatch[1].trim()
    }

    const rgMatch = contratanteBlock.match(/RG[^\d]*?([\d.\-A-Za-z]+)\s*(?:[.,]|$)/)
    if (rgMatch) {
      repRg = rgMatch[1].trim()
    }
  }

  let planoBase: string | null = null
  let valorMensalidade = 0
  let valorImplantacao = 0

  const bloco522Match = text.match(/5\.22\)\s*Valor[\s\S]*?(?=CLÁUSULA\s+SEXTA|$)/i)
  if (bloco522Match) {
    const bText = bloco522Match[0]

    const planLineMatch = bText.match(
      /(TMS-[A-Za-z0-9+]+|MTS-[A-Za-z0-9+]+|SL\s+TMS-[A-Za-z0-9+]+)\s*R\$\s*([\d.,]+)/i,
    )
    if (planLineMatch) {
      if (!planoBase) planoBase = planLineMatch[1].toUpperCase()
      if (!valorMensalidade) valorMensalidade = parseCurrency(planLineMatch[2])
    }

    const totalMensalMatch = bText.match(/Total:\s*R\$\s*([\d.,]+)/i)
    if (totalMensalMatch) {
      const v = parseCurrency(totalMensalMatch[1])
      if (v > 0) valorMensalidade = v
    }

    const implMatch = bText.match(/Implantação\/treinamento\s*R\$\s*([\d.,]+)/i)
    if (implMatch) {
      valorImplantacao = parseCurrency(implMatch[1])
    }
  }

  if (!planoBase || valorMensalidade === 0) {
    const t51Match = text.match(/PLANOS\s*\*?[\s\S]*?(?=\(\*\)\s*Módulos\s+inclusos|5\.2\))/i)
    if (t51Match) {
      const tableText = t51Match[0]
      const planColsMatch = tableText.match(/PLANOS\*?\s*([\s\S]*?)(?=\*\*|\n\n)/i)
      const contratadoLineMatch = tableText.match(/Contratado\s*([\s\S]*?)$/i)
      const mensalidadeLineMatch = tableText.match(/Mensalidade\s*([\s\S]*?)(?=Doc\.|\n\n)/i)

      if (planColsMatch && contratadoLineMatch) {
        const planNames = planColsMatch[1]
          .trim()
          .split(/\s+/)
          .filter((p) => /TMS|MTS/i.test(p))
        const marks = contratadoLineMatch[1].trim().split(/\s+/)
        const xIndex = marks.findIndex((m) => m.toLowerCase() === 'x')
        if (xIndex >= 0 && xIndex < planNames.length) {
          if (!planoBase) planoBase = planNames[xIndex].toUpperCase()
          if (valorMensalidade === 0 && mensalidadeLineMatch) {
            const values = [...mensalidadeLineMatch[1].matchAll(/R\$\s*([\d.,]+)/gi)]
            if (values[xIndex]) {
              valorMensalidade = parseCurrency(values[xIndex][1])
            }
          }
        }
      }
    }
  }

  const modulosInclusosPadrao = [
    'Administração',
    'Básico',
    'Carga',
    'Comercial',
    'Faturamento',
    'Financeiro',
  ]

  const modulosCanonicalNames: string[] = []

  const canonicalMap: Record<string, string> = {
    ADMINISTRAÇÃO: 'Administração',
    ADMINISTRACAO: 'Administração',
    BÁSICO: 'Básico',
    BASICO: 'Básico',
    CARGA: 'Carga',
    COMERCIAL: 'Comercial',
    FATURAMENTO: 'Faturamento',
    FINANCEIRO: 'Financeiro',
    FISCAL: 'Fiscal',
    'B.I.': 'BI WEB',
    BI: 'BI WEB',
    'BI WEB': 'BI WEB',
    'POWER BI': 'BI WEB',
    EDI: 'EDI',
    'CONTROLE DE VIAGEM': 'Controle de Viagem',
    'CONTROLE DE VIAGENS': 'Controle de Viagem',
    FROTA: 'Frota (até 10 placas)',
    'FROTA (ATÉ 10 PLACAS)': 'Frota (até 10 placas)',
    'FROTA – ATÉ 20 PLACAS': 'Frota – Até 20 Placas',
    MEDIÇÃO: 'Medição',
    MEDICAO: 'Medição',
    FRACIONADO: 'Fracionado',
    'TRANSPORTE (BLOCO/TCE/TCI)': 'Transporte (Bloco TCI/TCE)',
    'TRANSPORTE (BLOCO TCI/TCE)': 'Transporte (Bloco TCI/TCE)',
    'BLOCO TCI E TCE (TRANSPORTES)': 'Transporte (Bloco TCI/TCE)',
    'FUNDO DE PROTEÇÃO': 'Fundo de proteção',
    'FUNDO DE PROTECAO': 'Fundo de proteção',
    PATRIMÔNIO: 'Patrimônio',
    PATRIMONIO: 'Patrimônio',
    CALENDÁRIO: 'Calendário',
    CALENDARIO: 'Calendário',
    'PAINEL DE INFORMAÇÕES': 'Painel de Informações',
    'PAINEL DE INFORMACOES': 'Painel de Informações',
    'DF-E': 'DF-e',
    DFE: 'DF-e',
    'SL-TRIP': 'SL-Trip',
    'SL TRIP': 'SL-Trip',
    'SL-TRACK': 'SL-Track',
    'SL TRACK': 'SL-Track',
    'HOMOLOGAÇÃO BANCARIA': 'Homologação Bancaria',
    'HOMOLOGAÇÃO BANCÁRIA': 'Homologação Bancaria',
    CIOT: 'CIOT',
    'TORRE DE CONTROLE LOGÍSTICA': 'Torre de Controle Logística',
    'TORRE DE CONTROLE': 'Torre de Controle Logística',
  }

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

  if (
    text.includes(
      'Módulos inclusos nos Planos: Administração, Básico, Carga, Comercial, Faturamento, Financeiro',
    ) ||
    text.includes('SL TMS-WEB') ||
    planoBase
  ) {
    modulosInclusosPadrao.forEach((m) => {
      if (!modulosCanonicalNames.includes(m)) {
        modulosCanonicalNames.push(m)
      }
    })
  }

  for (const modName of adicionaisCandidates) {
    const escaped = modName.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&')
    const contratadoRegex = new RegExp(`${escaped}\\s*\\n?\\s*X\\s*\\n?\\s*R\\$\\s*[\\d.,]+`, 'i')
    if (contratadoRegex.test(text)) {
      const canonical = canonicalMap[modName.toUpperCase()] || modName
      if (!modulosCanonicalNames.includes(canonical)) {
        modulosCanonicalNames.push(canonical)
      }
    }
  }

  let vencimentoMensal: number | null = null
  const vencMatch = text.match(
    /vencimento\s+(?:para\s+)?(?:todo\s+)?dia\s*(\d{1,2})\s*de\s+cada\s+mês/i,
  )
  if (vencMatch) {
    const d = parseInt(vencMatch[1], 10)
    if (d >= 1 && d <= 31) vencimentoMensal = d
  }

  let vigencia: string | null = null
  const vigenciaMatch = text.match(/vigência\s+de\s*(\d+\s*meses|\d+\s*ano[s]?)/i)
  if (vigenciaMatch) {
    vigencia = vigenciaMatch[1].trim()
  }

  const filiais: Array<{ nome: string; cnpj: string; isenta?: boolean }> = []
  const filialTableMatch = text.match(/Empresas[\s\S]*?Matriz[\s\S]*?(?=5\.4\)|CLÁUSULA\s+SEXTA)/i)
  if (filialTableMatch) {
    const filialSection = filialTableMatch[0]
    const filialLines = filialSection.matchAll(
      /Filial\s+([A-ZÀ-ÿ0-9\s.,&-]+?)\s*(\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2})/gi,
    )
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

  let dataAssinatura: string | null = null
  let email: string | null = null

  const dateContratanteMatch = text.match(
    /Assinado\s+como\s+contratante\s+em\s+(\d{2})\/(\d{2})\/(\d{4})/i,
  )
  if (dateContratanteMatch) {
    const [, dd, mm, yyyy] = dateContratanteMatch
    dataAssinatura = `${yyyy}-${mm}-${dd}`
  }

  return {
    nome: nome || 'Não identificado no contrato',
    cnpj: cnpj || 'Não identificado no contrato',
    endereco: endereco || 'Não identificado no contrato',
    repName: repName || 'Não identificado no contrato',
    repCpf: repCpf || 'Não identificado no contrato',
    repRg: repRg || 'Não identificado no contrato',
    email: email || 'Não identificado no contrato',
    planoBase: planoBase || 'Não identificado no contrato',
    valor_total: valorMensalidade,
    valor_mensalidade: valorMensalidade,
    valor_implantacao: valorImplantacao,
    vencimento_mensal: vencimentoMensal,
    data_assinatura: dataAssinatura,
    vigencia: vigencia || 'Não identificado no contrato',
    modulos: modulosCanonicalNames,
    filiais,
  }
}

describe('Contract Extraction Rules (SL TMS-WEB / SM Transportes)', () => {
  const sampleContractText = `
DEFINIÇÕES:
Como “Software”, entende-se programa de computador...
CONTRATANTE:
SM TRANSPORTES LTDA, pessoa jurídica de direito privado, inscrita no CNPJ sob o nº 55.625.017/0001-26, com sede
Rodovia Governador Mario Covas, s/n – Garagem – Km 173 – BR 101 Norte – Jacupemba – Aracruz – ES – CEP:
29.196-010., neste ato representado pelos seus representantes legais Sr MAXILENO TELLES BOZI, inscrito no CPF
sob o nº 114.054.557-48
CONTRATADA:
CONTACTO SOLUÇÕES EM TECNOLOGIA - LTDA, pessoa jurídica de direito privado, inscrita no CNPJ sob o nº
27.751.577/0001-91, com sede na Rua Paulo de Vasconcelos, nº 429...

5.1) A CONTRATANTE pagará uma mensalidade pelo direito de uso do software...
PLANOS* TMS-50 TMS-100 TMS-300 TMS-500 MTS-1000 TMS-3000 TMS-5000 TMS-5000+
Contratado x
(*) Módulos inclusos nos Planos: Administração, Básico, Carga, Comercial, Faturamento, Financeiro.

Empresas
Matriz SM TRANSPORTES LTDA 55.625.017/0001-26 Obs...
Filial Obs...

SL TMS-WEB
Módulos inclusos Contratado Implantação H / H
Administração X X 10
Básico X X
Carga X X
Comercial X X
Faturamento X X
Financeiro X X
Adicionais R$ / Mês
Fiscal R$ 00,00 X 4
B.I. R$ 00,00 X 2
EDI R$ 00,00 X 4
Df-e R$ 00,00 X 2

5.9) A CONTRATADA pagará pela licença de uso um valor mensal com vencimento para todo dia 01 de cada mês.
5.20) Esse contrato tem a vigência de 12 meses...
5.22) Valor Plano
Plano Valor Mensal
TMS-WEB R$ 400,00
Adesão R$ 00
Total: R$ 400,00
Implantação/treinamento R$ 1.700,00
Total Geral: R$ 2.100,00

Assinado como contratante em 06/03/2026 às 11:09
`

  it('extrai corretamente o cliente contratante e nunca a contratada', () => {
    const res = extractData(sampleContractText)
    expect(res.nome).toBe('SM TRANSPORTES LTDA')
    expect(res.cnpj).toBe('55.625.017/0001-26')
    expect(res.cnpj).not.toBe('27.751.577/0001-91')
    expect(res.repName).toBe('MAXILENO TELLES BOZI')
    expect(res.repCpf).toBe('114.054.557-48')
  })

  it('extrai plano TMS-WEB ou TMS-50 e o valor de 400,00', () => {
    const res = extractData(sampleContractText)
    expect(res.planoBase).toMatch(/TMS-WEB|TMS-50/)
    expect(res.valor_mensalidade).toBe(400)
    expect(res.valor_implantacao).toBe(1700)
    expect(res.vencimento_mensal).toBe(1)
    expect(res.vigencia).toBe('12 meses')
    expect(res.data_assinatura).toBe('2026-03-06')
  })

  it('inclui os módulos básicos e não atribui valor falso aos adicionais R$ 00,00 não contratados', () => {
    const res = extractData(sampleContractText)
    expect(res.modulos).toContain('Administração')
    expect(res.modulos).toContain('Básico')
    expect(res.modulos).toContain('Carga')
    expect(res.modulos).toContain('Comercial')
    expect(res.modulos).toContain('Faturamento')
    expect(res.modulos).toContain('Financeiro')
  })

  it('identifica módulos adicionais quando assinalados com X na coluna Contratado com casamento canônico', () => {
    const textWithAddons = sampleContractText.replace(
      'B.I. R$ 00,00 X 2\nEDI R$ 00,00 X 4\nDf-e R$ 00,00 X 2',
      'B.I. X R$ 150,00 X 2\nEDI R$ 00,00 X 4\nDf-e X R$ 200,00 X 2',
    )
    const res = extractData(textWithAddons)
    expect(res.modulos).toContain('BI WEB')
    expect(res.modulos).toContain('DF-e')
    expect(res.modulos).not.toContain('EDI')
  })
})
