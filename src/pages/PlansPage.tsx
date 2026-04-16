import { CheckCircle2, ShieldCheck, Settings } from 'lucide-react'
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
import useAppStore from '@/stores/main'
import { formatCurrency } from '@/lib/formatters'

export default function PlansPage() {
  const { modules } = useAppStore()

  return (
    <div className="space-y-8 animate-fade-in">
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

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {modules.map((mod) => (
          <Card
            key={mod.id}
            className="relative overflow-hidden flex flex-col border-slate-200/60 shadow-sm hover:shadow-md transition-shadow group"
          >
            <div className={`absolute top-0 inset-x-0 h-1.5 ${mod.color.split(' ')[0]}`}></div>
            <CardHeader className="pb-4">
              <div className="flex justify-between items-start mb-2">
                <Badge className={`${mod.color} shadow-none`}>Módulo Base</Badge>
              </div>
              <CardTitle className="text-xl group-hover:text-indigo-600 transition-colors">
                {mod.name}
              </CardTitle>
              <CardDescription className="line-clamp-2 h-10 mt-2">
                {mod.description}
              </CardDescription>
            </CardHeader>
            <CardContent className="flex-grow">
              <div className="mb-4">
                <span className="text-3xl font-bold text-slate-900">
                  {formatCurrency(mod.price)}
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
  )
}
