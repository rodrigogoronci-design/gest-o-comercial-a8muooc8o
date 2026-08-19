import { useState, useEffect, useMemo } from 'react'
import { useParams, Link } from 'react-router-dom'
import {
  ArrowLeft,
  Loader2,
  MessageSquare,
  Clock,
  User,
  RefreshCw,
  Package,
  GraduationCap,
  Calendar,
  ClipboardList,
  FileText,
  LayoutDashboard,
  FolderOpen,
  Award,
  ListChecks,
  AlertCircle,
  Star,
} from 'lucide-react'
import { useUserRole } from '@/hooks/use-user-role'
import { getOrCreateOnboardingToken, generateOnboardingUrl } from '@/services/onboarding'
import { getOrCreateConsultoriaToken, generateConsultoriaUrl } from '@/services/consultoria'
import { ConsultoriaResponses } from '@/components/ConsultoriaResponses'
import { CollapsibleSection } from '@/components/collapsible-section'
import { SectionNav, type SectionNavItem } from '@/components/section-nav'
import { EtapaList, STATUS_CONFIG } from '@/components/etapa-list'
import { EtapaEditDialog } from '@/components/etapa-edit-dialog'
import { ImplementacaoObservacoes } from '@/components/ImplementacaoObservacoes'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Skeleton } from '@/components/ui/skeleton'
import {
  getImplementacao,
  getColaboradores,
  syncModulosToCliente,
  ensureTreinamentoEtapasForImpl,
} from '@/services/implementacoes'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { TreinamentoDetailsEditor } from '@/components/TreinamentoDetailsEditor'
import { TreinamentoEvaluationSection } from '@/components/TreinamentoEvaluationSection'
import { ContractedPlanDetails } from '@/components/ContractedPlanDetails'
import { DigitalCertificateField } from '@/components/DigitalCertificateField'
import { ImplementationDocumentRepository } from '@/components/ImplementationDocumentRepository'
import { getContractedModules } from '@/lib/scope-mapping'
import { getContractedModulesWithBasic } from '@/lib/plan-modules'
import { generateExecutionTitle } from '@/lib/atendimento-utils'
import { formatDateOnly } from '@/lib/formatters'

const TIPO_CONFIG: Record<string, { label: string; color: string }> = {
  novo_cliente: { label: 'Novo Cliente', color: 'bg-blue-50 text-blue-700 border-blue-200' },
  inclusao_modulo: {
    label: 'Inclusão de Módulo',
    color: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  },
  treinamento: { label: 'Treinamento', color: 'bg-violet-50 text-violet-700 border-violet-200' },
  consultoria: { label: 'Consultoria', color: 'bg-amber-50 text-amber-700 border-amber-200' },
}

export default function ImplementacaoDetailPage() {
  const { id } = useParams<{ id: string }>()
  const [impl, setImpl] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [loadError, setLoadError] = useState(false)
  const [editingEtapa, setEditingEtapa] = useState<any>(null)
  const [colaboradores, setColaboradores] = useState<any[]>([])
  const [syncingModulos, setSyncingModulos] = useState(false)
  const [sharingOnboarding, setSharingOnboarding] = useState(false)
  const [sharingConsultoria, setSharingConsultoria] = useState(false)
  const { isFinancialRestricted } = useUserRole()

  const isTrainingOnly = impl?.tipo === 'treinamento'

  const executionTitle = useMemo(() => {
    if (!impl) return 'Execução'
    return generateExecutionTitle(
      impl.tipo,
      impl.treinamento_motivo,
      impl.modulos_novos as string[] | null,
    )
  }, [impl])

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
      // Auto-correção: garante que todos os módulos contratados tenham etapa de
      // treinamento correspondente (para implementações já existentes).
      try {
        const added = await ensureTreinamentoEtapasForImpl(implId)
        if (added.length > 0) {
          toast.success(`${added.length} etapa(s) de treinamento adicionada(s) automaticamente.`)
        }
      } catch {
        // Falha na auto-correção não deve bloquear o carregamento da página.
      }

      const data = await getImplementacao(implId)
      setImpl(data)
    } catch {
      setLoadError(true)
      toast.error('Erro ao carregar implementação')
    } finally {
      setIsLoading(false)
    }
  }

  const HIDDEN_TREINAMENTO_ETAPAS = [
    'Levantamento de Necessidades',
    'Preparação de Material',
    'Termo de Encerramento',
  ]

  const etapasByCategoria = useMemo(() => {
    if (!impl?.implementacao_etapas) return {}
    const isTraining = impl?.tipo === 'treinamento'
    return [...impl.implementacao_etapas]
      .filter((e: any) => {
        if (!isTraining) return true
        return !HIDDEN_TREINAMENTO_ETAPAS.includes(e.titulo)
      })
      .sort((a: any, b: any) => a.ordem - b.ordem)
      .reduce((acc: Record<string, any[]>, e: any) => {
        if (!acc[e.categoria]) acc[e.categoria] = []
        acc[e.categoria].push(e)
        return acc
      }, {})
  }, [impl])

  const proximaEtapa = useMemo(() => {
    if (!impl?.implementacao_etapas) return null
    return (
      [...impl.implementacao_etapas]
        .sort((a: any, b: any) => a.ordem - b.ordem)
        .find((e: any) => e.status !== 'Concluída') || null
    )
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
    // Garante que o módulo básico apareça em TODAS as implementações, mesmo quando
    // o cliente/proposta não trazem módulos contratados explícitos.
    return getContractedModulesWithBasic(impl.clientes)
  }, [impl])

  const navItems = useMemo((): SectionNavItem[] => {
    if (!impl) return []
    if (impl.tipo === 'treinamento') {
      return [
        {
          id: 'detalhes-treinamento',
          label: 'Detalhes',
          icon: <GraduationCap className="h-3.5 w-3.5" />,
        },
        {
          id: 'execucao-treinamento',
          label: 'Execução',
          icon: <ListChecks className="h-3.5 w-3.5" />,
        },
        {
          id: 'avaliacao-treinamento',
          label: 'Avaliação',
          icon: <Star className="h-3.5 w-3.5" />,
        },
      ]
    }
    const items: SectionNavItem[] = [
      {
        id: 'visao-geral',
        label: 'Visão Geral',
        icon: <LayoutDashboard className="h-3.5 w-3.5" />,
      },
      { id: 'observacoes', label: 'Observações', icon: <MessageSquare className="h-3.5 w-3.5" /> },
    ]
    if (impl.tipo && impl.tipo !== 'novo_cliente') {
      const labels: Record<string, string> = {
        inclusao_modulo: 'Módulos',
        treinamento: 'Treinamento',
        consultoria: 'Consultoria',
      }
      items.push({
        id: 'detalhes-tipo',
        label: labels[impl.tipo] || 'Detalhes',
        icon: <Package className="h-3.5 w-3.5" />,
      })
    }
    if (impl.solicitacao_id) {
      items.push({
        id: 'solicitacao',
        label: 'Solicitação',
        icon: <FileText className="h-3.5 w-3.5" />,
      })
    }
    items.push({
      id: 'plano-contratado',
      label: 'Plano',
      icon: <ClipboardList className="h-3.5 w-3.5" />,
    })
    items.push({
      id: 'documentos',
      label: 'Documentos',
      icon: <FolderOpen className="h-3.5 w-3.5" />,
    })
    items.push({
      id: 'certificado-digital',
      label: 'Certificado',
      icon: <Award className="h-3.5 w-3.5" />,
    })
    if (impl.tipo === 'consultoria' && impl.consultoria_form_data) {
      items.push({
        id: 'consultoria-respostas',
        label: 'Respostas',
        icon: <ClipboardList className="h-3.5 w-3.5" />,
      })
    }
    items.push({ id: 'etapas', label: 'Etapas', icon: <ListChecks className="h-3.5 w-3.5" /> })
    return items
  }, [impl])

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
      const url = generateOnboardingUrl(token)
      const msg = encodeURIComponent(
        `Olá! Precisamos que você preencha a ficha de onboarding para iniciarmos a implantação. Acesse o link: ${url}`,
      )
      window.open(`https://wa.me/?text=${msg}`, '_blank', 'noopener,noreferrer')
    } catch (error: any) {
      toast.error('Erro ao gerar link de onboarding: ' + (error.message || ''))
    } finally {
      setSharingOnboarding(false)
    }
  }

  const handleShareConsultoria = async () => {
    if (!impl) return
    setSharingConsultoria(true)
    try {
      const token = await getOrCreateConsultoriaToken(impl.id)
      const url = generateConsultoriaUrl(token)
      const msg = encodeURIComponent(
        `Olá! Precisamos que você preencha o formulário de início da consultoria. Acesse o link: ${url}`,
      )
      window.open(`https://wa.me/?text=${msg}`, '_blank', 'noopener,noreferrer')
    } catch (error: any) {
      toast.error('Erro ao gerar link do formulário: ' + (error.message || ''))
    } finally {
      setSharingConsultoria(false)
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
    <div className="space-y-3">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link to="/implementacoes">
            <ArrowLeft className="h-5 w-5" />
          </Link>
        </Button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold tracking-tight">
            {impl.clientes?.nome || impl.cliente_nome}
          </h1>
          <p className="text-sm text-muted-foreground">
            {isTrainingOnly ? 'Solicitação de Treinamento' : 'Projeto de Implantação'}
          </p>
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
          {!isTrainingOnly &&
            (impl.tipo === 'consultoria' ? (
              <Button
                variant="outline"
                size="sm"
                onClick={handleShareConsultoria}
                disabled={sharingConsultoria}
                style={{ borderColor: '#25D366', color: '#25D366' }}
                className="hover:bg-[#25D366] hover:text-white"
              >
                {sharingConsultoria ? (
                  <Loader2 className="h-4 w-4 sm:mr-1.5 animate-spin" />
                ) : (
                  <MessageSquare className="h-4 w-4 sm:mr-1.5" />
                )}
                <span className="hidden sm:inline">Enviar Formulário</span>
              </Button>
            ) : (
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
            ))}
        </div>
      </div>

      <SectionNav items={navItems} />

      {isTrainingOnly ? (
        <>
          <CollapsibleSection
            id="detalhes-treinamento"
            title="Detalhes do Treinamento"
            icon={<GraduationCap className="h-4 w-4 text-violet-600" />}
            defaultOpen
          >
            <TreinamentoDetailsEditor
              implId={impl.id}
              treinamentoData={impl.treinamento_data}
              treinamentoHora={impl.treinamento_hora}
              treinamentoMotivo={impl.treinamento_motivo}
              treinamentoTopicos={impl.treinamento_topicos}
              clienteNome={impl.clientes?.nome || null}
              analistaNome={impl.colaboradores?.nome || null}
              onSaved={() => loadImpl(impl.id)}
            />
          </CollapsibleSection>

          <CollapsibleSection
            id="execucao-treinamento"
            title={executionTitle}
            icon={<ListChecks className="h-4 w-4 text-violet-600" />}
            defaultOpen
          >
            <div className="mb-3 p-3 rounded-lg bg-violet-50 border border-violet-200">
              <p className="text-xs text-violet-700 flex items-center gap-1.5">
                <AlertCircle className="h-3.5 w-3.5" />O RAT (Relatório de Atendimento Técnico) é
                obrigatório para concluir a etapa de execução do treinamento.
              </p>
            </div>
            <EtapaList
              etapasByCategoria={etapasByCategoria}
              colabMap={colabMap}
              contractedModules={contractedModules}
              onEditEtapa={setEditingEtapa}
            />
          </CollapsibleSection>

          <CollapsibleSection
            id="avaliacao-treinamento"
            title="Avaliação do Treinamento"
            icon={<Star className="h-4 w-4 text-violet-600" />}
          >
            <TreinamentoEvaluationSection
              implId={impl.id}
              clienteNome={impl.clientes?.nome || impl.cliente_nome || null}
              clienteEmail={impl.clientes?.email || null}
              treinamentoMotivo={impl.treinamento_motivo}
              modulosNovos={impl.modulos_novos as string[] | null}
              analistaNome={impl.colaboradores?.nome || null}
            />
          </CollapsibleSection>
        </>
      ) : (
        <>
          <CollapsibleSection
            id="visao-geral"
            title="Visão Geral"
            icon={<LayoutDashboard className="h-4 w-4 text-indigo-600" />}
            defaultOpen
          >
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
                      — Previsto para {formatDateOnly(proximaEtapa.data_prevista)}
                      {proximaEtapa.hora_prevista ? ` às ${proximaEtapa.hora_prevista}` : ''}
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
          </CollapsibleSection>

          <CollapsibleSection
            id="observacoes"
            title="Observações da Jornada"
            icon={<MessageSquare className="h-4 w-4 text-indigo-600" />}
            defaultOpen
          >
            <ImplementacaoObservacoes implementacaoId={impl.id} />
          </CollapsibleSection>

          {impl.tipo === 'inclusao_modulo' && (
            <CollapsibleSection
              id="detalhes-tipo"
              title={executionTitle}
              icon={<Package className="h-4 w-4 text-emerald-600" />}
            >
              <div className="space-y-4">
                <div className="flex items-center justify-between">
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
                    <span className="text-sm text-muted-foreground">
                      Nenhum módulo especificado.
                    </span>
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
              </div>
            </CollapsibleSection>
          )}

          {impl.tipo === 'treinamento' && (
            <CollapsibleSection
              id="detalhes-tipo"
              title="Detalhes do Treinamento"
              icon={<GraduationCap className="h-4 w-4 text-violet-600" />}
            >
              <div className="space-y-3">
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
                      {formatDateOnly(impl.treinamento_data)}
                      {impl.treinamento_hora && ` às ${impl.treinamento_hora}`}
                    </span>
                  </div>
                )}
              </div>
            </CollapsibleSection>
          )}

          {impl.tipo === 'consultoria' && (
            <CollapsibleSection
              id="detalhes-tipo"
              title="Detalhes da Consultoria"
              icon={<ClipboardList className="h-4 w-4 text-amber-600" />}
            >
              <div className="space-y-3">
                {impl.consultoria_titulo && (
                  <div className="flex items-start gap-2">
                    <span className="text-sm text-muted-foreground min-w-[100px]">Título:</span>
                    <span className="text-sm font-medium">{impl.consultoria_titulo}</span>
                  </div>
                )}
                {impl.consultoria_texto && (
                  <div className="flex items-start gap-2">
                    <span className="text-sm text-muted-foreground min-w-[100px]">Texto:</span>
                    <p className="text-sm whitespace-pre-wrap">{impl.consultoria_texto}</p>
                  </div>
                )}
                <p className="text-xs text-amber-600">
                  Service Logic | {impl.clientes?.nome || impl.cliente_nome || 'Cliente'}
                </p>
              </div>
            </CollapsibleSection>
          )}

          {impl.solicitacao_id && (
            <CollapsibleSection
              id="solicitacao"
              title="Solicitação de Serviço"
              icon={<FileText className="h-4 w-4 text-slate-600" />}
            >
              <div className="flex items-center gap-3 p-2">
                <FileText className="h-4 w-4 text-slate-400" />
                <span className="text-sm text-muted-foreground">Descrição:</span>
                <span className="text-sm font-medium">
                  {impl.solicitacoes_servico?.descricao || impl.solicitacao_id}
                </span>
              </div>
            </CollapsibleSection>
          )}

          <CollapsibleSection
            id="plano-contratado"
            title="Plano Contratado"
            icon={<ClipboardList className="h-4 w-4 text-indigo-600" />}
          >
            <ContractedPlanDetails
              proposta={impl.crm_propostas}
              cliente={impl.clientes}
              etapas={impl.implementacao_etapas}
              redactFinancial={isFinancialRestricted}
              dadosParametrizacao={impl.dados_parametrizacao}
              implementacaoId={impl.id}
            />
          </CollapsibleSection>

          <CollapsibleSection
            id="documentos"
            title="Documentos"
            icon={<FolderOpen className="h-4 w-4 text-indigo-600" />}
          >
            <ImplementationDocumentRepository
              implementacaoId={impl.id}
              dadosParametrizacao={impl.dados_parametrizacao}
            />
          </CollapsibleSection>

          <CollapsibleSection
            id="certificado-digital"
            title="Certificado Digital"
            icon={<Award className="h-4 w-4 text-indigo-600" />}
          >
            <DigitalCertificateField
              dadosParametrizacao={impl.dados_parametrizacao}
              implementacaoId={impl.id}
            />
          </CollapsibleSection>

          {impl.tipo === 'consultoria' && impl.consultoria_form_data && (
            <CollapsibleSection
              id="consultoria-respostas"
              title="Respostas da Consultoria"
              icon={<ClipboardList className="h-4 w-4 text-amber-600" />}
            >
              <ConsultoriaResponses data={impl.consultoria_form_data} />
            </CollapsibleSection>
          )}

          <CollapsibleSection
            id="etapas"
            title="Etapas de Implantação"
            icon={<ListChecks className="h-4 w-4 text-indigo-600" />}
            defaultOpen
          >
            <EtapaList
              etapasByCategoria={etapasByCategoria}
              colabMap={colabMap}
              contractedModules={contractedModules}
              onEditEtapa={setEditingEtapa}
            />
          </CollapsibleSection>
        </>
      )}

      <EtapaEditDialog
        etapa={editingEtapa}
        colaboradores={colaboradores}
        implId={impl.id}
        onClose={() => setEditingEtapa(null)}
        onSaved={() => loadImpl(impl.id)}
      />
    </div>
  )
}
