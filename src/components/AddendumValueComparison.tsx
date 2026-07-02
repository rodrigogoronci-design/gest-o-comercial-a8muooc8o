import { formatCurrency } from '@/lib/formatters'
import { calculateBranchAddendum } from '@/lib/branch-calculations'

export function AddendumValueComparison({
  currentMonthlyValue,
  branchCount,
  cobrarFiliais,
}: {
  currentMonthlyValue: number
  branchCount: number
  cobrarFiliais: boolean
}) {
  const { additionalValue, newValue } = calculateBranchAddendum(
    currentMonthlyValue,
    branchCount,
    cobrarFiliais,
  )

  if (branchCount <= 0) return null

  return (
    <div className="bg-gradient-to-r from-slate-50 to-indigo-50 border border-indigo-200 rounded-lg p-4 space-y-3">
      <div className="text-sm font-bold text-indigo-700">
        Comparativo de Valores — Aditivo de Inclusão de Filiais
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="bg-white rounded-lg p-3 border border-slate-200">
          <div className="text-xs text-slate-500 font-medium uppercase tracking-wide mb-1">
            Valor Atual
          </div>
          <div className="text-lg font-bold text-slate-800">
            {formatCurrency(currentMonthlyValue)}
          </div>
        </div>
        <div className="bg-white rounded-lg p-3 border border-amber-200 flex flex-col items-center justify-center">
          <div className="text-xs text-amber-600 font-medium uppercase tracking-wide mb-1">
            {branchCount} Filial(is) × R$ 199,00
          </div>
          <div className="text-lg font-bold text-amber-600">
            + {formatCurrency(additionalValue)}
          </div>
        </div>
        <div className="bg-indigo-50 rounded-lg p-3 border border-indigo-300">
          <div className="text-xs text-indigo-600 font-medium uppercase tracking-wide mb-1">
            Novo Valor
          </div>
          <div className="text-lg font-bold text-indigo-700">{formatCurrency(newValue)}</div>
        </div>
      </div>
    </div>
  )
}
