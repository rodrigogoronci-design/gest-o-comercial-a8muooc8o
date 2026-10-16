import { describe, it, expect } from 'vitest'
import { calculateSla, roundCurrency } from './sla-calculations'

describe('Cálculo de SLA Diferenciado em Orçamentos Comerciais', () => {
  it('deve retornar valores zerados de SLA quando desativado por padrão', () => {
    const res = calculateSla({
      subtotalRecorrente: 3094.13,
      percentualSla: 30,
      slaAtivo: false,
    })

    expect(res.slaAtivo).toBe(false)
    expect(res.subtotalRecorrente).toBe(3094.13)
    expect(res.valorSla).toBe(0)
    expect(res.totalMensalComSla).toBe(3094.13)
  })

  it('deve calcular corretamente o caso de teste obrigatório — ETECON a 30%', () => {
    // Caso de teste obrigatório da especificação:
    // Subtotal mensal recorrente: R$ 3.094,13
    // Percentual SLA: 30% -> Valor adicional do SLA: R$ 928,24 -> Total mensal final esperado: R$ 4.022,37
    // Arredondamento: 3094,13 * 0,30 = 928,239 -> 928,24
    const res = calculateSla({
      subtotalRecorrente: 3094.13,
      percentualSla: 30,
      slaAtivo: true,
    })

    expect(res.slaAtivo).toBe(true)
    expect(res.subtotalRecorrente).toBe(3094.13)
    expect(res.percentualSla).toBe(30)
    expect(res.valorSla).toBe(928.24)
    expect(res.totalMensalComSla).toBe(4022.37)
  })

  it('deve calcular corretamente o caso de teste obrigatório — ETECON a 25%', () => {
    // Caso de teste obrigatório da especificação:
    // Subtotal mensal recorrente: R$ 3.094,13
    // Percentual 25% -> Total esperado: R$ 3.867,66
    // 3094,13 * 0,25 = 773,5325 -> 773,53
    // 3094,13 + 773,53 = 3867,66
    const res = calculateSla({
      subtotalRecorrente: 3094.13,
      percentualSla: 25,
      slaAtivo: true,
    })

    expect(res.slaAtivo).toBe(true)
    expect(res.subtotalRecorrente).toBe(3094.13)
    expect(res.percentualSla).toBe(25)
    expect(res.valorSla).toBe(773.53)
    expect(res.totalMensalComSla).toBe(3867.66)
  })

  it('não deve acumular o SLA em recálculos sucessivos (idempotente a partir do subtotal base puro)', () => {
    const baseSubtotal = 3094.13
    const firstCalc = calculateSla({
      subtotalRecorrente: baseSubtotal,
      percentualSla: 30,
      slaAtivo: true,
    })
    expect(firstCalc.valorSla).toBe(928.24)
    expect(firstCalc.totalMensalComSla).toBe(4022.37)

    // Recalcular novamente com a mesma base pura nunca deve inflar
    const secondCalc = calculateSla({
      subtotalRecorrente: baseSubtotal,
      percentualSla: 30,
      slaAtivo: true,
    })
    expect(secondCalc.valorSla).toBe(928.24)
    expect(secondCalc.totalMensalComSla).toBe(4022.37)
  })

  it('deve tratar entradas com valores zerados ou negativos com segurança', () => {
    const resZero = calculateSla({
      subtotalRecorrente: 0,
      percentualSla: 20,
      slaAtivo: true,
    })
    expect(resZero.valorSla).toBe(0)
    expect(resZero.totalMensalComSla).toBe(0)

    const resPercentualZero = calculateSla({
      subtotalRecorrente: 1500,
      percentualSla: 0,
      slaAtivo: true,
    })
    expect(resPercentualZero.valorSla).toBe(0)
    expect(resPercentualZero.totalMensalComSla).toBe(1500)
  })

  it('arredondamento monetário deve lidar adequadamente com dízimas', () => {
    // 1000 * 0.3333 = 333.30
    expect(roundCurrency(928.239)).toBe(928.24)
    expect(roundCurrency(773.5325)).toBe(773.53)
  })
})
