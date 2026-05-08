import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { PieChart } from 'lucide-react'

export default function ReportsPage() {
  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6 animate-fade-in">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">Relatórios</h2>
      </div>

      <Card className="border-dashed border-2">
        <CardHeader className="flex flex-col items-center justify-center py-16 text-center">
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-primary/10 mb-4">
            <PieChart className="h-10 w-10 text-primary" />
          </div>
          <CardTitle className="text-2xl">Módulo de Relatórios</CardTitle>
          <CardDescription className="text-base mt-2 max-w-md">
            Esta área está sendo preparada para receber os novos dashboards e relatórios
            personalizados. Aguardando especificações.
          </CardDescription>
        </CardHeader>
      </Card>
    </div>
  )
}
