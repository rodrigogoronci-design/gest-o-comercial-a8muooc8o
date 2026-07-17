import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Rocket, Eye } from 'lucide-react'
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
import { useAuth } from '@/hooks/use-auth'
import { supabase } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

export default function ImplementacoesPage() {
  const [implementacoes, setImplementacoes] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [filter, setFilter] = useState<string>('all')
  const [searchTerm, setSearchTerm] = useState('')
  const [currentColabId, setCurrentColabId] = useState<string | null>(null)
  const { user } = useAuth()

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

  const filtered = implementacoes
    .filter((impl) => {
      if (filter === 'mine') return impl.responsavel_id === currentColabId
      if (filter === 'all') return true
      return impl.status === filter
    })
    .filter((impl) => {
      const nome = impl.clientes?.nome || ''
      return nome.toLowerCase().includes(searchTerm.toLowerCase())
    })

  const statusColors: Record<string, string> = {
    'Em andamento': 'bg-blue-50 text-blue-700 border-blue-200',
    Atrasada: 'bg-red-50 text-red-700 border-red-200',
    Finalizada: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
          <Rocket className="h-8 w-8 text-indigo-600" />
          Implantações
        </h1>
        <p className="text-muted-foreground mt-1">
          Acompanhe o progresso dos projetos de implantação de novos clientes.
        </p>
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
                <TableHead>Analista</TableHead>
                <TableHead>Etapa Atual</TableHead>
                <TableHead>Progresso</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                    Carregando...
                  </TableCell>
                </TableRow>
              ) : filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                    Nenhuma implementação encontrada.
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((impl) => (
                  <TableRow key={impl.id} className="hover:bg-slate-50/80">
                    <TableCell className="font-medium">{impl.clientes?.nome || 'N/A'}</TableCell>
                    <TableCell>{impl.colaboradores?.nome || 'Não atribuído'}</TableCell>
                    <TableCell className="text-sm text-slate-600">{getEtapaAtual(impl)}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2 min-w-[120px]">
                        <Progress value={impl.progresso || 0} className="h-2" />
                        <span className="text-xs font-medium text-slate-600 w-8">
                          {impl.progresso || 0}%
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className={cn('text-xs', statusColors[impl.status])}>
                        {impl.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="icon" asChild>
                        <Link to={`/implementacoes/${impl.id}`}>
                          <Eye className="h-4 w-4" />
                        </Link>
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
