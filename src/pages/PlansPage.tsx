import { CheckCircle2, ShieldCheck, Settings, Package, Layers } from 'lucide-react'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { formatCurrency } from '@/lib/formatters'
import { PLANS, MODULES } from '@/constants/contracts'

export default function PlansPage() {
  return (
    <div className="space-y-8 animate-fade-in pb-10">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Catálogo de Planos e Preços</h1>
          <p className="text-muted-foreground mt-1">
            Configure as ofertas e valores base do sistema comercial.
          </p>
        </div>
        <Button variant="outline" className="gap-2 self-start md:self-auto">
          <Settings className="h-4 w-4" />
          Gerenciar Regras
        </Button>
      </div>

      <div className="space-y-6">
        <div className="flex items-center gap-2">
          <Package className="h-6 w-6 text-blue-600" />
          <h2 className="text-2xl font-semibold tracking-tight">Planos Base (TMS)</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {PLANS.map((plan) => (
            <Card
              key={plan.id}
              className="relative overflow-hidden flex flex-col border-slate-200/60 shadow-sm hover:shadow-md transition-shadow group"
            >
              <div className="absolute top-0 inset-x-0 h-1.5 bg-blue-600"></div>
              <CardHeader className="pb-4">
                <div className="flex justify-between items-start mb-2">
                  <Badge
                    variant="secondary"
                    className="bg-blue-100 text-blue-800 hover:bg-blue-100 shadow-none"
                  >
                    Plano TMS
                  </Badge>
                </div>
                <CardTitle className="text-xl group-hover:text-blue-600 transition-colors">
                  {plan.name}
                </CardTitle>
                <CardDescription className="mt-2 text-xs">
                  Limite: {plan.limit} CTes/Mês
                  <br />
                  Máximo: {plan.maxDocs} Documentos
                </CardDescription>
              </CardHeader>
              <CardContent className="flex-grow">
                <div className="mb-4">
                  <span className="text-3xl font-bold text-slate-900">
                    {formatCurrency(plan.price)}
                  </span>
                  <span className="text-sm text-slate-500 font-medium">/mês</span>
                </div>
                <ul className="space-y-2.5 text-sm text-slate-600">
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-emerald-500 mt-0.5 shrink-0" />
                    <span>Atualizações gratuitas inclusas</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-emerald-500 mt-0.5 shrink-0" />
                    <span>Suporte técnico em horário comercial</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-emerald-500 mt-0.5 shrink-0" />
                    <span>Backup diário em nuvem</span>
                  </li>
                </ul>
              </CardContent>
              <CardFooter className="pt-4 border-t border-slate-50 bg-slate-50/50">
                <div className="flex items-center text-xs text-slate-500 gap-1.5">
                  <ShieldCheck className="h-4 w-4 text-slate-400" />
                  Disponível para venda imediata
                </div>
              </CardFooter>
            </Card>
          ))}
        </div>
      </div>

      <div className="space-y-6 pt-6">
        <div className="flex items-center gap-2">
          <Layers className="h-6 w-6 text-indigo-600" />
          <h2 className="text-2xl font-semibold tracking-tight">Módulos Adicionais</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {MODULES.map((mod) => (
            <Card
              key={mod.id}
              className="relative overflow-hidden flex flex-col border-slate-200/60 shadow-sm hover:shadow-md transition-shadow group"
            >
              <div className="absolute top-0 inset-x-0 h-1.5 bg-indigo-500"></div>
              <CardHeader className="pb-4">
                <div className="flex justify-between items-start mb-2">
                  <Badge
                    variant="secondary"
                    className="bg-indigo-100 text-indigo-800 hover:bg-indigo-100 shadow-none"
                  >
                    Módulo Adicional
                  </Badge>
                </div>
                <CardTitle className="text-lg group-hover:text-indigo-600 transition-colors">
                  {mod.name}
                </CardTitle>
              </CardHeader>
              <CardContent className="flex-grow">
                <div className="mb-2">
                  <span className="text-2xl font-bold text-slate-900">
                    {formatCurrency(mod.price)}
                  </span>
                  <span className="text-sm text-slate-500 font-medium">/mês</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  )
}
