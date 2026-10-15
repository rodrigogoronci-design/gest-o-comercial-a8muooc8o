import ExcelJS from 'exceljs'
import { supabase } from '@/lib/supabase/client'

export interface ParsedMensalidadeRow {
  linhaOriginal: number
  cnpjOriginal: string
  cnpjNormalizado: string // 14 dígitos se válido
  cnpjValido: boolean
  motivoInvalido?: string
  clienteArquivo: string
  valorAtualArquivo: number | null
  novoValorArquivo: number | null
  faturaSetembro?: string
  emissora?: string
  rawRow: Record<string, any>
}

export type StatusLinhaPrevia =
  | 'correspondido' // CNPJ exato encontrado no sistema
  | 'sem_correspondencia' // CNPJ válido (14 dígitos), mas não existe no banco
  | 'cnpj_invalido' // CNPJ malformado ou != 14 dígitos

export interface PreviaLinha {
  id: string // id local temporário da linha (ex: `linha-${idx}`)
  linhaOriginal: number
  cnpjOriginal: string
  cnpjNormalizado: string
  cnpjValido: boolean
  motivoInvalido?: string
  clienteArquivo: string
  faturaSetembro?: string
  emissora?: string

  // Dados do sistema (se encontrado)
  clienteIdSistema?: string
  clienteNomeSistema?: string
  mensalidadeAtualSistema: number // valor_total gravado no sistema (ou 0)

  // Valores informados
  valorAtualArquivo: number | null
  novoValorArquivo: number | null

  // Diagnósticos
  status: StatusLinhaPrevia
  temDivergenciaValorAtual: boolean // valorAtualArquivo != mensalidadeAtualSistema
  diferencaNovoVsAtualSistema: number // novoValorArquivo - mensalidadeAtualSistema

  // Controle de seleção do usuário
  selecionado: boolean
}

export interface PreviaResumo {
  totalLinhas: number
  totalCorrespondidos: number
  totalDivergencias: number
  totalSemCorrespondencia: number
  totalFalhasCnpj: number
  totalSelecionados: number
  somaAtualSistemaSelecionados: number
  somaNovoArquivoSelecionados: number
}

export interface ResultadoExecucaoLinha {
  linhaOriginal: number
  cnpj: string
  clienteNome: string
  clienteId?: string
  valorAnterior: number
  valorNovo: number
  status: 'sucesso' | 'ignorado_desmarcado' | 'sem_correspondencia' | 'cnpj_invalido' | 'erro'
  mensagem?: string
}

export interface ResultadoExecucaoGeral {
  totalProcessados: number
  totalSucesso: number
  totalErros: number
  totalIgnorados: number
  itens: ResultadoExecucaoLinha[]
}

/**
 * Normaliza CNPJ extraindo apenas os dígitos.
 * Retorna os 14 dígitos se houver exatamente 14; caso contrário retorna string vazia.
 */
export function normalizeCnpjDigits(raw: string): {
  digits: string
  isValid14: boolean
  originalClean: string
} {
  if (!raw) return { digits: '', isValid14: false, originalClean: '' }
  const clean = String(raw).replace(/\D/g, '')
  if (clean.length === 14) {
    return { digits: clean, isValid14: true, originalClean: clean }
  }
  return { digits: clean, isValid14: false, originalClean: clean }
}

/**
 * Converte valor em string/número para numérico seguro em Real.
 * Suporta "2261,00", "2.261,00", "2261.00", "R$ 1.234,56", números inteiros e floats.
 */
export function parseMoeda(raw: any): number | null {
  if (raw === null || raw === undefined) return null
  if (typeof raw === 'number') {
    return isNaN(raw) ? null : raw
  }
  const str = String(raw).trim()
  if (!str) return null

  // Remove símbolos monetários e espaços
  const cleaned = str.replace(/[R$\s]/gi, '').trim()
  if (!cleaned) return null

  // Caso contenha vírgula, assume formato brasileiro: pontos são milhar, vírgula é decimal
  if (cleaned.includes(',')) {
    const semPontos = cleaned.replace(/\./g, '')
    const comPontoDecimal = semPontos.replace(',', '.')
    const parsed = parseFloat(comPontoDecimal)
    return isNaN(parsed) ? null : parsed
  }

  // Caso só tenha pontos ou nada
  const parsed = parseFloat(cleaned)
  return isNaN(parsed) ? null : parsed
}

/**
 * Parser de CSV nativo que suporta separador ponto-e-vírgula ou vírgula,
 * com tratamento de aspas duplas e linhas vazias.
 */
export function parseCsvText(text: string): string[][] {
  const lines: string[][] = []
  let currentRow: string[] = []
  let currentField = ''
  let insideQuotes = false

  // Detectar separador principal analisando a primeira linha
  const firstLine = text.split(/\r?\n/)[0] || ''
  const semiCount = (firstLine.match(/;/g) || []).length
  const commaCount = (firstLine.match(/,/g) || []).length
  const delimiter = semiCount >= commaCount ? ';' : ','

  for (let i = 0; i < text.length; i++) {
    const char = text[i]
    const nextChar = text[i + 1]

    if (char === '"') {
      if (insideQuotes && nextChar === '"') {
        currentField += '"'
        i++ // pula escape de aspas
      } else {
        insideQuotes = !insideQuotes
      }
    } else if (char === delimiter && !insideQuotes) {
      currentRow.push(currentField.trim())
      currentField = ''
    } else if ((char === '\r' || char === '\n') && !insideQuotes) {
      if (char === '\r' && nextChar === '\n') {
        i++
      }
      currentRow.push(currentField.trim())
      currentField = ''
      if (currentRow.some((field) => field.length > 0)) {
        lines.push(currentRow)
      }
      currentRow = []
    } else {
      currentField += char
    }
  }

  if (currentField.length > 0 || currentRow.length > 0) {
    currentRow.push(currentField.trim())
    if (currentRow.some((field) => field.length > 0)) {
      lines.push(currentRow)
    }
  }

  return lines
}

/**
 * Lê arquivo (.csv ou .xlsx/.xls) no browser e devolve matriz de células strings/valores
 */
export async function parseUploadFile(file: File): Promise<string[][]> {
  const fileName = file.name.toLowerCase()

  if (fileName.endsWith('.xlsx') || fileName.endsWith('.xls')) {
    const arrayBuffer = await file.arrayBuffer()
    const workbook = new ExcelJS.Workbook()
    await workbook.xlsx.load(arrayBuffer)
    const worksheet = workbook.worksheets[0]
    if (!worksheet) return []

    const rows: string[][] = []
    worksheet.eachRow({ includeEmpty: false }, (row) => {
      const rowValues: string[] = []
      // ExcelJS row.values inicia no index 1
      const values = row.values as any[]
      if (Array.isArray(values)) {
        for (let c = 1; c < values.length; c++) {
          const val = values[c]
          if (val === null || val === undefined) {
            rowValues.push('')
          } else if (typeof val === 'object' && val.text) {
            rowValues.push(String(val.text).trim())
          } else if (typeof val === 'object' && val.result !== undefined) {
            rowValues.push(String(val.result).trim())
          } else {
            rowValues.push(String(val).trim())
          }
        }
      }
      if (rowValues.some((v) => v.length > 0)) {
        rows.push(rowValues)
      }
    })
    return rows
  }

  // Padrão CSV ou texto
  const text = await file.text()
  return parseCsvText(text)
}

/**
 * Processa a matriz crua para a lista de ParsedMensalidadeRow
 */
export function extractMensalidadeRows(rawMatrix: string[][]): ParsedMensalidadeRow[] {
  if (rawMatrix.length < 2) return []

  const headerRow = rawMatrix[0].map((h) =>
    String(h || '')
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .trim(),
  )

  const findIdx = (keywords: string[]) =>
    headerRow.findIndex((h) => keywords.some((kw) => h.includes(kw)))

  const idxCnpj = findIdx(['cnpj'])
  const idxCliente = findIdx(['cliente', 'razao', 'empresa', 'nome'])
  const idxValorAtual = findIdx(['valor atual', 'atual r$', 'atual'])
  const idxNovoValor = findIdx(['novo valor', 'novo r$', 'novo'])
  const idxFatura = findIdx(['fatura', 'setembro'])
  const idxEmissora = findIdx(['emissora', 'origem'])

  const results: ParsedMensalidadeRow[] = []

  for (let i = 1; i < rawMatrix.length; i++) {
    const row = rawMatrix[i]
    if (!row || row.length === 0 || row.every((c) => !c || c.trim() === '')) {
      continue
    }

    const rawCnpj = idxCnpj !== -1 ? String(row[idxCnpj] || '').trim() : ''
    const rawCliente = idxCliente !== -1 ? String(row[idxCliente] || '').trim() : ''
    const rawValorAtual = idxValorAtual !== -1 ? row[idxValorAtual] : ''
    const rawNovoValor = idxNovoValor !== -1 ? row[idxNovoValor] : ''
    const rawFatura = idxFatura !== -1 ? String(row[idxFatura] || '').trim() : ''
    const rawEmissora = idxEmissora !== -1 ? String(row[idxEmissora] || '').trim() : ''

    const { digits, isValid14 } = normalizeCnpjDigits(rawCnpj)
    let motivoInvalido: string | undefined

    if (!rawCnpj) {
      motivoInvalido = 'CNPJ não informado na linha'
    } else if (!isValid14) {
      motivoInvalido = `CNPJ possui ${digits.length} dígitos em vez de 14 (${rawCnpj})`
    }

    results.push({
      linhaOriginal: i + 1, // linha 1 é o cabeçalho
      cnpjOriginal: rawCnpj,
      cnpjNormalizado: digits,
      cnpjValido: isValid14,
      motivoInvalido,
      clienteArquivo: rawCliente,
      valorAtualArquivo: parseMoeda(rawValorAtual),
      novoValorArquivo: parseMoeda(rawNovoValor),
      faturaSetembro: rawFatura,
      emissora: rawEmissora,
      rawRow: {
        cnpj: rawCnpj,
        cliente: rawCliente,
        valorAtual: rawValorAtual,
        novoValor: rawNovoValor,
        fatura: rawFatura,
        emissora: rawEmissora,
      },
    })
  }

  return results
}

/**
 * Consulta todos os clientes do sistema e faz o matching exato de 14 dígitos com as linhas do arquivo
 */
export async function buildPreviaAtualizacao(
  parsedRows: ParsedMensalidadeRow[],
): Promise<{ previa: PreviaLinha[]; resumo: PreviaResumo }> {
  // Busca todos os clientes cadastrados (id, nome, cnpj, valor_total, valor_mensalidade)
  const { data: dbClientes, error } = await supabase
    .from('clientes')
    .select('id, nome, cnpj, valor_total, valor_mensalidade')
    .limit(10000)

  if (error) {
    throw new Error('Falha ao consultar clientes cadastrados: ' + error.message)
  }

  // Mapa de CNPJ normalizado (14 dígitos) -> cliente do banco
  const clientMap = new Map<string, any>()
  for (const c of dbClientes || []) {
    if (c.cnpj) {
      const clean = String(c.cnpj).replace(/\D/g, '')
      if (clean.length === 14 && !clientMap.has(clean)) {
        clientMap.set(clean, c)
      }
    }
  }

  const previa: PreviaLinha[] = []

  for (let idx = 0; idx < parsedRows.length; idx++) {
    const row = parsedRows[idx]
    const rowId = `linha-${row.linhaOriginal}-${idx}`

    if (!row.cnpjValido) {
      previa.push({
        id: rowId,
        linhaOriginal: row.linhaOriginal,
        cnpjOriginal: row.cnpjOriginal,
        cnpjNormalizado: row.cnpjNormalizado,
        cnpjValido: false,
        motivoInvalido: row.motivoInvalido,
        clienteArquivo: row.clienteArquivo,
        faturaSetembro: row.faturaSetembro,
        emissora: row.emissora,
        mensalidadeAtualSistema: 0,
        valorAtualArquivo: row.valorAtualArquivo,
        novoValorArquivo: row.novoValorArquivo,
        status: 'cnpj_invalido',
        temDivergenciaValorAtual: false,
        diferencaNovoVsAtualSistema: 0,
        selecionado: false, // não selecionável por padrão
      })
      continue
    }

    const matchedClient = clientMap.get(row.cnpjNormalizado)

    if (!matchedClient) {
      previa.push({
        id: rowId,
        linhaOriginal: row.linhaOriginal,
        cnpjOriginal: row.cnpjOriginal,
        cnpjNormalizado: row.cnpjNormalizado,
        cnpjValido: true,
        clienteArquivo: row.clienteArquivo,
        faturaSetembro: row.faturaSetembro,
        emissora: row.emissora,
        mensalidadeAtualSistema: 0,
        valorAtualArquivo: row.valorAtualArquivo,
        novoValorArquivo: row.novoValorArquivo,
        status: 'sem_correspondencia',
        temDivergenciaValorAtual: false,
        diferencaNovoVsAtualSistema: 0,
        selecionado: false, // não processável sem correspondência exata
      })
      continue
    }

    // Cliente correspondido com exatidão
    // No sistema, a mensalidade é refletida primariamente em valor_total (e valor_mensalidade quando preenchido)
    const valorSistema =
      matchedClient.valor_total != null && Number(matchedClient.valor_total) > 0
        ? Number(matchedClient.valor_total)
        : matchedClient.valor_mensalidade != null
          ? Number(matchedClient.valor_mensalidade)
          : 0

    const valorAtualArq = row.valorAtualArquivo ?? 0
    const novoValorArq = row.novoValorArquivo ?? 0

    // Divergência se o "Valor atual R$" informado no arquivo difere do sistema em mais de 1 centavo
    const temDivergencia =
      row.valorAtualArquivo !== null && Math.abs(valorAtualArq - valorSistema) >= 0.01

    const diferenca = novoValorArq - valorSistema

    previa.push({
      id: rowId,
      linhaOriginal: row.linhaOriginal,
      cnpjOriginal: row.cnpjOriginal,
      cnpjNormalizado: row.cnpjNormalizado,
      cnpjValido: true,
      clienteArquivo: row.clienteArquivo,
      faturaSetembro: row.faturaSetembro,
      emissora: row.emissora,
      clienteIdSistema: matchedClient.id,
      clienteNomeSistema: matchedClient.nome,
      mensalidadeAtualSistema: valorSistema,
      valorAtualArquivo: row.valorAtualArquivo,
      novoValorArquivo: row.novoValorArquivo,
      status: 'correspondido',
      temDivergenciaValorAtual: temDivergencia,
      diferencaNovoVsAtualSistema: diferenca,
      selecionado: true, // selecionado por padrão para revisão do usuário
    })
  }

  const resumo = computePreviaResumo(previa)
  return { previa, resumo }
}

export function computePreviaResumo(previa: PreviaLinha[]): PreviaResumo {
  let totalLinhas = previa.length
  let totalCorrespondidos = 0
  let totalDivergencias = 0
  let totalSemCorrespondencia = 0
  let totalFalhasCnpj = 0
  let totalSelecionados = 0
  let somaAtualSistemaSelecionados = 0
  let somaNovoArquivoSelecionados = 0

  for (const item of previa) {
    if (item.status === 'correspondido') {
      totalCorrespondidos++
      if (item.temDivergenciaValorAtual) {
        totalDivergencias++
      }
    } else if (item.status === 'sem_correspondencia') {
      totalSemCorrespondencia++
    } else if (item.status === 'cnpj_invalido') {
      totalFalhasCnpj++
    }

    if (item.selecionado && item.status === 'correspondido') {
      totalSelecionados++
      somaAtualSistemaSelecionados += item.mensalidadeAtualSistema || 0
      somaNovoArquivoSelecionados += item.novoValorArquivo || 0
    }
  }

  return {
    totalLinhas,
    totalCorrespondidos,
    totalDivergencias,
    totalSemCorrespondencia,
    totalFalhasCnpj,
    totalSelecionados,
    somaAtualSistemaSelecionados,
    somaNovoArquivoSelecionados,
  }
}

/**
 * Executa a atualização exclusivamente para as linhas marcadas e correspondidas.
 * Registra auditoria na tabela aditiva `auditoria_mensalidades` e no histórico do cliente `historico_contratos`.
 */
export async function applyAtualizacaoMensalidades(
  previa: PreviaLinha[],
  onProgress?: (current: number, total: number) => void,
): Promise<ResultadoExecucaoGeral> {
  const itens: ResultadoExecucaoLinha[] = []
  let totalSucesso = 0
  let totalErros = 0
  let totalIgnorados = 0

  const totalParaProcessar = previa.length
  let processados = 0

  for (const item of previa) {
    processados++
    if (onProgress) {
      onProgress(processados, totalParaProcessar)
    }

    // Casos não selecionáveis ou não selecionados
    if (item.status === 'cnpj_invalido') {
      totalIgnorados++
      itens.push({
        linhaOriginal: item.linhaOriginal,
        cnpj: item.cnpjOriginal,
        clienteNome: item.clienteArquivo || '—',
        valorAnterior: 0,
        valorNovo: item.novoValorArquivo || 0,
        status: 'cnpj_invalido',
        mensagem: item.motivoInvalido || 'CNPJ inválido/malformado',
      })
      continue
    }

    if (item.status === 'sem_correspondencia') {
      totalIgnorados++
      itens.push({
        linhaOriginal: item.linhaOriginal,
        cnpj: item.cnpjOriginal,
        clienteNome: item.clienteArquivo || '—',
        valorAnterior: 0,
        valorNovo: item.novoValorArquivo || 0,
        status: 'sem_correspondencia',
        mensagem: 'CNPJ não encontrado no cadastro de clientes',
      })
      continue
    }

    if (!item.selecionado) {
      totalIgnorados++
      itens.push({
        linhaOriginal: item.linhaOriginal,
        cnpj: item.cnpjOriginal,
        clienteNome: item.clienteNomeSistema || item.clienteArquivo,
        clienteId: item.clienteIdSistema,
        valorAnterior: item.mensalidadeAtualSistema,
        valorNovo: item.novoValorArquivo || 0,
        status: 'ignorado_desmarcado',
        mensagem: 'Desmarcado pelo usuário na prévia',
      })
      continue
    }

    if (!item.clienteIdSistema || item.novoValorArquivo === null) {
      totalErros++
      itens.push({
        linhaOriginal: item.linhaOriginal,
        cnpj: item.cnpjOriginal,
        clienteNome: item.clienteNomeSistema || item.clienteArquivo,
        clienteId: item.clienteIdSistema,
        valorAnterior: item.mensalidadeAtualSistema,
        valorNovo: item.novoValorArquivo || 0,
        status: 'erro',
        mensagem: 'Novo valor inválido ou cliente sem identificação',
      })
      continue
    }

    // EXECUTAR ATUALIZAÇÃO NO BANCO
    try {
      const novoValor = Number(item.novoValorArquivo)
      const valorAnterior = Number(item.mensalidadeAtualSistema)

      // 1. Gravar na tabela dedicada de auditoria de mensalidades
      const { error: auditError } = await (
        supabase.from('auditoria_mensalidades' as any) as any
      ).insert({
        cliente_id: item.clienteIdSistema,
        cnpj: item.cnpjNormalizado,
        cliente_nome: item.clienteNomeSistema || item.clienteArquivo,
        valor_anterior: valorAnterior,
        valor_novo: novoValor,
        origem: 'Importação em lote de mensalidades',
        observacao: `Atualização em lote (linha ${item.linhaOriginal}). Fatura: ${item.faturaSetembro || '—'}, Emissora: ${item.emissora || '—'}`,
      })

      if (auditError) {
        console.warn('Aviso: falha ao gravar auditoria_mensalidades:', auditError)
      }

      // 2. Gravar no histórico contratual do cliente (mecanismo já existente de auditoria do cliente)
      try {
        await supabase.from('historico_contratos').insert({
          cliente_id: item.clienteIdSistema,
          tipo: 'Reajuste de Mensalidade',
          data_solicitacao: new Date().toISOString().split('T')[0],
          valor_total: novoValor,
          valor_adicional: novoValor - valorAnterior,
          status: 'Confirmada',
          data_aceite: new Date().toISOString(),
          observacoes: `Atualização em lote de mensalidade: de R$ ${valorAnterior.toFixed(2)} para R$ ${novoValor.toFixed(2)}. Origem: Importação em lote de mensalidades.`,
        })
      } catch (histErr) {
        console.warn('Aviso: falha ao gravar historico_contratos:', histErr)
      }

      // 3. Atualizar exclusivamente o campo de valor do cliente no banco
      // Atualiza valor_total e valor_mensalidade sem tocar em planos, módulos, franquias ou outros campos
      const { error: updateError } = await supabase
        .from('clientes')
        .update({
          valor_total: novoValor,
          valor_mensalidade: novoValor,
        })
        .eq('id', item.clienteIdSistema)

      if (updateError) {
        throw updateError
      }

      totalSucesso++
      itens.push({
        linhaOriginal: item.linhaOriginal,
        cnpj: item.cnpjOriginal,
        clienteNome: item.clienteNomeSistema || item.clienteArquivo,
        clienteId: item.clienteIdSistema,
        valorAnterior: valorAnterior,
        valorNovo: novoValor,
        status: 'sucesso',
        mensagem: 'Mensalidade atualizada com sucesso',
      })
    } catch (err: any) {
      totalErros++
      itens.push({
        linhaOriginal: item.linhaOriginal,
        cnpj: item.cnpjOriginal,
        clienteNome: item.clienteNomeSistema || item.clienteArquivo,
        clienteId: item.clienteIdSistema,
        valorAnterior: item.mensalidadeAtualSistema,
        valorNovo: item.novoValorArquivo || 0,
        status: 'erro',
        mensagem: err.message || 'Erro ao gravar dados no banco',
      })
    }
  }

  return {
    totalProcessados: previa.length,
    totalSucesso,
    totalErros,
    totalIgnorados,
    itens,
  }
}
