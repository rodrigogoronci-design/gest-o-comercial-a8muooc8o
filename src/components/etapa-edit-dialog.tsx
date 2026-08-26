import { useState, useEffect } from 'react'
import { AlertCircle, Loader2 } from 'lucide-react'
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
import { updateEtapa } from '@/services/implementacoes'
import { toast } from 'sonner'

const STATUS_OPTIONS = ['Não iniciada', 'Agendada', 'Em andamento', 'Concluída', 'Atrasada']
const TIME_REGEX = /^([01]\d|2[0-3]):([0-5]\d)$/

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
  const [isSaving, setIsSaving] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  useEffect(() => {
    if (etapa) {
      setFormData({
        status: etapa.status,
        data_prevista: etapa.data_prevista || '',
        data_realizada: etapa.data_realizada || '',
        hora_prevista: etapa.hora_prevista || '',
        hora_realizada: etapa.hora_realizada || '',
        responsavel_id: etapa.responsavel_id || '',
        observacoes: etapa.observacoes || '',
        documento_url: etapa.documento_url || '',
      })
      setErrors({})
    }
  }, [etapa])

  const handleStatusChange = (v: string) => {
    const updates: any = { ...formData, status: v }
    if (v === 'Concluída' && !updates.data_realizada) {
      updates.data_realizada = todayStr()
    }
    setFormData(updates)
  }

  const validate = () => {
    const newErrors: Record<string, string> = {}
    if (formData.hora_prevista && !TIME_REGEX.test(formData.hora_prevista)) {
      newErrors.hora_prevista = 'Hora inválida (HH:MM)'
    }
    if (formData.hora_realizada && !TIME_REGEX.test(formData.hora_realizada)) {
      newErrors.hora_realizada = 'Hora inválida (HH:MM)'
    }
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSave = async () => {
    if (!etapa || !implId) return
    if (!validate()) {
      toast.error('Corrija os campos de hora antes de salvar.')
      return
    }
    setIsSaving(true)
    try {
      await updateEtapa(etapa.id, {
        status: formData.status,
        data_prevista: formData.data_prevista || null,
        data_realizada: formData.data_realizada || null,
        hora_prevista: formData.hora_prevista || null,
        hora_realizada: formData.hora_realizada || null,
        responsavel_id: formData.responsavel_id || null,
        observacoes: formData.observacoes || null,
        documento_url: formData.documento_url || null,
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
                {STATUS_OPTIONS.map((status) => (
                  <SelectItem key={status} value={status}>
                    {status}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Data Prevista</Label>
              <Input
                type="date"
                value={formData.data_prevista}
                onChange={(e) => setFormData({ ...formData, data_prevista: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Hora Prevista</Label>
              <Input
                type="time"
                value={formData.hora_prevista}
                onChange={(e) => setFormData({ ...formData, hora_prevista: e.target.value })}
              />
              {errors.hora_prevista && (
                <p className="text-xs text-red-600 flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" />
                  {errors.hora_prevista}
                </p>
              )}
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Data Realizada</Label>
              <Input
                type="date"
                value={formData.data_realizada}
                onChange={(e) => setFormData({ ...formData, data_realizada: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Hora Realizada</Label>
              <Input
                type="time"
                value={formData.hora_realizada}
                onChange={(e) => setFormData({ ...formData, hora_realizada: e.target.value })}
              />
              {errors.hora_realizada && (
                <p className="text-xs text-red-600 flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" />
                  {errors.hora_realizada}
                </p>
              )}
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
