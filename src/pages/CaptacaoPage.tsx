import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Search, Plus, Trash2, Pencil, User, Building2, ArrowLeft } from 'lucide-react'
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
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useToast } from '@/hooks/use-toast'
import { useAuth } from '@/hooks/use-auth'
import { supabase } from '@/lib/supabase/client'
import { formatDate } from '@/lib/formatters'
import { cn } from '@/lib/utils'
import { CaptacaoForm, CaptacaoFormValues } from '@/components/CaptacaoForm'
import { composeEndereco } from '@/lib/cpf-utils'

type CaptacaoProspect = {
  id: string
  tipo_pessoa: string | null
  empresa: string
  contato_nome: string
  cnpj: string | null
  cpf: string | null
  razao_social: string | null
  nome_mae: string | null
  nome_pai: string | null
  data_nascimento: string | null
  email: string | null
  telefone: string | null
  endereco: string | null
  status: string
  classificacao: string | null
  observacoes: string | null
  data_followup: string | null
  created_at: string | null
}

const STATUS_OPTIONS = [
  'Novo Lead',
  'Contato inicial',
  'Em negociação',
  'Proposta enviada',
  'Perdido',
]

export default function CaptacaoPage() {
  const [prospects, setProspects] = useState<CaptacaoProspect[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [tipoFilter, setTipoFilter] = useState<string>('all')
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [editingProspect, setEditingProspect] = useState<CaptacaoProspect | null>(null)
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const { toast } = useToast()
  const { user } = useAuth()

  const fetchProspects = async () => {
    setIsLoading(true)
    const { data, error } = await supabase
      .from('crm_prospects')
      .select('*')
      .order('created_at', { ascending: false })
    if (error) {
      toast({ title: 'Erro ao carregar', description: error.message, variant: 'destructive' })
    } else {
      setProspects((data || []) as CaptacaoProspect[])
    }
    setIsLoading(false)
  }

  useEffect(() => {
    fetchProspects()
  }, [])

  const onSubmit = async (values: CaptacaoFormValues) => {
    setIsSubmitting(true)
    const endereco = composeEndereco({
      logradouro: values.logradouro,
      numero: values.numero,
      complemento: values.complemento,
      bairro: values.bairro,
      cidade: values.cidade,
      estado: values.estado,
      cep: values.cep,
    })

    const insertData: Record<string, unknown> = {
      tipo_pessoa: values.tipo_pessoa,
      empresa: values.tipo_pessoa === 'PJ' ? values.empresa : values.contato_nome,
      contato_nome: values.contato_nome,
      email: values.email || null,
      telefone: values.telefone || null,
      endereco: endereco || null,
      status: 'Novo Lead',
      classificacao: values.classificacao || 'Frio',
      observacoes: values.observacoes || null,
      user_id: user?.id || null,
      ultima_interacao: new Date().toISOString(),
    }

    if (values.tipo_pessoa === 'PJ') {
      insertData.cnpj = values.cnpj || null
      insertData.razao_social = values.razao_social || null
    } else {
      insertData.cpf = values.cpf || null
      insertData.nome_mae = values.nome_mae || null
      insertData.nome_pai = values.nome_pai || null
      insertData.data_nascimento = values.data_nascimento || null
    }

    const { error } = await supabase.from('crm_prospects').insert([insertData])
    setIsSubmitting(false)
    if (error) {
      toast({ title: 'Erro ao salvar', description: error.message, variant: 'destructive' })
      return
    }
    toast({ title: 'Sucesso', description: 'Captação registrada com sucesso!' })
    setIsDialogOpen(false)
    fetchProspects()
  }

  const onEditSubmit = async (values: CaptacaoFormValues) => {
    if (!editingProspect) return
    setIsSubmitting(true)
    const endereco = composeEndereco({
      logradouro: values.logradouro,
      numero: values.numero,
      complemento: values.complemento,
      bairro: values.bairro,
      cidade: values.cidade,
      estado: values.estado,
      cep: values.cep,
    })

    const updateData: Record<string, unknown> = {
      tipo_pessoa: values.tipo_pessoa,
      empresa: values.tipo_pessoa === 'PJ' ? values.empresa : values.contato_nome,
      contato_nome: values.contato_nome,
      email: values.email || null,
      telefone: values.telefone || null,
      endereco: endereco || null,
      classificacao: values.classificacao || 'Frio',
      observacoes: values.observacoes || null,
      ultima_interacao: new Date().toISOString(),
    }

    if (values.tipo_pessoa === 'PJ') {
      updateData.cnpj = values.cnpj || null
      updateData.razao_social = values.razao_social || null
    } else {
      updateData.cpf = values.cpf || null
      updateData.nome_mae = values.nome_mae || null
      updateData.nome_pai = values.nome_pai || null
      updateData.data_nascimento = values.data_nascimento || null
    }

    const { error } = await supabase
      .from('crm_prospects')
      .update(updateData)
      .eq('id', editingProspect.id)
    setIsSubmitting(false)
    if (error) {
      toast({ title: 'Erro ao atualizar', description: error.message, variant: 'destructive' })
      return
    }
    toast({ title: 'Sucesso', description: 'Captação atualizada!' })
    setEditDialogOpen(false)
    setEditingProspect(null)
    fetchProspects()
  }

  const handleDelete = async (id: string) => {
    if (!window.confirm('Tem certeza que deseja excluir esta captação?')) return
    const { error } = await supabase.from('crm_prospects').delete().eq('id', id)
    if (error) {
      toast({ title: 'Erro', description: error.message, variant: 'destructive' })
      return
    }
    toast({ title: 'Excluído', description: 'Captação removida.' })
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

  const filtered = prospects.filter((p) => {
    const searchMatch =
      p.empresa?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.contato_nome?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (p.cnpj || '').includes(searchTerm) ||
      (p.cpf || '').includes(searchTerm)
    const statusMatch = statusFilter === 'all' || p.status === statusFilter
    const tipoMatch = tipoFilter === 'all' || (p.tipo_pessoa || 'PJ') === tipoFilter
    return searchMatch && statusMatch && tipoMatch
  })

  const getClassificacaoColor = (c: string | null) => {
    if (c === 'Muito Quente') return 'bg-red-500 text-white'
    if (c === 'Quente') return 'bg-red-100 text-red-800'
    if (c === 'Morno') return 'bg-amber-100 text-amber-800'
    return 'bg-blue-100 text-blue-800'
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Link to="/crm" className="text-slate-400 hover:text-slate-600 transition-colors">
              <ArrowLeft className="h-4 w-4" />
            </Link>
            <h1 className="text-3xl font-bold tracking-tight">Captação</h1>
          </div>
          <p className="text-muted-foreground mt-1">
            Registre e gerencie empresas e pessoas físicas em fase de prospecção.
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="h-4 w-4" /> Nova Captação
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Nova Captação</DialogTitle>
              <DialogDescription>
                Cadastre uma nova empresa ou pessoa física para prospecção.
              </DialogDescription>
            </DialogHeader>
            <CaptacaoForm onSubmit={onSubmit} isSubmitting={isSubmitting} />
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por nome, empresa, CNPJ ou CPF..."
            className="pl-9 h-9 bg-white shadow-sm border-slate-200"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <Select value={tipoFilter} onValueChange={setTipoFilter}>
          <SelectTrigger className="w-full sm:w-[140px] h-9">
            <SelectValue placeholder="Tipo" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os Tipos</SelectItem>
            <SelectItem value="PJ">Pessoa Jurídica</SelectItem>
            <SelectItem value="PF">Pessoa Física</SelectItem>
          </SelectContent>
        </Select>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-[160px] h-9">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os Status</SelectItem>
            {STATUS_OPTIONS.map((s) => (
              <SelectItem key={s} value={s}>
                {s}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Card className="border-slate-200/60 shadow-sm">
        <CardHeader className="pb-3 border-b border-slate-100">
          <CardTitle className="text-lg">Prospects em Captação</CardTitle>
          <CardDescription>{filtered.length} registro(s) encontrado(s).</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-slate-50/50">
                <TableRow>
                  <TableHead className="w-[250px]">Nome / Empresa</TableHead>
                  <TableHead>Documento</TableHead>
                  <TableHead>Contato</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Classificação</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Cadastrado em</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={8} className="h-24 text-center text-muted-foreground">
                      Carregando...
                    </TableCell>
                  </TableRow>
                ) : filtered.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="h-24 text-center text-muted-foreground">
                      Nenhuma captação encontrada.
                    </TableCell>
                  </TableRow>
                ) : (
                  filtered.map((p) => (
                    <TableRow key={p.id} className="hover:bg-slate-50/80 transition-colors">
                      <TableCell className="font-medium text-slate-900">
                        <div className="flex items-center gap-2">
                          {p.tipo_pessoa === 'PF' ? (
                            <User className="h-4 w-4 text-blue-500 shrink-0" />
                          ) : (
                            <Building2 className="h-4 w-4 text-indigo-500 shrink-0" />
                          )}
                          <div className="flex flex-col">
                            <span>{p.empresa}</span>
                            {p.tipo_pessoa === 'PJ' && p.razao_social && (
                              <span className="text-xs text-muted-foreground">
                                {p.razao_social}
                              </span>
                            )}
                            <span className="text-xs text-muted-foreground">{p.contato_nome}</span>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-sm">
                        {p.tipo_pessoa === 'PF' ? p.cpf || '-' : p.cnpj || '-'}
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col text-xs">
                          {p.email && <span className="text-slate-600">{p.email}</span>}
                          {p.telefone && (
                            <span className="text-muted-foreground">{p.telefone}</span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={cn(
                            'text-xs',
                            p.tipo_pessoa === 'PF'
                              ? 'border-blue-200 text-blue-700 bg-blue-50'
                              : 'border-indigo-200 text-indigo-700 bg-indigo-50',
                          )}
                        >
                          {p.tipo_pessoa === 'PF' ? 'PF' : 'PJ'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <span
                          className={cn(
                            'inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium',
                            getClassificacaoColor(p.classificacao),
                          )}
                        >
                          {p.classificacao || 'Frio'}
                        </span>
                      </TableCell>
                      <TableCell>
                        <Select value={p.status} onValueChange={(val) => updateStatus(p.id, val)}>
                          <SelectTrigger className="h-7 w-[140px] text-xs">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {STATUS_OPTIONS.map((s) => (
                              <SelectItem key={s} value={s}>
                                {s}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {p.created_at ? formatDate(p.created_at) : '-'}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-slate-400 hover:text-blue-600 hover:bg-blue-50"
                            onClick={() => {
                              setEditingProspect(p)
                              setEditDialogOpen(true)
                            }}
                            title="Editar"
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
          </div>
        </CardContent>
      </Card>

      <Dialog
        open={editDialogOpen}
        onOpenChange={(open) => {
          setEditDialogOpen(open)
          if (!open) setEditingProspect(null)
        }}
      >
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Editar Captação</DialogTitle>
            <DialogDescription>Atualize as informações da captação.</DialogDescription>
          </DialogHeader>
          {editingProspect && (
            <CaptacaoEditForm
              prospect={editingProspect}
              onSubmit={onEditSubmit}
              isSubmitting={isSubmitting}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}

function CaptacaoEditForm({
  prospect,
  onSubmit,
  isSubmitting,
}: {
  prospect: CaptacaoProspect
  onSubmit: (v: CaptacaoFormValues) => void
  isSubmitting?: boolean
}) {
  const [tipoPessoa, setTipoPessoa] = useState<'PJ' | 'PF'>(
    (prospect.tipo_pessoa as 'PJ' | 'PF') || 'PJ',
  )

  const parseEndereco = (endereco: string | null) => {
    if (!endereco)
      return {
        logradouro: '',
        numero: '',
        complemento: '',
        bairro: '',
        cidade: '',
        estado: '',
        cep: '',
      }
    const parts = endereco.split(', ').map((p) => p.trim())
    const cepPart = parts.find((p) => p.startsWith('CEP:'))
    const withoutCep = parts.filter((p) => !p.startsWith('CEP:'))
    return {
      logradouro: withoutCep[0] || '',
      numero: withoutCep[1] || '',
      complemento: withoutCep[2] || '',
      bairro: withoutCep[3] || '',
      cidade: withoutCep[4] || '',
      estado: withoutCep[5] || '',
      cep: cepPart ? cepPart.replace('CEP: ', '') : '',
    }
  }

  const parsed = parseEndereco(prospect.endereco)

  const baseValues: CaptacaoFormValues =
    tipoPessoa === 'PJ'
      ? {
          tipo_pessoa: 'PJ',
          empresa: prospect.empresa || '',
          razao_social: prospect.razao_social || '',
          cnpj: prospect.cnpj || '',
          contato_nome: prospect.contato_nome || '',
          email: prospect.email || '',
          telefone: prospect.telefone || '',
          logradouro: parsed.logradouro,
          numero: parsed.numero,
          complemento: parsed.complemento,
          bairro: parsed.bairro,
          cidade: parsed.cidade,
          estado: parsed.estado,
          cep: parsed.cep,
          classificacao: prospect.classificacao || 'Frio',
          observacoes: prospect.observacoes || '',
        }
      : {
          tipo_pessoa: 'PF',
          empresa: prospect.empresa || '',
          contato_nome: prospect.contato_nome || '',
          cpf: prospect.cpf || '',
          nome_mae: prospect.nome_mae || '',
          nome_pai: prospect.nome_pai || '',
          data_nascimento: prospect.data_nascimento || '',
          email: prospect.email || '',
          telefone: prospect.telefone || '',
          logradouro: parsed.logradouro,
          numero: parsed.numero,
          complemento: parsed.complemento,
          bairro: parsed.bairro,
          cidade: parsed.cidade,
          estado: parsed.estado,
          cep: parsed.cep,
          classificacao: prospect.classificacao || 'Frio',
          observacoes: prospect.observacoes || '',
        }

  return (
    <div className="w-full">
      <div className="flex gap-2 mb-4 bg-slate-100 rounded-lg p-1">
        <button
          type="button"
          onClick={() => setTipoPessoa('PJ')}
          className={`flex-1 text-sm font-medium py-1.5 px-3 rounded-md transition-all ${
            tipoPessoa === 'PJ'
              ? 'bg-white shadow-sm text-slate-900'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          Pessoa Jurídica (PJ)
        </button>
        <button
          type="button"
          onClick={() => setTipoPessoa('PF')}
          className={`flex-1 text-sm font-medium py-1.5 px-3 rounded-md transition-all ${
            tipoPessoa === 'PF'
              ? 'bg-white shadow-sm text-slate-900'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          Pessoa Física (PF)
        </button>
      </div>
      <CaptacaoForm
        key={tipoPessoa + prospect.id}
        onSubmit={onSubmit}
        isSubmitting={isSubmitting}
      />
      <InitialValuesSetter values={baseValues} onSubmit={onSubmit} isSubmitting={isSubmitting} />
    </div>
  )
}

function InitialValuesSetter({
  values,
  onSubmit,
  isSubmitting,
}: {
  values: CaptacaoFormValues
  onSubmit: (v: CaptacaoFormValues) => void
  isSubmitting?: boolean
}) {
  const [localValues, setLocalValues] = useState<CaptacaoFormValues>(values)
  const [tipoPessoa, setTipoPessoa] = useState<'PJ' | 'PF'>(values.tipo_pessoa)

  useEffect(() => {
    setLocalValues(values)
    setTipoPessoa(values.tipo_pessoa)
  }, [values])

  return (
    <InlineEditForm
      tipoPessoa={tipoPessoa}
      setTipoPessoa={setTipoPessoa}
      initial={localValues}
      onSubmit={onSubmit}
      isSubmitting={isSubmitting}
    />
  )
}

function InlineEditForm({
  tipoPessoa,
  setTipoPessoa,
  initial,
  onSubmit,
  isSubmitting,
}: {
  tipoPessoa: 'PJ' | 'PF'
  setTipoPessoa: (v: 'PJ' | 'PF') => void
  initial: CaptacaoFormValues
  onSubmit: (v: CaptacaoFormValues) => void
  isSubmitting?: boolean
}) {
  const [form, setForm] = useState<CaptacaoFormValues>(initial)

  useEffect(() => {
    setForm(initial)
  }, [initial])

  const update = (field: string, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }) as CaptacaoFormValues)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit(form)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div className="flex gap-2 mb-2 bg-slate-100 rounded-lg p-1">
        <button
          type="button"
          onClick={() => {
            setTipoPessoa('PJ')
            setForm((prev) => ({ ...prev, tipo_pessoa: 'PJ' }) as CaptacaoFormValues)
          }}
          className={`flex-1 text-sm font-medium py-1.5 px-3 rounded-md transition-all ${
            tipoPessoa === 'PJ' ? 'bg-white shadow-sm text-slate-900' : 'text-slate-600'
          }`}
        >
          Pessoa Jurídica (PJ)
        </button>
        <button
          type="button"
          onClick={() => {
            setTipoPessoa('PF')
            setForm((prev) => ({ ...prev, tipo_pessoa: 'PF' }) as CaptacaoFormValues)
          }}
          className={`flex-1 text-sm font-medium py-1.5 px-3 rounded-md transition-all ${
            tipoPessoa === 'PF' ? 'bg-white shadow-sm text-slate-900' : 'text-slate-600'
          }`}
        >
          Pessoa Física (PF)
        </button>
      </div>

      {tipoPessoa === 'PJ' ? (
        <>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-sm font-medium text-slate-700">CNPJ</label>
              <Input
                value={(form as any).cnpj || ''}
                onChange={(e) => update('cnpj', e.target.value)}
                placeholder="00.000.000/0001-00"
                className="mt-1"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700">Nome Fantasia *</label>
              <Input
                value={(form as any).empresa || ''}
                onChange={(e) => update('empresa', e.target.value)}
                placeholder="Nome Fantasia"
                className="mt-1"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-sm font-medium text-slate-700">Razão Social</label>
              <Input
                value={(form as any).razao_social || ''}
                onChange={(e) => update('razao_social', e.target.value)}
                placeholder="Razão Social"
                className="mt-1"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700">Responsável *</label>
              <Input
                value={form.contato_nome || ''}
                onChange={(e) => update('contato_nome', e.target.value)}
                placeholder="Responsável"
                className="mt-1"
              />
            </div>
          </div>
        </>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-sm font-medium text-slate-700">Nome Completo *</label>
              <Input
                value={form.contato_nome || ''}
                onChange={(e) => update('contato_nome', e.target.value)}
                placeholder="Nome completo"
                className="mt-1"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700">CPF</label>
              <Input
                value={(form as any).cpf || ''}
                onChange={(e) => update('cpf', e.target.value)}
                placeholder="000.000.000-00"
                className="mt-1"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-sm font-medium text-slate-700">Nome da Mãe</label>
              <Input
                value={(form as any).nome_mae || ''}
                onChange={(e) => update('nome_mae', e.target.value)}
                placeholder="Nome da mãe"
                className="mt-1"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700">Nome do Pai</label>
              <Input
                value={(form as any).nome_pai || ''}
                onChange={(e) => update('nome_pai', e.target.value)}
                placeholder="Nome do pai"
                className="mt-1"
              />
            </div>
          </div>
          <div>
            <label className="text-sm font-medium text-slate-700">Data de Nascimento</label>
            <Input
              type="date"
              value={(form as any).data_nascimento || ''}
              onChange={(e) => update('data_nascimento', e.target.value)}
              className="mt-1"
            />
          </div>
        </>
      )}

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-sm font-medium text-slate-700">E-mail</label>
          <Input
            value={form.email || ''}
            onChange={(e) => update('email', e.target.value)}
            placeholder="email@exemplo.com"
            className="mt-1"
          />
        </div>
        <div>
          <label className="text-sm font-medium text-slate-700">Telefone</label>
          <Input
            value={form.telefone || ''}
            onChange={(e) => update('telefone', e.target.value)}
            placeholder="(00) 00000-0000"
            className="mt-1"
          />
        </div>
      </div>

      <div className="border-t border-slate-100 pt-3">
        <span className="text-sm font-semibold text-slate-700">Endereço</span>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-sm font-medium text-slate-700">CEP</label>
          <Input
            value={(form as any).cep || ''}
            onChange={(e) => update('cep', e.target.value)}
            placeholder="00000-000"
            className="mt-1"
          />
        </div>
        <div>
          <label className="text-sm font-medium text-slate-700">Rua / Logradouro</label>
          <Input
            value={(form as any).logradouro || ''}
            onChange={(e) => update('logradouro', e.target.value)}
            placeholder="Rua"
            className="mt-1"
          />
        </div>
      </div>
      <div className="grid grid-cols-3 gap-3">
        <div>
          <label className="text-sm font-medium text-slate-700">Número</label>
          <Input
            value={(form as any).numero || ''}
            onChange={(e) => update('numero', e.target.value)}
            placeholder="Nº"
            className="mt-1"
          />
        </div>
        <div>
          <label className="text-sm font-medium text-slate-700">Complemento</label>
          <Input
            value={(form as any).complemento || ''}
            onChange={(e) => update('complemento', e.target.value)}
            placeholder="Complemento"
            className="mt-1"
          />
        </div>
        <div>
          <label className="text-sm font-medium text-slate-700">Bairro</label>
          <Input
            value={(form as any).bairro || ''}
            onChange={(e) => update('bairro', e.target.value)}
            placeholder="Bairro"
            className="mt-1"
          />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-sm font-medium text-slate-700">Cidade</label>
          <Input
            value={(form as any).cidade || ''}
            onChange={(e) => update('cidade', e.target.value)}
            placeholder="Cidade"
            className="mt-1"
          />
        </div>
        <div>
          <label className="text-sm font-medium text-slate-700">Estado</label>
          <Input
            value={(form as any).estado || ''}
            onChange={(e) => update('estado', e.target.value)}
            placeholder="UF"
            maxLength={2}
            className="mt-1"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-sm font-medium text-slate-700">Classificação</label>
          <Input
            value={(form as any).classificacao || ''}
            onChange={(e) => update('classificacao', e.target.value)}
            placeholder="Frio, Morno, Quente..."
            className="mt-1"
          />
        </div>
        <div>
          <label className="text-sm font-medium text-slate-700">Observações</label>
          <Input
            value={(form as any).observacoes || ''}
            onChange={(e) => update('observacoes', e.target.value)}
            placeholder="Observações"
            className="mt-1"
          />
        </div>
      </div>

      <div className="pt-2 flex justify-end">
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Salvando...' : 'Salvar Alterações'}
        </Button>
      </div>
    </form>
  )
}
