import { useState, useEffect, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Card } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
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
import { Plus, Pencil, Trash2, Save, X, Loader2, Clock } from 'lucide-react'
import {
  getObservacoes,
  createObservacao,
  updateObservacao,
  deleteObservacao,
  type ImplementacaoObservacao,
} from '@/services/implementacao-observacoes'
import { toast } from 'sonner'

interface Props {
  implementacaoId: string
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

export function ImplementacaoObservacoes({ implementacaoId }: Props) {
  const [observations, setObservations] = useState<ImplementacaoObservacao[]>([])
  const [loading, setLoading] = useState(true)
  const [newText, setNewText] = useState('')
  const [adding, setAdding] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editText, setEditText] = useState('')
  const [savingEdit, setSavingEdit] = useState(false)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [deleting, setDeleting] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const data = await getObservacoes(implementacaoId)
      setObservations(data)
    } catch {
      toast.error('Erro ao carregar observações')
    } finally {
      setLoading(false)
    }
  }, [implementacaoId])

  useEffect(() => {
    load()
  }, [load])

  const handleAdd = async () => {
    if (!newText.trim()) return
    setAdding(true)
    try {
      const created = await createObservacao(implementacaoId, newText.trim())
      setObservations((prev) => [created, ...prev])
      setNewText('')
      toast.success('Observação adicionada')
    } catch {
      toast.error('Erro ao adicionar observação')
    } finally {
      setAdding(false)
    }
  }

  const handleSaveEdit = async () => {
    if (!editingId || !editText.trim()) return
    setSavingEdit(true)
    try {
      const updated = await updateObservacao(editingId, editText.trim())
      setObservations((prev) => prev.map((o) => (o.id === editingId ? updated : o)))
      setEditingId(null)
      setEditText('')
      toast.success('Observação atualizada')
    } catch {
      toast.error('Erro ao atualizar observação')
    } finally {
      setSavingEdit(false)
    }
  }

  const handleConfirmDelete = async () => {
    if (!deleteId) return
    setDeleting(true)
    try {
      await deleteObservacao(deleteId)
      setObservations((prev) => prev.filter((o) => o.id !== deleteId))
      toast.success('Observação removida')
    } catch {
      toast.error('Erro ao remover observação')
    } finally {
      setDeleting(false)
      setDeleteId(null)
    }
  }

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Textarea
          value={newText}
          onChange={(e) => setNewText(e.target.value)}
          placeholder="Digite uma nova observação..."
          className="min-h-[80px]"
        />
        <Button
          onClick={handleAdd}
          disabled={adding || !newText.trim()}
          size="sm"
          className="bg-indigo-600 hover:bg-indigo-700"
        >
          {adding ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <Plus className="h-4 w-4 mr-2" />
          )}
          Adicionar Observação
        </Button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-5 w-5 animate-spin text-slate-400" />
        </div>
      ) : observations.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-4">
          Nenhuma observação registrada.
        </p>
      ) : (
        <div className="space-y-3">
          {observations.map((obs) => (
            <Card key={obs.id} className="p-3 space-y-2">
              {editingId === obs.id ? (
                <div className="space-y-2">
                  <Textarea
                    value={editText}
                    onChange={(e) => setEditText(e.target.value)}
                    className="min-h-[60px] text-sm"
                  />
                  <div className="flex gap-2 justify-end">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setEditingId(null)
                        setEditText('')
                      }}
                    >
                      <X className="h-3 w-3 mr-1" /> Cancelar
                    </Button>
                    <Button
                      size="sm"
                      onClick={handleSaveEdit}
                      disabled={savingEdit || !editText.trim()}
                      className="bg-indigo-600 hover:bg-indigo-700"
                    >
                      {savingEdit ? (
                        <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                      ) : (
                        <Save className="h-3 w-3 mr-1" />
                      )}
                      Salvar
                    </Button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 text-sm text-slate-700 whitespace-pre-wrap break-words">
                      {obs.observacao}
                    </div>
                    <div className="flex gap-1 shrink-0">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        onClick={() => {
                          setEditingId(obs.id)
                          setEditText(obs.observacao)
                        }}
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-red-500 hover:text-red-700"
                        onClick={() => setDeleteId(obs.id)}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 text-xs text-slate-400">
                    <Clock className="h-3 w-3" />
                    <span>
                      {formatDateTime(obs.created_at)}
                      {obs.updated_at !== obs.created_at && (
                        <span className="ml-1 italic">
                          (editado em {formatDateTime(obs.updated_at)})
                        </span>
                      )}
                    </span>
                  </div>
                </>
              )}
            </Card>
          ))}
        </div>
      )}

      <AlertDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja remover esta observação? Esta ação não pode ser desfeita.
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
