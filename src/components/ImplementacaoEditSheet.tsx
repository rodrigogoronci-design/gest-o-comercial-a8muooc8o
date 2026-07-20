import { useState, useEffect, useCallback } from 'react'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
} from '@/components/ui/sheet'
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
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Loader2, Save, Plus, X } from 'lucide-react'
import {
  getImplementacao,
  getColaboradores,
  updateImplementacao,
  batchUpdateEtapas,
  updateClienteModulos,
} from '@/services/implementacoes'
import { parseModulosToList } from '@/lib/modules-parser'
import { toast } from 'sonner'

const IMPL_STATUS = ['Em andamento', 'Atrasada', 'Finalizada']
const ETAPA_STATUS = ['Não iniciada', 'Agendada', 'Em andamento', 'Concluída', 'Atrasada']

interface Props {
  open: boolean
  onOpenChange: (v: boolean) => void
  implementacaoId: string | null
  onSaved: () => void
}

export function ImplementacaoEditSheet({ open, onOpenChange, implementacaoId, onSaved }: Props) {
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [impl, setImpl] = useState<any>(null)
  const [colaboradores, setColaboradores] = useState<any[]>([])
  const [implStatus, setImplStatus] = useState('')
  const [responsavelId, setResponsavelId] = useState('')
  const [modules, setModules] = useState<string[]>([])
  const [stages, setStages] = useState<any[]>([])

  const loadData = useCallback(async () => {
    if (!implementacaoId) return
    setLoading(true)
    try {
      const [data, colabs] = await Promise.all([
        getImplementacao(implementacaoId),
        getColaboradores(),
      ])
      setImpl(data)
      setColaboradores(colabs)
      setImplStatus(data?.status || 'Em andamento')
      setResponsavelId(data?.responsavel_id || '')
      setModules(parseModulosToList(data?.clientes?.modulos))
      setStages(
        [...(data?.implementacao_etapas || [])]
          .sort((a: any, b: any) => a.ordem - b.ordem)
          .map((e: any) => ({ ...e })),
      )
    } catch {
      toast.error('Erro ao carregar implementação')
    } finally {
      setLoading(false)
    }
  }, [implementacaoId])

  useEffect(() => {
    if (open && implementacaoId) loadData()
  }, [open, implementacaoId, loadData])

  const updateStage = (id: string, field: string, value: string) =>
    setStages((prev) => prev.map((s) => (s.id === id ? { ...s, [field]: value } : s)))

  const handleSave = async () => {
    if (!impl) return
    setSaving(true)
    try {
      await updateImplementacao(impl.id, {
        status: implStatus,
        responsavel_id: responsavelId || null,
      })
      if (impl.cliente_id) {
        await updateClienteModulos(
          impl.cliente_id,
          modules.filter((m) => m.trim()),
        )
      }
      const updates = stages.map((s) => ({
        id: s.id,
        data: {
          titulo: s.titulo,
          data_prevista: s.data_prevista || null,
          data_realizada: s.data_realizada || null,
          status: s.status,
          observacoes: s.observacoes || null,
        },
      }))
      await batchUpdateEtapas(updates, impl.id)
      toast.success('Implementação atualizada com sucesso!')
      onOpenChange(false)
      onSaved()
    } catch (error: any) {
      toast.error('Erro ao salvar: ' + (error.message || ''))
    } finally {
      setSaving(false)
    }
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-2xl overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Editar Implementação</SheetTitle>
          <SheetDescription>{impl?.clientes?.nome || 'Carregando...'}</SheetDescription>
        </SheetHeader>
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
          </div>
        ) : (
          <div className="space-y-6 py-4">
            <div className="space-y-3">
              <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wider">
                Detalhes da Implementação
              </h3>
              <div className="space-y-2">
                <Label>Tipo de Implementação</Label>
                <Input
                  value={
                    impl?.tipo === 'inclusao_modulo'
                      ? 'Inclusão de Módulo'
                      : impl?.tipo === 'treinamento'
                        ? 'Treinamento'
                        : 'Novo Cliente'
                  }
                  disabled
                  className="bg-slate-50"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Status</Label>
                  <Select value={implStatus} onValueChange={setImplStatus}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {IMPL_STATUS.map((s) => (
                        <SelectItem key={s} value={s}>
                          {s}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Responsável</Label>
                  <Select value={responsavelId} onValueChange={setResponsavelId}>
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
              </div>
            </div>
            <Separator />
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wider">
                  Escopo Técnico (Módulos)
                </h3>
                <Button variant="outline" size="sm" onClick={() => setModules((p) => [...p, ''])}>
                  <Plus className="h-3 w-3 mr-1" /> Adicionar
                </Button>
              </div>
              <div className="space-y-2">
                {modules.map((mod, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <Input
                      value={mod}
                      onChange={(e) =>
                        setModules((p) => p.map((m, idx) => (idx === i ? e.target.value : m)))
                      }
                      placeholder="Nome do módulo"
                    />
                    <Button
                      variant="ghost"
                      size="icon"
                      className="shrink-0 text-red-500 hover:text-red-700"
                      onClick={() => setModules((p) => p.filter((_, idx) => idx !== i))}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
                {modules.length === 0 && (
                  <p className="text-sm text-muted-foreground">Nenhum módulo cadastrado.</p>
                )}
              </div>
            </div>
            <Separator />
            <div className="space-y-3">
              <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wider">
                Etapas de Implementação
              </h3>
              <div className="space-y-3">
                {stages.map((stage) => (
                  <div key={stage.id} className="rounded-lg border border-slate-200 p-3 space-y-2">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-xs shrink-0">
                        {stage.categoria}
                      </Badge>
                      <Input
                        value={stage.titulo}
                        onChange={(e) => updateStage(stage.id, 'titulo', e.target.value)}
                        className="h-8 text-sm font-medium"
                      />
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      <div>
                        <Label className="text-xs text-slate-500">Prevista</Label>
                        <Input
                          type="date"
                          value={stage.data_prevista || ''}
                          onChange={(e) => updateStage(stage.id, 'data_prevista', e.target.value)}
                          className="h-8 text-sm"
                        />
                      </div>
                      <div>
                        <Label className="text-xs text-slate-500">Realizada</Label>
                        <Input
                          type="date"
                          value={stage.data_realizada || ''}
                          onChange={(e) => updateStage(stage.id, 'data_realizada', e.target.value)}
                          className="h-8 text-sm"
                        />
                      </div>
                      <div>
                        <Label className="text-xs text-slate-500">Status</Label>
                        <Select
                          value={stage.status}
                          onValueChange={(v) => updateStage(stage.id, 'status', v)}
                        >
                          <SelectTrigger className="h-8 text-sm">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {ETAPA_STATUS.map((s) => (
                              <SelectItem key={s} value={s}>
                                {s}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <Textarea
                      value={stage.observacoes || ''}
                      onChange={(e) => updateStage(stage.id, 'observacoes', e.target.value)}
                      placeholder="Observações..."
                      className="text-xs min-h-[40px]"
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
        <SheetFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button
            onClick={handleSave}
            disabled={saving || loading}
            className="bg-indigo-600 hover:bg-indigo-700"
          >
            {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            <Save className="h-4 w-4 mr-2" />
            Salvar
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}
