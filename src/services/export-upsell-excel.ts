import ExcelJS from 'exceljs'
import {
  buildUpsellQueue,
  extractAllContractedModules,
  type UpsellClienteLinha,
  type CampanhaUpsellResumo,
} from '@/lib/module-normalizer'
import { formatCNPJ, formatCurrency, formatDateOnly } from '@/lib/formatters'

/**
 * Exporta a planilha oficial completa de Fila Comercial de Upsell (.xlsx)
 * com as 3 abas oficiais da Service Logic:
 *  1. Resumo (ordem de campanhas, total de elegíveis, objetivo do contato)
 *  2. Fila Comercial (lista única priorizada de clientes com oferta inicial e oportunidades)
 *  3. Campanhas por módulo (clientes elegíveis por módulo)
 */
export async function exportFilaComercialUpsellExcel(
  clientes: any[],
  historicosPorCliente?: Map<string, any[]> | null,
): Promise<void> {
  const { filaComercial, campanhasResumo, campanhasPorModulo } = buildUpsellQueue(
    clientes,
    historicosPorCliente,
  )

  const workbook = new ExcelJS.Workbook()
  workbook.creator = 'Service Logic - Gestão Comercial'
  workbook.created = new Date()

  // -------------------------------------------------------------
  // ABA 1: Resumo
  // -------------------------------------------------------------
  const wsResumo = workbook.addWorksheet('Resumo', {
    views: [{ showGridLines: true }],
  })

  wsResumo.columns = [{ width: 10 }, { width: 28 }, { width: 22 }, { width: 85 }]

  // Linhas de Título
  const titleRow1 = wsResumo.addRow(['Plano de contato e upsell da base de clientes', '', '', ''])
  titleRow1.font = { name: 'Calibri', size: 14, bold: true, color: { argb: 'FF1B4382' } }
  wsResumo.mergeCells('A1:D1')

  const titleRow2 = wsResumo.addRow([
    `Ordem de abordagem baseada nos módulos ainda não contratados | ${formatDateOnly(new Date().toISOString())}`,
    '',
    '',
    '',
  ])
  titleRow2.font = { name: 'Calibri', size: 10, italic: true, color: { argb: 'FF64748B' } }
  wsResumo.mergeCells('A2:D2')

  wsResumo.addRow([]) // Linha em branco

  // Cabeçalho da Tabela de Campanhas
  const headerResumo = wsResumo.addRow([
    'Ordem',
    'Campanha',
    'Clientes elegíveis',
    'Objetivo do contato',
  ])
  headerResumo.height = 28
  headerResumo.eachCell((cell) => {
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF1B4382' },
    }
    cell.font = { name: 'Calibri', size: 11, bold: true, color: { argb: 'FFFFFFFF' } }
    cell.alignment = { vertical: 'middle', horizontal: 'center' }
  })
  headerResumo.getCell(4).alignment = { vertical: 'middle', horizontal: 'left' }

  // Linhas das Campanhas
  campanhasResumo.forEach((camp, index) => {
    const row = wsResumo.addRow([
      camp.ordem,
      camp.campanha,
      camp.clientesElegiveis,
      camp.objetivoContato,
    ])
    row.height = 24
    const isEven = index % 2 === 0
    row.eachCell((cell, colNumber) => {
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: isEven ? 'FFFFFFFF' : 'FFF8FAFC' },
      }
      cell.border = {
        top: { style: 'thin', color: { argb: 'FFE2E8F0' } },
        bottom: { style: 'thin', color: { argb: 'FFE2E8F0' } },
        left: { style: 'thin', color: { argb: 'FFE2E8F0' } },
        right: { style: 'thin', color: { argb: 'FFE2E8F0' } },
      }
      cell.font = { name: 'Calibri', size: 10 }
      if (colNumber === 1 || colNumber === 3) {
        cell.alignment = { vertical: 'middle', horizontal: 'center' }
      } else {
        cell.alignment = { vertical: 'middle', horizontal: 'left' }
      }
      if (colNumber === 2) {
        cell.font = { name: 'Calibri', size: 10, bold: true, color: { argb: 'FF1E293B' } }
      }
      if (colNumber === 3) {
        cell.font = { name: 'Calibri', size: 10, bold: true, color: { argb: 'FF1B4382' } }
      }
    })
  })

  wsResumo.addRow([]) // Linha em branco

  // Seção "Como usar a fila"
  const instrucoesTitle = wsResumo.addRow(['Como usar a fila', '', '', ''])
  instrucoesTitle.font = { name: 'Calibri', size: 12, bold: true, color: { argb: 'FF0F172A' } }
  wsResumo.mergeCells(`A${instrucoesTitle.number}:D${instrucoesTitle.number}`)

  const instrucaoTexto =
    'Comece pela prioridade 1 e avance na ordem. Cada cliente aparece uma única vez na Fila Comercial, com uma oferta inicial e outras oportunidades registradas. Faça primeiro a pergunta de satisfação e diagnóstico. Se houver problema aberto, registre e encaminhe antes de vender. Use a aba Campanhas por módulo para consultar todos os clientes elegíveis a cada produto.'
  const instrucoesBody = wsResumo.addRow([instrucaoTexto, '', '', ''])
  instrucoesBody.height = 40
  instrucoesBody.font = { name: 'Calibri', size: 10, color: { argb: 'FF475569' } }
  instrucoesBody.alignment = { vertical: 'top', horizontal: 'left', wrapText: true }
  wsResumo.mergeCells(`A${instrucoesBody.number}:D${instrucoesBody.number}`)

  wsResumo.addRow([]) // Linha em branco

  // Mensagem inicial sugerida
  const msgTitle = wsResumo.addRow(['Mensagem inicial sugerida', '', '', ''])
  msgTitle.font = { name: 'Calibri', size: 12, bold: true, color: { argb: 'FF0F172A' } }
  wsResumo.mergeCells(`A${msgTitle.number}:D${msgTitle.number}`)

  const msgSugerida =
    'Olá, tudo bem? Aqui é da Service Logic. Estou entrando em contato para acompanhar como está a utilização do sistema na sua operação e entender se há alguma demanda ou rotina que podemos apoiar.'
  const msgBody = wsResumo.addRow([msgSugerida, '', '', ''])
  msgBody.height = 30
  msgBody.font = { name: 'Calibri', size: 10, italic: true, color: { argb: 'FF334155' } }
  msgBody.alignment = { vertical: 'top', horizontal: 'left', wrapText: true }
  wsResumo.mergeCells(`A${msgBody.number}:D${msgBody.number}`)

  // -------------------------------------------------------------
  // ABA 2: Fila Comercial
  // -------------------------------------------------------------
  const wsFila = workbook.addWorksheet('Fila Comercial', {
    views: [{ state: 'frozen', ySplit: 1, xSplit: 3 }],
  })

  const colunasFila = [
    { header: 'Ordem', key: 'ordem', width: 9 },
    { header: 'Prioridade', key: 'prioridade', width: 12 },
    { header: 'Cliente', key: 'cliente', width: 36 },
    { header: 'CNPJ', key: 'cnpj', width: 22 },
    { header: 'Nome do contato', key: 'contato', width: 24 },
    { header: 'WhatsApp', key: 'whatsapp', width: 18 },
    { header: 'Plano', key: 'plano', width: 16 },
    { header: 'Mensalidade', key: 'mensalidade', width: 16 },
    { header: 'Assinatura', key: 'assinatura', width: 16 },
    { header: 'Módulos atuais', key: 'modulos_atuais', width: 44 },
    { header: 'Oferta inicial', key: 'oferta_inicial', width: 20 },
    { header: 'Outras oportunidades', key: 'outras_oportunidades', width: 30 },
    { header: 'Pergunta de diagnóstico', key: 'pergunta', width: 60 },
    { header: 'Contato realizado', key: 'contato_realizado', width: 18 },
    { header: 'Data do contato', key: 'data_contato', width: 16 },
    { header: 'Satisfação (0-10)', key: 'satisfacao', width: 16 },
    { header: 'Dor ou necessidade', key: 'dor_necessidade', width: 30 },
    { header: 'Interesse', key: 'interesse', width: 18 },
    { header: 'Próxima ação', key: 'proxima_acao', width: 24 },
    { header: 'Data de retorno', key: 'data_retorno', width: 16 },
    { header: 'Observações', key: 'observacoes', width: 32 },
  ]

  wsFila.columns = colunasFila

  const headerFila = wsFila.getRow(1)
  headerFila.height = 32
  headerFila.eachCell((cell) => {
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF1B4382' },
    }
    cell.font = { name: 'Calibri', size: 10, bold: true, color: { argb: 'FFFFFFFF' } }
    cell.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true }
    cell.border = {
      top: { style: 'thin', color: { argb: 'FF0D2549' } },
      bottom: { style: 'medium', color: { argb: 'FFF37021' } },
      left: { style: 'thin', color: { argb: 'FF335C9A' } },
      right: { style: 'thin', color: { argb: 'FF335C9A' } },
    }
  })

  filaComercial.forEach((linha, index) => {
    const row = wsFila.addRow({
      ordem: linha.ordem,
      prioridade: linha.prioridade,
      cliente: linha.clienteNome,
      cnpj: linha.cnpj ? formatCNPJ(linha.cnpj) : '',
      contato: linha.contatoNome || '',
      whatsapp: linha.whatsapp || '',
      plano: linha.planoDescricao || 'TMS',
      mensalidade: linha.mensalidade,
      assinatura: linha.dataAssinatura ? formatDateOnly(linha.dataAssinatura) : 'Não informada',
      modulos_atuais: linha.modulosAtuais.join(', '),
      oferta_inicial: linha.ofertaInicial,
      outras_oportunidades: linha.outrasOportunidades.join(', '),
      pergunta: linha.perguntaDiagnostico,
      contato_realizado: 'Não',
      data_contato: '',
      satisfacao: '',
      dor_necessidade: '',
      interesse: 'Não informado',
      proxima_acao: '',
      data_retorno: '',
      observacoes: '',
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
      cell.font = { name: 'Calibri', size: 10, color: { argb: 'FF1E293B' } }
      cell.border = {
        top: { style: 'thin', color: { argb: 'FFE2E8F0' } },
        bottom: { style: 'thin', color: { argb: 'FFE2E8F0' } },
        left: { style: 'thin', color: { argb: 'FFE2E8F0' } },
        right: { style: 'thin', color: { argb: 'FFE2E8F0' } },
      }
      cell.alignment = { vertical: 'middle', wrapText: true }

      // Centralizados
      if ([1, 2, 4, 6, 9, 14, 15, 16, 18, 20].includes(colNumber)) {
        cell.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true }
      }

      // Moeda Mensalidade (coluna 8)
      if (colNumber === 8) {
        cell.numFmt = '"R$" #,##0.00;[Red]-"R$" #,##0.00;"R$" 0.00'
        cell.alignment = { vertical: 'middle', horizontal: 'right' }
        cell.font = { name: 'Calibri', size: 10, bold: true, color: { argb: 'FF0F172A' } }
      }

      // Destaque Oferta Inicial (coluna 11)
      if (colNumber === 11) {
        cell.font = { name: 'Calibri', size: 10, bold: true, color: { argb: 'FF1B4382' } }
        cell.alignment = { vertical: 'middle', horizontal: 'center' }
      }

      // Prioridade com destaque
      if (colNumber === 2) {
        cell.font = { name: 'Calibri', size: 10, bold: true, color: { argb: 'FFF37021' } }
      }
    })
  })

  wsFila.autoFilter = {
    from: { row: 1, column: 1 },
    to: { row: filaComercial.length + 1, column: colunasFila.length },
  }

  // -------------------------------------------------------------
  // ABA 3: Campanhas por módulo
  // -------------------------------------------------------------
  const wsCampanhas = workbook.addWorksheet('Campanhas por módulo', {
    views: [{ state: 'frozen', ySplit: 1 }],
  })

  const colunasCampanhas = [
    { header: 'Ordem', key: 'ordem', width: 9 },
    { header: 'Campanha', key: 'campanha', width: 22 },
    { header: 'Cliente', key: 'cliente', width: 36 },
    { header: 'CNPJ', key: 'cnpj', width: 22 },
    { header: 'Plano', key: 'plano', width: 16 },
    { header: 'Mensalidade', key: 'mensalidade', width: 16 },
    { header: 'Pergunta de diagnóstico', key: 'pergunta', width: 68 },
  ]

  wsCampanhas.columns = colunasCampanhas

  const headerCamp = wsCampanhas.getRow(1)
  headerCamp.height = 32
  headerCamp.eachCell((cell) => {
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF1B4382' },
    }
    cell.font = { name: 'Calibri', size: 10, bold: true, color: { argb: 'FFFFFFFF' } }
    cell.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true }
    cell.border = {
      top: { style: 'thin', color: { argb: 'FF0D2549' } },
      bottom: { style: 'medium', color: { argb: 'FFF37021' } },
      left: { style: 'thin', color: { argb: 'FF335C9A' } },
      right: { style: 'thin', color: { argb: 'FF335C9A' } },
    }
  })

  campanhasPorModulo.forEach((linha, index) => {
    const row = wsCampanhas.addRow({
      ordem: linha.ordem,
      campanha: linha.campanha,
      cliente: linha.cliente,
      cnpj: linha.cnpj ? formatCNPJ(linha.cnpj) : '',
      plano: linha.plano,
      mensalidade: linha.mensalidade,
      pergunta: linha.perguntaDiagnostico,
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
      cell.font = { name: 'Calibri', size: 10, color: { argb: 'FF1E293B' } }
      cell.border = {
        top: { style: 'thin', color: { argb: 'FFE2E8F0' } },
        bottom: { style: 'thin', color: { argb: 'FFE2E8F0' } },
        left: { style: 'thin', color: { argb: 'FFE2E8F0' } },
        right: { style: 'thin', color: { argb: 'FFE2E8F0' } },
      }
      cell.alignment = { vertical: 'middle', wrapText: true }

      if (colNumber === 1 || colNumber === 4 || colNumber === 5) {
        cell.alignment = { vertical: 'middle', horizontal: 'center' }
      }

      if (colNumber === 2) {
        cell.font = { name: 'Calibri', size: 10, bold: true, color: { argb: 'FF1B4382' } }
      }

      if (colNumber === 6) {
        cell.numFmt = '"R$" #,##0.00;[Red]-"R$" #,##0.00;"R$" 0.00'
        cell.alignment = { vertical: 'middle', horizontal: 'right' }
        cell.font = { name: 'Calibri', size: 10, bold: true, color: { argb: 'FF0F172A' } }
      }
    })
  })

  wsCampanhas.autoFilter = {
    from: { row: 1, column: 1 },
    to: { row: campanhasPorModulo.length + 1, column: colunasCampanhas.length },
  }

  // Gera o buffer e dispara download
  const buffer = await workbook.xlsx.writeBuffer()
  const blob = new Blob([buffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `Fila_Comercial_Upsell_Service_Logic.xlsx`
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}
