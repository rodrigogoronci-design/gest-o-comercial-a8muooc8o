import { useState, useRef } from 'react'
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
import { Loader2, Save, Upload, FileText, X } from 'lucide-react'
import { AdvancedDatePicker } from '@/components/ui/advanced-date-picker'
import {
  createAtendimento,
  uploadAtendimentoDocumento,
  type AtendimentoInput,
} from '@/services/atendimentos'
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
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const resetForm = () => {
    setDataAtendimento('')
    setSolicitacao('')
    setRelatorio('')
    setSelectedFile(null)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const maxSize = 15 * 1024 * 1024
    if (file.size > maxSize) {
      toast.error('Arquivo muito grande. Máximo permitido: 15MB.')
      e.target.value = ''
      return
    }
    setSelectedFile(file)
  }

  const handleRemoveFile = () => {
    setSelectedFile(null)
    if (fileInputRef.current) fileInputRef.current.value = ''
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
      let documentoUrl: string | null = null

      if (selectedFile) {
        documentoUrl = await uploadAtendimentoDocumento(clienteId, selectedFile)
      }

      const payload: AtendimentoInput = {
        cliente_id: clienteId,
        data_atendimento: new Date(dataAtendimento + 'T12:00:00').toISOString(),
        solicitacao: solicitacao.trim(),
        relatorio: relatorio.trim(),
        documento_url: documentoUrl,
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
          <div className="space-y-2">
            <Label>Anexar Documento</Label>
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,.doc,.docx,.xls,.xlsx,.png,.jpg,.jpeg"
              onChange={handleFileChange}
              className="hidden"
              id="atendimento-doc-upload"
            />
            {selectedFile ? (
              <div className="flex items-center gap-2 bg-indigo-50 border border-indigo-100 rounded-md p-3">
                <FileText className="h-4 w-4 text-indigo-600 shrink-0" />
                <span className="text-sm text-slate-700 font-medium truncate flex-1">
                  {selectedFile.name}
                </span>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-7 px-2 text-red-500 hover:text-red-700 hover:bg-red-50"
                  onClick={handleRemoveFile}
                >
                  <X className="h-3.5 w-3.5" />
                </Button>
              </div>
            ) : (
              <label
                htmlFor="atendimento-doc-upload"
                className="flex items-center gap-2 cursor-pointer text-sm text-slate-600 hover:text-indigo-600 font-medium transition-colors border-2 border-dashed border-slate-200 rounded-md p-3 hover:border-indigo-200 hover:bg-indigo-50/30"
              >
                <Upload className="h-4 w-4 text-indigo-500" />
                <span>Selecionar arquivo (PDF, DOCX, etc.)</span>
              </label>
            )}
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
