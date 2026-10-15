import { describe, it, expect } from 'vitest'
import {
  normalizeCnpjDigits,
  parseMoeda,
  parseCsvText,
  extractMensalidadeRows,
  computePreviaResumo,
  type PreviaLinha,
} from './lote-mensalidades'

describe('lote-mensalidades parser e normalizações', () => {
  it('deve normalizar CNPJ com 14 dígitos e acusar CNPJs malformados', () => {
    // CNPJ formatado comum (14 dígitos)
    const norm1 = normalizeCnpjDigits('11.222.333/0001-81')
    expect(norm1.isValid14).toBe(true)
    expect(norm1.digits).toBe('11222333000181')

    // CNPJ malformado com 8 dígitos no último bloco (ex: 44.547.284/00001-06 = 15 dígitos)
    const norm2 = normalizeCnpjDigits('44.547.284/00001-06')
    expect(norm2.isValid14).toBe(false)
    expect(norm2.digits).toBe('445472840000106')
    expect(norm2.digits.length).toBe(15)

    // CNPJ vazio
    const norm3 = normalizeCnpjDigits('')
    expect(norm3.isValid14).toBe(false)
    expect(norm3.digits).toBe('')
  })

  it('deve converter valores monetários em formatos brasileiros e numéricos', () => {
    expect(parseMoeda('2261,00')).toBe(2261.0)
    expect(parseMoeda('2.261,50')).toBe(2261.5)
    expect(parseMoeda('R$ 1.500,75')).toBe(1500.75)
    expect(parseMoeda(950)).toBe(950)
    expect(parseMoeda('')).toBe(null)
    expect(parseMoeda(null)).toBe(null)
  })

  it('deve fazer o parse correto de CSV delimitado por ponto-e-vírgula', () => {
    const csvContent = `CNPJ;Cliente Skip;Valor atual R$;Novo valor R$;Fatura setembro;Emissora
11.222.333/0001-81;Empresa Teste A;1000,00;1200,00;1234;CONTACTO
44.547.284/00001-06;Empresa Com Erro;500,00;600,00;1235;CONTACTO`

    const parsedMatrix = parseCsvText(csvContent)
    expect(parsedMatrix.length).toBe(3)
    expect(parsedMatrix[0][0]).toBe('CNPJ')

    const rows = extractMensalidadeRows(parsedMatrix)
    expect(rows.length).toBe(2)

    // Linha 1 válida
    expect(rows[0].cnpjValido).toBe(true)
    expect(rows[0].cnpjNormalizado).toBe('11222333000181')
    expect(rows[0].clienteArquivo).toBe('Empresa Teste A')
    expect(rows[0].valorAtualArquivo).toBe(1000)
    expect(rows[0].novoValorArquivo).toBe(1200)

    // Linha 2 com CNPJ malformado
    expect(rows[1].cnpjValido).toBe(false)
    expect(rows[1].motivoInvalido).toContain('possui 15 dígitos')
  })

  it('deve calcular corretamente o resumo e status da prévia', () => {
    const previaItems: PreviaLinha[] = [
      {
        id: '1',
        linhaOriginal: 2,
        cnpjOriginal: '11.222.333/0001-81',
        cnpjNormalizado: '11222333000181',
        cnpjValido: true,
        clienteArquivo: 'Cliente A',
        clienteIdSistema: 'id-1',
        clienteNomeSistema: 'Cliente A Sistema',
        mensalidadeAtualSistema: 1000,
        valorAtualArquivo: 1000,
        novoValorArquivo: 1200,
        status: 'correspondido',
        temDivergenciaValorAtual: false,
        diferencaNovoVsAtualSistema: 200,
        selecionado: true,
      },
      {
        id: '2',
        linhaOriginal: 3,
        cnpjOriginal: '22.333.444/0001-92',
        cnpjNormalizado: '22333444000192',
        cnpjValido: true,
        clienteArquivo: 'Cliente B',
        clienteIdSistema: 'id-2',
        clienteNomeSistema: 'Cliente B Sistema',
        mensalidadeAtualSistema: 800,
        valorAtualArquivo: 850, // divergência!
        novoValorArquivo: 900,
        status: 'correspondido',
        temDivergenciaValorAtual: true,
        diferencaNovoVsAtualSistema: 100,
        selecionado: true,
      },
      {
        id: '3',
        linhaOriginal: 4,
        cnpjOriginal: '33.444.555/0001-03',
        cnpjNormalizado: '33444555000103',
        cnpjValido: true,
        clienteArquivo: 'Cliente C',
        mensalidadeAtualSistema: 0,
        valorAtualArquivo: 500,
        novoValorArquivo: 600,
        status: 'sem_correspondencia',
        temDivergenciaValorAtual: false,
        diferencaNovoVsAtualSistema: 0,
        selecionado: false,
      },
      {
        id: '4',
        linhaOriginal: 5,
        cnpjOriginal: '44.555.666/000001-04',
        cnpjNormalizado: '4455566600000104',
        cnpjValido: false,
        clienteArquivo: 'Cliente D',
        mensalidadeAtualSistema: 0,
        valorAtualArquivo: 300,
        novoValorArquivo: 400,
        status: 'cnpj_invalido',
        temDivergenciaValorAtual: false,
        diferencaNovoVsAtualSistema: 0,
        selecionado: false,
      },
    ]

    const resumo = computePreviaResumo(previaItems)
    expect(resumo.totalLinhas).toBe(4)
    expect(resumo.totalCorrespondidos).toBe(2)
    expect(resumo.totalDivergencias).toBe(1)
    expect(resumo.totalSemCorrespondencia).toBe(1)
    expect(resumo.totalFalhasCnpj).toBe(1)
    expect(resumo.totalSelecionados).toBe(2)
    expect(resumo.somaAtualSistemaSelecionados).toBe(1800)
    expect(resumo.somaNovoArquivoSelecionados).toBe(2100)
  })
})
