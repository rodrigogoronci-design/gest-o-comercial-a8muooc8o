import { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  format,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  isSameMonth,
  isSameDay,
  addMonths,
  subMonths,
} from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { ChevronLeft, ChevronRight, CalendarClock, ExternalLink } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import { SectionNav } from '@/components/section-nav'
import { CollapsibleSection } from '@/components/collapsible-section'
import { getAgendaImplantacoes, type AgendaImplantacaoItem } from '@/services/agenda-implantacoes'
import { TIPO_CONFIG } from '@/lib/implantacao-config'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'

const STATUS_COLORS: Record<string, string> = {
  'Não iniciada':
    'bg-slate-100 text-slate-700 border-slate-300 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-600',
  Agendada:
    'bg-blue-100 text-blue-800 border-blue-300 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-700/50',
  'Em andamento':
    'bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-900/30 dark:text-amber-300 dark:border-amber-700/50',
  Concluída:
    'bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-900/30 dark:text-emerald-300 dark:border-emerald-700/50',
  Atrasada:
    'bg-red-100 text-red-800 border-red-300 dark:bg-red-900/30 dark:text-red-300 dark:border-red-700/50',
}

const TIPO_LABELS: Record<string, string> = {
  novo_cliente: 'Novo Cliente',
  inclusao_modulo: 'Inclusão de Módulo',
  treinamento: 'Treinamento',
  consultoria: 'Consultoria',
}

const SOURCE_BADGE: Record<string, { label: string; color: string }> = {
  etapa_prevista: {
    label: 'Previsto',
    color: 'bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400',
  },
  etapa_realizada: {
    label: 'Realizado',
    color: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400',
  },
  treinamento: {
    label: 'Treinamento',
    color: 'bg-violet-50 text-violet-600 dark:bg-violet-900/30 dark:text-violet-400',
  },
}

export default function AgendaImplantacoesPage() {
  const navigate = useNavigate()
  const [currentDate, setCurrentDate] = useState(new Date())
  const [items, setItems] = useState<AgendaImplantacaoItem[]>([])
  const [loading, setLoading] = useState(true)
  const [filterTipo, setFilterTipo] = useState('all')
  const [filterStatus, setFilterStatus] = useState('all')

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      setLoading(true)
      const data = await getAgendaImplantacoes()
      setItems(data)
    } catch (error: any) {
      toast.error('Erro ao carregar agenda: ' + (error.message || ''))
    } finally {
      setLoading(false)
    }
  }

  const nextMonth = () => setCurrentDate(addMonths(currentDate, 1))
  const prevMonth = () => setCurrentDate(subMonths(currentDate, 1))

  const monthStart = startOfMonth(currentDate)
  const monthEnd = endOfMonth(currentDate)
  const startDate = startOfWeek(monthStart)
  const endDate = endOfWeek(monthEnd)

  const days = eachDayOfInterval({ start: startDate, end: endDate })

  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      if (filterTipo !== 'all' && item.tipo !== filterTipo) return false
      if (filterStatus !== 'all' && item.status !== filterStatus) return false
      return true
    })
  }, [items, filterTipo, filterStatus])

  const itemsByDay = useMemo(() => {
    const map: Record<string, AgendaImplantacaoItem[]> = {}
    for (const item of filteredItems) {
      const dateKey = format(new Date(item.data), 'yyyy-MM-dd')
      if (!map[dateKey]) map[dateKey] = []
      map[dateKey].push(item)
    }
    return map
  }, [filteredItems])

  const monthSummary = useMemo(() => {
    const count = filteredItems.filter((item) =>
      isSameMonth(new Date(item.data), currentDate),
    ).length
    return count
  }, [filteredItems, currentDate])

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6 max-w-[1400px] mx-auto">
      <div className="flex flex-col md:flex-row items-center justify-between space-y-4 md:space-y-0">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 w-full md:w-auto">
          <h2 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <CalendarClock className="h-7 w-7 text-indigo-600" />
            Agenda de Implantações
          </h2>
          <div className="flex gap-2 w-full sm:w-auto">
            <Select value={filterTipo} onValueChange={setFilterTipo}>
              <SelectTrigger className="w-full sm:w-[170px]">
                <SelectValue placeholder="Tipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os Tipos</SelectItem>
                <SelectItem value="novo_cliente">Novo Cliente</SelectItem>
                <SelectItem value="inclusao_modulo">Inclusão de Módulo</SelectItem>
                <SelectItem value="treinamento">Treinamento</SelectItem>
                <SelectItem value="consultoria">Consultoria</SelectItem>
              </SelectContent>
            </Select>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-full sm:w-[170px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os Status</SelectItem>
                <SelectItem value="Não iniciada">Não iniciada</SelectItem>
                <SelectItem value="Agendada">Agendada</SelectItem>
                <SelectItem value="Em andamento">Em andamento</SelectItem>
                <SelectItem value="Concluída">Concluída</SelectItem>
                <SelectItem value="Atrasada">Atrasada</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="flex items-center space-x-2 w-full md:w-auto justify-between md:justify-end">
          <Button variant="outline" onClick={prevMonth} size="icon">
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <div className="w-48 text-center font-semibold text-lg capitalize">
            {format(currentDate, 'MMMM yyyy', { locale: ptBR })}
          </div>
          <Button variant="outline" onClick={nextMonth} size="icon">
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <SectionNav
        items={[
          {
            id: 'calendario',
            label: 'Calendário',
            icon: <CalendarClock className="h-3.5 w-3.5" />,
          },
        ]}
      />

      <CollapsibleSection
        id="calendario"
        title={`Calendário de Implantações (${monthSummary} neste mês)`}
        icon={<CalendarClock className="h-4 w-4 text-indigo-600" />}
        defaultOpen
      >
        <div className="rounded-md border bg-card shadow-sm overflow-hidden">
          <div className="grid grid-cols-7 gap-px border-b bg-muted text-center text-sm font-medium">
            {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map((day) => (
              <div key={day} className="py-3">
                {day}
              </div>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-px bg-border">
            {loading
              ? days.map((day) => (
                  <div key={day.toString()} className="min-h-[140px] bg-background p-2">
                    <Skeleton className="h-5 w-5 rounded-full mb-2" />
                    <Skeleton className="h-8 w-full mb-1" />
                    <Skeleton className="h-8 w-full" />
                  </div>
                ))
              : days.map((day) => {
                  const dateKey = format(day, 'yyyy-MM-dd')
                  const dayItems = itemsByDay[dateKey] || []
                  const isCurrentMonth = isSameMonth(day, currentDate)
                  const isToday = isSameDay(day, new Date())

                  return (
                    <div
                      key={day.toString()}
                      className={cn(
                        'min-h-[140px] bg-background p-2 group transition-colors',
                        !isCurrentMonth && 'text-muted-foreground bg-muted/20',
                      )}
                    >
                      <div className="flex justify-between items-start mb-2">
                        <span
                          className={cn(
                            'text-sm font-medium h-7 w-7 flex items-center justify-center rounded-full',
                            isToday ? 'bg-primary text-primary-foreground' : 'group-hover:bg-muted',
                          )}
                        >
                          {format(day, 'd')}
                        </span>
                        {dayItems.length > 0 && (
                          <span className="text-[10px] text-muted-foreground bg-muted px-1.5 rounded">
                            {dayItems.length}
                          </span>
                        )}
                      </div>
                      <div className="space-y-1.5 h-[100px] overflow-y-auto no-scrollbar">
                        {dayItems.map((item) => {
                          const statusColor =
                            STATUS_COLORS[item.status] || STATUS_COLORS['Não iniciada']
                          const sourceBadge = SOURCE_BADGE[item.source]
                          const tipoCfg = TIPO_CONFIG[item.tipo]

                          return (
                            <div
                              key={item.id}
                              onClick={() => navigate(`/implementacoes/${item.implementacao_id}`)}
                              className={cn(
                                'text-[11px] px-1.5 py-1 rounded truncate border cursor-pointer hover:brightness-95 transition-all flex flex-col gap-0.5',
                                statusColor,
                              )}
                              title={`${item.cliente_nome} - ${item.etapa_titulo}`}
                            >
                              <div className="flex items-center gap-1">
                                {item.hora && (
                                  <span className="font-semibold whitespace-nowrap">
                                    {item.hora}
                                  </span>
                                )}
                                <span className="truncate font-medium">{item.cliente_nome}</span>
                                <ExternalLink className="h-2.5 w-2.5 ml-auto shrink-0 opacity-50" />
                              </div>
                              <div className="flex items-center gap-1">
                                <span className="truncate text-[10px] opacity-80">
                                  {item.etapa_titulo}
                                </span>
                              </div>
                              <div className="flex items-center gap-1 flex-wrap">
                                <span className={cn('text-[8px] px-1 rounded', sourceBadge?.color)}>
                                  {sourceBadge?.label}
                                </span>
                                {tipoCfg && (
                                  <span
                                    className={cn('text-[8px] px-1 rounded border', tipoCfg.color)}
                                  >
                                    {TIPO_LABELS[item.tipo] || item.tipo}
                                  </span>
                                )}
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  )
                })}
          </div>
        </div>
      </CollapsibleSection>

      {!loading && monthSummary === 0 && filterStatus === 'all' && filterTipo === 'all' && (
        <div className="flex flex-col items-center justify-center py-12 gap-3">
          <CalendarClock className="h-12 w-12 text-slate-300" />
          <p className="text-sm text-muted-foreground text-center max-w-md">
            Nenhuma atividade de implantação agendada para este mês. As datas previstas e realizadas
            das etapas de implementação aparecerão aqui automaticamente.
          </p>
        </div>
      )}
    </div>
  )
}
