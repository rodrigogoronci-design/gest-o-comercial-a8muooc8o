import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { ClipboardList, Plus, Eye, FileCheck, Clock } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { getConsultorias, type ConsultoriaProject } from '@/services/consultoria-crm'
import { CrmConsultoriaCreateDialog } from '@/components/CrmConsultoriaCreateDialog'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

const STATUS_COLORS: Record<string, string> = {
  'Em andamento': 'bg-blue-50 text-blue-700 border-blue-200',
  consultoria_recebido: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  consultoria_completed: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  Finalizada: 'bg-slate-50 text-slate-700 border-slate-200',
}

export default function CrmConsultoriaPage() {
  const [projects, setProjects] = useState<ConsultoriaProject[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [createOpen, setCreateOpen] = useState(false)

  const loadProjects = async () => {
    setIsLoading(true)
    try {
      const data = await getConsultorias()
      setProjects(data)
    } catch (error: any) {
      toast.error('Erro ao carregar consultorias: ' + (error.message || ''))
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadProjects()
  }, [])

  const filtered = projects.filter((p) => {
    const name = p.clientes?.nome || ''
    return name.toLowerCase().includes(searchTerm.toLowerCase())
  })

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <ClipboardList className="h-8 w-8 text-amber-600" />
            Consultoria
          </h1>
          <p className="text-muted-foreground mt-1">
            Gerencie projetos de consultoria e acompanhe respostas dos clientes.
          </p>
        </div>
        <Button onClick={() => setCreateOpen(true)} className="bg-amber-600 hover:bg-amber-700">
          <Plus className="h-4 w-4 mr-2" />
          Nova Consultoria
        </Button>
      </div>

      <div className="relative max-w-sm">
        <Input
          placeholder="Buscar por cliente..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Projetos de Consultoria</CardTitle>
          <CardDescription>{filtered.length} projeto(s) encontrado(s).</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-slate-50/50">
              <TableRow>
                <TableHead>Projeto</TableHead>
                <TableHead>Cliente</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Respostas</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                    Carregando...
                  </TableCell>
                </TableRow>
              ) : filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                    Nenhum projeto de consultoria encontrado.
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((project) => {
                  const projectName = `Service Logic | ${project.clientes?.nome || 'N/A'}`
                  const hasResponses =
                    project.consultoria_form_data &&
                    Object.keys(project.consultoria_form_data).length > 0
                  return (
                    <TableRow key={project.id} className="hover:bg-slate-50/80">
                      <TableCell className="font-medium">{projectName}</TableCell>
                      <TableCell>
                        <div className="flex flex-col">
                          <span>{project.clientes?.nome || 'N/A'}</span>
                          {project.clientes?.cnpj && (
                            <span className="text-xs text-muted-foreground">
                              {project.clientes.cnpj}
                            </span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={cn(
                            'text-xs',
                            STATUS_COLORS[project.status] ||
                              'bg-slate-50 text-slate-700 border-slate-200',
                          )}
                        >
                          {project.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {hasResponses ? (
                          <span className="flex items-center gap-1 text-emerald-600 text-xs font-medium">
                            <FileCheck className="h-3.5 w-3.5" /> Recebidas
                          </span>
                        ) : (
                          <span className="flex items-center gap-1 text-slate-400 text-xs">
                            <Clock className="h-3.5 w-3.5" /> Aguardando
                          </span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="icon" asChild>
                          <Link to={`/crm/consultoria/${project.id}`}>
                            <Eye className="h-4 w-4" />
                          </Link>
                        </Button>
                      </TableCell>
                    </TableRow>
                  )
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <CrmConsultoriaCreateDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        onCreated={loadProjects}
      />
    </div>
  )
}
