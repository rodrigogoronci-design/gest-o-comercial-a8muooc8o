import { formatCurrency } from '@/lib/formatters'

export function UpsellValueComparison({
  currentMonthlyValue,
  selectedModules,
}: {
  currentMonthlyValue: number | null
  selectedModules: { nome: string; valor: number }[]
}) {
  const additionalValue = selectedModules.reduce((sum, m) => sum + (m.valor || 0), 0)
  const hasCurrent = currentMonthlyValue !== null && currentMonthlyValue !== undefined
  const newValue = hasCurrent ? currentMonthlyValue + additionalValue : additionalValue

  return (
    <div className="bg-gradient-to-r from-slate-50 to-indigo-50 border border-slate-200 rounded-xl p-4 space-y-3 shadow-sm">
      <div className="text-sm font-bold text-indigo-700">
        Simulação de Upsell — Inclusão de Módulos
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="bg-white rounded-lg p-3 border border-slate-200">
          <div className="text-xs text-slate-500 font-medium uppercase tracking-wide mb-1">
            Valor Atual da Mensalidade
          </div>
          {hasCurrent ? (
            <div className="text-lg font-bold text-slate-800">
              {formatCurrency(currentMonthlyValue)}
            </div>
          ) : (
            <div className="text-sm font-medium text-amber-600 italic">
              Valor atual não definido
            </div>
          )}
        </div>
        <div className="bg-white rounded-lg p-3 border border-amber-200 flex flex-col items-center justify-center">
          <div className="text-xs text-amber-600 font-medium uppercase tracking-wide mb-1">
            Acréscimo
          </div>
          <div className="text-lg font-bold text-amber-600">
            + {formatCurrency(additionalValue)}
          </div>
        </div>
        <div className="bg-indigo-50 rounded-lg p-3 border border-indigo-300">
          <div className="text-xs text-indigo-600 font-medium uppercase tracking-wide mb-1">
            Novo Valor da Mensalidade
          </div>
          <div className="text-lg font-bold text-indigo-700">{formatCurrency(newValue)}</div>
        </div>
      </div>
    </div>
  )
}
