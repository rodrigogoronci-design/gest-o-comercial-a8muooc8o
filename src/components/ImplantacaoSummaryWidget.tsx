import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Rocket, ExternalLink, Loader2 } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Button } from '@/components/ui/button'
import { getImplementacaoByCliente } from '@/services/implementacoes'
import { cn } from '@/lib/utils'

const STATUS_COLORS: Record<string, string> = {
  'Em andamento': 'bg-blue-50 text-blue-700 border-blue-200',
  Atrasada: 'bg-red-50 text-red-700 border-red-200',
  Finalizada: 'bg-emerald-50 text-emerald-700 border-emerald-200',
}

export function ImplantacaoSummaryWidget({ clienteId }: { clienteId: string }) {
  const [impl, setImpl] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (!clienteId) return
    setIsLoading(true)
    getImplementacaoByCliente(clienteId)
      .then(setImpl)
      .catch(() => setImpl(null))
      .finally(() => setIsLoading(false))
  }, [clienteId])

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Rocket className="h-4 w-4 text-indigo-600" />
            Implantação
          </CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center py-6">
          <Loader2 className="h-5 w-5 animate-spin text-slate-400" />
        </CardContent>
      </Card>
    )
  }

  if (!impl) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Rocket className="h-4 w-4 text-indigo-600" />
            Implantação
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Nenhuma implantação iniciada para este cliente.
          </p>
        </CardContent>
      </Card>
    )
  }

  const etapas = (impl.implementacao_etapas || []).sort((a: any, b: any) => a.ordem - b.ordem)
  const proxima = etapas.find((e: any) => e.status !== 'Concluída')

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <Rocket className="h-4 w-4 text-indigo-600" />
          Implantação
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">Status</span>
          <Badge variant="outline" className={cn('text-xs', STATUS_COLORS[impl.status] || '')}>
            {impl.status}
          </Badge>
        </div>
        {impl.colaboradores?.nome && (
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Responsável</span>
            <span className="text-sm font-medium">{impl.colaboradores.nome}</span>
          </div>
        )}
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">Progresso</span>
          <div className="flex items-center gap-2 w-32">
            <Progress value={impl.progresso || 0} className="h-2" />
            <span className="text-xs font-medium text-slate-600 w-8">{impl.progresso || 0}%</span>
          </div>
        </div>
        {proxima && (
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Próxima etapa</span>
            <span className="text-sm font-medium text-right">{proxima.titulo}</span>
          </div>
        )}
        <Button asChild size="sm" className="w-full bg-indigo-600 hover:bg-indigo-700">
          <Link to={`/implementacoes/${impl.id}`}>
            <ExternalLink className="h-3 w-3 mr-1" />
            Abrir Implantação
          </Link>
        </Button>
      </CardContent>
    </Card>
  )
}
