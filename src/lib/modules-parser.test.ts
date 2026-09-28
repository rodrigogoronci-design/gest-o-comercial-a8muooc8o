import { describe, it, expect } from 'vitest'
import { isModuloReal, parseModulosToList } from './modules-parser'

describe('isModuloReal', () => {
  it('retorna true para módulos reais do sistema', () => {
    expect(isModuloReal('Administração')).toBe(true)
    expect(isModuloReal('Básico')).toBe(true)
    expect(isModuloReal('Carga')).toBe(true)
    expect(isModuloReal('Comercial')).toBe(true)
    expect(isModuloReal('Faturamento')).toBe(true)
    expect(isModuloReal('Financeiro')).toBe(true)
    expect(isModuloReal('Fiscal')).toBe(true)
    expect(isModuloReal('DF-e')).toBe(true)
    expect(isModuloReal('EDI')).toBe(true)
    expect(isModuloReal('Controle de Viagem')).toBe(true)
    expect(isModuloReal('Frota')).toBe(true)
    expect(isModuloReal('BI WEB')).toBe(true)
    expect(isModuloReal('Torre de Controle Logística')).toBe(true)
    expect(isModuloReal('SL-Trip')).toBe(true)
    expect(isModuloReal('SL-Track')).toBe(true)
    expect(isModuloReal('Fracionado')).toBe(true)
    expect(isModuloReal('Medição')).toBe(true)
    expect(isModuloReal('Treinamento: Carga')).toBe(true)
  })

  it('descarta entradas que começam com Filial / Filiais', () => {
    expect(isModuloReal('Filial: MOVEX TRANSPORTES E LOGISTICA LTDA (67.081.546/0002-76)')).toBe(
      false,
    )
    expect(isModuloReal('Filial: NOVAROTA SERVICOS E TRANSPORTES LTDA (36.822.496/0001-26)')).toBe(
      false,
    )
    expect(isModuloReal('Filial: E&G DIESEL LTDA (65.623.034/0001-88)')).toBe(false)
    expect(isModuloReal('Filiais Adicionais (Qtd: 1)')).toBe(false)
    expect(isModuloReal('Filiais Adicionais (Qtd: 2)')).toBe(false)
    expect(isModuloReal('Filial Adicional')).toBe(false)
  })

  it('descarta entradas com CNPJ formatado', () => {
    expect(isModuloReal('Unidade Secundária 12.345.678/0001-90')).toBe(false)
    expect(isModuloReal('inclusão de uma nova filial - CNPJ 36.822.496/0001-26')).toBe(false)
    expect(isModuloReal('inclusão do DF-e para a filial - CNPJ 65.623.034/0001-88')).toBe(false)
  })

  it('descarta contadores e descritivos de filial', () => {
    expect(isModuloReal('Adicional de filial')).toBe(false)
    expect(isModuloReal('Qtd: 2 filiais')).toBe(false)
    expect(isModuloReal('inclusão de uma nova filial')).toBe(false)
    expect(isModuloReal('DF-e para a filial')).toBe(false)
  })

  it('retorna false para valores nulos ou vazios', () => {
    expect(isModuloReal(null)).toBe(false)
    expect(isModuloReal(undefined)).toBe(false)
    expect(isModuloReal('')).toBe(false)
    expect(isModuloReal('   ')).toBe(false)
  })

  it('filtra corretamente uma lista extraída de cliente', () => {
    const raw = {
      adicionais: [
        { name: 'Administração' },
        { name: 'Filial: MOVEX TRANSPORTES E LOGISTICA LTDA (67.081.546/0002-76)' },
        { name: 'Carga' },
        { name: 'Filiais Adicionais (Qtd: 1)' },
        { name: 'DF-e' },
      ],
    }
    const list = parseModulosToList(raw).filter(isModuloReal)
    expect(list).toEqual(['Administração', 'Carga', 'DF-e'])
  })
})
