import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Loader2, Save } from 'lucide-react'
import { AdvancedDatePicker } from '@/components/ui/advanced-date-picker'
import { createAtendimento, type AtendimentoInput } from '@/services/atendimentos'
import { toast } from 'sonner'

interface AtendimentoFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  clienteId: string
  onSaved: () => void
}

export function AtendimentoFormDialog({
  open,
  onOpenChange,
  clienteId,
  onSaved,
}: AtendimentoFormDialogProps) {
  const [dataAtendimento, setDataAtendimento] = useState('')
  const [solicitacao, setSolicitacao] = useState('')
  const [relatorio, setRelatorio] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const resetForm = () => {
    setDataAtendimento('')
    setSolicitacao('')
    setRelatorio('')
  }

  const handleSubmit = async () => {
    if (!dataAtendimento) {
      toast.error('A data do atendimento é obrigatória')
      return
    }
    if (!solicitacao.trim()) {
      toast.error('A solicitação é obrigatória')
      return
    }
    if (!relatorio.trim()) {
      toast.error('O relatório do atendimento é obrigatório')
      return
    }

    setIsSubmitting(true)
    try {
      const payload: AtendimentoInput = {
        cliente_id: clienteId,
        data_atendimento: new Date(dataAtendimento + 'T12:00:00').toISOString(),
        solicitacao: solicitacao.trim(),
        relatorio: relatorio.trim(),
      }
      await createAtendimento(payload)
      toast.success('Atendimento registrado com sucesso!')
      resetForm()
      onOpenChange(false)
      onSaved()
    } catch (error: any) {
      toast.error('Erro ao salvar atendimento: ' + (error.message || ''))
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(open) => {
        onOpenChange(open)
        if (!open) resetForm()
      }}
    >
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Adicionar Atendimento</DialogTitle>
          <DialogDescription>
            Registre os detalhes da interação, reunião ou solicitação do cliente.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>Data do Atendimento</Label>
            <AdvancedDatePicker
              value={dataAtendimento}
              onChange={setDataAtendimento}
              placeholder="Selecione a data do atendimento"
            />
          </div>
          <div className="space-y-2">
            <Label>Solicitação</Label>
            <Input
              placeholder="Ex: Reunião de alinhamento, solicitação de novo módulo, visita técnica..."
              value={solicitacao}
              onChange={(e) => setSolicitacao(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label>Relatório do Atendimento</Label>
            <Textarea
              placeholder="Descreva detalhadamente tudo que foi discutido, decisões tomadas, próximos passos..."
              value={relatorio}
              onChange={(e) => setRelatorio(e.target.value)}
              className="min-h-[160px]"
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="bg-indigo-600 hover:bg-indigo-700 text-white"
          >
            {isSubmitting ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <Save className="h-4 w-4 mr-2" />
            )}
            Salvar Atendimento
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
