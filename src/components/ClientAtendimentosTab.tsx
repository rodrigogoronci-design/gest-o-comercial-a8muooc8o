import { useState, useEffect, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import {
  Loader2,
  Plus,
  Calendar,
  MessageSquare,
  Trash2,
  ChevronRight,
  Paperclip,
} from 'lucide-react'
import { AtendimentoFormDialog } from '@/components/AtendimentoFormDialog'
import { AtendimentoDetailDialog } from '@/components/AtendimentoDetailDialog'
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
  const [selectedAtendimento, setSelectedAtendimento] = useState<Atendimento | null>(null)
  const [isDetailOpen, setIsDetailOpen] = useState(false)

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

  const handleOpenDetail = (atendimento: Atendimento) => {
    setSelectedAtendimento(atendimento)
    setIsDetailOpen(true)
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

      <AtendimentoDetailDialog
        open={isDetailOpen}
        onOpenChange={setIsDetailOpen}
        atendimento={selectedAtendimento}
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
        <div className="border border-slate-200 rounded-lg overflow-hidden">
          {atendimentos.map((atendimento, index) => (
            <div
              key={atendimento.id}
              className={`flex items-center gap-3 px-4 py-3 hover:bg-slate-50 transition-colors group ${
                index !== atendimentos.length - 1 ? 'border-b border-slate-100' : ''
              }`}
            >
              <div className="flex items-center gap-2 text-xs text-slate-500 min-w-[130px] shrink-0">
                <Calendar className="h-3.5 w-3.5 text-slate-400" />
                <span className="font-medium">{formatDate(atendimento.data_atendimento)}</span>
              </div>
              <button
                onClick={() => handleOpenDetail(atendimento)}
                className="flex-1 text-left text-sm font-medium text-indigo-600 hover:text-indigo-800 hover:underline cursor-pointer transition-colors truncate"
              >
                {atendimento.solicitacao}
              </button>
              {atendimento.documento_url && (
                <Paperclip
                  className="h-4 w-4 text-indigo-500 shrink-0"
                  aria-label="Possui documento anexo"
                />
              )}
              <ChevronRight className="h-4 w-4 text-slate-300 group-hover:text-slate-400 shrink-0" />
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 text-slate-400 hover:text-red-600 hover:bg-red-50 shrink-0"
                onClick={() => handleDelete(atendimento.id)}
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
