export function calculateFinancialScore(receipts: any[]) {
  let totalTitulos = 0
  let totalPago = 0
  let totalAtrasoAtual = 0
  let totalPagoAtrasado = 0
  let diasAtrasoAcumulado = 0
  let valorTotal = 0

  receipts.forEach((r) => {
    totalTitulos++
    valorTotal += Number(r.valor_titulo) || 0

    if (r.status === 'VENCIDO') {
      totalAtrasoAtual++
      diasAtrasoAcumulado += Number(r.dias_vencidos) || 0
    } else if (r.status === 'PAGO') {
      let isDelayed = false
      if (r.data_pagamento && r.data_vencimento) {
        if (new Date(r.data_pagamento) > new Date(r.data_vencimento)) {
          isDelayed = true
        }
      }
      if (isDelayed || (r.dias_vencidos && r.dias_vencidos > 0)) {
        totalPagoAtrasado++
      } else {
        totalPago++
      }
    }
  })

  const relevantTitulos = totalPago + totalPagoAtrasado + totalAtrasoAtual
  let score = 100
  if (relevantTitulos > 0) {
    const onTimeRatio = totalPago / relevantTitulos
    score = onTimeRatio * 100

    if (totalAtrasoAtual > 0) {
      score -= totalAtrasoAtual * 15 // Penalidade por atrasos atuais
    }
  } else {
    score = 0
  }

  score = Math.max(0, Math.min(100, Math.round(score)))

  let classification = 'Sem Histórico'
  let color = 'text-slate-600 bg-slate-50 border-slate-200'

  if (relevantTitulos > 0) {
    if (score >= 90 && totalAtrasoAtual === 0) {
      classification = 'Premium'
      color = 'text-emerald-700 bg-emerald-50 border-emerald-200'
    } else if (score >= 70 && totalAtrasoAtual === 0) {
      classification = 'Regular'
      color = 'text-blue-700 bg-blue-50 border-blue-200'
    } else if (score >= 50) {
      classification = 'Atenção'
      color = 'text-amber-700 bg-amber-50 border-amber-200'
    } else {
      classification = 'Risco'
      color = 'text-rose-700 bg-rose-50 border-rose-200'
    }
  }

  return {
    score,
    classification,
    color,
    totalTitulos,
    totalAtrasoAtual,
    totalPago,
    totalPagoAtrasado,
    relevantTitulos,
    diasAtrasoAcumulado,
    valorTotal,
  }
}
