/**
 * Utility to calculate the final consolidated monthly fee for a contract amendment (upsell).
 * Safely sums the client's current monthly fee with the new proposal's value, applying any given discounts.
 */
export function calculateConsolidatedMonthlyFee(
  currentTotal: number | undefined | null,
  proposalMonthlyValue: number | undefined | null,
  discount: number | undefined | null = 0,
): {
  currentContractValue: number
  totalAdicionaisPadrao: number
  descontoAplicado: number
  novoValorFinal: number
} {
  const current = Number(currentTotal) || 0
  const adicionais = Number(proposalMonthlyValue) || 0
  const desc = Number(discount) || 0

  const finalAdicionais = Math.max(0, adicionais - desc)
  const novoValorFinal = current + finalAdicionais

  return {
    currentContractValue: current,
    totalAdicionaisPadrao: adicionais,
    descontoAplicado: desc,
    novoValorFinal,
  }
}
