import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Rocket, Eye, Pencil, Lock, Plus, Package, GraduationCap } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Input } from '@/components/ui/input'
import { getImplementacoes } from '@/services/implementacoes'
import { TIPO_CONFIG } from '@/lib/implantacao-config'
import { ImplementacaoEditSheet } from '@/components/ImplementacaoEditSheet'
import { ImplementacaoCreateDialog } from '@/components/ImplementacaoCreateDialog'
import { useAuth } from '@/hooks/use-auth'
import { useUserRole } from '@/hooks/use-user-role'
import { supabase } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

const TIPO_ICONS: Record<string, any> = {
  novo_cliente: Rocket,
  inclusao_modulo: Package,
  treinamento: GraduationCap,
}

export default function ImplementacoesPage() {
  const [implementacoes, setImplementacoes] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [filter, setFilter] = useState<string>('all')
  const [tipoFilter, setTipoFilter] = useState<string>('all')
  const [searchTerm, setSearchTerm] = useState('')
  const [currentColabId, setCurrentColabId] = useState<string | null>(null)
  const [editId, setEditId] = useState<string | null>(null)
  const [editOpen, setEditOpen] = useState(false)
  const [createOpen, setCreateOpen] = useState(false)
  const [sortField, setSortField] = useState<'progresso' | 'data_prevista' | null>(null)
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc')
  const { user } = useAuth()
  const { isFinancialRestricted } = useUserRole()

  useEffect(() => {
    if (user?.id) {
      supabase
        .from('colaboradores')
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle()
        .then(({ data }) => setCurrentColabId(data?.id || null))
    }
  }, [user])

  useEffect(() => {
    loadImplementacoes()
  }, [])

  const loadImplementacoes = async () => {
    setIsLoading(true)
    try {
      const data = await getImplementacoes()
      setImplementacoes(data)
    } catch (error) {
      console.error(error)
      toast.error('Erro ao carregar implementações')
    } finally {
      setIsLoading(false)
    }
  }

  const getEtapaAtual = (impl: any) => {
    const etapas = (impl.implementacao_etapas || []).sort((a: any, b: any) => a.ordem - b.ordem)
    const atual = etapas.find((e: any) => e.status !== 'Concluída')
    return atual?.titulo || 'Concluída'
  }

  const getPrevisaoConclusao = (impl: any) => {
    const etapas = impl.implementacao_etapas || []
    if (etapas.length === 0) return ''
    return etapas.reduce((max: string, e: any) => {
      return e.data_prevista && (!max || e.data_prevista > max) ? e.data_prevista : max
    }, '')
  }

  const handleSort = (field: 'progresso' | 'data_prevista') => {
    if (sortField === field) {
      setSortDir(sortDir === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortDir('asc')
    }
  }

  const filtered = implementacoes
    .filter((impl) => {
      if (filter === 'mine') return impl.responsavel_id === currentColabId
      if (filter === 'all') return true
      return impl.status === filter
    })
    .filter((impl) => {
      if (tipoFilter === 'all') return true
      return (impl.tipo || 'novo_cliente') === tipoFilter
    })
    .filter((impl) => {
      const nome = impl.clientes?.nome || ''
      return nome.toLowerCase().includes(searchTerm.toLowerCase())
    })
    .sort((a, b) => {
      if (!sortField) {
        const sigA = a.clientes?.data_assinatura || ''
        const sigB = b.clientes?.data_assinatura || ''
        if (sigA === sigB) {
          return (b.created_at || '').localeCompare(a.created_at || '')
        }
        return sigB.localeCompare(sigA)
      }
      let cmp = 0
      if (sortField === 'progresso') {
        cmp = (a.progresso || 0) - (b.progresso || 0)
      } else {
        const dateA = getPrevisaoConclusao(a)
        const dateB = getPrevisaoConclusao(b)
        cmp = dateA.localeCompare(dateB)
      }
      return sortDir === 'asc' ? cmp : -cmp
    })

  const statusColors: Record<string, string> = {
    'Em andamento': 'bg-blue-50 text-blue-700 border-blue-200',
    Atrasada: 'bg-red-50 text-red-700 border-red-200',
    Finalizada: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    onboarding_recebido: 'bg-indigo-50 text-indigo-700 border-indigo-200',
    onboarding_completed: 'bg-indigo-50 text-indigo-700 border-indigo-200',
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <Rocket className="h-8 w-8 text-indigo-600" />
            Implantações
          </h1>
          <p className="text-muted-foreground mt-1">
            Acompanhe o progresso dos projetos de implantação, inclusões de módulos e treinamentos.
          </p>
          {isFinancialRestricted && (
            <div className="mt-3 flex items-center gap-2 py-2 px-3 rounded-lg bg-amber-50 border border-amber-200 max-w-fit">
              <Lock className="h-4 w-4 text-amber-600 shrink-0" />
              <span className="text-xs text-amber-700 font-medium">
                Seu perfil de acesso restringe a visualização de dados financeiros.
              </span>
            </div>
          )}
        </div>
        <Button onClick={() => setCreateOpen(true)} className="bg-indigo-600 hover:bg-indigo-700">
          <Plus className="h-4 w-4 mr-2" />
          Nova Implementação
        </Button>
      </div>

      <div className="flex flex-wrap gap-2 items-center">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Input
            placeholder="Buscar por cliente..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex gap-1 flex-wrap">
          {[
            { key: 'all', label: 'Todas' },
            { key: 'Em andamento', label: 'Em andamento' },
            { key: 'Atrasada', label: 'Atrasadas' },
            { key: 'Finalizada', label: 'Finalizadas' },
            { key: 'mine', label: 'Meus Clientes' },
          ].map((f) => (
            <Button
              key={f.key}
              variant={filter === f.key ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilter(f.key)}
              className={cn(filter === f.key && 'bg-indigo-600 hover:bg-indigo-700')}
            >
              {f.label}
            </Button>
          ))}
        </div>
      </div>

      <div className="flex gap-1 flex-wrap">
        <span className="text-xs text-muted-foreground self-center mr-1">Tipo:</span>
        {[
          { key: 'all', label: 'Todos' },
          { key: 'novo_cliente', label: 'Novo Cliente' },
          { key: 'inclusao_modulo', label: 'Inclusão de Módulo' },
          { key: 'treinamento', label: 'Treinamentos' },
        ].map((f) => (
          <Button
            key={f.key}
            variant={tipoFilter === f.key ? 'secondary' : 'ghost'}
            size="sm"
            onClick={() => setTipoFilter(f.key)}
            className={cn(
              'text-xs h-7',
              tipoFilter === f.key &&
                f.key === 'novo_cliente' &&
                'bg-blue-100 text-blue-700 hover:bg-blue-200',
              tipoFilter === f.key &&
                f.key === 'inclusao_modulo' &&
                'bg-emerald-100 text-emerald-700 hover:bg-emerald-200',
              tipoFilter === f.key &&
                f.key === 'treinamento' &&
                'bg-violet-100 text-violet-700 hover:bg-violet-200',
            )}
          >
            {f.label}
          </Button>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Projetos de Implantação</CardTitle>
          <CardDescription>{filtered.length} implementações encontradas.</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-slate-50/50">
              <TableRow>
                <TableHead>Cliente</TableHead>
                <TableHead>Plano</TableHead>
                <TableHead>Analista</TableHead>
                <TableHead>Etapa Atual</TableHead>
                <TableHead>
                  <button
                    className="flex items-center gap-1 hover:text-slate-900 transition-colors"
                    onClick={() => handleSort('progresso')}
                  >
                    Progresso
                    {sortField === 'progresso' && (
                      <span className="text-xs">{sortDir === 'asc' ? '↑' : '↓'}</span>
                    )}
                  </button>
                </TableHead>
                <TableHead>
                  <button
                    className="flex items-center gap-1 hover:text-slate-900 transition-colors"
                    onClick={() => handleSort('data_prevista')}
                  >
                    Previsão
                    {sortField === 'data_prevista' && (
                      <span className="text-xs">{sortDir === 'asc' ? '↑' : '↓'}</span>
                    )}
                  </button>
                </TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={7} className="h-24 text-center text-muted-foreground">
                    Carregando...
                  </TableCell>
                </TableRow>
              ) : filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="h-24 text-center text-muted-foreground">
                    Nenhuma implementação encontrada.
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((impl) => {
                  const tipoKey = impl.tipo || 'novo_cliente'
                  const TipoIcon = TIPO_ICONS[tipoKey] || Rocket
                  const tipoCfg = TIPO_CONFIG[tipoKey]
                  return (
                    <TableRow key={impl.id} className="hover:bg-slate-50/80">
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className={cn('p-1.5 rounded-full', tipoCfg?.color)}>
                            <TipoIcon className="h-3 w-3" />
                          </div>
                          <div>
                            <div className="font-medium">{impl.clientes?.nome || 'N/A'}</div>
                            <Badge
                              variant="outline"
                              className={cn('text-[9px] mt-0.5', tipoCfg?.color)}
                            >
                              {tipoCfg?.label || 'Novo Cliente'}
                            </Badge>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-sm text-slate-600">
                        {impl.dados_parametrizacao?.plano_descricao || '—'}
                      </TableCell>
                      <TableCell>{impl.colaboradores?.nome || 'Não atribuído'}</TableCell>
                      <TableCell className="text-sm text-slate-600">
                        {getEtapaAtual(impl)}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2 min-w-[120px]">
                          <Progress value={impl.progresso || 0} className="h-2" />
                          <span className="text-xs font-medium text-slate-600 w-8">
                            {impl.progresso || 0}%
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="text-sm text-slate-600">
                        {getPrevisaoConclusao(impl)
                          ? new Date(getPrevisaoConclusao(impl)).toLocaleDateString('pt-BR')
                          : '—'}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={cn('text-xs', statusColors[impl.status])}
                        >
                          {impl.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => {
                              setEditId(impl.id)
                              setEditOpen(true)
                            }}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" asChild>
                            <Link to={`/implementacoes/${impl.id}`}>
                              <Eye className="h-4 w-4" />
                            </Link>
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  )
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <ImplementacaoEditSheet
        open={editOpen}
        onOpenChange={setEditOpen}
        implementacaoId={editId}
        onSaved={loadImplementacoes}
      />
      <ImplementacaoCreateDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        onCreated={loadImplementacoes}
      />
    </div>
  )
}
