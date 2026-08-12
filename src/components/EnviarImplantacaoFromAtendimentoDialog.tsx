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
import { Loader2, Plus, X, FileText } from 'lucide-react'
import { createImplementacaoFromAtendimento, getColaboradores } from '@/services/implementacoes'
import type { Atendimento } from '@/services/atendimentos'
import { parseSolicitacao, mapTipoToImplantacaoTipo } from '@/lib/atendimento-utils'
import { toast } from 'sonner'

interface Props {
  open: boolean
  onOpenChange: (v: boolean) => void
  atendimento: Atendimento | null
  clienteId: string
  onSent: () => void
}

export function EnviarImplantacaoFromAtendimentoDialog({
  open,
  onOpenChange,
  atendimento,
  clienteId,
  onSent,
}: Props) {
  const [saving, setSaving] = useState(false)
  const [colaboradores, setColaboradores] = useState<any[]>([])
  const [tipo, setTipo] = useState<'novo_cliente' | 'inclusao_modulo' | 'treinamento'>(
    'novo_cliente',
  )
  const [responsavelId, setResponsavelId] = useState('')
  const [modulosNovos, setModulosNovos] = useState<string[]>([])
  const [treinamentoMotivo, setTreinamentoMotivo] = useState('')
  const [treinamentoTopicos, setTreinamentoTopicos] = useState('')
  const [treinamentoData, setTreinamentoData] = useState('')

  useEffect(() => {
    if (open && atendimento) {
      const parsed = parseSolicitacao(atendimento.solicitacao)
      const mappedTipo = parsed.tipo
        ? (mapTipoToImplantacaoTipo(parsed.tipo) as
            | 'novo_cliente'
            | 'inclusao_modulo'
            | 'treinamento')
        : 'novo_cliente'
      setTipo(mappedTipo)
      setResponsavelId('')
      setModulosNovos(parsed.modulo ? [parsed.modulo] : [''])
      setTreinamentoMotivo(atendimento.solicitacao || '')
      setTreinamentoTopicos(atendimento.relatorio || '')
      setTreinamentoData('')
      getColaboradores()
        .then((data) => setColaboradores(data || []))
        .catch(() => {})
    }
  }, [open, atendimento])

  const handleSubmit = async () => {
    if (!atendimento) return
    setSaving(true)
    try {
      await createImplementacaoFromAtendimento({
        atendimento_id: atendimento.id,
        cliente_id: clienteId,
        tipo,
        responsavel_id: responsavelId || null,
        modulos_novos: tipo === 'inclusao_modulo' ? modulosNovos.filter((m) => m.trim()) : [],
        treinamento_motivo: tipo === 'treinamento' ? treinamentoMotivo || null : null,
        treinamento_topicos: tipo === 'treinamento' ? treinamentoTopicos || null : null,
        treinamento_data: tipo === 'treinamento' ? treinamentoData || null : null,
      })
      toast.success('Solicitação enviada para a aba de Implantações com sucesso!')
      onOpenChange(false)
      onSent()
    } catch (error: any) {
      toast.error('Erro ao enviar para implantação: ' + (error.message || ''))
    } finally {
      setSaving(false)
    }
  }

  if (!atendimento) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Enviar para Implantação</DialogTitle>
          <DialogDescription>
            Converta esta solicitação de atendimento em uma implementação.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-2 max-h-[60vh] overflow-y-auto">
          <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 space-y-1">
            <div className="flex items-center gap-2 text-xs font-medium text-slate-500">
              <FileText className="h-3.5 w-3.5" />
              Solicitação
            </div>
            <p className="text-sm text-slate-700">{atendimento.solicitacao}</p>
            {atendimento.relatorio && (
              <p className="text-xs text-slate-500 mt-2">{atendimento.relatorio}</p>
            )}
          </div>

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
            <Label>Responsável (opcional)</Label>
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
            Enviar para Implantação
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
