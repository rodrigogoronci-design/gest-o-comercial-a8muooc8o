import { useState, useEffect, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card } from '@/components/ui/card'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import {
  Plus,
  Pencil,
  Trash2,
  Save,
  X,
  Loader2,
  Clock,
  Link2,
  Video,
  ExternalLink,
} from 'lucide-react'
import {
  getReunioesByCliente,
  createReuniao,
  updateReuniao,
  deleteReuniao,
  type Reuniao,
} from '@/services/reunioes'
import { toast } from 'sonner'

interface Props {
  clienteId: string
}

function formatDateTime(iso: string) {
  return new Date(iso).toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function ClientReunioesTab({ clienteId }: Props) {
  const [reunioes, setReunioes] = useState<Reuniao[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    titulo: '',
    descricao: '',
    data_evento: '',
    link_reuniao: '',
    gravacao_url: '',
  })
  const [saving, setSaving] = useState(false)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [deleting, setDeleting] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const data = await getReunioesByCliente(clienteId)
      setReunioes(data)
    } catch {
      toast.error('Erro ao carregar reuniões')
    } finally {
      setLoading(false)
    }
  }, [clienteId])

  useEffect(() => {
    load()
  }, [load])

  const resetForm = () => {
    setFormData({
      titulo: '',
      descricao: '',
      data_evento: '',
      link_reuniao: '',
      gravacao_url: '',
    })
    setEditingId(null)
    setShowForm(false)
  }

  const handleSave = async () => {
    if (!formData.titulo.trim()) {
      toast.error('O título é obrigatório')
      return
    }
    if (!formData.data_evento) {
      toast.error('A data é obrigatória')
      return
    }
    setSaving(true)
    try {
      const payload = {
        cliente_id: clienteId,
        titulo: formData.titulo.trim(),
        descricao: formData.descricao.trim() || null,
        data_evento: new Date(formData.data_evento).toISOString(),
        link_reuniao: formData.link_reuniao.trim() || null,
        gravacao_url: formData.gravacao_url.trim() || null,
      }
      if (editingId) {
        const updated = await updateReuniao(editingId, payload)
        setReunioes((prev) => prev.map((r) => (r.id === editingId ? updated : r)))
        toast.success('Reunião atualizada')
      } else {
        const created = await createReuniao(payload)
        setReunioes((prev) => [created, ...prev])
        toast.success('Reunião adicionada')
      }
      resetForm()
    } catch (error: any) {
      toast.error('Erro ao salvar reunião: ' + (error.message || ''))
    } finally {
      setSaving(false)
    }
  }

  const handleEdit = (r: Reuniao) => {
    setEditingId(r.id)
    setFormData({
      titulo: r.titulo || '',
      descricao: r.descricao || '',
      data_evento: r.data_evento ? new Date(r.data_evento).toISOString().slice(0, 16) : '',
      link_reuniao: r.link_reuniao || '',
      gravacao_url: r.gravacao_url || '',
    })
    setShowForm(true)
  }

  const handleConfirmDelete = async () => {
    if (!deleteId) return
    setDeleting(true)
    try {
      await deleteReuniao(deleteId)
      setReunioes((prev) => prev.filter((r) => r.id !== deleteId))
      toast.success('Reunião removida')
    } catch {
      toast.error('Erro ao remover reunião')
    } finally {
      setDeleting(false)
      setDeleteId(null)
    }
  }

  return (
    <div className="space-y-4">
      {!showForm && (
        <Button
          onClick={() => setShowForm(true)}
          size="sm"
          className="bg-indigo-600 hover:bg-indigo-700"
        >
          <Plus className="h-4 w-4 mr-2" />
          Nova Reunião
        </Button>
      )}

      {showForm && (
        <Card className="p-4 space-y-3 border-indigo-200">
          <div className="space-y-2">
            <Label>Título</Label>
            <Input
              value={formData.titulo}
              onChange={(e) => setFormData((prev) => ({ ...prev, titulo: e.target.value }))}
              placeholder="Ex: Reunião de Kickoff"
            />
          </div>
          <div className="space-y-2">
            <Label>Data e Hora</Label>
            <Input
              type="datetime-local"
              value={formData.data_evento}
              onChange={(e) => setFormData((prev) => ({ ...prev, data_evento: e.target.value }))}
            />
          </div>
          <div className="space-y-2">
            <Label>Link da Reunião</Label>
            <Input
              value={formData.link_reuniao}
              onChange={(e) => setFormData((prev) => ({ ...prev, link_reuniao: e.target.value }))}
              placeholder="https://meet.google.com/..."
            />
          </div>
          <div className="space-y-2">
            <Label>Link da Gravação</Label>
            <Input
              value={formData.gravacao_url}
              onChange={(e) => setFormData((prev) => ({ ...prev, gravacao_url: e.target.value }))}
              placeholder="https://..."
            />
          </div>
          <div className="space-y-2">
            <Label>Descrição (Opcional)</Label>
            <Textarea
              value={formData.descricao}
              onChange={(e) => setFormData((prev) => ({ ...prev, descricao: e.target.value }))}
              placeholder="Pauta, participantes..."
              rows={3}
            />
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" size="sm" onClick={resetForm}>
              <X className="h-3 w-3 mr-1" /> Cancelar
            </Button>
            <Button
              size="sm"
              onClick={handleSave}
              disabled={saving}
              className="bg-indigo-600 hover:bg-indigo-700"
            >
              {saving ? (
                <Loader2 className="h-3 w-3 mr-1 animate-spin" />
              ) : (
                <Save className="h-3 w-3 mr-1" />
              )}
              Salvar
            </Button>
          </div>
        </Card>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-5 w-5 animate-spin text-slate-400" />
        </div>
      ) : reunioes.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-4">
          Nenhuma reunião registrada.
        </p>
      ) : (
        <div className="space-y-3">
          {reunioes.map((r) => (
            <Card key={r.id} className="p-3 space-y-2">
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1">
                  <div className="font-medium text-sm text-slate-800">{r.titulo}</div>
                  {r.descricao && (
                    <p className="text-xs text-slate-500 mt-1 whitespace-pre-wrap">{r.descricao}</p>
                  )}
                </div>
                <div className="flex gap-1 shrink-0">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7"
                    onClick={() => handleEdit(r)}
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 text-red-500 hover:text-red-700"
                    onClick={() => setDeleteId(r.id)}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-3 text-xs text-slate-400">
                <span className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {formatDateTime(r.data_evento)}
                </span>
                {r.link_reuniao && (
                  <a
                    href={r.link_reuniao}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 text-indigo-600 hover:underline"
                  >
                    <Link2 className="h-3 w-3" />
                    Link da Reunião
                    <ExternalLink className="h-2.5 w-2.5" />
                  </a>
                )}
                {r.gravacao_url && (
                  <a
                    href={r.gravacao_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 text-emerald-600 hover:underline"
                  >
                    <Video className="h-3 w-3" />
                    Gravação
                    <ExternalLink className="h-2.5 w-2.5" />
                  </a>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}

      <AlertDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja remover esta reunião? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              disabled={deleting}
              className="bg-red-600 hover:bg-red-700"
            >
              {deleting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
