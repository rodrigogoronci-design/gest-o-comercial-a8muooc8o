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
import { Loader2, Plus, X } from 'lucide-react'
import { createImplementacao, getColaboradores, getSolicitacoes } from '@/services/implementacoes'
import { getClientes } from '@/services/clientes'
import { toast } from 'sonner'

interface Props {
  open: boolean
  onOpenChange: (v: boolean) => void
  onCreated: () => void
}

export function ImplementacaoCreateDialog({ open, onOpenChange, onCreated }: Props) {
  const [saving, setSaving] = useState(false)
  const [clientes, setClientes] = useState<any[]>([])
  const [colaboradores, setColaboradores] = useState<any[]>([])
  const [solicitacoes, setSolicitacoes] = useState<any[]>([])
  const [tipo, setTipo] = useState<'novo_cliente' | 'inclusao_modulo' | 'treinamento'>(
    'novo_cliente',
  )
  const [clienteId, setClienteId] = useState('')
  const [responsavelId, setResponsavelId] = useState('')
  const [solicitacaoId, setSolicitacaoId] = useState('')
  const [modulosNovos, setModulosNovos] = useState<string[]>([])
  const [treinamentoMotivo, setTreinamentoMotivo] = useState('')
  const [treinamentoTopicos, setTreinamentoTopicos] = useState('')
  const [treinamentoData, setTreinamentoData] = useState('')

  useEffect(() => {
    if (open) {
      Promise.all([getClientes(), getColaboradores(), getSolicitacoes()])
        .then(([c, col, sol]) => {
          setClientes(c || [])
          setColaboradores(col || [])
          setSolicitacoes(sol || [])
        })
        .catch(() => toast.error('Erro ao carregar dados'))
    }
  }, [open])

  const handleSubmit = async () => {
    if (!clienteId) {
      toast.error('Selecione um cliente')
      return
    }
    setSaving(true)
    try {
      await createImplementacao({
        cliente_id: clienteId,
        responsavel_id: responsavelId || null,
        solicitacao_id: solicitacaoId || null,
        tipo,
        modulos_novos: tipo === 'inclusao_modulo' ? modulosNovos.filter((m) => m.trim()) : [],
        treinamento_motivo: tipo === 'treinamento' ? treinamentoMotivo || null : null,
        treinamento_topicos: tipo === 'treinamento' ? treinamentoTopicos || null : null,
        treinamento_data: tipo === 'treinamento' ? treinamentoData || null : null,
      })
      toast.success('Implementação criada com sucesso!')
      onOpenChange(false)
      onCreated()
      setTipo('novo_cliente')
      setClienteId('')
      setResponsavelId('')
      setSolicitacaoId('')
      setModulosNovos([])
      setTreinamentoMotivo('')
      setTreinamentoTopicos('')
      setTreinamentoData('')
    } catch (error: any) {
      toast.error('Erro ao criar implementação: ' + (error.message || ''))
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Nova Implementação</DialogTitle>
          <DialogDescription>
            Crie uma nova implementação, inclusão de módulo ou treinamento.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-2 max-h-[60vh] overflow-y-auto">
          <div className="space-y-2">
            <Label>Tipo de Implementação</Label>
            <Select value={tipo} onValueChange={(v) => setTipo(v as any)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="novo_cliente">Novo Cliente</SelectItem>
                <SelectItem value="inclusao_modulo">Inclusão de Módulo</SelectItem>
                <SelectItem value="treinamento">Treinamento</SelectItem>
              </SelectContent>
            </Select>
          </div>
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
          <div className="space-y-2">
            <Label>Responsável</Label>
            <Select value={responsavelId} onValueChange={setResponsavelId}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione um responsável..." />
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
            <Label>Solicitação de Serviço (opcional)</Label>
            <Select value={solicitacaoId} onValueChange={setSolicitacaoId}>
              <SelectTrigger>
                <SelectValue placeholder="Vincular a uma solicitação..." />
              </SelectTrigger>
              <SelectContent>
                {solicitacoes.map((s) => (
                  <SelectItem key={s.id} value={s.id}>
                    {s.tipo} — {s.clientes?.nome || 'N/A'}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {tipo === 'inclusao_modulo' && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Módulos a serem adicionados</Label>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setModulosNovos((p) => [...p, ''])}
                >
                  <Plus className="h-3 w-3 mr-1" /> Adicionar
                </Button>
              </div>
              <div className="space-y-2">
                {modulosNovos.map((mod, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <Input
                      value={mod}
                      onChange={(e) =>
                        setModulosNovos((p) => p.map((m, idx) => (idx === i ? e.target.value : m)))
                      }
                      placeholder="Nome do módulo"
                    />
                    <Button
                      variant="ghost"
                      size="icon"
                      className="shrink-0 text-red-500 hover:text-red-700"
                      onClick={() => setModulosNovos((p) => p.filter((_, idx) => idx !== i))}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
                {modulosNovos.length === 0 && (
                  <p className="text-sm text-muted-foreground">Nenhum módulo adicionado.</p>
                )}
              </div>
            </div>
          )}
          {tipo === 'treinamento' && (
            <>
              <div className="space-y-2">
                <Label>Motivo do Treinamento</Label>
                <Input
                  value={treinamentoMotivo}
                  onChange={(e) => setTreinamentoMotivo(e.target.value)}
                  placeholder="Ex: Contratação de novos colaboradores"
                />
              </div>
              <div className="space-y-2">
                <Label>Tópicos a serem abordados</Label>
                <Textarea
                  value={treinamentoTopicos}
                  onChange={(e) => setTreinamentoTopicos(e.target.value)}
                  placeholder="Descreva os tópicos do treinamento..."
                />
              </div>
              <div className="space-y-2">
                <Label>Data Agendada</Label>
                <Input
                  type="date"
                  value={treinamentoData}
                  onChange={(e) => setTreinamentoData(e.target.value)}
                />
              </div>
            </>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={saving}
            className="bg-indigo-600 hover:bg-indigo-700"
          >
            {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Criar Implementação
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
