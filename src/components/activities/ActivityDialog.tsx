import { useState, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Plus } from 'lucide-react'
import { getClientesParaAtividades, createAtividade } from '@/services/atividades'
import { useToast } from '@/hooks/use-toast'

export function ActivityDialog({ onSaved }: { onSaved: () => void }) {
  const [open, setOpen] = useState(false)
  const [clientes, setClientes] = useState<{ id: string; nome: string }[]>([])
  const [loading, setLoading] = useState(false)
  const { toast } = useToast()

  const [formData, setFormData] = useState({
    cliente_nome: '',
    demanda: '',
    data_atividade: new Date().toISOString().split('T')[0],
  })

  useEffect(() => {
    if (open) {
      getClientesParaAtividades().then(setClientes).catch(console.error)
    }
  }, [open])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      setLoading(true)

      const existingClient = clientes.find(
        (c) => c.nome.toLowerCase() === formData.cliente_nome.toLowerCase(),
      )

      await createAtividade({
        cliente_id: existingClient ? existingClient.id : null,
        cliente_nome: existingClient ? null : formData.cliente_nome,
        demanda: formData.demanda,
        data_atividade: formData.data_atividade,
      })

      toast({ title: 'Atividade registrada com sucesso!' })
      setOpen(false)
      onSaved()
      setFormData({
        cliente_nome: '',
        demanda: '',
        data_atividade: new Date().toISOString().split('T')[0],
      })
    } catch (error: any) {
      toast({ title: 'Erro ao salvar', description: error.message, variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="mr-2 size-4" /> Nova Atividade
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Registrar Atividade Comercial</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          <div className="space-y-2">
            <Label>Cliente</Label>
            <Input
              value={formData.cliente_nome}
              onChange={(e) => setFormData({ ...formData, cliente_nome: e.target.value })}
              required
              placeholder="Digite o nome ou selecione na lista"
              list="clientes-list"
            />
            <datalist id="clientes-list">
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
            <Label>Demanda / Resumo</Label>
            <Textarea
              value={formData.demanda}
              onChange={(e) => setFormData({ ...formData, demanda: e.target.value })}
              required
              placeholder="Descreva o que foi tratado, alinhado ou vendido..."
              className="min-h-[100px]"
            />
          </div>
          <div className="flex justify-end pt-4">
            <Button type="submit" disabled={loading}>
              {loading ? 'Salvando...' : 'Salvar Registro'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
