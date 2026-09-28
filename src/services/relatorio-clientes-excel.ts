import ExcelJS from 'exceljs'
import type { ClienteRelatorio } from './relatorio-clientes'
import { parseModulosToList, isModuloReal } from '@/lib/modules-parser'
import { formatCNPJ } from '@/lib/formatters'
import { MODULES } from '@/constants/contracts'

export { isModuloReal }

/**
 * Normaliza nome de módulo para comparação exata (sem acentos, minúsculo, espaços unificados)
 */
export function normalizeExactModuleName(name: string): string {
  return name
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, ' ')
}

/**
 * Verifica se um nome de módulo coincide exatamente com outro
 */
export function matchesExactModule(moduleInClient: string, targetModule: string): boolean {
  const normClient = normalizeExactModuleName(moduleInClient)
  const normTarget = normalizeExactModuleName(targetModule)
  if (normClient === normTarget) return true

  // Equivalências conhecidas para nomes com sufixos de pacote
  if (normTarget === 'frota' && (normClient.startsWith('frota') || normClient.includes('frota'))) {
    return true
  }
  if (
    normTarget === 'bi' &&
    (normClient === 'bi web' || normClient === 'power bi' || normClient === 'bi')
  ) {
    return true
  }
  if (normTarget === 'bi web' && (normClient === 'power bi' || normClient === 'bi web')) {
    return true
  }
  if (normTarget === 'torre de controle' && normClient.startsWith('torre de controle')) {
    return true
  }
  return false
}

/**
 * Lista prioritária exigida pelo usuário:
 * Administração; Básico; Carga; Comercial; Faturamento; Financeiro; Fiscal; DF-e; EDI;
 * Controle de Viagem; Frota; BI; Torre de Controle; SL-Trip; SL-Track; Fracionado; Medição;
 * + demais módulos cadastrados no catálogo/banco.
 */
export const ORDERED_DEFAULT_MODULES = [
  'Administração',
  'Básico',
  'Carga',
  'Comercial',
  'Faturamento',
  'Financeiro',
  'Fiscal',
  'DF-e',
  'EDI',
  'Controle de Viagem',
  'Frota',
  'BI',
  'Torre de Controle',
  'SL-Trip',
  'SL-Track',
  'Fracionado',
  'Medição',
]

/**
 * Monta o catálogo ordenado completo de colunas de módulos para o Excel
 */
export function getExcelModuleColumns(clientes: ClienteRelatorio[]): string[] {
  const orderedList = [...ORDERED_DEFAULT_MODULES]
  const existingNorms = new Set(orderedList.map((m) => normalizeExactModuleName(m)))

  // Adicionar outros módulos do catálogo oficial se não estiverem presentes
  for (const mod of MODULES) {
    if (!isModuloReal(mod.name)) continue
    const norm = normalizeExactModuleName(mod.name)
    // Se for frota ou bi com outro nome, verificar se já temos o representante
    if (!existingNorms.has(norm)) {
      if (norm.startsWith('frota') && existingNorms.has('frota')) continue
      if ((norm === 'bi web' || norm === 'power bi') && existingNorms.has('bi')) continue
      if (norm.startsWith('torre de controle') && existingNorms.has('torre de controle')) continue
      orderedList.push(mod.name)
      existingNorms.add(norm)
    }
  }

  // Adicionar módulos que existam nos dados dos clientes (apenas módulos reais)
  for (const cliente of clientes) {
    const list = parseModulosToList(cliente.modulos)
    for (const m of list) {
      if (!isModuloReal(m)) continue
      const norm = normalizeExactModuleName(m)
      if (norm.startsWith('frota') && existingNorms.has('frota')) continue
      if (
        (norm === 'bi web' || norm === 'power bi' || norm === 'bi') &&
        (existingNorms.has('bi') || existingNorms.has('bi web'))
      )
        continue
      if (norm.startsWith('torre de controle') && existingNorms.has('torre de controle')) continue
      if (!existingNorms.has(norm)) {
        orderedList.push(m.trim())
        existingNorms.add(norm)
      }
    }
  }

  return orderedList
}

export function formatAssinaturaDate(dateStr: string | null | undefined): string {
  if (!dateStr || !dateStr.trim()) return 'Não informada'
  const datePart = dateStr.includes('T') ? dateStr.split('T')[0] : dateStr.trim()
  if (/^\d{4}-\d{2}-\d{2}$/.test(datePart)) {
    const [year, month, day] = datePart.split('-')
    return `${day}/${month}/${year}`
  }
  const d = new Date(dateStr)
  if (isNaN(d.getTime())) return 'Não informada'
  const day = String(d.getDate()).padStart(2, '0')
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const year = d.getFullYear()
  return `${day}/${month}/${year}`
}

export async function exportClientesToExcel(rows: ClienteRelatorio[]): Promise<void> {
  const workbook = new ExcelJS.Workbook()
  workbook.creator = 'Service Logic'
  workbook.created = new Date()

  const worksheet = workbook.addWorksheet('Clientes', {
    views: [{ state: 'frozen', ySplit: 1 }], // Congela a primeira linha
  })

  // Descobrir as colunas de módulos
  const moduleColumns = getExcelModuleColumns(rows)

  // Definir colunas base
  const columnsDef = [
    { header: 'Nome / Razão Social', key: 'nome', width: 34 },
    { header: 'CNPJ', key: 'cnpj', width: 20 },
    { header: 'Duplicidade CNPJ', key: 'duplicidade', width: 22 },
    { header: 'Data de assinatura do contrato', key: 'data_assinatura', width: 24 },
    { header: 'Mensalidade', key: 'mensalidade', width: 18 },
    { header: 'Dia Vencimento', key: 'vencimento', width: 16 },
    { header: 'Código do Plano', key: 'plano_codigo', width: 18 },
    { header: 'Plano Contratado', key: 'plano_descricao', width: 24 },
    { header: 'Resumo dos módulos', key: 'modulos_resumo', width: 36 },
    ...moduleColumns.map((modName) => ({
      header: `Módulo: ${modName}`,
      key: `mod_${normalizeExactModuleName(modName)}`,
      width: Math.max(14, modName.length + 8),
    })),
    { header: 'Endereço', key: 'endereco', width: 32 },
    { header: 'Status', key: 'status', width: 14 },
  ]

  worksheet.columns = columnsDef

  // Formatação do Cabeçalho (Linha 1)
  const headerRow = worksheet.getRow(1)
  headerRow.height = 32
  headerRow.eachCell((cell) => {
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF1B4382' }, // Cor primária da Service Logic
    }
    cell.font = {
      bold: true,
      color: { argb: 'FFFFFFFF' },
      size: 11,
      name: 'Calibri',
    }
    cell.alignment = {
      vertical: 'middle',
      horizontal: 'center',
      wrapText: true,
    }
    cell.border = {
      top: { style: 'thin', color: { argb: 'FF0D2549' } },
      bottom: { style: 'medium', color: { argb: 'FFF37021' } }, // Linha inferior laranja Service Logic
      left: { style: 'thin', color: { argb: 'FF335C9A' } },
      right: { style: 'thin', color: { argb: 'FF335C9A' } },
    }
  })

  // Adicionar dados
  rows.forEach((cliente, index) => {
    const modulosList = parseModulosToList(cliente.modulos).filter(isModuloReal)
    const dupText =
      cliente.cnpj_duplicado_count && cliente.cnpj_duplicado_count > 1
        ? `CNPJ duplicado (${cliente.cnpj_duplicado_count} registros)`
        : 'Não duplicado'
    const planoExibido =
      cliente.plano_descricao && cliente.plano_descricao.trim()
        ? cliente.plano_descricao.trim()
        : 'Não informado'
    const dataAssinaturaFormatada = formatAssinaturaDate(cliente.data_assinatura)
    const mensalidadeValor = cliente.valor_total != null ? Number(cliente.valor_total) : 0
    const statusText = cliente.status?.trim() || 'Ativo'

    const rowData: Record<string, any> = {
      nome: cliente.nome,
      cnpj: cliente.cnpj ? formatCNPJ(cliente.cnpj) : '',
      duplicidade: dupText,
      data_assinatura: dataAssinaturaFormatada,
      mensalidade: mensalidadeValor,
      vencimento: cliente.vencimento_mensal != null ? `${cliente.vencimento_mensal}º` : '—',
      plano_codigo: cliente.plano_codigo ?? '-',
      plano_descricao: planoExibido,
      modulos_resumo: modulosList.length > 0 ? modulosList.join(', ') : 'Nenhum',
      endereco: cliente.endereco || '—',
      status: statusText,
    }

    // Colunas de cada módulo: "Sim" ou "Não"
    for (const modName of moduleColumns) {
      const hasMod = modulosList.some((m) => matchesExactModule(m, modName))
      rowData[`mod_${normalizeExactModuleName(modName)}`] = hasMod ? 'Sim' : 'Não'
    }

    const row = worksheet.addRow(rowData)
    row.height = 24

    // Cores alternadas
    const isEven = index % 2 === 0
    const rowBg = isEven ? 'FFFFFFFF' : 'FFF8FAFC' // Branco e slate-50

    row.eachCell({ includeEmpty: true }, (cell, colNumber) => {
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: rowBg },
      }
      cell.font = {
        size: 10,
        name: 'Calibri',
        color: { argb: 'FF1E293B' },
      }
      cell.border = {
        top: { style: 'thin', color: { argb: 'FFE2E8F0' } },
        bottom: { style: 'thin', color: { argb: 'FFE2E8F0' } },
        left: { style: 'thin', color: { argb: 'FFE2E8F0' } },
        right: { style: 'thin', color: { argb: 'FFE2E8F0' } },
      }
      cell.alignment = {
        vertical: 'middle',
        wrapText: true,
      }

      // Alinhamento específico por coluna
      // 1: Nome (esquerda)
      // 2: CNPJ (centro)
      // 3: Duplicidade (centro)
      // 4: Data de assinatura (centro)
      // 5: Mensalidade (direita + moeda R$)
      // 6: Dia Vencimento (centro)
      // 7: Código do Plano (centro)
      // 8: Plano (esquerda)
      // 9: Resumo módulos (esquerda)
      // 10 .. N-2: Módulos Sim/Não (centro)
      // N-1: Endereço (esquerda)
      // N: Status (centro + cor verde/vermelho)

      if (
        colNumber === 2 ||
        colNumber === 3 ||
        colNumber === 4 ||
        colNumber === 6 ||
        colNumber === 7
      ) {
        cell.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true }
      }

      // Mensalidade
      if (colNumber === 5) {
        cell.numFmt = '"R$" #,##0.00;[Red]-"R$" #,##0.00;"R$" 0.00'
        cell.alignment = { vertical: 'middle', horizontal: 'right' }
        cell.font = { bold: true, size: 10, name: 'Calibri', color: { argb: 'FF0F172A' } }
      }

      // Colunas dos módulos: Sim / Não
      const totalFixedLeft = 9
      const totalModules = moduleColumns.length
      if (colNumber > totalFixedLeft && colNumber <= totalFixedLeft + totalModules) {
        cell.alignment = { vertical: 'middle', horizontal: 'center' }
        if (cell.value === 'Sim') {
          cell.font = { bold: true, color: { argb: 'FF15803D' }, size: 10, name: 'Calibri' } // verde
          cell.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: isEven ? 'FFF0FDF4' : 'FFE7F9EE' },
          }
        } else {
          cell.font = { color: { argb: 'FF94A3B8' }, size: 9, name: 'Calibri' }
        }
      }

      // Coluna Status
      const lastCol = columnsDef.length
      if (colNumber === lastCol) {
        cell.alignment = { vertical: 'middle', horizontal: 'center' }
        const isInactive =
          statusText.toLowerCase() === 'inativo' || statusText.toLowerCase() === 'cancelado'
        if (isInactive) {
          cell.font = { bold: true, color: { argb: 'FFB91C1C' }, size: 10, name: 'Calibri' } // vermelho
          cell.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FFFEE2E2' },
          }
        } else {
          cell.font = { bold: true, color: { argb: 'FF15803D' }, size: 10, name: 'Calibri' } // verde
          cell.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FFDCFCE7' },
          }
        }
      }

      // Duplicidade destacada se for duplicado
      if (colNumber === 3 && dupText.startsWith('CNPJ duplicado')) {
        cell.font = { bold: true, color: { argb: 'FFB45309' }, size: 9, name: 'Calibri' }
        cell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FFFEF3C7' },
        }
      }
    })
  })

  // Habilitar AutoFiltro em todas as colunas
  worksheet.autoFilter = {
    from: { row: 1, column: 1 },
    to: { row: rows.length + 1, column: columnsDef.length },
  }

  // Gerar o buffer e disparar download no browser
  const buffer = await workbook.xlsx.writeBuffer()
  const blob = new Blob([buffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  const today = new Date().toISOString().split('T')[0]
  link.href = url
  link.download = `relatorio_clientes_${today}.xlsx`
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}
