import { Checkbox } from '@/components/ui/checkbox'
import { formatCurrency } from '@/lib/formatters'
import { UpsellValueComparison } from './UpsellValueComparison'

export interface UpsellModule {
  id: string
  nome: string
  valor: number
}

export function UpsellModuleSelector({
  availableModules,
  selectedModuleIds,
  onToggleModule,
  currentMonthlyFee,
}: {
  availableModules: UpsellModule[]
  selectedModuleIds: string[]
  onToggleModule: (id: string) => void
  currentMonthlyFee: number | null
}) {
  const selectedModules = availableModules.filter((m) => selectedModuleIds.includes(m.id))

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <label className="text-sm font-bold text-slate-700">Seleção de Módulos (Upsell)</label>
        {availableModules.length === 0 ? (
          <p className="text-sm text-slate-500 italic">Nenhum módulo adicional disponível.</p>
        ) : (
          <div className="space-y-2">
            {availableModules.map((module) => (
              <button
                type="button"
                key={module.id}
                className="flex items-center gap-3 p-3 border border-slate-200 rounded-lg hover:bg-slate-50 cursor-pointer transition-colors w-full text-left"
                onClick={() => onToggleModule(module.id)}
              >
                <Checkbox
                  checked={selectedModuleIds.includes(module.id)}
                  className="pointer-events-none"
                />
                <span className="flex-1 text-sm font-medium text-slate-700">{module.nome}</span>
                <span className="text-sm font-semibold text-indigo-600">
                  {formatCurrency(module.valor)}
                </span>
              </button>
            ))}
          </div>
        )}
      </div>
      <UpsellValueComparison
        currentMonthlyValue={currentMonthlyFee}
        selectedModules={selectedModules}
      />
    </div>
  )
}
