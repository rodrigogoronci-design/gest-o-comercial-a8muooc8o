import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { getClientesParaAtividades, updateAtividade, Atividade } from '@/services/atividades'
import { useToast } from '@/hooks/use-toast'

export function EditActivityDialog({
  atividade,
  open,
  onOpenChange,
  onSaved,
}: {
  atividade: Atividade | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onSaved: () => void
}) {
  const [clientes, setClientes] = useState<{ id: string; nome: string }[]>([])
  const [loading, setLoading] = useState(false)
  const { toast } = useToast()

  const [formData, setFormData] = useState({
    cliente_nome: '',
    demanda: '',
    data_atividade: '',
    observacoes: '',
    status: '',
    tipo: '',
    data_follow_up: '',
  })

  useEffect(() => {
    if (open) {
      getClientesParaAtividades().then(setClientes).catch(console.error)
      if (atividade) {
        setFormData({
          cliente_nome: atividade.clientes?.nome || atividade.cliente_nome || '',
          demanda: atividade.demanda || '',
          data_atividade: atividade.data_atividade ? atividade.data_atividade.split('T')[0] : '',
          observacoes: atividade.observacoes || '',
          status: atividade.status || '',
          tipo: atividade.tipo || '',
          data_follow_up: atividade.data_follow_up ? atividade.data_follow_up.split('T')[0] : '',
        })
      }
    }
  }, [open, atividade])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!atividade) return

    try {
      setLoading(true)

      const existingClient = clientes.find(
        (c) => c.nome.toLowerCase() === formData.cliente_nome.toLowerCase(),
      )

      await updateAtividade(atividade.id, {
        cliente_id: existingClient ? existingClient.id : null,
        cliente_nome: existingClient ? null : formData.cliente_nome,
        demanda: formData.demanda,
        data_atividade: formData.data_atividade || new Date().toISOString().split('T')[0],
        observacoes: formData.observacoes,
        status: formData.status,
        tipo: formData.tipo,
        data_follow_up: formData.data_follow_up || null,
      })

      toast({ title: 'Atividade atualizada com sucesso!' })
      onOpenChange(false)
      onSaved()
    } catch (error: any) {
      toast({ title: 'Erro ao salvar', description: error.message, variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Editar Atividade Comercial</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2 sm:col-span-2">
              <Label>Cliente</Label>
              <Input
                value={formData.cliente_nome}
                onChange={(e) => setFormData({ ...formData, cliente_nome: e.target.value })}
                required
                placeholder="Digite o nome ou selecione na lista"
                list="clientes-edit-list"
              />
              <datalist id="clientes-edit-list">
                {clientes.map((c) => (
                  <option key={c.id} value={c.nome} />
                ))}
              </datalist>
            </div>
            <div className="space-y-2">
              <Label>Data da Atividade</Label>
              <Input
                type="date"
                value={formData.data_atividade}
                onChange={(e) => setFormData({ ...formData, data_atividade: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label>Data Follow-up</Label>
              <Input
                type="date"
                value={formData.data_follow_up}
                onChange={(e) => setFormData({ ...formData, data_follow_up: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Tipo</Label>
              <Input
                value={formData.tipo}
                onChange={(e) => setFormData({ ...formData, tipo: e.target.value })}
                placeholder="Ex: Reunião, Ligação..."
              />
            </div>
            <div className="space-y-2">
              <Label>Status</Label>
              <Input
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                placeholder="Ex: Em andamento, Concluído..."
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Demanda / Resumo</Label>
            <Textarea
              value={formData.demanda}
              onChange={(e) => setFormData({ ...formData, demanda: e.target.value })}
              required
              placeholder="Descreva o que foi tratado, alinhado ou vendido..."
              className="min-h-[80px]"
            />
          </div>
          <div className="space-y-2">
            <Label>Observações</Label>
            <Textarea
              value={formData.observacoes}
              onChange={(e) => setFormData({ ...formData, observacoes: e.target.value })}
              placeholder="Anotações extras..."
              className="min-h-[60px]"
            />
          </div>
          <div className="flex justify-end pt-4">
            <Button
              type="button"
              variant="outline"
              className="mr-2"
              onClick={() => onOpenChange(false)}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Salvando...' : 'Salvar Alterações'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
