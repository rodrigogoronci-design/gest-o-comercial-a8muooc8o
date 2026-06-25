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
  UserCheck,
  Mail,
  Send,
  ChevronDown,
  ChevronRight,
} from 'lucide-react'
import React from 'react'
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
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { useToast } from '@/hooks/use-toast'
import { useAuth } from '@/hooks/use-auth'
import { formatDate } from '@/lib/formatters'
import { supabase } from '@/lib/supabase/client'
import { cn } from '@/lib/utils'
import { CrmProspectForm, ProspectFormValues } from '@/components/CrmProspectForm'
import { CrmDiagnosticoForm } from '@/components/CrmDiagnosticoForm'
import { CrmHistorico } from '@/components/CrmHistorico'
import { CrmKanbanBoard } from '@/components/CrmKanbanBoard'

export type CrmProspect = {
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
  proposta_url?: string | null
}

export default function CRMPage() {
  const [prospects, setProspects] = useState<CrmProspect[]>([])
  const [allProposals, setAllProposals] = useState<any[]>([])
  const [expandedRows, setExpandedRows] = useState<Record<string, boolean>>({})
  const [searchTerm, setSearchTerm] = useState('')
  const [viewMode, setViewMode] = useState<'list' | 'kanban'>('kanban')
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingProspect, setEditingProspect] = useState<CrmProspect | null>(null)
  const [editingTab, setEditingTab] = useState<string>('dados')
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [sendingProposal, setSendingProposal] = useState<CrmProspect | null>(null)
  const [sendingEmail, setSendingEmail] = useState(false)
  const { toast } = useToast()
  const { user } = useAuth()

  const toggleExpand = (id: string) => {
    setExpandedRows(prev => ({ ...prev, [id]: !prev[id] }))
  }

  const handleUpdatePropostaInline = async (id: string, updates: any) => {
    try {
      const { error } = await supabase.from('crm_propostas').update(updates).eq('id', id)
      if (error) throw error
      setAllProposals(prev => prev.map(prop => prop.id === id ? { ...prop, ...updates } : prop))
      toast({ title: 'Proposta atualizada' })
    } catch (e: any) {
      toast({ title: 'Erro', description: e.message, variant: 'destructive' })
    }
  }

  const handleSendProposalClick = (p: CrmProspect) => {
    if (!p.email) {
      toast({
        title: 'E-mail não cadastrado',
        description:
          'Por favor, edite o prospecto e adicione um e-mail antes de enviar a proposta.',
        variant: 'destructive',
      })
      return
    }
    setSendingProposal(p)
  }

  const handleConfirmSendProposal = async () => {
    if (!sendingProposal) return
    setSendingEmail(true)

    const senderName = user?.user_metadata?.name || 'Comercial'

    const { error } = await supabase.functions.invoke('send-crm-proposal', {
      body: {
        to: sendingProposal.email,
        companyName: sendingProposal.empresa,
        contactName: sendingProposal.contato_nome,
        senderName: senderName,
        proposalUrl: sendingProposal.proposta_url,
      },
    })

    setSendingEmail(false)

    if (error) {
      toast({
        title: 'Falha ao enviar e-mail',
        description: error.message || 'Ocorreu um erro desconhecido.',
        variant: 'destructive',
      })
    } else {
      toast({
        title: 'Sucesso',
        description: 'E-mail enviado com sucesso!',
      })

      await supabase.from('crm_historico_interacoes').insert([
        {
          prospect_id: sendingProposal.id,
          tipo_contato: 'E-mail',
          resumo: 'Envio de Proposta',
          detalhes: 'Proposta comercial enviada por e-mail com sucesso.',
        },
      ])

      // Auto update latest proposal status and sent date
      const { data: latestProposal } = await supabase
        .from('crm_propostas')
        .select('id')
        .eq('prospect_id', sendingProposal.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .single()
        
      if (latestProposal) {
        await supabase
          .from('crm_propostas')
          .update({
            status_negociacao: 'Enviada',
            data_envio: new Date().toISOString()
          })
          .eq('id', latestProposal.id)
      }

      setSendingProposal(null)
      fetchProspects()
    }
  }

  const handleEfetivarCliente = async (p: CrmProspect) => {
    if (!p.cnpj) {
      return toast({
        title: 'CNPJ obrigatório',
        description: 'O prospecto precisa ter um CNPJ preenchido para ser efetivado.',
        variant: 'destructive',
      })
    }

    setIsSubmitting(true)

    const { data: existingClient } = await supabase
      .from('clientes')
      .select('id')
      .eq('cnpj', p.cnpj)
      .maybeSingle()

    if (existingClient) {
      setIsSubmitting(false)
      return toast({
        title: 'Erro ao efetivar',
        description: 'Já existe um cliente cadastrado com este CNPJ.',
        variant: 'destructive',
      })
    }

    const { data: newClient, error: clientError } = await supabase
      .from('clientes')
      .insert([
        {
          nome: p.empresa,
          cnpj: p.cnpj,
          email: p.email,
          telefone: p.telefone,
          endereco: p.endereco,
          diagnostico: p.diagnostico,
          tags: p.tags,
          status: 'Ativo',
        },
      ])
      .select()
      .single()

    if (clientError || !newClient) {
      setIsSubmitting(false)
      return toast({
        title: 'Erro ao criar cliente',
        description: clientError?.message || 'Erro desconhecido',
        variant: 'destructive',
      })
    }

    await supabase
      .from('crm_prospects')
      .update({ status: 'Cliente Efetivado', ultima_interacao: new Date().toISOString() })
      .eq('id', p.id)

    await supabase
      .from('crm_propostas')
      .update({ cliente_id: newClient.id })
      .eq('prospect_id', p.id)

    await supabase.from('crm_historico_interacoes').insert([
      {
        prospect_id: p.id,
        tipo_contato: 'Sistema',
        resumo: 'Conversão para Cliente',
        detalhes: 'Prospecto convertido em cliente com sucesso.',
      },
    ])

    setIsSubmitting(false)

    toast({
      title: 'Sucesso',
      description: (
        <div className="flex flex-col gap-2 mt-1">
          <span>Prospecto convertido em cliente!</span>
          <Link to={`/clientes`} className="text-indigo-600 underline font-medium">
            Ver Cliente Efetivado
          </Link>
        </div>
      ),
    })

    fetchProspects()
  }

  const fetchProspects = async () => {
    setIsLoading(true)
    const { data, error } = await supabase
      .from('crm_prospects')
      .select('*')
      .order('ultima_interacao', { ascending: false })
    if (!error && data) setProspects(data as CrmProspect[])
    
    const { data: propsData } = await supabase
      .from('crm_propostas')
      .select('id, prospect_id, data_proposta, valor_mensalidade, valor_implantacao, status_negociacao, data_envio')
      .order('created_at', { ascending: false })
    if (propsData) setAllProposals(propsData)
      
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
    if (s === 'Novo Lead') return 'bg-sky-100 text-sky-800 hover:bg-sky-200 border-sky-200'
    if (s === 'Contato inicial' || s === 'Contato Inicial')
      return 'bg-blue-100 text-blue-800 hover:bg-blue-200 border-blue-200'
    if (s === 'Apresentação do sistema')
      return 'bg-purple-100 text-purple-800 hover:bg-purple-200 border-purple-200'
    if (s === 'Em negociação' || s === 'Em Negociação')
      return 'bg-orange-100 text-orange-800 hover:bg-orange-200 border-orange-200'
    if (s === 'Proposta enviada')
      return 'bg-indigo-100 text-indigo-800 hover:bg-indigo-200 border-indigo-200'
    if (s === 'Contrato assinado' || s === 'Fechado')
      return 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200 border-emerald-200'
    if (s === 'Cliente Efetivado')
      return 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200 border-emerald-200'
    if (s === 'Perdido') return 'bg-red-100 text-red-800 hover:bg-red-200 border-red-200'
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
    (p) =>
      p.data_followup &&
      p.data_followup <= today &&
      !['Fechado', 'Cliente Efetivado', 'Perdido'].includes(p.status),
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

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
        <Tabs
          value={viewMode}
          onValueChange={(v) => setViewMode(v as 'list' | 'kanban')}
          className="w-full sm:w-[300px] shrink-0"
        >
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="kanban">Kanban</TabsTrigger>
            <TabsTrigger value="list">Lista</TabsTrigger>
          </TabsList>
        </Tabs>
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar prospect..."
            className="pl-9 h-9 bg-white shadow-sm border-slate-200"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {viewMode === 'kanban' ? (
        <CrmKanbanBoard
          prospects={filtered}
          onUpdateStatus={updateStatus}
          onEdit={(p, tab = 'dados') => {
            setEditingProspect(p)
            setEditingTab(tab)
          }}
          onDelete={handleDelete}
          onEfetivar={handleEfetivarCliente}
          onSendProposal={handleSendProposalClick}
        />
      ) : (
        <Card className="border-slate-200/60 shadow-sm">
          <CardHeader className="pb-3 border-b border-slate-100 mb-2">
            <CardTitle className="text-lg">Pipeline de Vendas</CardTitle>
            <CardDescription>
              Lista atualizada de todas as negociações em andamento.
            </CardDescription>
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
                  filtered.map((p) => {
                    const props = allProposals.filter(prop => prop.prospect_id === p.id)
                    const hasProps = props.length > 0
                    const isExpanded = expandedRows[p.id]

                    return (
                    <React.Fragment key={p.id}>
                    <TableRow className="hover:bg-slate-50/80 transition-colors">
                      <TableCell className="font-medium text-slate-900">
                        <div className="flex items-start gap-2">
                          {hasProps ? (
                            <button onClick={() => toggleExpand(p.id)} className="mt-0.5 text-slate-400 hover:text-indigo-600 transition-colors">
                              {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                            </button>
                          ) : (
                            <div className="w-4" />
                          )}
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
                            <span className="text-xs text-muted-foreground mt-0.5">
                              {p.telefone}
                            </span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        {p.data_followup ? (
                          <div
                            className={cn(
                              'flex items-center gap-1.5 text-xs font-medium',
                              p.data_followup < today &&
                                !['Fechado', 'Cliente Efetivado', 'Perdido'].includes(p.status)
                                ? 'text-red-600'
                                : p.data_followup === today &&
                                    !['Fechado', 'Cliente Efetivado', 'Perdido'].includes(p.status)
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
                            {![
                              'Novo Lead',
                              'Contato inicial',
                              'Em negociação',
                              'Proposta enviada',
                              'Fechado',
                              'Cliente Efetivado',
                              'Perdido',
                            ].includes(p.status) && (
                              <SelectItem value={p.status} className="hidden">
                                {p.status}
                              </SelectItem>
                            )}
                            <SelectItem value="Novo Lead">Novo Lead</SelectItem>
                            <SelectItem value="Contato inicial">Contato inicial</SelectItem>
                            <SelectItem value="Em negociação">Em negociação</SelectItem>
                            <SelectItem value="Proposta enviada">Proposta enviada</SelectItem>
                            <SelectItem value="Fechado">Fechado</SelectItem>
                            <SelectItem value="Cliente Efetivado">Cliente Efetivado</SelectItem>
                            <SelectItem value="Perdido">Perdido</SelectItem>
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          {p.status !== 'Cliente Efetivado' && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 gap-1 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50"
                              onClick={() => handleEfetivarCliente(p)}
                              disabled={isSubmitting}
                              title="Efetivar Cliente"
                            >
                              <UserCheck className="h-4 w-4" />
                              <span className="hidden lg:inline">Efetivar</span>
                            </Button>
                          )}
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
                            className="h-8 w-8 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50"
                            onClick={() => handleSendProposalClick(p)}
                            title="Enviar Proposta por E-mail"
                          >
                            <Mail className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-slate-400 hover:text-blue-600 hover:bg-blue-50"
                            onClick={() => {
                              setEditingProspect(p)
                              setEditingTab('dados')
                            }}
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
                    {isExpanded && (
                      <TableRow className="bg-slate-50/50 hover:bg-slate-50/50">
                        <TableCell colSpan={6} className="p-0">
                          <div className="py-3 px-10 border-b border-slate-100 bg-indigo-50/30">
                            <h4 className="text-xs font-semibold text-slate-600 uppercase mb-3 tracking-wider flex items-center gap-1.5"><FileText className="w-3.5 h-3.5" /> Propostas Geradas</h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                              {props.map(prop => (
                                <div key={prop.id} className="bg-white p-3 rounded-lg border border-slate-200 shadow-sm flex flex-col gap-2">
                                  <div className="flex justify-between items-center pb-2 border-b border-slate-100">
                                    <span className="text-sm font-medium text-slate-800">
                                      Data: {new Date(prop.data_proposta + 'T12:00:00Z').toLocaleDateString('pt-BR')}
                                    </span>
                                    <span className="text-xs font-semibold text-indigo-600">
                                      {prop.valor_mensalidade?.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })} /mês
                                    </span>
                                  </div>
                                  <div className="grid grid-cols-2 gap-3 mt-1">
                                    <div className="space-y-1">
                                      <span className="text-[10px] uppercase text-slate-500 font-medium">Status</span>
                                      <Select
                                        value={prop.status_negociacao || 'Gerada'}
                                        onValueChange={(val) => handleUpdatePropostaInline(prop.id, { status_negociacao: val })}
                                      >
                                        <SelectTrigger className="h-7 text-xs bg-slate-50">
                                          <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                          <SelectItem value="Gerada">Gerada</SelectItem>
                                          <SelectItem value="Enviada">Enviada</SelectItem>
                                          <SelectItem value="Em Análise">Em Análise</SelectItem>
                                          <SelectItem value="Aprovada">Aprovada</SelectItem>
                                          <SelectItem value="Recusada">Recusada</SelectItem>
                                        </SelectContent>
                                      </Select>
                                    </div>
                                    <div className="space-y-1">
                                      <span className="text-[10px] uppercase text-slate-500 font-medium">Envio</span>
                                      <Input
                                        type="date"
                                        className="h-7 text-xs bg-slate-50 px-2"
                                        value={prop.data_envio ? prop.data_envio.split('T')[0] : ''}
                                        onChange={(e) => {
                                          const val = e.target.value
                                          handleUpdatePropostaInline(prop.id, { data_envio: val ? new Date(val + 'T12:00:00Z').toISOString() : null })
                                        }}
                                      />
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        </TableCell>
                      </TableRow>
                    )}
                    </React.Fragment>
                  );
                })
              )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      <Dialog open={!!editingProspect} onOpenChange={(open) => !open && setEditingProspect(null)}>
        <DialogContent className="sm:max-w-[800px] h-[90vh] md:h-[85vh] flex flex-col p-0 gap-0">
          <DialogHeader className="p-6 pb-4 shrink-0 border-b border-slate-100">
            <DialogTitle>Detalhes do Prospecto</DialogTitle>
            <DialogDescription>
              Atualize informações, preencha o diagnóstico e acompanhe o histórico.
            </DialogDescription>
          </DialogHeader>
          <div className="flex-1 overflow-hidden p-6 pt-4 bg-slate-50/30">
            <Tabs value={editingTab} onValueChange={setEditingTab} className="h-full flex flex-col">
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

      <Dialog open={!!sendingProposal} onOpenChange={(open) => !open && setSendingProposal(null)}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Enviar Proposta por E-mail</DialogTitle>
            <DialogDescription>
              Revise a mensagem padrão antes de enviar para{' '}
              <strong>{sendingProposal?.empresa}</strong>.
            </DialogDescription>
          </DialogHeader>

          {sendingProposal && (
            <div className="space-y-4 py-4">
              <div className="flex flex-col gap-1.5">
                <span className="text-sm font-medium text-slate-700">Destinatário:</span>
                <Input value={sendingProposal.email || ''} readOnly className="bg-slate-50" />
              </div>

              {!sendingProposal.proposta_url && (
                <Alert className="bg-amber-50 border-amber-200 text-amber-800">
                  <AlertTitle className="text-sm font-semibold">Atenção!</AlertTitle>
                  <AlertDescription className="text-xs">
                    Este prospecto ainda não possui uma proposta (PDF ou Link) vinculada. O e-mail
                    será enviado sem o link do anexo.
                  </AlertDescription>
                </Alert>
              )}

              <div className="flex flex-col gap-1.5">
                <span className="text-sm font-medium text-slate-700">
                  Pré-visualização do e-mail:
                </span>
                <div className="border border-slate-200 rounded-md p-4 bg-slate-50 text-sm whitespace-pre-wrap font-sans text-slate-800 h-64 overflow-y-auto">
                  <strong>Assunto:</strong> Proposta Comercial – {sendingProposal.empresa}
                  {'\n'}
                  <hr className="my-2 border-slate-200" />
                  Prezado(a) {sendingProposal.contato_nome},{'\n\n'}
                  Espero que esteja bem.{'\n\n'}
                  Conforme alinhado em nossa conversa e apresentação do sistema, segue em anexo a
                  sua proposta comercial com a solução mais adequada para a sua operação.{'\n\n'}A
                  cotação foi elaborada com base nas informações levantadas durante nosso
                  atendimento e contempla as melhores condições disponíveis no momento.{'\n\n'}
                  Caso tenha qualquer dúvida ou precise de algum ajuste na proposta, estou à
                  disposição para te auxiliar.{'\n\n'}
                  Fico no aguardo do seu retorno para darmos sequência.{'\n\n'}
                  {sendingProposal.proposta_url &&
                    `Link para a proposta: ${sendingProposal.proposta_url}\n\n`}
                  Atenciosamente,{'\n'}
                  {user?.user_metadata?.name || 'Comercial'}
                </div>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setSendingProposal(null)}
              disabled={sendingEmail}
            >
              Cancelar
            </Button>
            <Button onClick={handleConfirmSendProposal} disabled={sendingEmail} className="gap-2">
              <Send className="h-4 w-4" />
              {sendingEmail ? 'Enviando...' : 'Enviar E-mail'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
