import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import {
  Pencil,
  UserCheck,
  CalendarClock,
  MoreVertical,
  FileText,
  Paperclip,
  FileSignature,
  Trash2,
  MessageSquarePlus,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { formatDate } from '@/lib/formatters'
import type { CrmProspect } from '@/pages/CRMPage'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu'
import { supabase } from '@/lib/supabase/client'

interface CrmKanbanBoardProps {
  prospects: CrmProspect[]
  onUpdateStatus: (id: string, newStatus: string, oldStatus: string) => void
  onEdit: (prospect: CrmProspect, tab?: string) => void
  onDelete: (id: string) => void
  onEfetivar: (prospect: CrmProspect) => void
}

const KANBAN_COLUMNS = [
  'Novo Lead',
  'Contato inicial',
  'Em negociação',
  'Proposta enviada',
  'Fechado',
  'Cliente Efetivado',
  'Perdido',
]

export function CrmKanbanBoard({
  prospects,
  onUpdateStatus,
  onEdit,
  onEfetivar,
}: CrmKanbanBoardProps) {
  const [draggedId, setDraggedId] = useState<string | null>(null)
  const [proposalsByProspect, setProposalsByProspect] = useState<Record<string, number>>({})

  const prospectIdsStr = prospects
    .map((p) => p.id)
    .sort()
    .join(',')

  useEffect(() => {
    const fetchProposals = async () => {
      if (prospects.length === 0) return

      const prospectIds = prospects.map((p) => p.id)

      const { data } = await supabase
        .from('crm_propostas')
        .select('prospect_id')
        .in('prospect_id', prospectIds)

      if (data) {
        const counts: Record<string, number> = {}
        data.forEach((p) => {
          if (p.prospect_id) {
            counts[p.prospect_id] = (counts[p.prospect_id] || 0) + 1
          }
        })
        setProposalsByProspect(counts)
      }
    }
    fetchProposals()
  }, [prospectIdsStr])

  const handleDragStart = (e: React.DragEvent, prospectId: string) => {
    e.dataTransfer.setData('text/plain', prospectId)
    e.dataTransfer.effectAllowed = 'move'
    setDraggedId(prospectId)
  }

  const handleDragEnd = () => {
    setDraggedId(null)
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
  }

  const handleDrop = (e: React.DragEvent, newStatus: string) => {
    e.preventDefault()
    setDraggedId(null)
    const prospectId = e.dataTransfer.getData('text/plain')
    if (prospectId) {
      const prospect = prospects.find((p) => p.id === prospectId)
      if (prospect && prospect.status !== newStatus) {
        onUpdateStatus(prospectId, newStatus, prospect.status)
      }
    }
  }

  const getClassificacaoColor = (c: string | null) => {
    if (c === 'Muito Quente') return 'bg-red-500 text-white border-red-600'
    if (c === 'Quente') return 'bg-red-100 text-red-800 border-red-200'
    if (c === 'Morno') return 'bg-amber-100 text-amber-800 border-amber-200'
    return 'bg-blue-100 text-blue-800 border-blue-200'
  }

  const today = new Date().toISOString().split('T')[0]

  const otherStatuses = prospects
    .filter((p) => !KANBAN_COLUMNS.includes(p.status))
    .map((p) => p.status)
  const uniqueOtherStatuses = Array.from(new Set(otherStatuses))
  const allColumns = [...KANBAN_COLUMNS, ...uniqueOtherStatuses]

  return (
    <div className="flex gap-4 overflow-x-auto pb-6 pt-2 h-[calc(100vh-220px)] min-h-[600px] items-start snap-x">
      {allColumns.map((col) => {
        const colProspects = prospects.filter((p) => p.status === col)
        return (
          <div
            key={col}
            className="flex-shrink-0 w-[320px] bg-slate-100/50 rounded-xl flex flex-col border border-slate-200 snap-center max-h-full"
            onDragOver={handleDragOver}
            onDrop={(e) => handleDrop(e, col)}
          >
            <div className="flex justify-between items-center p-3 border-b border-slate-200/60 bg-slate-100/80 rounded-t-xl sticky top-0 z-10">
              <h3 className="font-semibold text-slate-800 text-sm tracking-tight">{col}</h3>
              <span className="bg-white text-slate-600 text-xs py-0.5 px-2.5 rounded-full font-medium shadow-sm border border-slate-200">
                {colProspects.length}
              </span>
            </div>

            <div className="flex flex-col gap-3 p-3 overflow-y-auto min-h-[150px] flex-1">
              {colProspects.length === 0 ? (
                <div className="flex-1 border-2 border-dashed border-slate-200 rounded-lg flex items-center justify-center text-slate-400 text-sm p-4 text-center">
                  Arraste cards para cá
                </div>
              ) : (
                colProspects.map((p) => (
                  <div
                    key={p.id}
                    draggable
                    onDragStart={(e) => handleDragStart(e, p.id)}
                    onDragEnd={handleDragEnd}
                    className={cn(
                      'bg-white p-3.5 rounded-lg shadow-sm border border-slate-200 cursor-move hover:border-indigo-300 transition-all group active:scale-[0.98]',
                      draggedId === p.id && 'opacity-50',
                    )}
                  >
                    <div className="flex justify-between items-start mb-1">
                      <div className="font-semibold text-slate-900 text-sm leading-snug line-clamp-2 pr-2 flex flex-col gap-1 w-full">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span>{p.empresa}</span>
                          {p.cnpj && (
                            <span className="text-[10px] font-normal text-muted-foreground">
                              {p.cnpj}
                            </span>
                          )}
                          {proposalsByProspect[p.id] > 0 && (
                            <div
                              title="Possui proposta vinculada"
                              className="bg-indigo-50 text-indigo-600 p-1 rounded-md border border-indigo-100 flex-shrink-0"
                            >
                              <FileText className="w-3.5 h-3.5" />
                            </div>
                          )}
                        </div>
                        {p.tags && p.tags.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-0.5">
                            {p.tags.map((tag) => (
                              <span
                                key={tag}
                                className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-indigo-50 text-indigo-700 border border-indigo-100"
                              >
                                {tag}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6 -mr-2 text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-48">
                          <DropdownMenuItem onClick={() => onEdit(p, 'dados')}>
                            <Pencil className="mr-2 h-4 w-4" /> Editar / Detalhes
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => onEdit(p, 'historico')}>
                            <MessageSquarePlus className="mr-2 h-4 w-4 text-blue-600" />{' '}
                            <span className="text-blue-600">Registrar Interação</span>
                          </DropdownMenuItem>
                          {p.status !== 'Cliente Efetivado' && (
                            <DropdownMenuItem
                              onClick={() => onEfetivar(p)}
                              className="text-emerald-600 focus:text-emerald-600 focus:bg-emerald-50"
                            >
                              <UserCheck className="mr-2 h-4 w-4" /> Efetivar Cliente
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuSeparator />
                          <DropdownMenuItem asChild>
                            <Link
                              to={`/contratos?tab=cotacao&prospectId=${p.id}&prospect=${encodeURIComponent(p.empresa)}&contato=${encodeURIComponent(p.contato_nome)}`}
                              className="cursor-pointer w-full flex items-center"
                            >
                              <FileText className="mr-2 h-4 w-4 text-orange-600" />{' '}
                              <span className="text-orange-600">Gerar Proposta</span>
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem asChild>
                            <Link
                              to={`/contratos?prospect=${encodeURIComponent(p.empresa)}&cnpj=${p.cnpj ? p.cnpj.replace(/\D/g, '') : ''}`}
                              className="cursor-pointer w-full flex items-center"
                            >
                              <FileSignature className="mr-2 h-4 w-4 text-indigo-600" />{' '}
                              <span className="text-indigo-600">Gerar Contrato</span>
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onClick={() => onDelete(p.id)}
                            className="text-red-600 focus:text-red-600 focus:bg-red-50"
                          >
                            <Trash2 className="mr-2 h-4 w-4" /> Excluir Prospecto
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>

                    <div className="text-sm text-slate-600 mb-3">{p.contato_nome}</div>

                    <div className="flex flex-col gap-2 mt-auto">
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          {p.data_followup && (
                            <div
                              className={cn(
                                'flex items-center gap-1.5 text-[11px] font-medium px-2 py-1 rounded-md bg-slate-50 border',
                                p.data_followup < today &&
                                  !['Fechado', 'Cliente Efetivado', 'Perdido'].includes(p.status)
                                  ? 'text-red-700 border-red-200 bg-red-50'
                                  : p.data_followup === today &&
                                      !['Fechado', 'Cliente Efetivado', 'Perdido'].includes(
                                        p.status,
                                      )
                                    ? 'text-amber-700 border-amber-200 bg-amber-50'
                                    : 'text-slate-600 border-slate-200',
                              )}
                            >
                              <CalendarClock className="w-3.5 h-3.5" />
                              {new Date(p.data_followup + 'T12:00:00Z').toLocaleDateString(
                                'pt-BR',
                                {
                                  day: '2-digit',
                                  month: 'short',
                                },
                              )}
                            </div>
                          )}
                          {(p as any).proposta_url && (
                            <div
                              title="Proposta Anexada"
                              className="bg-emerald-50 text-emerald-600 p-1 px-1.5 rounded-md border border-emerald-100 flex-shrink-0 flex items-center gap-1"
                            >
                              <Paperclip className="w-3.5 h-3.5" />
                              <span className="text-[10px] font-medium hidden sm:inline leading-none">
                                Proposta
                              </span>
                            </div>
                          )}
                        </div>

                        <span
                          className={cn(
                            'text-[10px] px-2 py-1 rounded-full border font-semibold tracking-wide whitespace-nowrap uppercase',
                            getClassificacaoColor(p.classificacao),
                          )}
                        >
                          {p.classificacao || 'Frio'}
                        </span>
                      </div>

                      <div className="text-[10px] text-muted-foreground flex items-center justify-between">
                        <span title="Última Interação">Int: {formatDate(p.ultima_interacao)}</span>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}
