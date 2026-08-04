import { useState, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Loader2 } from 'lucide-react'
import { getClientes } from '@/services/clientes'
import { createConsultoria, getConsultoriaProjectName } from '@/services/consultoria-crm'
import { toast } from 'sonner'

interface Props {
  open: boolean
  onOpenChange: (v: boolean) => void
  onCreated: () => void
}

export function CrmConsultoriaCreateDialog({ open, onOpenChange, onCreated }: Props) {
  const [saving, setSaving] = useState(false)
  const [clientes, setClientes] = useState<any[]>([])
  const [clienteId, setClienteId] = useState('')

  useEffect(() => {
    if (open) {
      getClientes()
        .then((c) => setClientes(c || []))
        .catch(() => toast.error('Erro ao carregar clientes'))
    }
  }, [open])

  const selectedClient = clientes.find((c) => c.id === clienteId)
  const projectName = selectedClient ? getConsultoriaProjectName(selectedClient.nome) : ''

  const handleSubmit = async () => {
    if (!clienteId) {
      toast.error('Selecione um cliente')
      return
    }
    setSaving(true)
    try {
      await createConsultoria(clienteId)
      toast.success('Projeto de consultoria criado com sucesso!')
      onOpenChange(false)
      onCreated()
      setClienteId('')
    } catch (error: any) {
      toast.error('Erro ao criar consultoria: ' + (error.message || ''))
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Nova Consultoria</DialogTitle>
          <DialogDescription>
            Selecione um cliente para criar um projeto de consultoria.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label>Cliente</Label>
            <Select value={clienteId} onValueChange={setClienteId}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione um cliente..." />
              </SelectTrigger>
              <SelectContent>
                {clientes.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.nome}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {projectName && (
            <div className="p-3 rounded-lg bg-amber-50 border border-amber-100">
              <p className="text-xs text-amber-600 font-medium uppercase mb-1">Nome do Projeto</p>
              <p className="text-sm font-semibold text-amber-900">{projectName}</p>
            </div>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={saving || !clienteId}
            className="bg-amber-600 hover:bg-amber-700"
          >
            {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Criar Consultoria
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
