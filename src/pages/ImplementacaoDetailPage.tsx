import { useState, useEffect, useMemo } from 'react'
import { useParams, Link } from 'react-router-dom'
import { ArrowLeft, Upload, CheckCircle, Clock, AlertCircle, FileText, Loader2 } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
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
import {
  getImplementacao,
  updateEtapa,
  uploadRat,
  getColaboradores,
} from '@/services/implementacoes'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

const STATUS_CONFIG: Record<string, { color: string; icon: any }> = {
  'Não iniciada': { color: 'bg-slate-100 text-slate-600 border-slate-200', icon: Clock },
  Agendada: { color: 'bg-blue-50 text-blue-700 border-blue-200', icon: Clock },
  'Em andamento': { color: 'bg-amber-50 text-amber-700 border-amber-200', icon: AlertCircle },
  Concluída: { color: 'bg-emerald-50 text-emerald-700 border-emerald-200', icon: CheckCircle },
  Atrasada: { color: 'bg-red-50 text-red-700 border-red-200', icon: AlertCircle },
}

const CATEGORIA_ORDER = [
  'Pré-Implantação',
  'Ciclo de Treinamentos',
  'Operação Assistida',
  'Encerramento',
]

export default function ImplementacaoDetailPage() {
  const { id } = useParams<{ id: string }>()
  const [impl, setImpl] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [editingEtapa, setEditingEtapa] = useState<any>(null)
  const [colaboradores, setColaboradores] = useState<any[]>([])
  const [isSaving, setIsSaving] = useState(false)
  const [ratFile, setRatFile] = useState<File | null>(null)
  const [formData, setFormData] = useState<any>({})

  useEffect(() => {
    if (id) loadImpl(id)
    getColaboradores()
      .then(setColaboradores)
      .catch(() => {})
  }, [id])

  const loadImpl = async (implId: string) => {
    setIsLoading(true)
    try {
      const data = await getImplementacao(implId)
      setImpl(data)
    } catch (error) {
      console.error(error)
      toast.error('Erro ao carregar implementação')
    } finally {
      setIsLoading(false)
    }
  }

  const etapasByCategoria = useMemo(() => {
    if (!impl?.implementacao_etapas) return {}
    const sorted = [...impl.implementacao_etapas].sort((a: any, b: any) => a.ordem - b.ordem)
    const grouped: Record<string, any[]> = {}
    sorted.forEach((e: any) => {
      if (!grouped[e.categoria]) grouped[e.categoria] = []
      grouped[e.categoria].push(e)
    })
    return grouped
  }, [impl])

  const proximaEtapa = useMemo(() => {
    if (!impl?.implementacao_etapas) return null
    const sorted = [...impl.implementacao_etapas].sort((a: any, b: any) => a.ordem - b.ordem)
    return sorted.find((e: any) => e.status !== 'Concluída') || null
  }, [impl])

  const handleOpenEdit = (etapa: any) => {
    setEditingEtapa(etapa)
    setFormData({
      status: etapa.status,
      data_prevista: etapa.data_prevista || '',
      data_realizada: etapa.data_realizada || '',
      responsavel_id: etapa.responsavel_id || '',
      observacoes: etapa.observacoes || '',
      documento_url: etapa.documento_url || '',
    })
    setRatFile(null)
  }

  const handleSaveEtapa = async () => {
    if (!editingEtapa || !impl) return
    const isTreinamento = editingEtapa.titulo.toLowerCase().includes('treinamento')

    if (isTreinamento && formData.status === 'Concluída' && !formData.documento_url && !ratFile) {
      toast.error(
        'É obrigatório anexar o RAT (Relatório de Atendimento Técnico) para concluir treinamentos.',
      )
      return
    }

    setIsSaving(true)
    try {
      let docUrl = formData.documento_url || null
      if (ratFile) {
        docUrl = await uploadRat(ratFile, impl.id, editingEtapa.id)
      }

      await updateEtapa(editingEtapa.id, {
        status: formData.status,
        data_prevista: formData.data_prevista || null,
        data_realizada: formData.data_realizada || null,
        responsavel_id: formData.responsavel_id || null,
        observacoes: formData.observacoes || null,
        documento_url: docUrl,
      })

      toast.success('Etapa atualizada com sucesso!')
      setEditingEtapa(null)
      loadImpl(impl.id)
    } catch (error: any) {
      toast.error('Erro ao atualizar etapa: ' + (error.message || ''))
    } finally {
      setIsSaving(false)
    }
  }

  if (isLoading) {
    return <div className="flex items-center justify-center min-h-[400px]">Carregando...</div>
  }

  if (!impl) {
    return (
      <div className="text-center py-12 text-muted-foreground">Implementação não encontrada.</div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link to="/implementacoes">
            <ArrowLeft className="h-5 w-5" />
          </Link>
        </Button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold tracking-tight">{impl.clientes?.nome}</h1>
          <p className="text-sm text-muted-foreground">Projeto de Implantação</p>
        </div>
        <Badge variant="outline" className={cn('text-sm', STATUS_CONFIG[impl.status]?.color)}>
          {impl.status}
        </Badge>
      </div>

      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-medium text-slate-600">Progresso Geral</span>
            <span className="text-2xl font-bold text-indigo-600">{impl.progresso}%</span>
          </div>
          <Progress value={impl.progresso} className="h-3 mb-4" />
          {proximaEtapa && (
            <div className="flex items-center gap-2 text-sm">
              <Clock className="h-4 w-4 text-slate-400" />
              <span className="text-slate-500">Próxima atividade:</span>
              <span className="font-medium text-slate-800">{proximaEtapa.titulo}</span>
              {proximaEtapa.data_prevista && (
                <span className="text-slate-400">
                  — {new Date(proximaEtapa.data_prevista).toLocaleDateString('pt-BR')}
                </span>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {CATEGORIA_ORDER.map((categoria) => {
        const etapas = etapasByCategoria[categoria]
        if (!etapas || etapas.length === 0) return null
        return (
          <div key={categoria}>
            <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wider mb-3">
              {categoria}
            </h3>
            <div className="space-y-2">
              {etapas.map((etapa: any) => {
                const config = STATUS_CONFIG[etapa.status] || STATUS_CONFIG['Não iniciada']
                const Icon = config.icon
                return (
                  <Card
                    key={etapa.id}
                    className="hover:shadow-md transition-shadow cursor-pointer"
                    onClick={() => handleOpenEdit(etapa)}
                  >
                    <CardContent className="p-4 flex items-center gap-4">
                      <div className={cn('p-2 rounded-full', config.color)}>
                        <Icon className="h-4 w-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-sm text-slate-800">{etapa.titulo}</span>
                          {etapa.titulo.toLowerCase().includes('treinamento') && (
                            <Badge
                              variant="secondary"
                              className="text-[9px] bg-violet-50 text-violet-700"
                            >
                              RAT
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-3 mt-1 text-xs text-slate-500">
                          {etapa.data_prevista && (
                            <span>
                              Prev: {new Date(etapa.data_prevista).toLocaleDateString('pt-BR')}
                            </span>
                          )}
                          {etapa.data_realizada && (
                            <span className="text-emerald-600">
                              Concluído:{' '}
                              {new Date(etapa.data_realizada).toLocaleDateString('pt-BR')}
                            </span>
                          )}
                          {etapa.documento_url && (
                            <a
                              href={etapa.documento_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-600 hover:underline flex items-center gap-1"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <FileText className="h-3 w-3" /> RAT
                            </a>
                          )}
                        </div>
                      </div>
                      <Badge variant="outline" className={cn('text-xs', config.color)}>
                        {etapa.status}
                      </Badge>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          </div>
        )
      })}

      <Dialog open={!!editingEtapa} onOpenChange={(open) => !open && setEditingEtapa(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editingEtapa?.titulo}</DialogTitle>
            <DialogDescription>Atualize o status e detalhes desta etapa.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Status</Label>
              <Select
                value={formData.status}
                onValueChange={(v) => setFormData({ ...formData, status: v })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Não iniciada">Não iniciada</SelectItem>
                  <SelectItem value="Agendada">Agendada</SelectItem>
                  <SelectItem value="Em andamento">Em andamento</SelectItem>
                  <SelectItem value="Concluída">Concluída</SelectItem>
                  <SelectItem value="Atrasada">Atrasada</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Data Prevista</Label>
                <Input
                  type="date"
                  value={formData.data_prevista}
                  onChange={(e) => setFormData({ ...formData, data_prevista: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Data Realizada</Label>
                <Input
                  type="date"
                  value={formData.data_realizada}
                  onChange={(e) => setFormData({ ...formData, data_realizada: e.target.value })}
                />
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
            {editingEtapa?.titulo.toLowerCase().includes('treinamento') && (
              <div className="space-y-2">
                <Label className="flex items-center gap-1">
                  <FileText className="h-3 w-3" /> RAT - Relatório de Atendimento Técnico
                </Label>
                <Input type="file" onChange={(e) => setRatFile(e.target.files?.[0] || null)} />
                {formData.documento_url && !ratFile && (
                  <a
                    href={formData.documento_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-blue-600 hover:underline"
                  >
                    Ver documento atual
                  </a>
                )}
                <p className="text-xs text-amber-600">Obrigatório para concluir treinamentos.</p>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingEtapa(null)}>
              Cancelar
            </Button>
            <Button
              onClick={handleSaveEtapa}
              disabled={isSaving}
              className="bg-indigo-600 hover:bg-indigo-700"
            >
              {isSaving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Salvar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
