import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Search, FileSignature, MoreHorizontal, Plus } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'
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
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { useToast } from '@/hooks/use-toast'
import { formatDate } from '@/lib/formatters'
import { supabase } from '@/lib/supabase/client'
import { CrmProspectForm, ProspectFormValues } from '@/components/CrmProspectForm'

type CrmProspect = {
  id: string
  empresa: string
  contato_nome: string
  telefone: string | null
  email: string | null
  status: string
  observacoes: string | null
  ultima_interacao: string
}

export default function CRMPage() {
  const [prospects, setProspects] = useState<CrmProspect[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { toast } = useToast()

  const fetchProspects = async () => {
    setIsLoading(true)
    const { data, error } = await supabase
      .from('crm_prospects')
      .select('*')
      .order('ultima_interacao', { ascending: false })

    if (!error && data) {
      setProspects(data as CrmProspect[])
    }
    setIsLoading(false)
  }

  useEffect(() => {
    fetchProspects()
  }, [])

  const onSubmit = async (values: ProspectFormValues) => {
    setIsSubmitting(true)
    const { error } = await supabase.from('crm_prospects').insert([
      {
        empresa: values.empresa,
        contato_nome: values.contato_nome,
        telefone: values.telefone || null,
        email: values.email || null,
        status: values.status,
        observacoes: values.observacoes || null,
      },
    ])

    setIsSubmitting(false)

    if (error) {
      toast({ title: 'Erro ao salvar', description: error.message, variant: 'destructive' })
      return
    }

    toast({ title: 'Sucesso', description: 'Contato adicionado com sucesso!' })
    setIsDialogOpen(false)
    fetchProspects()
  }

  const updateStatus = async (id: string, newStatus: string) => {
    const { error } = await supabase
      .from('crm_prospects')
      .update({ status: newStatus, ultima_interacao: new Date().toISOString() })
      .eq('id', id)

    if (error) {
      toast({ title: 'Erro', description: error.message, variant: 'destructive' })
      return
    }
    fetchProspects()
  }

  const filteredProspects = prospects.filter(
    (p) =>
      p.empresa.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.contato_nome.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Contato Inicial':
        return 'bg-blue-100 text-blue-800 hover:bg-blue-200 border-blue-200'
      case 'Em Negociação':
        return 'bg-orange-100 text-orange-800 hover:bg-orange-200 border-orange-200'
      case 'Aguardando Feedback':
        return 'bg-purple-100 text-purple-800 hover:bg-purple-200 border-purple-200'
      case 'Fechado':
        return 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200 border-emerald-200'
      default:
        return 'bg-slate-100 text-slate-800 border-slate-200'
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">CRM e Prospecção</h1>
          <p className="text-muted-foreground mt-1">
            Gerencie seus contatos e acompanhe o funil de vendas.
          </p>
        </div>

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              Novo Lead/Contato
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Novo Contato</DialogTitle>
              <DialogDescription>Adicione as informações do novo lead ao CRM.</DialogDescription>
            </DialogHeader>
            <CrmProspectForm onSubmit={onSubmit} isSubmitting={isSubmitting} />
          </DialogContent>
        </Dialog>
      </div>

      <Card className="border-slate-200/60 shadow-sm">
        <CardHeader className="pb-3 border-b border-slate-100 mb-2">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <CardTitle className="text-lg">Pipeline de Vendas</CardTitle>
              <CardDescription>
                Lista atualizada de todas as negociações em andamento.
              </CardDescription>
            </div>
            <div className="relative w-full sm:w-72">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar prospect..."
                className="pl-9 h-9 w-full bg-slate-50"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-slate-50/50">
              <TableRow>
                <TableHead className="w-[300px]">Empresa</TableHead>
                <TableHead>Contato</TableHead>
                <TableHead>Última Interação</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                    Carregando contatos...
                  </TableCell>
                </TableRow>
              ) : filteredProspects.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                    Nenhum contato encontrado.
                  </TableCell>
                </TableRow>
              ) : (
                filteredProspects.map((prospect) => (
                  <TableRow
                    key={prospect.id}
                    className="group hover:bg-slate-50/80 transition-colors"
                  >
                    <TableCell className="font-medium text-slate-900">
                      {prospect.empresa}
                      {prospect.email && (
                        <span className="block text-xs text-muted-foreground font-normal mt-0.5">
                          {prospect.email}
                        </span>
                      )}
                    </TableCell>
                    <TableCell>
                      {prospect.contato_nome}
                      {prospect.telefone && (
                        <span className="block text-xs text-muted-foreground font-normal mt-0.5">
                          {prospect.telefone}
                        </span>
                      )}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {formatDate(prospect.ultima_interacao)}
                    </TableCell>
                    <TableCell>
                      <Select
                        defaultValue={prospect.status}
                        onValueChange={(val) => updateStatus(prospect.id, val)}
                      >
                        <SelectTrigger
                          className={`h-8 w-[160px] border rounded-full text-xs font-semibold px-3 ${getStatusColor(prospect.status)}`}
                        >
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Contato Inicial">Contato Inicial</SelectItem>
                          <SelectItem value="Em Negociação">Em Negociação</SelectItem>
                          <SelectItem value="Aguardando Feedback">Aguardando Feedback</SelectItem>
                          <SelectItem value="Fechado">Fechado</SelectItem>
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 gap-1 text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50"
                          asChild
                        >
                          <Link to={`/contratos?prospect=${encodeURIComponent(prospect.empresa)}`}>
                            <FileSignature className="h-4 w-4" />
                            <span className="hidden sm:inline">Gerar Contrato</span>
                          </Link>
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </div>
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
