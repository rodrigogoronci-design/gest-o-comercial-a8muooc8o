import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Calendar, FileText, MessageSquare } from 'lucide-react'
import { formatDate } from '@/lib/formatters'
import type { Atendimento } from '@/services/atendimentos'

interface AtendimentoDetailDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  atendimento: Atendimento | null
}

export function AtendimentoDetailDialog({
  open,
  onOpenChange,
  atendimento,
}: AtendimentoDetailDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        {atendimento ? (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5 text-indigo-600" />
                Detalhes do Atendimento
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-2">
              <div className="flex items-center gap-2 text-sm">
                <Calendar className="h-4 w-4 text-slate-400" />
                <span className="text-slate-600 font-medium">
                  {formatDate(atendimento.data_atendimento)}
                </span>
              </div>
              <div>
                <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1">
                  Solicitação
                </h4>
                <p className="text-sm text-slate-800 font-medium">{atendimento.solicitacao}</p>
              </div>
              <div>
                <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1 flex items-center gap-1">
                  <FileText className="h-3.5 w-3.5" />
                  Relatório
                </h4>
                <div className="bg-slate-50 border border-slate-100 rounded-md p-3 max-h-[300px] overflow-y-auto">
                  <p className="text-sm text-slate-700 whitespace-pre-wrap">
                    {atendimento.relatorio}
                  </p>
                </div>
              </div>
            </div>
          </>
        ) : null}
      </DialogContent>
    </Dialog>
  )
}
