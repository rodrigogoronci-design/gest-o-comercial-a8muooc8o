import { useState, useEffect, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Loader2, Plus, Calendar, MessageSquare, Trash2, FileText } from 'lucide-react'
import { AtendimentoFormDialog } from '@/components/AtendimentoFormDialog'
import {
  getAtendimentosByCliente,
  deleteAtendimento,
  type Atendimento,
} from '@/services/atendimentos'
import { formatDate } from '@/lib/formatters'
import { toast } from 'sonner'

interface ClientAtendimentosTabProps {
  clienteId: string
  clientName: string
}

export function ClientAtendimentosTab({ clienteId, clientName }: ClientAtendimentosTabProps) {
  const [atendimentos, setAtendimentos] = useState<Atendimento[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isFormOpen, setIsFormOpen] = useState(false)

  const loadAtendimentos = useCallback(async () => {
    setIsLoading(true)
    try {
      const data = await getAtendimentosByCliente(clienteId)
      setAtendimentos(data)
    } catch (error: any) {
      toast.error('Erro ao carregar atendimentos: ' + (error.message || ''))
    } finally {
      setIsLoading(false)
    }
  }, [clienteId])

  useEffect(() => {
    loadAtendimentos()
  }, [loadAtendimentos])

  const handleDelete = async (id: string) => {
    if (!window.confirm('Tem certeza que deseja excluir este atendimento?')) return
    try {
      await deleteAtendimento(id)
      toast.success('Atendimento excluído com sucesso!')
      loadAtendimentos()
    } catch (error: any) {
      toast.error('Erro ao excluir atendimento: ' + (error.message || ''))
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-slate-800">Histórico de Atendimentos</h3>
          <p className="text-sm text-slate-500">
            Registro de interações, reuniões e solicitações de {clientName}
          </p>
        </div>
        <Button
          onClick={() => setIsFormOpen(true)}
          size="sm"
          className="bg-indigo-600 hover:bg-indigo-700"
        >
          <Plus className="h-4 w-4 mr-2" /> Adicionar Atendimento
        </Button>
      </div>

      <AtendimentoFormDialog
        open={isFormOpen}
        onOpenChange={setIsFormOpen}
        clienteId={clienteId}
        onSaved={loadAtendimentos}
      />

      {isLoading ? (
        <div className="flex justify-center items-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-indigo-600" />
        </div>
      ) : atendimentos.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 bg-slate-50 border border-dashed border-slate-200 rounded-lg">
          <MessageSquare className="h-10 w-10 text-slate-300 mb-3" />
          <p className="text-sm text-slate-500 font-medium">Nenhum atendimento registrado</p>
          <p className="text-xs text-slate-400 mt-1">
            Clique em "Adicionar Atendimento" para começar.
          </p>
        </div>
      ) : (
        <ScrollArea className="h-[calc(100vh-16rem)] pr-4">
          <div className="relative border-l-2 border-slate-100 ml-3 pl-6 space-y-6 pb-4 pt-2">
            {atendimentos.map((atendimento) => (
              <div key={atendimento.id} className="relative group">
                <div className="absolute -left-[31px] top-1.5 h-3.5 w-3.5 rounded-full border-2 border-indigo-500 bg-white" />

                <div className="bg-white border border-slate-100 rounded-md p-4 shadow-sm hover:border-indigo-100 transition-colors">
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs text-slate-400 font-medium flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {formatDate(atendimento.data_atendimento)}
                        </span>
                      </div>
                      <h4 className="font-semibold text-slate-800 text-sm">
                        {atendimento.solicitacao}
                      </h4>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-slate-400 hover:text-red-600 hover:bg-red-50"
                      onClick={() => handleDelete(atendimento.id)}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>

                  <div className="bg-slate-50 p-3 rounded border border-slate-100">
                    <div className="flex items-start gap-2">
                      <FileText className="h-4 w-4 text-slate-400 shrink-0 mt-0.5" />
                      <p className="text-sm text-slate-600 whitespace-pre-wrap">
                        {atendimento.relatorio}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      )}
    </div>
  )
}
