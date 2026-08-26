import { Clock, AlertCircle, CheckCircle, User } from 'lucide-react'
import { formatDateOnly } from '@/lib/formatters'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { isStageRelatedToModules } from '@/lib/scope-mapping'

export const STATUS_CONFIG: Record<string, { color: string; icon: any }> = {
  'Não iniciada': { color: 'bg-slate-100 text-slate-600 border-slate-200', icon: Clock },
  Agendada: { color: 'bg-blue-50 text-blue-700 border-blue-200', icon: Clock },
  'Em andamento': { color: 'bg-amber-50 text-amber-700 border-amber-200', icon: AlertCircle },
  Concluída: { color: 'bg-emerald-50 text-emerald-700 border-emerald-200', icon: CheckCircle },
  Atrasada: { color: 'bg-red-50 text-red-700 border-red-200', icon: AlertCircle },
  onboarding_recebido: {
    color: 'bg-indigo-50 text-indigo-700 border-indigo-200',
    icon: CheckCircle,
  },
  onboarding_completed: {
    color: 'bg-indigo-50 text-indigo-700 border-indigo-200',
    icon: CheckCircle,
  },
  Finalizada: { color: 'bg-emerald-50 text-emerald-700 border-emerald-200', icon: CheckCircle },
}

export const CATEGORIA_ORDER = [
  'Pré-Implantação',
  'Implantação Inicial',
  'Análise',
  'Configuração',
  'Preparação',
  'Agendamento',
  'Ciclo de Treinamentos',
  'Treinamento',
  'Execução',
  'Implantação Operacional',
  'Validação',
  'Encerramento',
]

interface EtapaListProps {
  etapasByCategoria: Record<string, any[]>
  colabMap: Record<string, string>
  contractedModules: string[]
  onEditEtapa: (etapa: any) => void
}

export function EtapaList({
  etapasByCategoria,
  colabMap,
  contractedModules,
  onEditEtapa,
}: EtapaListProps) {
  return (
    <>
      {CATEGORIA_ORDER.map((categoria) => {
        const etapas = etapasByCategoria[categoria]
        if (!etapas || etapas.length === 0) return null
        const concludedCount = etapas.filter((e) => e.status === 'Concluída').length
        return (
          <div key={categoria} className="space-y-2 mb-4">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-bold text-slate-700 uppercase tracking-wider">
                {categoria}
              </h4>
              <span className="text-xs text-slate-500">
                {concludedCount}/{etapas.length} concluídas
              </span>
            </div>
            {etapas.map((etapa) => {
              const config = STATUS_CONFIG[etapa.status] || STATUS_CONFIG['Não iniciada']
              const Icon = config.icon
              const responsavelNome = etapa.responsavel_id
                ? colabMap[etapa.responsavel_id] || null
                : null
              const isScopeRelated = isStageRelatedToModules(etapa.titulo, contractedModules)
              return (
                <Card
                  key={etapa.id}
                  className={cn(
                    'hover:shadow-md transition-shadow cursor-pointer',
                    isScopeRelated && 'border-l-4 border-l-indigo-400',
                  )}
                  onClick={() => onEditEtapa(etapa)}
                >
                  <CardContent className="p-4 flex items-center gap-4">
                    <div className={cn('p-2 rounded-full', config.color)}>
                      <Icon className="h-4 w-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-sm text-slate-800">{etapa.titulo}</span>
                        {isScopeRelated && (
                          <Badge
                            variant="secondary"
                            className="text-[9px] bg-indigo-50 text-indigo-700"
                          >
                            Escopo
                          </Badge>
                        )}
                      </div>
                      <div className="flex flex-wrap items-center gap-3 mt-1 text-xs text-slate-500">
                        {etapa.data_prevista && (
                          <span>
                            Prev: {formatDateOnly(etapa.data_prevista)}
                            {etapa.hora_prevista && ` às ${etapa.hora_prevista}`}
                          </span>
                        )}
                        {etapa.data_realizada && (
                          <span className="text-emerald-600">
                            Concluído: {formatDateOnly(etapa.data_realizada)}
                            {etapa.hora_realizada && ` às ${etapa.hora_realizada}`}
                          </span>
                        )}
                        {responsavelNome && (
                          <span className="flex items-center gap-1">
                            <User className="h-3 w-3" />
                            {responsavelNome}
                          </span>
                        )}
                      </div>
                    </div>
                    <Badge variant="outline" className={cn('text-xs', config.color)}>
                      {etapa.status}
                    </Badge>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        )
      })}
    </>
  )
}
