import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import {
  Search,
  FileSignature,
  Plus,
  CalendarClock,
  BellRing,
  Pencil,
  Trash2,
  FileText,
} from 'lucide-react'
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { useToast } from '@/hooks/use-toast'
import { formatDate } from '@/lib/formatters'
import { supabase } from '@/lib/supabase/client'
import { cn } from '@/lib/utils'
import { CrmProspectForm, ProspectFormValues } from '@/components/CrmProspectForm'
import { CrmDiagnosticoForm } from '@/components/CrmDiagnosticoForm'
import { CrmHistorico } from '@/components/CrmHistorico'

type CrmProspect = {
  id: string
  cnpj: string | null
  empresa: string
  endereco: string | null
  contato_nome: string
  telefone: string | null
  email: string | null
  status: string
  classificacao: string | null
  data_followup: string | null
  observacoes: string | null
  ultima_interacao: string
  diagnostico: any | null
  tags: string[] | null
}

export default function CRMPage() {
  const [prospects, setProspects] = useState<CrmProspect[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingProspect, setEditingProspect] = useState<CrmProspect | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { toast } = useToast()

  const fetchProspects = async () => {
    setIsLoading(true)
    const { data, error } = await supabase
      .from('crm_prospects')
      .select('*')
      .order('ultima_interacao', { ascending: false })
    if (!error && data) setProspects(data as CrmProspect[])
    setIsLoading(false)
  }

  useEffect(() => {
    fetchProspects()
  }, [])

  const onSubmit = async (values: ProspectFormValues) => {
    setIsSubmitting(true)
    const { error } = await supabase.from('crm_prospects').insert([
      {
        cnpj: values.cnpj || null,
        empresa: values.empresa,
        endereco: values.endereco || null,
        contato_nome: values.contato_nome,
        telefone: values.telefone || null,
        email: values.email || null,
        status: values.status,
        classificacao: values.classificacao || 'Frio',
        data_followup: values.data_followup || null,
        observacoes: values.observacoes || null,
      },
    ])
    setIsSubmitting(false)
    if (error)
      return toast({ title: 'Erro ao salvar', description: error.message, variant: 'destructive' })
    toast({ title: 'Sucesso', description: 'Contato adicionado com sucesso!' })
    setIsDialogOpen(false)
    fetchProspects()
  }

  const onEditSubmit = async (values: ProspectFormValues) => {
    if (!editingProspect) return
    setIsSubmitting(true)

    const statusChanged = editingProspect.status !== values.status
    const classifChanged =
      editingProspect.classificacao !== values.classificacao &&
      (editingProspect.classificacao || 'Frio') !== (values.classificacao || 'Frio')

    const { error } = await supabase
      .from('crm_prospects')
      .update({
        cnpj: values.cnpj || null,
        empresa: values.empresa,
        endereco: values.endereco || null,
        contato_nome: values.contato_nome,
        telefone: values.telefone || null,
        email: values.email || null,
        status: values.status,
        classificacao: values.classificacao || 'Frio',
        data_followup: values.data_followup || null,
        observacoes: values.observacoes || null,
        ultima_interacao:
          statusChanged || classifChanged
            ? new Date().toISOString()
            : editingProspect.ultima_interacao,
      })
      .eq('id', editingProspect.id)

    if (!error) {
      if (statusChanged) {
        await supabase.from('crm_historico_interacoes').insert([
          {
            prospect_id: editingProspect.id,
            tipo_contato: 'Sistema',
            resumo: `Mudança de Fase: ${values.status}`,
            detalhes: `Lead movido da fase "${editingProspect.status}" para "${values.status}".`,
          },
        ])
      }
      if (classifChanged) {
        await supabase.from('crm_historico_interacoes').insert([
          {
            prospect_id: editingProspect.id,
            tipo_contato: 'Sistema',
            resumo: `Classificação atualizada: ${values.classificacao || 'Frio'}`,
            detalhes: `Classificação do lead alterada de "${editingProspect.classificacao || 'Frio'}" para "${values.classificacao || 'Frio'}".`,
          },
        ])
      }
    }

    setIsSubmitting(false)
    if (error)
      return toast({
        title: 'Erro ao atualizar',
        description: error.message,
        variant: 'destructive',
      })
    toast({ title: 'Sucesso', description: 'Contato atualizado com sucesso!' })
    setEditingProspect(null)
    fetchProspects()
  }

  const handleDelete = async (id: string) => {
    if (
      !window.confirm('Tem certeza que deseja excluir este lead? Essa ação não pode ser desfeita.')
    )
      return
    const { error } = await supabase.from('crm_prospects').delete().eq('id', id)
    if (error)
      return toast({ title: 'Erro ao excluir', description: error.message, variant: 'destructive' })
    toast({ title: 'Sucesso', description: 'Lead excluído com sucesso!' })
    fetchProspects()
  }

  const updateStatus = async (id: string, newStatus: string, oldStatus: string) => {
    if (newStatus === oldStatus) return
    const { error } = await supabase
      .from('crm_prospects')
      .update({ status: newStatus, ultima_interacao: new Date().toISOString() })
      .eq('id', id)
    if (error) return toast({ title: 'Erro', description: error.message, variant: 'destructive' })

    await supabase.from('crm_historico_interacoes').insert([
      {
        prospect_id: id,
        tipo_contato: 'Sistema',
        resumo: `Mudança de Fase: ${newStatus}`,
        detalhes: `Lead movido da fase "${oldStatus}" para "${newStatus}".`,
      },
    ])

    fetchProspects()
  }

  const updateClassificacao = async (
    id: string,
    newClassificacao: string,
    oldClassificacao: string | null,
  ) => {
    if (newClassificacao === oldClassificacao) return
    const { error } = await supabase
      .from('crm_prospects')
      .update({ classificacao: newClassificacao, ultima_interacao: new Date().toISOString() })
      .eq('id', id)
    if (error) return toast({ title: 'Erro', description: error.message, variant: 'destructive' })

    await supabase.from('crm_historico_interacoes').insert([
      {
        prospect_id: id,
        tipo_contato: 'Sistema',
        resumo: `Classificação atualizada: ${newClassificacao}`,
        detalhes: `Classificação do lead alterada de "${oldClassificacao || 'N/A'}" para "${newClassificacao}".`,
      },
    ])

    fetchProspects()
  }

  const filtered = prospects.filter(
    (p) =>
      p.empresa.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.contato_nome.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  const getStatusColor = (s: string) => {
    if (s === 'Contato Inicial')
      return 'bg-blue-100 text-blue-800 hover:bg-blue-200 border-blue-200'
    if (s === 'Em Negociação')
      return 'bg-orange-100 text-orange-800 hover:bg-orange-200 border-orange-200'
    if (s === 'Aguardando Feedback')
      return 'bg-purple-100 text-purple-800 hover:bg-purple-200 border-purple-200'
    if (s === 'Fechado')
      return 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200 border-emerald-200'
    return 'bg-slate-100 text-slate-800 border-slate-200'
  }

  const getClassificacaoColor = (c: string | null) => {
    if (c === 'Muito Quente') return 'bg-red-500 text-white border-red-600'
    if (c === 'Quente') return 'bg-red-100 text-red-800 border-red-200'
    if (c === 'Morno') return 'bg-amber-100 text-amber-800 border-amber-200'
    return 'bg-blue-100 text-blue-800 border-blue-200'
  }

  const today = new Date().toISOString().split('T')[0]
  const followUpsHoje = prospects.filter(
    (p) => p.data_followup && p.data_followup <= today && !['Fechado'].includes(p.status),
  )

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">CRM e Prospecção</h1>
          <p className="text-muted-foreground mt-1">
            Gerencie contatos e acompanhe o funil de vendas.
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="h-4 w-4" /> Novo Lead/Contato
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[550px]">
            <DialogHeader>
              <DialogTitle>Novo Contato</DialogTitle>
              <DialogDescription>Adicione as informações do novo lead ao CRM.</DialogDescription>
            </DialogHeader>
            <CrmProspectForm onSubmit={onSubmit} isSubmitting={isSubmitting} />
          </DialogContent>
        </Dialog>
      </div>

      {followUpsHoje.length > 0 && (
        <Alert className="bg-amber-50 border-amber-200 text-amber-900 shadow-sm">
          <BellRing className="h-4 w-4 text-amber-600" />
          <AlertTitle className="text-amber-800 font-semibold">
            Atenção: Follow-ups Pendentes!
          </AlertTitle>
          <AlertDescription className="text-amber-700 mt-1">
            Você tem <strong>{followUpsHoje.length}</strong> contato(s) com retorno agendado para
            hoje ou em atraso.
            <ul className="mt-2 space-y-1 list-disc pl-5 text-sm">
              {followUpsHoje.slice(0, 3).map((p) => (
                <li key={p.id}>
                  <strong>{p.empresa}</strong> - {p.contato_nome}{' '}
                  {p.telefone && `(Tel: ${p.telefone})`}
                </li>
              ))}
              {followUpsHoje.length > 3 && <li>E mais {followUpsHoje.length - 3} contatos...</li>}
            </ul>
          </AlertDescription>
        </Alert>
      )}

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
                className="pl-9 h-9 bg-slate-50"
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
                <TableHead className="w-[280px]">Empresa</TableHead>
                <TableHead>Contato</TableHead>
                <TableHead>Follow-up</TableHead>
                <TableHead>Classificação</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                    Carregando contatos...
                  </TableCell>
                </TableRow>
              ) : filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                    Nenhum contato encontrado.
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((p) => (
                  <TableRow key={p.id} className="hover:bg-slate-50/80 transition-colors">
                    <TableCell className="font-medium text-slate-900">
                      <div className="flex flex-col">
                        <span>{p.empresa}</span>
                        {p.cnpj && (
                          <span className="text-xs text-muted-foreground mt-0.5">{p.cnpj}</span>
                        )}
                        {p.tags && p.tags.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-1.5">
                            {p.tags.map((tag) => (
                              <span
                                key={tag}
                                className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-indigo-50 text-indigo-700 border border-indigo-100"
                              >
                                {tag}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        <span>{p.contato_nome}</span>
                        {p.telefone && (
                          <span className="text-xs text-muted-foreground mt-0.5">{p.telefone}</span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      {p.data_followup ? (
                        <div
                          className={cn(
                            'flex items-center gap-1.5 text-xs font-medium',
                            p.data_followup <= today && p.status !== 'Fechado'
                              ? 'text-amber-600'
                              : 'text-muted-foreground',
                          )}
                        >
                          <CalendarClock className="h-3.5 w-3.5" />
                          {new Date(p.data_followup + 'T12:00:00Z').toLocaleDateString('pt-BR')}
                        </div>
                      ) : (
                        <span className="text-xs text-muted-foreground">-</span>
                      )}
                      <div
                        className="text-[10px] text-muted-foreground mt-1"
                        title="Última Interação"
                      >
                        Int: {formatDate(p.ultima_interacao)}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Select
                        defaultValue={p.classificacao || 'Frio'}
                        onValueChange={(val) => updateClassificacao(p.id, val, p.classificacao)}
                      >
                        <SelectTrigger
                          className={cn(
                            'h-8 w-[120px] border rounded-full text-xs font-semibold px-3',
                            getClassificacaoColor(p.classificacao),
                          )}
                        >
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Frio">Frio</SelectItem>
                          <SelectItem value="Morno">Morno</SelectItem>
                          <SelectItem value="Quente">Quente</SelectItem>
                          <SelectItem value="Muito Quente">Muito Quente</SelectItem>
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell>
                      <Select
                        defaultValue={p.status}
                        onValueChange={(val) => updateStatus(p.id, val, p.status)}
                      >
                        <SelectTrigger
                          className={cn(
                            'h-8 w-[150px] border rounded-full text-xs font-semibold px-3',
                            getStatusColor(p.status),
                          )}
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
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 gap-1 text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50"
                          asChild
                        >
                          <Link
                            to={`/contratos?prospect=${encodeURIComponent(p.empresa)}&cnpj=${p.cnpj ? p.cnpj.replace(/\D/g, '') : ''}`}
                          >
                            <FileSignature className="h-4 w-4" />
                            <span className="hidden lg:inline">Gerar Contrato</span>
                          </Link>
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 gap-1 text-orange-600 hover:text-orange-700 hover:bg-orange-50"
                          asChild
                        >
                          <Link
                            to={`/contratos?tab=cotacao&prospectId=${p.id}&prospect=${encodeURIComponent(p.empresa)}&contato=${encodeURIComponent(p.contato_nome)}`}
                          >
                            <FileText className="h-4 w-4" />
                            <span className="hidden lg:inline">Gerar Proposta</span>
                          </Link>
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-slate-400 hover:text-blue-600 hover:bg-blue-50"
                          onClick={() => setEditingProspect(p)}
                          title="Editar/Diagnóstico"
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-slate-400 hover:text-red-600 hover:bg-red-50"
                          onClick={() => handleDelete(p.id)}
                          title="Excluir"
                        >
                          <Trash2 className="h-4 w-4" />
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

      <Dialog open={!!editingProspect} onOpenChange={(open) => !open && setEditingProspect(null)}>
        <DialogContent className="sm:max-w-[800px] h-[90vh] md:h-[85vh] flex flex-col p-0 gap-0">
          <DialogHeader className="p-6 pb-4 shrink-0 border-b border-slate-100">
            <DialogTitle>Detalhes do Prospecto</DialogTitle>
            <DialogDescription>
              Atualize informações, preencha o diagnóstico e acompanhe o histórico.
            </DialogDescription>
          </DialogHeader>
          <div className="flex-1 overflow-hidden p-6 pt-4 bg-slate-50/30">
            <Tabs defaultValue="dados" className="h-full flex flex-col">
              <TabsList className="grid w-full grid-cols-3 mb-4 shrink-0 bg-slate-100">
                <TabsTrigger value="dados">Dados Básicos</TabsTrigger>
                <TabsTrigger value="diagnostico">Diagnóstico</TabsTrigger>
                <TabsTrigger value="historico">Histórico</TabsTrigger>
              </TabsList>

              <TabsContent
                value="dados"
                className="flex-1 overflow-y-auto pr-2 pb-4 focus-visible:outline-none"
              >
                {editingProspect && (
                  <CrmProspectForm
                    onSubmit={onEditSubmit}
                    isSubmitting={isSubmitting}
                    initialData={{
                      cnpj: editingProspect.cnpj || '',
                      empresa: editingProspect.empresa,
                      endereco: editingProspect.endereco || '',
                      contato_nome: editingProspect.contato_nome,
                      telefone: editingProspect.telefone || '',
                      email: editingProspect.email || '',
                      status: editingProspect.status,
                      classificacao: editingProspect.classificacao || 'Frio',
                      data_followup: editingProspect.data_followup || '',
                      observacoes: editingProspect.observacoes || '',
                    }}
                  />
                )}
              </TabsContent>

              <TabsContent
                value="diagnostico"
                className="flex-1 overflow-y-auto pr-2 pb-4 focus-visible:outline-none"
              >
                {editingProspect && (
                  <CrmDiagnosticoForm
                    prospectId={editingProspect.id}
                    initialData={editingProspect.diagnostico}
                    onSave={() => {
                      setEditingProspect(null)
                      fetchProspects()
                    }}
                  />
                )}
              </TabsContent>

              <TabsContent
                value="historico"
                className="flex-1 overflow-y-auto pr-2 pb-4 focus-visible:outline-none"
              >
                {editingProspect && <CrmHistorico prospectId={editingProspect.id} />}
              </TabsContent>
            </Tabs>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
