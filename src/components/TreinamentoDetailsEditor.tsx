import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Calendar, User, Pencil, Save, X, Loader2, AlertCircle } from 'lucide-react'
import { updateTreinamentoDetails } from '@/services/implementacoes'
import { toast } from 'sonner'

interface TreinamentoDetailsEditorProps {
  implId: string
  treinamentoData: string | null
  treinamentoMotivo: string | null
  treinamentoTopicos: string | null
  clienteNome: string | null
  analistaNome: string | null
  onSaved: () => void
}

export function TreinamentoDetailsEditor({
  implId,
  treinamentoData,
  treinamentoMotivo,
  treinamentoTopicos,
  clienteNome,
  analistaNome,
  onSaved,
}: TreinamentoDetailsEditorProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [editData, setEditData] = useState({
    treinamento_data: treinamentoData || '',
    treinamento_motivo: treinamentoMotivo || '',
    treinamento_topicos: treinamentoTopicos || '',
  })
  const [errors, setErrors] = useState<Record<string, string>>({})

  useEffect(() => {
    setEditData({
      treinamento_data: treinamentoData || '',
      treinamento_motivo: treinamentoMotivo || '',
      treinamento_topicos: treinamentoTopicos || '',
    })
  }, [treinamentoData, treinamentoMotivo, treinamentoTopicos])

  const handleEdit = () => {
    setEditData({
      treinamento_data: treinamentoData || '',
      treinamento_motivo: treinamentoMotivo || '',
      treinamento_topicos: treinamentoTopicos || '',
    })
    setErrors({})
    setIsEditing(true)
  }

  const handleCancel = () => {
    setIsEditing(false)
    setErrors({})
    setEditData({
      treinamento_data: treinamentoData || '',
      treinamento_motivo: treinamentoMotivo || '',
      treinamento_topicos: treinamentoTopicos || '',
    })
  }

  const validate = () => {
    const newErrors: Record<string, string> = {}
    if (editData.treinamento_data) {
      const d = new Date(editData.treinamento_data)
      if (isNaN(d.getTime())) {
        newErrors.treinamento_data = 'Data inválida'
      }
    }
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSave = async () => {
    if (!validate()) return
    setIsSaving(true)
    try {
      await updateTreinamentoDetails(implId, {
        treinamento_data: editData.treinamento_data || null,
        treinamento_motivo: editData.treinamento_motivo || null,
        treinamento_topicos: editData.treinamento_topicos || null,
      })
      toast.success('Detalhes do treinamento atualizados!')
      setIsEditing(false)
      onSaved()
    } catch (error: any) {
      toast.error('Erro ao salvar: ' + (error.message || ''))
    } finally {
      setIsSaving(false)
    }
  }

  if (isEditing) {
    return (
      <div className="space-y-4">
        {clienteNome && (
          <div className="flex items-start gap-2">
            <span className="text-sm text-muted-foreground min-w-[100px]">Cliente:</span>
            <span className="text-sm font-medium">{clienteNome}</span>
          </div>
        )}
        <div className="space-y-2">
          <Label htmlFor="treinamento-motivo">Motivo do Treinamento</Label>
          <Input
            id="treinamento-motivo"
            value={editData.treinamento_motivo}
            onChange={(e) => setEditData({ ...editData, treinamento_motivo: e.target.value })}
            placeholder="Ex: Contratação de novos colaboradores"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="treinamento-topicos">Tópicos a serem abordados</Label>
          <Textarea
            id="treinamento-topicos"
            value={editData.treinamento_topicos}
            onChange={(e) => setEditData({ ...editData, treinamento_topicos: e.target.value })}
            placeholder="Descreva os tópicos do treinamento..."
            rows={4}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="treinamento-data">Data Agendada</Label>
          <Input
            id="treinamento-data"
            type="date"
            value={editData.treinamento_data}
            onChange={(e) => setEditData({ ...editData, treinamento_data: e.target.value })}
          />
          {errors.treinamento_data && (
            <p className="text-xs text-red-600 flex items-center gap-1">
              <AlertCircle className="h-3 w-3" />
              {errors.treinamento_data}
            </p>
          )}
        </div>
        <div className="flex items-center gap-2 pt-2">
          <Button
            onClick={handleSave}
            disabled={isSaving}
            size="sm"
            className="bg-violet-600 hover:bg-violet-700"
          >
            {isSaving ? (
              <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />
            ) : (
              <Save className="h-4 w-4 mr-1.5" />
            )}
            Salvar
          </Button>
          <Button onClick={handleCancel} disabled={isSaving} variant="outline" size="sm">
            <X className="h-4 w-4 mr-1.5" />
            Cancelar
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      <div className="flex justify-end">
        <Button
          onClick={handleEdit}
          variant="outline"
          size="sm"
          className="text-violet-600 border-violet-300 hover:bg-violet-50"
        >
          <Pencil className="h-3.5 w-3.5 mr-1.5" />
          Editar
        </Button>
      </div>
      {clienteNome && (
        <div className="flex items-start gap-2">
          <span className="text-sm text-muted-foreground min-w-[100px]">Cliente:</span>
          <span className="text-sm font-medium">{clienteNome}</span>
        </div>
      )}
      <div className="flex items-start gap-2">
        <span className="text-sm text-muted-foreground min-w-[100px]">Motivo:</span>
        <span className="text-sm font-medium">{treinamentoMotivo || 'Não informado'}</span>
      </div>
      <div className="flex items-start gap-2">
        <span className="text-sm text-muted-foreground min-w-[100px]">Tópicos:</span>
        <span className="text-sm font-medium whitespace-pre-wrap">
          {treinamentoTopicos || 'Não informado'}
        </span>
      </div>
      <div className="flex items-center gap-2">
        <Calendar className="h-4 w-4 text-slate-400" />
        <span className="text-sm text-muted-foreground">Data agendada:</span>
        <span className="text-sm font-medium">
          {treinamentoData
            ? new Date(treinamentoData).toLocaleDateString('pt-BR')
            : 'Não informada'}
        </span>
      </div>
      {analistaNome && (
        <div className="flex items-center gap-2">
          <User className="h-4 w-4 text-slate-400" />
          <span className="text-sm text-muted-foreground">Analista:</span>
          <span className="text-sm font-medium">{analistaNome}</span>
        </div>
      )}
    </div>
  )
}
