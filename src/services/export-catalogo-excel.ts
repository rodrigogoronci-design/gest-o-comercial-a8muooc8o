import ExcelJS from 'exceljs'
import { supabase } from '@/lib/supabase/client'
import { MODULES } from '@/constants/contracts'

export interface PlanoCatalogoDb {
  id: string
  codigo: string
  descricao: string
  valor_titular: number | null
  franquia_quantidade: number | null
  valor_excedente: number | null
  tipo: string | null
  ativo: boolean | null
  modulos: any
}

/**
 * Busca todos os registros do catálogo diretamente da tabela public.planos_saude
 */
export async function fetchAllCatalogoPlanos(): Promise<PlanoCatalogoDb[]> {
  const { data, error } = await (supabase.from('planos_saude') as any)
    .select(
      'id, codigo, descricao, valor_titular, franquia_quantidade, valor_excedente, tipo, ativo, modulos',
    )
    .order('tipo', { ascending: true })
    .order('valor_titular', { ascending: true })

  if (error) {
    console.error('Erro ao buscar catálogo de planos para exportação:', error)
    throw error
  }

  return (data || []) as PlanoCatalogoDb[]
}

/**
 * Converte modulos (jsonb array ou string) em lista legível
 */
function formatIncludedModules(modulos: any, codigo: string): string {
  if (codigo === 'ERP-NONE') {
    return 'Nenhum'
  }

  let list: string[] = []
  if (Array.isArray(modulos)) {
    list = modulos.map((m) => (typeof m === 'string' ? m : m?.name || String(m))).filter(Boolean)
  } else if (typeof modulos === 'string' && modulos.trim()) {
    try {
      const parsed = JSON.parse(modulos)
      if (Array.isArray(parsed)) {
        list = parsed.map((m) => (typeof m === 'string' ? m : m?.name || String(m))).filter(Boolean)
      }
    } catch {
      list = modulos
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean)
    }
  }

  if (list.length === 0) {
    if (codigo === 'ERP-TMS-30') {
      return 'Administração, Básico, Carga, Comercial'
    }
    if (codigo.startsWith('ERP-TMS-') || codigo === 'ERP-PONTO-WEB') {
      return 'Administração, Básico, Carga, Comercial, Faturamento, Financeiro'
    }
    return 'Módulos base padrão'
  }

  return list.join(', ')
}

/**
 * Resolve descrição detalhada ou regras de módulos para a aba de Módulos
 */
function resolveModuleDescription(mod: PlanoCatalogoDb): string {
  const parts: string[] = []

  // Procurar regras de franquia / excedente
  if (mod.franquia_quantidade != null && mod.franquia_quantidade > 0) {
    parts.push(`Franquia: ${mod.franquia_quantidade} placas`)
    if (mod.valor_excedente != null && mod.valor_excedente > 0) {
      parts.push(
        `Excedente: R$ ${Number(mod.valor_excedente).toFixed(2).replace('.', ',')}/placa extra`,
      )
    }
  }

  // Procurar descrição conhecida nos contratos (ex: Torre de Controle)
  const knownMod = MODULES.find(
    (m) =>
      m.id.toLowerCase() === mod.codigo.toLowerCase() ||
      m.name.toLowerCase() === mod.descricao.toLowerCase() ||
      (mod.codigo === 'FROTA_20' && m.id === 'mod-frota-20') ||
      (mod.codigo === 'MOD-FROTA-10' && m.id === 'mod-frota'),
  )

  if (knownMod && (knownMod as any).description) {
    parts.push((knownMod as any).description)
  }

  if (parts.length > 0) {
    return parts.join(' | ')
  }

  return mod.descricao || 'Módulo complementar'
}

/**
 * Exporta o catálogo de planos e módulos para uma planilha Excel (.xlsx) com duas abas:
 * 1. Planos: Plano, Código, Mensalidade, Módulos inclusos, Ativo
 * 2. Módulos: Módulo, Mensalidade, Descrição/regras se existirem, Ativo
 *
 * Utiliza o padrão visual corporativo Service Logic (cabeçalho azul #1B4382 com borda laranja #F37021,
 * primeira linha congelada, autofiltro, formatação de moeda R$, linhas zebradas e destaque de status Ativo/Inativo).
 */
export async function exportCatalogoToExcel(): Promise<void> {
  const catalog = await fetchAllCatalogoPlanos()

  const workbook = new ExcelJS.Workbook()
  workbook.creator = 'Service Logic'
  workbook.created = new Date()

  // ----------------------------------------------------
  // ABA 1: PLANOS
  // ----------------------------------------------------
  const sheetPlanos = workbook.addWorksheet('Planos', {
    views: [{ state: 'frozen', ySplit: 1 }],
  })

  sheetPlanos.columns = [
    { header: 'Plano', key: 'plano', width: 36 },
    { header: 'Código', key: 'codigo', width: 22 },
    { header: 'Mensalidade', key: 'mensalidade', width: 20 },
    { header: 'Módulos inclusos', key: 'modulos_inclusos', width: 50 },
    { header: 'Ativo', key: 'ativo', width: 14 },
  ]

  // Formatar cabeçalho Planos
  const headerPlanos = sheetPlanos.getRow(1)
  headerPlanos.height = 32
  headerPlanos.eachCell((cell) => {
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF1B4382' }, // Azul Service Logic
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
      bottom: { style: 'medium', color: { argb: 'FFF37021' } }, // Laranja Service Logic
      left: { style: 'thin', color: { argb: 'FF335C9A' } },
      right: { style: 'thin', color: { argb: 'FF335C9A' } },
    }
  })

  // Filtrar planos de base (tipo != 'modulo')
  // Ordenar canônicos: ERP-PONTO-WEB, ERP-TMS-*, ERP-NONE, etc.
  const planosRows = catalog.filter((item) => item.tipo !== 'modulo')

  planosRows.forEach((plano, index) => {
    const isAtivo = plano.ativo !== false
    const mensalidade = plano.valor_titular != null ? Number(plano.valor_titular) : 0
    const modulosInclusos = formatIncludedModules(plano.modulos, plano.codigo)

    const row = sheetPlanos.addRow({
      plano: plano.descricao,
      codigo: plano.codigo,
      mensalidade,
      modulos_inclusos: modulosInclusos,
      ativo: isAtivo ? 'Sim' : 'Não',
    })

    row.height = 24
    const isEven = index % 2 === 0
    const rowBg = isEven ? 'FFFFFFFF' : 'FFF8FAFC'

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

      // Plano (esq), Código (centro), Mensalidade (dir), Modulos (esq), Ativo (centro)
      if (colNumber === 2) {
        cell.alignment = { vertical: 'middle', horizontal: 'center' }
      } else if (colNumber === 3) {
        cell.numFmt = '"R$" #,##0.00;[Red]-"R$" #,##0.00;"R$" 0.00'
        cell.alignment = { vertical: 'middle', horizontal: 'right' }
        cell.font = { bold: true, size: 10, name: 'Calibri', color: { argb: 'FF0F172A' } }
      } else if (colNumber === 5) {
        cell.alignment = { vertical: 'middle', horizontal: 'center' }
        if (isAtivo) {
          cell.font = { bold: true, color: { argb: 'FF15803D' }, size: 10, name: 'Calibri' }
          cell.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FFDCFCE7' },
          }
        } else {
          cell.font = { bold: true, color: { argb: 'FFB91C1C' }, size: 10, name: 'Calibri' }
          cell.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FFFEE2E2' },
          }
        }
      }
    })
  })

  sheetPlanos.autoFilter = {
    from: { row: 1, column: 1 },
    to: { row: planosRows.length + 1, column: 5 },
  }

  // ----------------------------------------------------
  // ABA 2: MÓDULOS
  // ----------------------------------------------------
  const sheetModulos = workbook.addWorksheet('Módulos', {
    views: [{ state: 'frozen', ySplit: 1 }],
  })

  sheetModulos.columns = [
    { header: 'Módulo', key: 'modulo', width: 34 },
    { header: 'Mensalidade', key: 'mensalidade', width: 20 },
    { header: 'Descrição / Regras', key: 'descricao_regras', width: 56 },
    { header: 'Ativo', key: 'ativo', width: 14 },
  ]

  // Formatar cabeçalho Módulos
  const headerModulos = sheetModulos.getRow(1)
  headerModulos.height = 32
  headerModulos.eachCell((cell) => {
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF1B4382' },
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
      bottom: { style: 'medium', color: { argb: 'FFF37021' } },
      left: { style: 'thin', color: { argb: 'FF335C9A' } },
      right: { style: 'thin', color: { argb: 'FF335C9A' } },
    }
  })

  // Filtrar módulos (tipo === 'modulo')
  const modulosRows = catalog.filter((item) => item.tipo === 'modulo')

  modulosRows.forEach((modulo, index) => {
    const isAtivo = modulo.ativo !== false
    const mensalidade = modulo.valor_titular != null ? Number(modulo.valor_titular) : 0
    const descricaoRegras = resolveModuleDescription(modulo)

    const row = sheetModulos.addRow({
      modulo: modulo.descricao,
      mensalidade,
      descricao_regras: descricaoRegras,
      ativo: isAtivo ? 'Sim' : 'Não',
    })

    row.height = 24
    const isEven = index % 2 === 0
    const rowBg = isEven ? 'FFFFFFFF' : 'FFF8FAFC'

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

      // Modulo (esq), Mensalidade (dir), Descricao (esq), Ativo (centro)
      if (colNumber === 2) {
        cell.numFmt = '"R$" #,##0.00;[Red]-"R$" #,##0.00;"R$" 0.00'
        cell.alignment = { vertical: 'middle', horizontal: 'right' }
        cell.font = { bold: true, size: 10, name: 'Calibri', color: { argb: 'FF0F172A' } }
      } else if (colNumber === 4) {
        cell.alignment = { vertical: 'middle', horizontal: 'center' }
        if (isAtivo) {
          cell.font = { bold: true, color: { argb: 'FF15803D' }, size: 10, name: 'Calibri' }
          cell.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FFDCFCE7' },
          }
        } else {
          cell.font = { bold: true, color: { argb: 'FFB91C1C' }, size: 10, name: 'Calibri' }
          cell.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FFFEE2E2' },
          }
        }
      }
    })
  })

  sheetModulos.autoFilter = {
    from: { row: 1, column: 1 },
    to: { row: modulosRows.length + 1, column: 4 },
  }

  // ----------------------------------------------------
  // DOWNLOAD DO ARQUIVO XLSX
  // ----------------------------------------------------
  const buffer = await workbook.xlsx.writeBuffer()
  const blob = new Blob([buffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  const today = new Date().toISOString().split('T')[0]
  link.href = url
  link.download = `catalogo_planos_precos_${today}.xlsx`
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}
