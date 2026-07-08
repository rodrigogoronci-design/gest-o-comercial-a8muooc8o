import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Calendar, FileText, MessageSquare, Download, Loader2, ExternalLink } from 'lucide-react'
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
  const [loadingDoc, setLoadingDoc] = useState(false)

  const handleViewDocument = async () => {
    if (!atendimento?.documento_url) return
    setLoadingDoc(true)
    try {
      window.open(atendimento.documento_url, '_blank')
    } finally {
      setLoadingDoc(false)
    }
  }

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
              {atendimento.documento_url && (
                <div>
                  <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2">
                    Documento Anexo
                  </h4>
                  <div className="flex items-center gap-2 bg-indigo-50 border border-indigo-100 rounded-md p-3">
                    <FileText className="h-5 w-5 text-indigo-600 shrink-0" />
                    <span className="text-sm text-slate-700 font-medium flex-1 truncate">
                      Documento anexado
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-indigo-600 border-indigo-200 hover:bg-indigo-50"
                      disabled={loadingDoc}
                      onClick={handleViewDocument}
                    >
                      {loadingDoc ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <>
                          <ExternalLink className="h-4 w-4 mr-1.5" />
                          Ver Documento Anexo
                        </>
                      )}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-indigo-600 hover:bg-indigo-50"
                      disabled={loadingDoc}
                      onClick={handleViewDocument}
                    >
                      <Download className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </>
        ) : null}
      </DialogContent>
    </Dialog>
  )
}
