import { useState, useEffect } from 'react'
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
import { ChevronLeft, ChevronRight, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useToast } from '@/hooks/use-toast'
import {
  getEventos,
  createEvento,
  updateEvento,
  deleteEvento,
  getClientesParaAgenda,
} from '@/services/agenda'

export default function AgendaPage() {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [events, setEvents] = useState<any[]>([])
  const [clientes, setClientes] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [selectedDate, setSelectedDate] = useState<Date>(new Date())
  const [editingEvent, setEditingEvent] = useState<any>(null)

  const [titulo, setTitulo] = useState('')
  const [descricao, setDescricao] = useState('')
  const [tipo, setTipo] = useState('Reunião')
  const [clienteId, setClienteId] = useState('none')
  const [status, setStatus] = useState('Pendente')

  const { toast } = useToast()

  const loadData = async () => {
    try {
      setLoading(true)
      const [eventosData, clientesData] = await Promise.all([getEventos(), getClientesParaAgenda()])
      setEvents(eventosData)
      setClientes(clientesData)
    } catch (error: any) {
      toast({ title: 'Erro ao carregar dados', description: error.message, variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  const nextMonth = () => setCurrentDate(addMonths(currentDate, 1))
  const prevMonth = () => setCurrentDate(subMonths(currentDate, 1))

  const monthStart = startOfMonth(currentDate)
  const monthEnd = endOfMonth(currentDate)
  const startDate = startOfWeek(monthStart)
  const endDate = endOfWeek(monthEnd)

  const days = eachDayOfInterval({
    start: startDate,
    end: endDate,
  })

  const openNewEventDialog = (date: Date) => {
    setEditingEvent(null)
    const now = new Date()
    date.setHours(now.getHours())
    date.setMinutes(now.getMinutes())
    setSelectedDate(date)
    setTitulo('')
    setDescricao('')
    setTipo('Reunião')
    setClienteId('none')
    setStatus('Pendente')
    setIsDialogOpen(true)
  }

  const openEditEventDialog = (e: React.MouseEvent, event: any) => {
    e.stopPropagation()
    setEditingEvent(event)
    setSelectedDate(new Date(event.data_evento))
    setTitulo(event.titulo)
    setDescricao(event.descricao || '')
    setTipo(event.tipo)
    setClienteId(event.cliente_id || 'none')
    setStatus(event.status)
    setIsDialogOpen(true)
  }

  const handleSave = async () => {
    if (!titulo) {
      toast({ title: 'Atenção', description: 'Título é obrigatório.', variant: 'destructive' })
      return
    }

    try {
      const payload = {
        titulo,
        descricao,
        tipo,
        status,
        data_evento: selectedDate.toISOString(),
        cliente_id: clienteId === 'none' ? null : clienteId,
      }

      if (editingEvent) {
        await updateEvento(editingEvent.id, payload)
        toast({ title: 'Sucesso', description: 'Evento atualizado.' })
      } else {
        await createEvento(payload)
        toast({ title: 'Sucesso', description: 'Evento criado.' })
      }
      setIsDialogOpen(false)
      loadData()
    } catch (error: any) {
      toast({ title: 'Erro', description: error.message, variant: 'destructive' })
    }
  }

  const handleDelete = async () => {
    if (!editingEvent) return
    try {
      await deleteEvento(editingEvent.id)
      toast({ title: 'Sucesso', description: 'Evento excluído.' })
      setIsDialogOpen(false)
      loadData()
    } catch (error: any) {
      toast({ title: 'Erro', description: error.message, variant: 'destructive' })
    }
  }

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6 max-w-[1400px] mx-auto">
      <div className="flex flex-col sm:flex-row items-center justify-between space-y-2 sm:space-y-0">
        <h2 className="text-3xl font-bold tracking-tight">Agenda</h2>
        <div className="flex items-center space-x-2">
          <Button variant="outline" onClick={prevMonth} size="icon">
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <div className="w-40 text-center font-semibold text-lg capitalize">
            {format(currentDate, 'MMMM yyyy', { locale: ptBR })}
          </div>
          <Button variant="outline" onClick={nextMonth} size="icon">
            <ChevronRight className="h-4 w-4" />
          </Button>
          <Button onClick={() => openNewEventDialog(new Date())} className="ml-2">
            <Plus className="mr-2 h-4 w-4" /> Novo Evento
          </Button>
        </div>
      </div>

      <div className="rounded-md border bg-card shadow-sm mt-4">
        <div className="grid grid-cols-7 gap-px border-b bg-muted text-center text-sm font-medium">
          {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map((day) => (
            <div key={day} className="py-3">
              {day}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-px bg-border">
          {days.map((day) => {
            const dayEvents = events.filter((e) => isSameDay(new Date(e.data_evento), day))
            const isCurrentMonth = isSameMonth(day, currentDate)
            const isToday = isSameDay(day, new Date())

            return (
              <div
                key={day.toString()}
                onClick={() => openNewEventDialog(day)}
                className={`min-h-[140px] bg-background p-2 cursor-pointer transition-colors hover:bg-accent/50 group ${
                  !isCurrentMonth ? 'text-muted-foreground bg-muted/20' : ''
                }`}
              >
                <div className="flex justify-between items-start mb-2">
                  <span
                    className={`text-sm font-medium h-7 w-7 flex items-center justify-center rounded-full ${
                      isToday ? 'bg-primary text-primary-foreground' : 'group-hover:bg-muted'
                    }`}
                  >
                    {format(day, 'd')}
                  </span>
                  {dayEvents.length > 0 && (
                    <span className="text-[10px] text-muted-foreground bg-muted px-1.5 rounded">
                      {dayEvents.length}
                    </span>
                  )}
                </div>
                <div className="space-y-1.5 h-[100px] overflow-y-auto no-scrollbar">
                  {dayEvents.map((evt) => {
                    let eventClass =
                      'bg-slate-100 text-slate-800 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700'
                    if (evt.tipo === 'Reunião')
                      eventClass =
                        'bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-800/50'
                    if (evt.tipo === 'Visita Técnica')
                      eventClass =
                        'bg-orange-100 text-orange-800 border-orange-200 dark:bg-orange-900/30 dark:text-orange-300 dark:border-orange-800/50'
                    if (evt.tipo === 'Treinamento')
                      eventClass =
                        'bg-green-100 text-green-800 border-green-200 dark:bg-green-900/30 dark:text-green-300 dark:border-green-800/50'

                    return (
                      <div
                        key={evt.id}
                        onClick={(e) => openEditEventDialog(e, evt)}
                        className={`text-[11px] px-1.5 py-1 rounded truncate border cursor-pointer hover:brightness-95 transition-all ${eventClass}`}
                        title={evt.titulo}
                      >
                        <span className="font-semibold">
                          {format(new Date(evt.data_evento), 'HH:mm')}
                        </span>{' '}
                        {evt.titulo}
                      </div>
                    )
                  })}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[450px]">
          <DialogHeader>
            <DialogTitle>{editingEvent ? 'Editar Evento' : 'Novo Evento'}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="data">Data e Hora</Label>
              <Input
                id="data"
                type="datetime-local"
                value={format(selectedDate, "yyyy-MM-dd'T'HH:mm")}
                onChange={(e) => setSelectedDate(new Date(e.target.value))}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="titulo">Título</Label>
              <Input
                id="titulo"
                placeholder="Ex: Treinamento Sistema X"
                value={titulo}
                onChange={(e) => setTitulo(e.target.value)}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label>Tipo</Label>
                <Select value={tipo} onValueChange={setTipo}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Reunião">Reunião</SelectItem>
                    <SelectItem value="Visita Técnica">Visita Técnica</SelectItem>
                    <SelectItem value="Treinamento">Treinamento</SelectItem>
                    <SelectItem value="Outro">Outro</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label>Status</Label>
                <Select value={status} onValueChange={setStatus}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Pendente">Pendente</SelectItem>
                    <SelectItem value="Confirmado">Confirmado</SelectItem>
                    <SelectItem value="Cancelado">Cancelado</SelectItem>
                    <SelectItem value="Concluído">Concluído</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid gap-2">
              <Label>Cliente Relacionado</Label>
              <Select value={clienteId} onValueChange={setClienteId}>
                <SelectTrigger>
                  <SelectValue placeholder="Nenhum cliente" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Nenhum cliente</SelectItem>
                  {clientes.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="descricao">Observações</Label>
              <Textarea
                id="descricao"
                placeholder="Detalhes adicionais do evento..."
                value={descricao}
                onChange={(e) => setDescricao(e.target.value)}
                rows={3}
                className="resize-none"
              />
            </div>
          </div>
          <div className="flex flex-row justify-between items-center w-full mt-4">
            {editingEvent ? (
              <Button type="button" variant="destructive" onClick={handleDelete}>
                Excluir
              </Button>
            ) : (
              <div />
            )}
            <div className="flex gap-2">
              <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                Cancelar
              </Button>
              <Button type="button" onClick={handleSave}>
                Salvar
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
