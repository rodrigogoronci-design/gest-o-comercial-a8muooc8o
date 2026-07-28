import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { MODULES } from '@/constants/contracts'
import { formatCurrency } from '@/lib/formatters'

export function CustomPlanFields({
  customPlanName,
  setCustomPlanName,
  customPlanModules,
  setCustomPlanModules,
  customPlanPrice,
  setCustomPlanPrice,
}: {
  customPlanName: string
  setCustomPlanName: (v: string) => void
  customPlanModules: string[]
  setCustomPlanModules: (v: string[]) => void
  customPlanPrice: number
  setCustomPlanPrice: (v: number) => void
}) {
  const basicModules = MODULES.filter((m: any) => m.isBasic)

  const toggleModule = (id: string, checked: boolean) => {
    if (checked) {
      setCustomPlanModules([...customPlanModules, id])
    } else {
      setCustomPlanModules(customPlanModules.filter((m) => m !== id))
    }
  }

  return (
    <div className="space-y-4 bg-indigo-50/50 border border-indigo-200 rounded-lg p-4">
      <div className="flex items-center gap-2">
        <span className="text-sm font-bold text-indigo-700">
          Configuração do Plano Personalizado
        </span>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label className="text-sm font-bold text-slate-700">Nome do Plano</Label>
          <Input
            placeholder="Ex: Plano Financeiro"
            value={customPlanName}
            onChange={(e) => setCustomPlanName(e.target.value)}
            className="bg-white border-slate-300"
          />
        </div>
        <div className="space-y-2">
          <Label className="text-sm font-bold text-slate-700">Valor Mensalidade (R$)</Label>
          <Input
            type="number"
            min="0"
            step="0.01"
            placeholder="0,00"
            value={customPlanPrice || ''}
            onChange={(e) => setCustomPlanPrice(parseFloat(e.target.value) || 0)}
            className="w-40 bg-white border-slate-300"
          />
        </div>
      </div>
      <div className="space-y-2">
        <Label className="text-sm font-bold text-slate-700">
          Módulos Inclusos no Plano
          {customPlanModules.length === 0 && (
            <span className="ml-2 text-xs text-red-500">Selecione pelo menos 1 módulo</span>
          )}
        </Label>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {basicModules.map((m: any) => (
            <div
              key={m.id}
              className="flex items-center space-x-2 border p-2 rounded-lg bg-white transition-colors hover:bg-slate-50"
            >
              <Checkbox
                id={`custom-mod-${m.id}`}
                checked={customPlanModules.includes(m.id)}
                onCheckedChange={(c) => toggleModule(m.id, c as boolean)}
              />
              <Label
                htmlFor={`custom-mod-${m.id}`}
                className="text-xs font-medium cursor-pointer flex-1"
              >
                {m.name}
              </Label>
              {m.price > 0 && (
                <span className="text-xs text-slate-500">{formatCurrency(m.price)}</span>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
