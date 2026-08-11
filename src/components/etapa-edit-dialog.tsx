import { useState, useMemo, useEffect } from 'react'
import { AlertCircle, FileText, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { uploadRat, updateEtapa } from '@/services/implementacoes'
import { toast } from 'sonner'

const STATUS_OPTIONS = ['Não iniciada', 'Agendada', 'Em andamento', 'Concluída', 'Atrasada']

function todayStr() {
  return new Date().toISOString().split('T')[0]
}

interface EtapaEditDialogProps {
  etapa: any | null
  colaboradores: any[]
  implId?: string
  onClose: () => void
  onSaved: () => void
}

export function EtapaEditDialog({
  etapa,
  colaboradores,
  implId,
  onClose,
  onSaved,
}: EtapaEditDialogProps) {
  const [formData, setFormData] = useState<any>({})
  const [ratFile, setRatFile] = useState<File | null>(null)
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    if (etapa) {
      setFormData({
        status: etapa.status,
        data_prevista: etapa.data_prevista || '',
        data_realizada: etapa.data_realizada || '',
        responsavel_id: etapa.responsavel_id || '',
        observacoes: etapa.observacoes || '',
        documento_url: etapa.documento_url || '',
      })
      setRatFile(null)
    }
  }, [etapa])

  const isTreinamentoEtapa = useMemo(() => etapa?.categoria === 'Ciclo de Treinamentos', [etapa])

  const canConcluir = useMemo(() => {
    if (!isTreinamentoEtapa) return true
    return !!formData.documento_url || !!ratFile
  }, [isTreinamentoEtapa, formData.documento_url, ratFile])

  const handleStatusChange = (v: string) => {
    const updates: any = { ...formData, status: v }
    if (v === 'Concluída' && !updates.data_realizada) {
      updates.data_realizada = todayStr()
    }
    setFormData(updates)
  }

  const handleSave = async () => {
    if (!etapa || !implId) return
    if (
      isTreinamentoEtapa &&
      formData.status === 'Concluída' &&
      !formData.documento_url &&
      !ratFile
    ) {
      toast.error(
        'A etapa somente poderá ser marcada como Concluída após existir um documento anexado.',
      )
      return
    }
    setIsSaving(true)
    try {
      let docUrl = formData.documento_url || null
      if (ratFile) {
        docUrl = await uploadRat(ratFile, implId, etapa.id)
      }
      await updateEtapa(etapa.id, {
        status: formData.status,
        data_prevista: formData.data_prevista || null,
        data_realizada: formData.data_realizada || null,
        responsavel_id: formData.responsavel_id || null,
        observacoes: formData.observacoes || null,
        documento_url: docUrl,
      })
      toast.success('Etapa atualizada com sucesso!')
      onSaved()
      onClose()
    } catch (error: any) {
      toast.error('Erro ao atualizar etapa: ' + (error.message || ''))
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <Dialog open={!!etapa} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{etapa?.titulo}</DialogTitle>
          <DialogDescription>Atualize o status e detalhes desta etapa.</DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label>Status</Label>
            <Select value={formData.status} onValueChange={handleStatusChange}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {STATUS_OPTIONS.map((status) => {
                  const isDisabled = status === 'Concluída' && !canConcluir
                  return (
                    <SelectItem key={status} value={status} disabled={isDisabled}>
                      {status}
                      {isDisabled && ' (requer RAT)'}
                    </SelectItem>
                  )
                })}
              </SelectContent>
            </Select>
            {isTreinamentoEtapa && !canConcluir && (
              <p className="text-xs text-amber-600 flex items-center gap-1">
                <AlertCircle className="h-3 w-3" />A etapa somente poderá ser marcada como Concluída
                após existir um documento anexado.
              </p>
            )}
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Data Prevista</Label>
              <Input
                type="date"
                value={formData.data_prevista}
                onChange={(e) => setFormData({ ...formData, data_prevista: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Data Realizada</Label>
              <Input
                type="date"
                value={formData.data_realizada}
                onChange={(e) => setFormData({ ...formData, data_realizada: e.target.value })}
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Responsável</Label>
            <Select
              value={formData.responsavel_id}
              onValueChange={(v) => setFormData({ ...formData, responsavel_id: v })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione..." />
              </SelectTrigger>
              <SelectContent>
                {colaboradores.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.nome}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Observações</Label>
            <Textarea
              value={formData.observacoes}
              onChange={(e) => setFormData({ ...formData, observacoes: e.target.value })}
              placeholder="Notas sobre esta etapa..."
            />
          </div>
          {isTreinamentoEtapa && (
            <div className="space-y-2">
              <Label className="flex items-center gap-1">
                <FileText className="h-3 w-3" /> RAT - Relatório de Atendimento Técnico
              </Label>
              <Input type="file" onChange={(e) => setRatFile(e.target.files?.[0] || null)} />
              {formData.documento_url && !ratFile && (
                <a
                  href={formData.documento_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-blue-600 hover:underline"
                >
                  Ver documento atual
                </a>
              )}
              <p className="text-xs text-amber-600">Obrigatório para concluir treinamentos.</p>
            </div>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button
            onClick={handleSave}
            disabled={isSaving}
            className="bg-indigo-600 hover:bg-indigo-700"
          >
            {isSaving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Salvar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
