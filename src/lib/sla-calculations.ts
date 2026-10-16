/**
 * Utilitários para cálculo de SLA Diferenciado em propostas comerciais.
 *
 * Regras:
 * - O percentual incide sobre o subtotal de todos os itens recorrentes mensais, incluindo:
 *   Plano TMS, Módulos adicionais, Filiais, Placas adicionais e outros serviços de cobrança mensal.
 * - NÃO incluir na base de cálculo: valores de implantação, treinamento, serviços de cobrança única
 *   ou excedentes variáveis ainda não apurados.
 * - Valor do SLA = Subtotal mensal recorrente × (Percentual SLA ÷ 100)
 * - Total mensal final = Subtotal mensal recorrente + Valor do SLA
 * - Arredondamento monetário para duas casas decimais (half-up monetário).
 */

/**
 * Arredonda um valor numérico para duas casas decimais com precisão monetária padrão.
 */
export function roundCurrency(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100
}

export interface SlaCalculationResult {
  slaAtivo: boolean
  subtotalRecorrente: number
  percentualSla: number
  valorSla: number
  totalMensalComSla: number
}

/**
 * Calcula o valor adicional do SLA e o total mensal final com SLA.
 *
 * @param subtotalRecorrente Subtotal puro de itens recorrentes mensais (sem implantação, etc.)
 * @param percentualSla Percentual negociado do SLA (ex: 30 para 30%)
 * @param slaAtivo Se a opção de SLA diferenciado está ativa (padrão: false)
 */
export function calculateSla({
  subtotalRecorrente,
  percentualSla,
  slaAtivo,
}: {
  subtotalRecorrente: number
  percentualSla: number
  slaAtivo: boolean
}): SlaCalculationResult {
  const safeSubtotal = Math.max(0, roundCurrency(subtotalRecorrente || 0))
  const safePercentual = Math.max(0, roundCurrency(percentualSla || 0))

  if (!slaAtivo || safePercentual <= 0 || safeSubtotal <= 0) {
    return {
      slaAtivo: Boolean(slaAtivo),
      subtotalRecorrente: safeSubtotal,
      percentualSla: safePercentual,
      valorSla: 0,
      totalMensalComSla: safeSubtotal,
    }
  }

  // Fórmula: Valor do SLA = Subtotal mensal recorrente × (Percentual SLA ÷ 100)
  const rawValorSla = (safeSubtotal * safePercentual) / 100
  const valorSla = roundCurrency(rawValorSla)
  const totalMensalComSla = roundCurrency(safeSubtotal + valorSla)

  return {
    slaAtivo: true,
    subtotalRecorrente: safeSubtotal,
    percentualSla: safePercentual,
    valorSla,
    totalMensalComSla,
  }
}
