import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import {
  ArrowLeft,
  Loader2,
  MessageSquare,
  Save,
  Building2,
  FileCheck,
  Clock,
  FileText,
} from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Skeleton } from '@/components/ui/skeleton'
import {
  getConsultoria,
  updateConsultoria,
  type ConsultoriaProject,
} from '@/services/consultoria-crm'
import { getOrCreateConsultoriaToken, generateConsultoriaUrl } from '@/services/consultoria'
import { ConsultoriaResponses } from '@/components/ConsultoriaResponses'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { SectionNav, type SectionNavItem } from '@/components/section-nav'
import { CollapsibleSection } from '@/components/collapsible-section'

const STATUS_COLORS: Record<string, string> = {
  'Em andamento': 'bg-blue-50 text-blue-700 border-blue-200',
  consultoria_recebido: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  consultoria_completed: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  Finalizada: 'bg-slate-50 text-slate-700 border-slate-200',
}

export default function CrmConsultoriaDetailPage() {
  const { id } = useParams<{ id: string }>()
  const [project, setProject] = useState<ConsultoriaProject | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [loadError, setLoadError] = useState(false)
  const [titulo, setTitulo] = useState('')
  const [texto, setTexto] = useState('')
  const [saving, setSaving] = useState(false)
  const [sharing, setSharing] = useState(false)

  const loadProject = async () => {
    if (!id) return
    setIsLoading(true)
    setLoadError(false)
    try {
      const data = await getConsultoria(id)
      if (!data) {
        setLoadError(true)
      } else {
        setProject(data)
        setTitulo(data.consultoria_titulo || '')
        setTexto(data.consultoria_texto || '')
      }
    } catch {
      setLoadError(true)
      toast.error('Erro ao carregar consultoria')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadProject()
  }, [id])

  const handleSaveTexts = async () => {
    if (!id) return
    setSaving(true)
    try {
      await updateConsultoria(id, { consultoria_titulo: titulo, consultoria_texto: texto })
      toast.success('Informações atualizadas!')
    } catch (error: any) {
      toast.error('Erro ao salvar: ' + (error.message || ''))
    } finally {
      setSaving(false)
    }
  }

  const handleShareWhatsapp = async () => {
    if (!id) return
    setSharing(true)
    try {
      const token = await getOrCreateConsultoriaToken(id)
      const url = generateConsultoriaUrl(token)
      const message = encodeURIComponent(
        `Olá! Precisamos que você preencha o formulário de início da consultoria. Acesse o link: ${url}`,
      )
      window.open(`https://wa.me/?text=${message}`, '_blank', 'noopener,noreferrer')
    } catch (error: any) {
      toast.error('Erro ao gerar link: ' + (error.message || ''))
    } finally {
      setSharing(false)
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-4 w-40" />
        <Card>
          <CardContent className="p-6 space-y-4">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-24 w-full" />
          </CardContent>
        </Card>
      </div>
    )
  }

  if (loadError || !project) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
        <p className="text-lg font-medium text-slate-700">Consultoria não encontrada</p>
        <Button asChild variant="outline">
          <Link to="/crm/consultoria">
            <ArrowLeft className="h-4 w-4 mr-2" /> Voltar para lista
          </Link>
        </Button>
      </div>
    )
  }

  const projectName = `Service Logic | ${project.clientes?.nome || 'N/A'}`
  const hasResponses =
    project.consultoria_form_data && Object.keys(project.consultoria_form_data).length > 0

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link to="/crm/consultoria">
            <ArrowLeft className="h-5 w-5" />
          </Link>
        </Button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold tracking-tight">{projectName}</h1>
          <p className="text-sm text-muted-foreground flex items-center gap-1.5 mt-0.5">
            <Building2 className="h-3.5 w-3.5" />
            {project.clientes?.nome || 'N/A'}
            {project.clientes?.cnpj && ` — ${project.clientes.cnpj}`}
          </p>
        </div>
        <Badge variant="outline" className={cn('text-sm', STATUS_COLORS[project.status] || '')}>
          {project.status}
        </Badge>
        <Button
          variant="outline"
          size="sm"
          onClick={handleShareWhatsapp}
          disabled={sharing}
          style={{ borderColor: '#25D366', color: '#25D366' }}
          className="hover:bg-[#25D366] hover:text-white"
        >
          {sharing ? (
            <Loader2 className="h-4 w-4 sm:mr-1.5 animate-spin" />
          ) : (
            <MessageSquare className="h-4 w-4 sm:mr-1.5" />
          )}
          <span className="hidden sm:inline">Enviar Formulário ao Cliente</span>
        </Button>
      </div>

      <SectionNav
        items={[
          { id: 'formulario', label: 'Formulário', icon: <FileText className="h-3.5 w-3.5" /> },
          { id: 'status', label: 'Status', icon: <Clock className="h-3.5 w-3.5" /> },
          ...(hasResponses
            ? [{ id: 'respostas', label: 'Respostas', icon: <FileCheck className="h-3.5 w-3.5" /> }]
            : []),
        ]}
      />

      <CollapsibleSection
        id="formulario"
        title="Editar Formulário"
        icon={<FileText className="h-4 w-4 text-amber-600" />}
        defaultOpen
      >
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wider">
              Editar Formulário
            </h3>
            <Button
              size="sm"
              onClick={handleSaveTexts}
              disabled={saving}
              className="bg-amber-600 hover:bg-amber-700"
            >
              {saving ? (
                <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" />
              ) : (
                <Save className="h-3.5 w-3.5 mr-1" />
              )}
              Salvar
            </Button>
          </div>
          <div className="space-y-2">
            <Label>Título do Formulário</Label>
            <Input value={titulo} onChange={(e) => setTitulo(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Texto Introdutório</Label>
            <Textarea value={texto} onChange={(e) => setTexto(e.target.value)} rows={5} />
          </div>
          <p className="text-xs text-muted-foreground">
            O nome da empresa (Service Logic | Cliente) é gerado automaticamente. Estes textos são
            exibidos no formulário enviado ao cliente.
          </p>
        </div>
      </CollapsibleSection>

      <CollapsibleSection
        id="status"
        title="Status das Respostas"
        icon={<Clock className="h-4 w-4 text-amber-600" />}
      >
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            {hasResponses ? (
              <div className="flex items-center gap-2 text-emerald-600">
                <FileCheck className="h-5 w-5" />
                <span className="font-medium">Formulário preenchido e recebido</span>
              </div>
            ) : (
              <div className="flex items-center gap-2 text-slate-400">
                <Clock className="h-5 w-5" />
                <span className="font-medium">Aguardando preenchimento do formulário</span>
              </div>
            )}
          </div>
        </div>
      </CollapsibleSection>

      {hasResponses && project.consultoria_form_data && (
        <CollapsibleSection
          id="respostas"
          title="Respostas da Consultoria"
          icon={<FileCheck className="h-4 w-4 text-amber-600" />}
          defaultOpen
        >
          <ConsultoriaResponses data={project.consultoria_form_data} />
        </CollapsibleSection>
      )}
    </div>
  )
}
