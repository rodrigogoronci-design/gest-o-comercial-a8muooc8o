import { useState, useEffect, useMemo } from 'react'
import { useParams, Link } from 'react-router-dom'
import {
  ArrowLeft,
  Upload,
  CheckCircle,
  Clock,
  AlertCircle,
  FileText,
  Loader2,
  Rocket,
  User,
  RefreshCw,
  Package,
  GraduationCap,
  Calendar,
  MessageSquare,
} from 'lucide-react'
import { useUserRole } from '@/hooks/use-user-role'
import { getOrCreateOnboardingToken, generateOnboardingUrl } from '@/services/onboarding'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Skeleton } from '@/components/ui/skeleton'
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
  syncModulosToCliente,
} from '@/services/implementacoes'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { ContractedPlanDetails } from '@/components/ContractedPlanDetails'
import { ParametrizacaoSection } from '@/components/ParametrizacaoSection'
import { ImplementationDocumentRepository } from '@/components/ImplementationDocumentRepository'
import { getContractedModules, isStageRelatedToModules } from '@/lib/scope-mapping'

const STATUS_CONFIG: Record<string, { color: string; icon: any }> = {
  'Não iniciada': { color: 'bg-slate-100 text-slate-600 border-slate-200', icon: Clock },
  Agendada: { color: 'bg-blue-50 text-blue-700 border-blue-200', icon: Clock },
  'Em andamento': { color: 'bg-amber-50 text-amber-700 border-amber-200', icon: AlertCircle },
  Concluída: { color: 'bg-emerald-50 text-emerald-700 border-emerald-200', icon: CheckCircle },
  Atrasada: { color: 'bg-red-50 text-red-700 border-red-200', icon: AlertCircle },
  onboarding_recebido: {
    color: 'bg-indigo-50 text-indigo-700 border-indigo-200',
    icon: CheckCircle,
  },
  onboarding_completed: {
    color: 'bg-indigo-50 text-indigo-700 border-indigo-200',
    icon: CheckCircle,
  },
  Finalizada: { color: 'bg-emerald-50 text-emerald-700 border-emerald-200', icon: CheckCircle },
}

const STATUS_OPTIONS = ['Não iniciada', 'Agendada', 'Em andamento', 'Concluída', 'Atrasada']

const TIPO_CONFIG: Record<string, { label: string; color: string }> = {
  novo_cliente: { label: 'Novo Cliente', color: 'bg-blue-50 text-blue-700 border-blue-200' },
  inclusao_modulo: {
    label: 'Inclusão de Módulo',
    color: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  },
  treinamento: { label: 'Treinamento', color: 'bg-violet-50 text-violet-700 border-violet-200' },
}

const CATEGORIA_ORDER = [
  'Pré-Implantação',
  'Implantação Inicial',
  'Análise',
  'Configuração',
  'Preparação',
  'Agendamento',
  'Ciclo de Treinamentos',
  'Treinamento',
  'Execução',
  'Implantação Operacional',
  'Validação',
  'Encerramento',
]

function todayStr() {
  return new Date().toISOString().split('T')[0]
}

export default function ImplementacaoDetailPage() {
  const { id } = useParams<{ id: string }>()
  const [impl, setImpl] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [loadError, setLoadError] = useState(false)
  const [editingEtapa, setEditingEtapa] = useState<any>(null)
  const [colaboradores, setColaboradores] = useState<any[]>([])
  const [isSaving, setIsSaving] = useState(false)
  const [syncingModulos, setSyncingModulos] = useState(false)
  const [ratFile, setRatFile] = useState<File | null>(null)
  const [formData, setFormData] = useState<any>({})
  const [sharingOnboarding, setSharingOnboarding] = useState(false)
  const { isFinancialRestricted } = useUserRole()

  useEffect(() => {
    if (id) loadImpl(id)
    getColaboradores()
      .then(setColaboradores)
      .catch(() => {})
  }, [id])

  const loadImpl = async (implId: string) => {
    setIsLoading(true)
    setLoadError(false)
    try {
      const data = await getImplementacao(implId)
      setImpl(data)
    } catch (error) {
      console.error(error)
      setLoadError(true)
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

  const colabMap = useMemo(() => {
    const map: Record<string, string> = {}
    colaboradores.forEach((c) => {
      map[c.id] = c.nome
    })
    return map
  }, [colaboradores])

  const contractedModules = useMemo(() => {
    if (!impl) return []
    return getContractedModules(impl.clientes, impl.crm_propostas)
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

  const isTreinamentoEtapa = useMemo(() => {
    return editingEtapa?.categoria === 'Ciclo de Treinamentos'
  }, [editingEtapa])

  const canConcluir = useMemo(() => {
    if (!isTreinamentoEtapa) return true
    return !!formData.documento_url || !!ratFile
  }, [isTreinamentoEtapa, formData.documento_url, ratFile])

  const handleStatusChange = (v: string) => {
    const updates: any = { ...formData, status: v }
    if (v === 'Concluída' && !updates.data_realizada) {
      updates.data_realizada = todayStr()
    }
    setFormData(updates)
  }

  const handleSaveEtapa = async () => {
    if (!editingEtapa || !impl) return

    if (
      isTreinamentoEtapa &&
      formData.status === 'Concluída' &&
      !formData.documento_url &&
      !ratFile
    ) {
      toast.error(
        'A etapa somente poderá ser marcada como Concluída após existir um documento anexado.',
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

  const handleSyncModulos = async () => {
    if (!impl) return
    setSyncingModulos(true)
    try {
      const merged = await syncModulosToCliente(impl.id)
      toast.success(`${merged.length} módulos sincronizados com o cliente!`)
      loadImpl(impl.id)
    } catch (error: any) {
      toast.error('Erro ao sincronizar módulos: ' + (error.message || ''))
    } finally {
      setSyncingModulos(false)
    }
  }

  const handleShareWhatsapp = async () => {
    if (!impl) return
    setSharingOnboarding(true)
    try {
      const token = await getOrCreateOnboardingToken(impl.id)
      const onboardingUrl = generateOnboardingUrl(token)
      const message = encodeURIComponent(
        `Olá! Precisamos que você preencha a ficha de onboarding para iniciarmos a implantação. Acesse o link: ${onboardingUrl}`,
      )
      window.open(`https://wa.me/?text=${message}`, '_blank', 'noopener,noreferrer')
    } catch (error: any) {
      toast.error('Erro ao gerar link de onboarding: ' + (error.message || ''))
    } finally {
      setSharingOnboarding(false)
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Skeleton className="h-10 w-10 rounded-lg" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-7 w-64" />
            <Skeleton className="h-4 w-40" />
          </div>
          <Skeleton className="h-6 w-24" />
        </div>
        <Card>
          <CardContent className="p-6 space-y-4">
            <div className="flex items-center justify-between">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-8 w-12" />
            </div>
            <Skeleton className="h-3 w-full" />
            <Skeleton className="h-4 w-72" />
          </CardContent>
        </Card>
        {[1, 2, 3].map((i) => (
          <div key={i} className="space-y-2">
            <Skeleton className="h-4 w-40" />
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-16 w-full" />
          </div>
        ))}
      </div>
    )
  }

  if (loadError || !impl) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
        <div className="flex items-center justify-center w-16 h-16 rounded-full bg-slate-100">
          <AlertCircle className="h-8 w-8 text-slate-400" />
        </div>
        <div className="text-center">
          <p className="text-lg font-medium text-slate-700">
            {loadError ? 'Erro ao carregar implementação' : 'Implementação não encontrada'}
          </p>
          <p className="text-sm text-muted-foreground mt-1">
            {loadError
              ? 'Ocorreu um erro ao carregar os dados. Tente novamente.'
              : 'A implementação solicitada pode ter sido removida ou o ID é inválido.'}
          </p>
        </div>
        <div className="flex gap-2">
          {loadError && id && (
            <Button onClick={() => loadImpl(id)} className="bg-indigo-600 hover:bg-indigo-700">
              Tentar Novamente
            </Button>
          )}
          <Button asChild variant="outline">
            <Link to="/implementacoes">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Voltar para lista
            </Link>
          </Button>
        </div>
      </div>
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
        <div className="flex items-center gap-2">
          {impl.tipo && impl.tipo !== 'novo_cliente' && (
            <Badge variant="outline" className={cn('text-sm', TIPO_CONFIG[impl.tipo]?.color)}>
              {TIPO_CONFIG[impl.tipo]?.label || impl.tipo}
            </Badge>
          )}
          <Badge variant="outline" className={cn('text-sm', STATUS_CONFIG[impl.status]?.color)}>
            {impl.status}
          </Badge>
          <Button
            variant="outline"
            size="sm"
            onClick={handleShareWhatsapp}
            disabled={sharingOnboarding}
            style={{ borderColor: '#25D366', color: '#25D366' }}
            className="hover:bg-[#25D366] hover:text-white"
          >
            {sharingOnboarding ? (
              <Loader2 className="h-4 w-4 sm:mr-1.5 animate-spin" />
            ) : (
              <MessageSquare className="h-4 w-4 sm:mr-1.5" />
            )}
            <span className="hidden sm:inline">Enviar via WhatsApp</span>
          </Button>
        </div>
      </div>

      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-medium text-slate-600">Progresso Geral</span>
            <span className="text-2xl font-bold text-indigo-600">{impl.progresso}%</span>
          </div>
          <Progress value={impl.progresso} className="h-3 mb-4" />
          <div className="flex flex-wrap items-center gap-4 text-sm">
            {proximaEtapa && (
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-slate-400" />
                <span className="text-slate-500">Próxima atividade:</span>
                <span className="font-medium text-slate-800">{proximaEtapa.titulo}</span>
                {proximaEtapa.data_prevista && (
                  <span className="text-slate-400">
                    — Previsto para{' '}
                    {new Date(proximaEtapa.data_prevista).toLocaleDateString('pt-BR')}
                  </span>
                )}
              </div>
            )}
            {impl.colaboradores?.nome && (
              <div className="flex items-center gap-2">
                <User className="h-4 w-4 text-slate-400" />
                <span className="text-slate-500">Analista:</span>
                <span className="font-medium text-slate-800">{impl.colaboradores.nome}</span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {impl.tipo === 'inclusao_modulo' && (
        <Card>
          <CardContent className="p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wider flex items-center gap-2">
                <Package className="h-4 w-4 text-emerald-600" />
                Módulos em Inclusão
              </h3>
              <Button
                size="sm"
                variant="outline"
                onClick={handleSyncModulos}
                disabled={syncingModulos}
                className="border-emerald-300 text-emerald-700 hover:bg-emerald-50"
              >
                {syncingModulos ? (
                  <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                ) : (
                  <RefreshCw className="h-3 w-3 mr-1" />
                )}
                Sincronizar com Cliente
              </Button>
            </div>
            <div className="flex flex-wrap gap-2">
              {(impl.modulos_novos || []).length === 0 ? (
                <span className="text-sm text-muted-foreground">Nenhum módulo especificado.</span>
              ) : (
                (impl.modulos_novos as string[]).map((mod, i) => (
                  <Badge key={i} variant="secondary" className="bg-emerald-50 text-emerald-700">
                    {mod}
                  </Badge>
                ))
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              A sincronização adiciona estes módulos ao perfil do cliente. Use com cautela para
              evitar substituições acidentais.
            </p>
          </CardContent>
        </Card>
      )}

      {impl.tipo === 'treinamento' && (
        <Card>
          <CardContent className="p-6 space-y-3">
            <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wider flex items-center gap-2">
              <GraduationCap className="h-4 w-4 text-violet-600" />
              Detalhes do Treinamento
            </h3>
            {impl.treinamento_motivo && (
              <div className="flex items-start gap-2">
                <span className="text-sm text-muted-foreground min-w-[100px]">Motivo:</span>
                <span className="text-sm font-medium">{impl.treinamento_motivo}</span>
              </div>
            )}
            {impl.treinamento_topicos && (
              <div className="flex items-start gap-2">
                <span className="text-sm text-muted-foreground min-w-[100px]">Tópicos:</span>
                <span className="text-sm font-medium">{impl.treinamento_topicos}</span>
              </div>
            )}
            {impl.treinamento_data && (
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-slate-400" />
                <span className="text-sm text-muted-foreground">Data agendada:</span>
                <span className="text-sm font-medium">
                  {new Date(impl.treinamento_data).toLocaleDateString('pt-BR')}
                </span>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {impl.solicitacao_id && (
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <FileText className="h-4 w-4 text-slate-400" />
            <span className="text-sm text-muted-foreground">Solicitação de serviço vinculada:</span>
            <span className="text-sm font-medium">
              {impl.solicitacoes_servico?.descricao || impl.solicitacao_id}
            </span>
          </CardContent>
        </Card>
      )}

      <ContractedPlanDetails
        proposta={impl.crm_propostas}
        cliente={impl.clientes}
        etapas={impl.implementacao_etapas}
        redactFinancial={isFinancialRestricted}
      />

      <ImplementationDocumentRepository
        implementacaoId={impl.id}
        dadosParametrizacao={impl.dados_parametrizacao}
      />

      <div className="space-y-4">
        <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wider">
          Parametrização do Sistema
        </h3>
        <ParametrizacaoSection implementacaoId={impl.id} dados={impl.dados_parametrizacao} />
      </div>

      {CATEGORIA_ORDER.map((categoria) => {
        const etapas = etapasByCategoria[categoria]
        if (!etapas || etapas.length === 0) return null
        const concludedCount = etapas.filter((e: any) => e.status === 'Concluída').length
        return (
          <div key={categoria}>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wider">
                {categoria}
              </h3>
              <span className="text-xs text-slate-500">
                {concludedCount}/{etapas.length} concluídas
              </span>
            </div>
            <div className="space-y-2">
              {etapas.map((etapa: any) => {
                const config = STATUS_CONFIG[etapa.status] || STATUS_CONFIG['Não iniciada']
                const Icon = config.icon
                const responsavelNome = etapa.responsavel_id
                  ? colabMap[etapa.responsavel_id] || null
                  : null
                const isScopeRelated = isStageRelatedToModules(etapa.titulo, contractedModules)
                return (
                  <Card
                    key={etapa.id}
                    className={cn(
                      'hover:shadow-md transition-shadow cursor-pointer',
                      isScopeRelated && 'border-l-4 border-l-indigo-400',
                    )}
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
                          {isScopeRelated && (
                            <Badge
                              variant="secondary"
                              className="text-[9px] bg-indigo-50 text-indigo-700"
                            >
                              Escopo
                            </Badge>
                          )}
                        </div>
                        <div className="flex flex-wrap items-center gap-3 mt-1 text-xs text-slate-500">
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
                          {responsavelNome && (
                            <span className="flex items-center gap-1">
                              <User className="h-3 w-3" />
                              {responsavelNome}
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
              <Select value={formData.status} onValueChange={handleStatusChange}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {STATUS_OPTIONS.map((status) => {
                    const isDisabled = status === 'Concluída' && !canConcluir
                    return (
                      <SelectItem key={status} value={status} disabled={isDisabled}>
                        {status}
                        {isDisabled && ' (requer RAT)'}
                      </SelectItem>
                    )
                  })}
                </SelectContent>
              </Select>
              {isTreinamentoEtapa && !canConcluir && (
                <p className="text-xs text-amber-600 flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" />A etapa somente poderá ser marcada como
                  Concluída após existir um documento anexado.
                </p>
              )}
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
            {isTreinamentoEtapa && (
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
