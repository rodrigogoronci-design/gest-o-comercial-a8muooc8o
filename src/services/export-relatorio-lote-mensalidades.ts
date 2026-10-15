import ExcelJS from 'exceljs'
import { formatCNPJ } from '@/lib/formatters'
import type { ResultadoExecucaoGeral } from './lote-mensalidades'

/**
 * Exporta o relatório final da importação de atualização de mensalidades
 * no mesmo padrão visual dos relatórios oficiais Service Logic:
 * - Cabeçalho institucional azul Service Logic (FF1B4382) com linha inferior laranja (FFF37021)
 * - Primeira linha congelada (frozen ySplit: 1)
 * - Linhas zebradas (branco e slate-50 FFF8FAFC)
 * - Valores monetários formatados em moeda ("R$" #,##0.00)
 * - Status destacados com cores correspondentes (Sucesso, Invalido, Sem Correspondência, Erro, Desmarcado)
 */
export async function exportRelatorioAtualizacaoToExcel(
  resultado: ResultadoExecucaoGeral,
): Promise<void> {
  const workbook = new ExcelJS.Workbook()
  workbook.creator = 'Service Logic'
  workbook.created = new Date()

  const worksheet = workbook.addWorksheet('Atualização de Mensalidades', {
    views: [{ state: 'frozen', ySplit: 1 }],
  })

  const columnsDef = [
    { header: 'Linha', key: 'linhaOriginal', width: 10 },
    { header: 'CNPJ', key: 'cnpj', width: 22 },
    { header: 'Cliente / Razão Social', key: 'clienteNome', width: 40 },
    { header: 'Valor Anterior (R$)', key: 'valorAnterior', width: 20 },
    { header: 'Novo Valor (R$)', key: 'valorNovo', width: 20 },
    { header: 'Diferença (R$)', key: 'diferenca', width: 18 },
    { header: 'Status da Execução', key: 'status', width: 24 },
    { header: 'Detalhes / Mensagem', key: 'mensagem', width: 42 },
  ]

  worksheet.columns = columnsDef

  // Formatação do Cabeçalho Service Logic (Linha 1)
  const headerRow = worksheet.getRow(1)
  headerRow.height = 32
  headerRow.eachCell((cell) => {
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF1B4382' }, // Azul institucional Service Logic
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

  const statusLabel = (st: string) => {
    switch (st) {
      case 'sucesso':
        return 'Atualizado com Sucesso'
      case 'sem_correspondencia':
        return 'Não Correspondido'
      case 'cnpj_invalido':
        return 'CNPJ Inválido'
      case 'ignorado_desmarcado':
        return 'Desmarcado na Prévia'
      case 'erro':
        return 'Falha na Gravação'
      default:
        return st
    }
  }

  // Preencher Linhas
  resultado.itens.forEach((item, index) => {
    const valorAnterior = Number(item.valorAnterior || 0)
    const valorNovo = Number(item.valorNovo || 0)
    const diferenca = valorNovo - valorAnterior

    const rowData = {
      linhaOriginal: item.linhaOriginal,
      cnpj: item.cnpj ? formatCNPJ(item.cnpj) : '',
      clienteNome: item.clienteNome || '—',
      valorAnterior: valorAnterior,
      valorNovo: valorNovo,
      diferenca: diferenca,
      status: statusLabel(item.status),
      mensagem: item.mensagem || '',
    }

    const row = worksheet.addRow(rowData)
    row.height = 24

    // Zebra: linhas alternadas
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

      // Coluna 1: Linha
      if (colNumber === 1) {
        cell.alignment = { vertical: 'middle', horizontal: 'center' }
      }

      // Coluna 2: CNPJ
      if (colNumber === 2) {
        cell.alignment = { vertical: 'middle', horizontal: 'center' }
        cell.font = { size: 10, name: 'Calibri', color: { argb: 'FF334155' } }
      }

      // Coluna 3: Cliente
      if (colNumber === 3) {
        cell.alignment = { vertical: 'middle', horizontal: 'left' }
        cell.font = { bold: true, size: 10, name: 'Calibri', color: { argb: 'FF0F172A' } }
      }

      // Colunas 4, 5, 6: Valores monetários
      if (colNumber === 4 || colNumber === 5 || colNumber === 6) {
        cell.numFmt = '"R$" #,##0.00;[Red]-"R$" #,##0.00;"R$" 0.00'
        cell.alignment = { vertical: 'middle', horizontal: 'right' }
        cell.font = { bold: true, size: 10, name: 'Calibri', color: { argb: 'FF0F172A' } }

        if (colNumber === 5 && item.status === 'sucesso') {
          cell.font = { bold: true, size: 10, name: 'Calibri', color: { argb: 'FF15803D' } } // verde
        }
      }

      // Coluna 7: Status
      if (colNumber === 7) {
        cell.alignment = { vertical: 'middle', horizontal: 'center' }
        switch (item.status) {
          case 'sucesso':
            cell.font = { bold: true, color: { argb: 'FF15803D' }, size: 10, name: 'Calibri' }
            cell.fill = {
              type: 'pattern',
              pattern: 'solid',
              fgColor: { argb: 'FFDCFCE7' }, // verde claro
            }
            break
          case 'sem_correspondencia':
            cell.font = { bold: true, color: { argb: 'FFB45309' }, size: 10, name: 'Calibri' }
            cell.fill = {
              type: 'pattern',
              pattern: 'solid',
              fgColor: { argb: 'FFFEF3C7' }, // amarelo suave
            }
            break
          case 'cnpj_invalido':
          case 'erro':
            cell.font = { bold: true, color: { argb: 'FFB91C1C' }, size: 10, name: 'Calibri' }
            cell.fill = {
              type: 'pattern',
              pattern: 'solid',
              fgColor: { argb: 'FFFEE2E2' }, // vermelho claro
            }
            break
          case 'ignorado_desmarcado':
            cell.font = { bold: false, color: { argb: 'FF64748B' }, size: 9, name: 'Calibri' }
            cell.fill = {
              type: 'pattern',
              pattern: 'solid',
              fgColor: { argb: 'FFF1F5F9' }, // cinza slate
            }
            break
        }
      }
    })
  })

  // Ativar filtro automático
  worksheet.autoFilter = {
    from: { row: 1, column: 1 },
    to: { row: resultado.itens.length + 1, column: columnsDef.length },
  }

  // Download do arquivo XLSX
  const buffer = await workbook.xlsx.writeBuffer()
  const blob = new Blob([buffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19)
  link.href = url
  link.download = `relatorio_atualizacao_mensalidades_${timestamp}.xlsx`
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}
