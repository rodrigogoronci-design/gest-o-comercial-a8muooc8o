import { supabase } from '@/lib/supabase/client'
import {
  SLImportacao,
  SLUtilizacaoMensal,
  SLParsedRow,
  SLBaseAnalysis,
  SLPreImportAnalysis,
} from '@/types/service-logic-utilizacao'

/**
 * Normaliza CNPJ removendo caracteres não numéricos e preenchendo com zeros à esquerda se necessário (14 dígitos).
 */
export function normalizeCNPJ(cnpj: string | number | null | undefined): string {
  if (cnpj === null || cnpj === undefined) return ''
  const digits = String(cnpj).replace(/\D/g, '')
  if (!digits) return ''
  return digits.padStart(14, '0')
}

/**
 * Calcula o checksum SHA-256 de um arquivo via SubtleCrypto.
 */
export async function calculateFileSHA256(file: File): Promise<string> {
  const arrayBuffer = await file.arrayBuffer()
  const hashBuffer = await crypto.subtle.digest('SHA-256', arrayBuffer)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('')
}

/**
 * Tenta identificar a competência (AAAA-MM) a partir do nome do arquivo ou texto.
 * Exemplos aceitos no nome:
 * - "Utilizacao_2024_05.xlsx" -> "2024-05"
 * - "utilizacao-05-2024.xlsx" -> "2024-05"
 * - "202405.xlsx" -> "2024-05"
 * - "Maio_2024.xlsx" -> "2024-05"
 */
export function extractCompetenciaFromFileName(fileName: string): string {
  const cleanName = fileName.toLowerCase()

  // Padrão AAAA-MM ou AAAA_MM
  const matchIso = cleanName.match(/(20\d{2})[-_/.](0[1-9]|1[0-2])/)
  if (matchIso) {
    return `${matchIso[1]}-${matchIso[2]}`
  }

  // Padrão MM-AAAA ou MM_AAAA
  const matchBr = cleanName.match(/(0[1-9]|1[0-2])[-_/.](20\d{2})/)
  if (matchBr) {
    return `${matchBr[2]}-${matchBr[1]}`
  }

  // Padrão AAAAMM (ex: 202405)
  const matchContinuous = cleanName.match(/(20\d{2})(0[1-9]|1[0-2])/)
  if (matchContinuous) {
    return `${matchContinuous[1]}-${matchContinuous[2]}`
  }

  // Padrão por nome de mês em português
  const monthMap: Record<string, string> = {
    janeiro: '01',
    jan: '01',
    fevereiro: '02',
    fev: '02',
    marco: '03',
    março: '03',
    mar: '03',
    abril: '04',
    abr: '04',
    maio: '05',
    mai: '05',
    junho: '06',
    jun: '06',
    julho: '07',
    jul: '07',
    agosto: '08',
    ago: '08',
    setembro: '09',
    set: '09',
    outubro: '10',
    out: '10',
    novembro: '11',
    nov: '11',
    dezembro: '12',
    dez: '12',
  }

  for (const [mName, mNum] of Object.entries(monthMap)) {
    if (cleanName.includes(mName)) {
      const yearMatch = cleanName.match(/(20\d{2})/)
      if (yearMatch) {
        return `${yearMatch[1]}-${mNum}`
      }
    }
  }

  // Fallback para mês/ano atual no formato AAAA-MM
  const now = new Date()
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  return `${year}-${month}`
}

/**
 * Converte valor de célula para número (preservando precisão, lidando com formatação brasileira R$, pontos e vírgulas).
 */
export function parseCellNumeric(val: any): number {
  if (val === null || val === undefined || val === '') return 0
  if (typeof val === 'number') return isNaN(val) ? 0 : val
  const str = String(val).trim()
  if (!str) return 0
  const cleaned = str
    .replace(/[R$\s]/g, '')
    .replace(/\./g, '')
    .replace(',', '.')
  const num = parseFloat(cleaned)
  return isNaN(num) ? 0 : num
}

/**
 * Converte valor de célula para string limpa.
 */
export function parseCellString(val: any): string {
  if (val === null || val === undefined) return ''
  return String(val).trim()
}

/**
 * Mapeamento flexível de cabeçalhos da planilha XLSX.
 */
const EXPECTED_COLUMNS: { key: string; required: boolean; aliases: string[] }[] = [
  {
    key: 'cnpj',
    required: true,
    aliases: ['cnpj', 'cpf_cnpj', 'cpf/cnpj', 'cnpj/cpf', 'documento'],
  },
  {
    key: 'razao_social',
    required: true,
    aliases: ['razao social', 'razaosocial', 'razao_social', 'nome', 'empresa', 'cliente'],
  },
  { key: 'base', required: false, aliases: ['base', 'filial/base', 'unidade', 'grupo'] },
  {
    key: 'contratado',
    required: true,
    aliases: ['contratado', 'limite contratado', 'qtd contratada', 'contratada'],
  },
  {
    key: 'total_emitido',
    required: true,
    aliases: [
      'total emitido',
      'totalemitido',
      'emitido',
      'total de docs',
      'total docs',
      'documentos',
    ],
  },
  { key: 'saldo', required: false, aliases: ['saldo', 'saldo de docs', 'saldo docs', 'diferenca'] },
  {
    key: 'valor_por_doc',
    required: false,
    aliases: [
      'valor por doc',
      'valorpordoc',
      'vl por doc',
      'vl doc',
      'valor doc',
      'valor unitario',
    ],
  },
  {
    key: 'valor_cobranca',
    required: false,
    aliases: [
      'valor cobranca',
      'valorcobranca',
      'vl cobranca',
      'valor da cobranca',
      'cobranca total',
    ],
  },
  { key: 'cte', required: false, aliases: ['cte', 'ct-e', 'conhecimento'] },
  {
    key: 'cte_cancelado',
    required: false,
    aliases: ['cte cancelado', 'cte_cancelado', 'ct-e cancelado', 'cte canc'],
  },
  { key: 'nfe', required: false, aliases: ['nfe', 'nf-e', 'nota fiscal'] },
  {
    key: 'nfe_cancelado',
    required: false,
    aliases: ['nfe cancelado', 'nfe_cancelado', 'nf-e cancelado', 'nfe canc'],
  },
  { key: 'nfse', required: false, aliases: ['nfse', 'nfs-e', 'servico', 'nf servico'] },
  {
    key: 'nfse_cancelado',
    required: false,
    aliases: ['nfse cancelado', 'nfse_cancelado', 'nfs-e cancelado', 'nfse canc'],
  },
]

function normalizeHeaderName(header: string): string {
  return String(header || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]/g, '')
}

/**
 * Analisa a planilha via edge function ou parsing de matriz.
 */
export async function parseExcelSpreadsheet(
  file: File,
): Promise<{ headers: string[]; rows: any[][] }> {
  const formData = new FormData()
  formData.append('file', file)

  const { data, error } = await supabase.functions.invoke('parse-excel', { body: formData })
  if (error) throw new Error(`Falha ao ler planilha: ${error.message}`)
  if (!data || !data.success) throw new Error(data?.error || 'Erro ao processar planilha Excel.')

  const sheets = Object.keys(data.data || {})
  if (!sheets.length) throw new Error('O arquivo enviado não contém abas válidas.')

  // Utiliza a primeira aba
  const sheetRows = data.data[sheets[0]] as any[][]
  if (!sheetRows || sheetRows.length < 2) {
    throw new Error('A planilha selecionada está vazia ou não contém linhas de dados.')
  }

  const rawHeaders = (sheetRows[0] || []).map((h) => String(h || '').trim())
  const rawDataRows = sheetRows
    .slice(1)
    .filter((r) => r && r.some((c) => c !== null && c !== undefined && String(c).trim() !== ''))

  return { headers: rawHeaders, rows: rawDataRows }
}

/**
 * Constrói o mapa de colunas a partir do cabeçalho
 */
export function buildColumnMap(headers: string[]): {
  mapping: Record<string, number>
  missingRequired: string[]
} {
  const mapping: Record<string, number> = {}
  const normalizedHeaders = headers.map(normalizeHeaderName)

  EXPECTED_COLUMNS.forEach((col) => {
    // Procura por match direto ou aliases
    let foundIdx = -1
    for (const alias of col.aliases) {
      const normAlias = normalizeHeaderName(alias)
      const idx = normalizedHeaders.findIndex(
        (h) => h === normAlias || h.includes(normAlias) || normAlias.includes(h),
      )
      if (idx !== -1) {
        foundIdx = idx
        break
      }
    }
    if (foundIdx !== -1) {
      mapping[col.key] = foundIdx
    }
  })

  const missingRequired = EXPECTED_COLUMNS.filter(
    (c) => c.required && mapping[c.key] === undefined,
  ).map((c) => c.key)

  return { mapping, missingRequired }
}

/**
 * Busca todos os clientes cadastrados no banco para vincular por CNPJ (somente consulta, sem alteração).
 */
export async function fetchClientsForLookup(): Promise<
  Map<string, { id: string; nome: string; count: number }>
> {
  const { data, error } = await supabase.from('clientes').select('id, nome, cnpj, filiais_detalhes')

  if (error) {
    console.error('Erro ao buscar clientes para cruzamento de CNPJ:', error)
    return new Map()
  }

  const map = new Map<string, { id: string; nome: string; count: number }>()

  ;(data || []).forEach((c: any) => {
    const mainCnpj = normalizeCNPJ(c.cnpj)
    if (mainCnpj) {
      const existing = map.get(mainCnpj)
      if (existing) {
        existing.count += 1
      } else {
        map.set(mainCnpj, { id: c.id, nome: c.nome, count: 1 })
      }
    }

    // Também verifica filiais nos detalhes
    if (Array.isArray(c.filiais_detalhes)) {
      c.filiais_detalhes.forEach((f: any) => {
        const filialCnpj = normalizeCNPJ(f.cnpj)
        if (filialCnpj) {
          const existing = map.get(filialCnpj)
          if (existing) {
            existing.count += 1
          } else {
            map.set(filialCnpj, {
              id: c.id,
              nome: `${c.nome} (Filial: ${f.nome || 'Sem nome'})`,
              count: 1,
            })
          }
        }
      })
    }
  })

  return map
}

/**
 * Busca utilização vigente da competência informada para comparar linhas (novas, idênticas, diferentes).
 */
export async function fetchExistingUtilizationForCompetencia(
  competencia: string,
): Promise<Map<string, SLUtilizacaoMensal>> {
  const { data, error } = await (supabase.from('sl_utilizacao_mensal') as any)
    .select('*')
    .eq('competencia', competencia)
    .eq('vigente', true)

  if (error) {
    console.error('Erro ao buscar utilização existente da competência:', error)
    return new Map()
  }

  const map = new Map<string, SLUtilizacaoMensal>()
  ;(data || []).forEach((item: any) => {
    const norm = normalizeCNPJ(item.cnpj)
    if (norm) {
      map.set(norm, item as SLUtilizacaoMensal)
    }
  })
  return map
}

/**
 * Verifica se o hash do arquivo já foi importado anteriormente.
 */
export async function checkFileHashExists(hash: string): Promise<SLImportacao | null> {
  const { data, error } = await (supabase.from('sl_importacoes') as any)
    .select('*')
    .eq('hash_arquivo', hash)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (error || !data) return null
  return data as SLImportacao
}

/**
 * Verifica se já existe importação concluída para a competência informada.
 */
export async function checkCompetenciaExists(competencia: string): Promise<SLImportacao | null> {
  const { data, error } = await (supabase.from('sl_importacoes') as any)
    .select('*')
    .eq('competencia', competencia)
    .eq('status', 'concluida')
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (error || !data) return null
  return data as SLImportacao
}

/**
 * Executa a análise completa da planilha pré-importação.
 */
export async function analyzeSpreadsheet(
  file: File,
  confirmedCompetencia?: string,
): Promise<SLPreImportAnalysis> {
  const fileHash = await calculateFileSHA256(file)
  const competenciaSugerida = extractCompetenciaFromFileName(file.name)
  const competencia = confirmedCompetencia || competenciaSugerida

  const { headers, rows } = await parseExcelSpreadsheet(file)
  const { mapping, missingRequired } = buildColumnMap(headers)

  if (missingRequired.length > 0) {
    throw new Error(
      `Colunas obrigatórias não encontradas na planilha: ${missingRequired.join(', ')}. Verifique o cabeçalho.`,
    )
  }

  // Consultas assíncronas em paralelo
  const [clientLookup, existingUtilization, importacaoByHash, importacaoByCompetencia] =
    await Promise.all([
      fetchClientsForLookup(),
      fetchExistingUtilizationForCompetencia(competencia),
      checkFileHashExists(fileHash),
      checkCompetenciaExists(competencia),
    ])

  const parsedRows: SLParsedRow[] = []
  const baseMap = new Map<string, { cnpjs: string[]; contratados: number[] }>()

  let cnpjsVinculados = 0
  let cnpjsNaoLocalizados = 0
  let cnpjsMultiplos = 0
  let linhasComDivergenciaFormula = 0
  let linhasComDivergenciaCobranca = 0
  let linhasComContratadoZerado = 0
  let linhasNovas = 0
  let linhasIdenticas = 0
  let linhasDiferentes = 0

  rows.forEach((row, idx) => {
    const cnpjRaw = parseCellString(row[mapping.cnpj])
    const cnpjNormalized = normalizeCNPJ(cnpjRaw)
    const razaoSocial = parseCellString(row[mapping.razao_social])
    const base = mapping.base !== undefined ? parseCellString(row[mapping.base]) : ''

    // Preservação exata de valores numéricos
    const contratado = parseCellNumeric(row[mapping.contratado])
    const totalEmitido = parseCellNumeric(row[mapping.total_emitido])
    const saldo = mapping.saldo !== undefined ? parseCellNumeric(row[mapping.saldo]) : 0
    const valorPorDoc =
      mapping.valor_por_doc !== undefined ? parseCellNumeric(row[mapping.valor_por_doc]) : 0
    const valorCobranca =
      mapping.valor_cobranca !== undefined ? parseCellNumeric(row[mapping.valor_cobranca]) : 0

    // Nova validação de cobrança (regra do excedente)
    const valorCobrancaEsperado =
      valorPorDoc > 0 ? Math.max(totalEmitido - contratado, 0) * valorPorDoc : 0

    // Divergência de cobrança só é calculada se houver ValorPorDoc > 0 e Contratado > 0
    // Se Contratado = 0, não é erro de cobrança — é "limite não informado"
    const contratadoZerado = contratado === 0 && valorPorDoc > 0
    const divergenciaCobranca =
      !contratadoZerado && valorPorDoc > 0
        ? Math.abs(valorCobranca - valorCobrancaEsperado) > 0.005
        : false

    if (divergenciaCobranca) {
      linhasComDivergenciaCobranca++
    }
    if (contratadoZerado) {
      linhasComContratadoZerado++
    }

    const cte = mapping.cte !== undefined ? parseCellNumeric(row[mapping.cte]) : 0
    const cteCancelado =
      mapping.cte_cancelado !== undefined ? parseCellNumeric(row[mapping.cte_cancelado]) : 0
    const nfe = mapping.nfe !== undefined ? parseCellNumeric(row[mapping.nfe]) : 0
    const nfeCancelado =
      mapping.nfe_cancelado !== undefined ? parseCellNumeric(row[mapping.nfe_cancelado]) : 0
    const nfse = mapping.nfse !== undefined ? parseCellNumeric(row[mapping.nfse]) : 0
    const nfseCancelado =
      mapping.nfse_cancelado !== undefined ? parseCellNumeric(row[mapping.nfse_cancelado]) : 0

    // Validação da fórmula: TotalEmitido = Cte + CteCancelado + Nfe + NfeCancelado + Nfse + NfseCancelado
    const somaDocsCalculada = cte + cteCancelado + nfe + nfeCancelado + nfse + nfseCancelado
    // Divergência só se houver ao menos um dos campos de docs preenchidos ou se soma > 0
    const hasAnyDocBreakdown =
      mapping.cte !== undefined || mapping.nfe !== undefined || mapping.nfse !== undefined

    let divergenciaFormula = false
    if (hasAnyDocBreakdown && somaDocsCalculada > 0) {
      divergenciaFormula = Math.abs(totalEmitido - somaDocsCalculada) > 0.001
    }
    if (divergenciaFormula) {
      linhasComDivergenciaFormula++
    }

    // Validação de dados da linha
    const validationErrors: string[] = []
    if (!cnpjNormalized) {
      validationErrors.push('CNPJ ausente ou inválido')
    }
    if (!razaoSocial) {
      validationErrors.push('Razão Social não informada')
    }

    const isValid = validationErrors.length === 0

    // Cruzamento com clientes existentes
    const clientMatch = clientLookup.get(cnpjNormalized)
    const clienteId = clientMatch ? clientMatch.id : null
    const clienteNome = clientMatch ? clientMatch.nome : null
    const isMultiplo = !!(clientMatch && clientMatch.count > 1)

    if (clientMatch) {
      cnpjsVinculados++
      if (isMultiplo) {
        cnpjsMultiplos++
      }
    } else if (cnpjNormalized) {
      cnpjsNaoLocalizados++
    }

    // Análise de bases/filiais
    const baseKey = base ? base.trim().toUpperCase() : 'SEM BASE DEFINIDA'
    if (!baseMap.has(baseKey)) {
      baseMap.set(baseKey, { cnpjs: [], contratados: [] })
    }
    const bEntry = baseMap.get(baseKey)!
    bEntry.cnpjs.push(cnpjNormalized)
    bEntry.contratados.push(contratado)

    // Comparação com utilização existente da competência
    const existingRow = existingUtilization.get(cnpjNormalized)
    let statusComparacao: 'novo' | 'identico' | 'diferente' = 'novo'
    const diferencas: string[] = []

    if (!existingRow) {
      statusComparacao = 'novo'
      linhasNovas++
    } else {
      // Compara valores
      if (existingRow.total_emitido !== totalEmitido) {
        diferencas.push(`Total Emitido: ${existingRow.total_emitido} -> ${totalEmitido}`)
      }
      if (existingRow.contratado !== contratado) {
        diferencas.push(`Contratado: ${existingRow.contratado} -> ${contratado}`)
      }
      if (existingRow.valor_cobranca !== valorCobranca) {
        diferencas.push(`Valor Cobrança: ${existingRow.valor_cobranca} -> ${valorCobranca}`)
      }
      if (existingRow.saldo !== saldo) {
        diferencas.push(`Saldo: ${existingRow.saldo} -> ${saldo}`)
      }
      if (existingRow.cte !== cte) diferencas.push(`CTe: ${existingRow.cte} -> ${cte}`)
      if (existingRow.nfe !== nfe) diferencas.push(`NFe: ${existingRow.nfe} -> ${nfe}`)
      if (existingRow.nfse !== nfse) diferencas.push(`NFSe: ${existingRow.nfse} -> ${nfse}`)

      if (diferencas.length === 0) {
        statusComparacao = 'identico'
        linhasIdenticas++
      } else {
        statusComparacao = 'diferente'
        linhasDiferentes++
      }
    }

    parsedRows.push({
      rowIndex: idx + 2,
      cnpjRaw,
      cnpjNormalized,
      razaoSocial,
      base,
      contratado,
      totalEmitido,
      saldo,
      valorPorDoc,
      valorCobranca,
      valorCobrancaEsperado,
      divergenciaCobranca,
      contratadoZerado,
      cte,
      cteCancelado,
      nfe,
      nfeCancelado,
      nfse,
      nfseCancelado,
      divergenciaFormula,
      somaDocsCalculada,
      isValid,
      validationErrors,
      clienteId,
      clienteNome,
      isMultiplo,
      statusComparacao,
      registroAnterior: existingRow || null,
      diferencas,
    })
  })

  // Monta a análise de bases
  const baseAnalysis: SLBaseAnalysis[] = []
  baseMap.forEach((entry, bName) => {
    const totalLinhas = entry.cnpjs.length
    const hasContratadoZerado = entry.contratados.some((c) => c === 0)
    const uniqueContratados = Array.from(new Set(entry.contratados))
    const hasContratadosIguais = totalLinhas > 1 && uniqueContratados.length === 1
    const hasContratadosDiferentes = totalLinhas > 1 && uniqueContratados.length > 1
    const isSingleBranch = totalLinhas === 1
    const isMultipleBranches = totalLinhas > 1

    let isInconsistencyAlert = false
    let inconsistencyMessage = ''

    if (isMultipleBranches) {
      if (hasContratadoZerado && entry.contratados.some((c) => c > 0)) {
        isInconsistencyAlert = true
        inconsistencyMessage = 'Base com filiais ativas misturadas a filiais com contratado zerado.'
      } else if (hasContratadosIguais) {
        inconsistencyMessage =
          'Contratado idêntico repetido entre filiais (possível limite único compartilhado por base ou limite individual replicado).'
      } else if (hasContratadosDiferentes) {
        inconsistencyMessage = 'Limites contratados diferentes definidos por filial.'
      }
    } else if (hasContratadoZerado) {
      inconsistencyMessage = 'Filial única com limite contratado zerado.'
    }

    baseAnalysis.push({
      baseName: bName,
      totalLinhas,
      cnpjs: entry.cnpjs,
      contratados: entry.contratados,
      hasContratadoZerado,
      hasContratadosIguais,
      hasContratadosDiferentes,
      isSingleBranch,
      isMultipleBranches,
      isInconsistencyAlert,
      inconsistencyMessage,
    })
  })

  // Converte mapping para nomes de campos encontrados
  const columnMappingFound: Record<string, string> = {}
  Object.keys(mapping).forEach((k) => {
    columnMappingFound[k] = headers[mapping[k]] || ''
  })

  return {
    fileName: file.name,
    fileHash,
    competenciaSugerida,
    competenciaConfirmada: competencia,
    totalLinhas: rows.length,
    linhasValidas: parsedRows.filter((r) => r.isValid).length,
    linhasInvalidas: parsedRows.filter((r) => !r.isValid).length,
    linhasNovas,
    linhasIdenticas,
    linhasDiferentes,
    cnpjsVinculados,
    cnpjsNaoLocalizados,
    cnpjsMultiplos,
    linhasComDivergenciaFormula,
    linhasComDivergenciaCobranca,
    linhasComContratadoZerado,
    hashJaExiste: !!importacaoByHash,
    importacaoExistentePorHash: importacaoByHash,
    competenciaJaExiste: !!importacaoByCompetencia,
    importacaoExistentePorCompetencia: importacaoByCompetencia,
    rows: parsedRows,
    baseAnalysis,
    columnMappingFound,
    missingRequiredColumns: missingRequired,
  }
}

/**
 * Executa a gravação segura da importação no Supabase.
 * - Se for reimportação da mesma competência: marca registros vigentes anteriores como vigente = false
 * - Registra em sl_historico_revisoes com ON DELETE RESTRICT e auditoria completa
 * - Insere a nova importação em sl_importacoes
 * - Insere as novas linhas em sl_utilizacao_mensal com vigente = true
 */
export async function commitUtilizationImport({
  analysis,
  motivoReimportacao,
  observacao,
  userId,
}: {
  analysis: SLPreImportAnalysis
  motivoReimportacao?: string
  observacao?: string
  userId: string
}): Promise<{ importacaoId: string; success: boolean }> {
  const competencia = analysis.competenciaConfirmada
  const validRows = analysis.rows.filter((r) => r.isValid)

  if (validRows.length === 0) {
    throw new Error('Nenhuma linha válida para importar.')
  }

  // 1. Criar registro da nova importação em sl_importacoes
  const { data: novaImportacao, error: errImp } = await (supabase.from('sl_importacoes') as any)
    .insert({
      arquivo_nome: analysis.fileName,
      hash_arquivo: analysis.fileHash,
      competencia,
      total_linhas: analysis.totalLinhas,
      linhas_validas: analysis.linhasValidas,
      linhas_novas: analysis.linhasNovas,
      linhas_identicas: analysis.linhasIdenticas,
      linhas_diferentes: analysis.linhasDiferentes,
      cnpjs_vinculados: analysis.cnpjsVinculados,
      cnpjs_nao_localizados: analysis.cnpjsNaoLocalizados,
      cnpjs_multiplos: analysis.cnpjsMultiplos,
      status: 'concluida',
      usuario_id: userId,
      observacao: observacao || null,
    })
    .select('id')
    .single()

  if (errImp || !novaImportacao) {
    throw new Error(`Erro ao registrar importação: ${errImp?.message || 'Falha desconhecida'}`)
  }

  const novaImportacaoId = novaImportacao.id

  // 2. Se houver importação anterior vigente da mesma competência, buscar registros vigentes anteriores
  const { data: registrosAntigos, error: errAntigos } = await (
    supabase.from('sl_utilizacao_mensal') as any
  )
    .select('*')
    .eq('competencia', competencia)
    .eq('vigente', true)

  if (errAntigos) {
    console.warn('Erro ao consultar registros anteriores:', errAntigos)
  }

  const mapaAntigos = new Map<string, SLUtilizacaoMensal>()
  ;(registrosAntigos || []).forEach((r: any) => {
    mapaAntigos.set(r.cnpj, r as SLUtilizacaoMensal)
  })

  // Se havia registros vigentes, marcá-los como vigente = false
  if (registrosAntigos && registrosAntigos.length > 0) {
    const { error: errUpdateVigente } = await (supabase.from('sl_utilizacao_mensal') as any)
      .update({ vigente: false, updated_at: new Date().toISOString() })
      .eq('competencia', competencia)
      .eq('vigente', true)

    if (errUpdateVigente) {
      throw new Error(
        `Erro ao atualizar vigência dos registros anteriores: ${errUpdateVigente.message}`,
      )
    }

    // Se havia importação concluída anterior, atualiza status para 'substituida'
    if (analysis.importacaoExistentePorCompetencia?.id) {
      await (supabase.from('sl_importacoes') as any)
        .update({ status: 'substituida' })
        .eq('id', analysis.importacaoExistentePorCompetencia.id)
    }
  }

  // 3. Montar e inserir novas linhas em sl_utilizacao_mensal (vigente = true)
  const utilizacaoToInsert = validRows.map((r) => ({
    importacao_id: novaImportacaoId,
    cnpj: r.cnpjNormalized,
    razao_social: r.razaoSocial,
    cliente_id: r.clienteId,
    filial_id: null,
    base: r.base || null,
    contratado: r.contratado,
    total_emitido: r.totalEmitido,
    saldo: r.saldo,
    valor_por_doc: r.valorPorDoc,
    valor_cobranca: r.valorCobranca,
    cte: r.cte,
    cte_cancelado: r.cteCancelado,
    nfe: r.nfe,
    nfe_cancelado: r.nfeCancelado,
    nfse: r.nfse,
    nfse_cancelado: r.nfseCancelado,
    competencia,
    vigente: true,
    divergencia_formula: r.divergenciaFormula,
  }))

  // Inserção em lotes de 200 para segurança de payload
  const batchSize = 200
  const insertedRows: any[] = []

  for (let i = 0; i < utilizacaoToInsert.length; i += batchSize) {
    const batch = utilizacaoToInsert.slice(i, i + batchSize)
    const { data: batchResult, error: errBatch } = await (
      supabase.from('sl_utilizacao_mensal') as any
    )
      .insert(batch)
      .select('id, cnpj')

    if (errBatch) {
      throw new Error(`Erro ao gravar registros de utilização: ${errBatch.message}`)
    }
    if (batchResult) {
      insertedRows.push(...batchResult)
    }
  }

  const mapaNovosInseridos = new Map<string, string>()
  insertedRows.forEach((r) => {
    mapaNovosInseridos.set(r.cnpj, r.id)
  })

  // 4. Se for reimportação ou houver registros anteriores, registrar auditoria em sl_historico_revisoes
  if (registrosAntigos && registrosAntigos.length > 0) {
    const importacaoAntigaId =
      analysis.importacaoExistentePorCompetencia?.id ||
      registrosAntigos[0]?.importacao_id ||
      novaImportacaoId

    const historicosToInsert: any[] = []

    validRows.forEach((r) => {
      const regAntigo = mapaAntigos.get(r.cnpjNormalized)
      const novoId = mapaNovosInseridos.get(r.cnpjNormalized)

      if (regAntigo) {
        // Se houve alteração de valores ou substituição da competência
        historicosToInsert.push({
          importacao_id_antiga: regAntigo.importacao_id || importacaoAntigaId,
          importacao_id_nova: novaImportacaoId,
          utilizacao_id_antigo: regAntigo.id,
          utilizacao_id_novo: novoId || null,
          user_id: userId,
          dados_anteriores: {
            cnpj: regAntigo.cnpj,
            razao_social: regAntigo.razao_social,
            total_emitido: regAntigo.total_emitido,
            contratado: regAntigo.contratado,
            saldo: regAntigo.saldo,
            valor_por_doc: regAntigo.valor_por_doc,
            valor_cobranca: regAntigo.valor_cobranca,
            cte: regAntigo.cte,
            nfe: regAntigo.nfe,
            nfse: regAntigo.nfse,
          },
          dados_novos: {
            cnpj: r.cnpjNormalized,
            razao_social: r.razaoSocial,
            total_emitido: r.totalEmitido,
            contratado: r.contratado,
            saldo: r.saldo,
            valor_por_doc: r.valorPorDoc,
            valor_cobranca: r.valorCobranca,
            cte: r.cte,
            nfe: r.nfe,
            nfse: r.nfse,
          },
          motivo:
            motivoReimportacao ||
            `Reimportação da competência ${competencia}. ${r.diferencas?.join('; ') || 'Substituição de lote'}`,
        })
      }
    })

    if (historicosToInsert.length > 0) {
      for (let i = 0; i < historicosToInsert.length; i += batchSize) {
        const batchHist = historicosToInsert.slice(i, i + batchSize)
        const { error: errHist } = await (supabase.from('sl_historico_revisoes') as any).insert(
          batchHist,
        )

        if (errHist) {
          console.error('Erro ao gravar histórico de revisões (auditoria):', errHist)
        }
      }
    }
  }

  return { importacaoId: novaImportacaoId, success: true }
}

/**
 * Busca histórico de importações realizadas
 */
export async function fetchImportacoesList(): Promise<SLImportacao[]> {
  const { data, error } = await (supabase.from('sl_importacoes') as any)
    .select('*')
    .order('created_at', { ascending: false })

  if (error) throw new Error(error.message)
  return (data || []) as SLImportacao[]
}

/**
 * Busca histórico de revisões / auditoria
 */
export async function fetchHistoricoRevisoes(competencia?: string): Promise<any[]> {
  let query = (supabase.from('sl_historico_revisoes') as any)
    .select('*')
    .order('created_at', { ascending: false })
    .limit(100)

  const { data, error } = await query
  if (error) throw new Error(error.message)
  return data || []
}
