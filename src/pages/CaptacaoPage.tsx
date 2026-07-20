import { useState, useEffect } from 'react'
import { Plus, Search, Pencil, Trash2, User, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { useToast } from '@/hooks/use-toast'
import { supabase } from '@/lib/supabase/client'
import { CaptacaoForm, CaptacaoFormValues } from '@/components/CaptacaoForm'
import { composeEndereco } from '@/lib/cpf-utils'
import { cn } from '@/lib/utils'

interface CaptacaoProspect {
  id: string
  cpf: string | null
  empresa: string
  contato_nome: string
  telefone: string | null
  email: string | null
  status: string
  endereco: string | null
  nome_mae: string | null
  nome_pai: string | null
  data_nascimento: string | null
  classificacao: string | null
  ultima_interacao: string | null
}

export default function CaptacaoPage() {
  const [prospects, setProspects] = useState<CaptacaoProspect[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingProspect, setEditingProspect] = useState<CaptacaoProspect | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { toast } = useToast()

  const fetchProspects = async () => {
    setIsLoading(true)
    const { data, error } = await supabase
      .from('crm_prospects')
      .select('*')
      .eq('tipo_pessoa', 'PF')
      .order('ultima_interacao', { ascending: false })
    if (!error && data) setProspects(data as CaptacaoProspect[])
    setIsLoading(false)
  }

  useEffect(() => {
    fetchProspects()
  }, [])

  const onSubmit = async (values: CaptacaoFormValues) => {
    setIsSubmitting(true)

    const enderecoComposto =
      values.tipo_pessoa === 'PF'
        ? composeEndereco({
            logradouro: values.logradouro,
            numero: values.numero,
            complemento: values.complemento,
            bairro: values.bairro,
            cidade: values.cidade,
            estado: values.estado,
            cep: values.cep,
          })
        : undefined

    const { error } = await supabase.from('crm_prospects').insert([
      {
        tipo_pessoa: values.tipo_pessoa,
        cpf: values.tipo_pessoa === 'PF' ? values.cpf || null : null,
        cnpj: values.tipo_pessoa === 'PJ' ? values.cnpj || null : null,
        razao_social: values.tipo_pessoa === 'PJ' ? values.razao_social || null : null,
        empresa: values.empresa,
        endereco: enderecoComposto || values.logradouro || null,
        contato_nome: values.contato_nome,
        telefone: values.telefone || null,
        email: values.email || null,
        status: 'Novo Lead',
        classificacao: values.classificacao || 'Frio',
        observacoes: values.observacoes || null,
        nome_mae: values.tipo_pessoa === 'PF' ? values.nome_mae || null : null,
        nome_pai: values.tipo_pessoa === 'PF' ? values.nome_pai || null : null,
        data_nascimento: values.tipo_pessoa === 'PF' ? values.data_nascimento || null : null,
      },
    ])
    setIsSubmitting(false)
    if (error)
      return toast({ title: 'Erro ao salvar', description: error.message, variant: 'destructive' })
    toast({ title: 'Sucesso', description: 'Lead cadastrado com sucesso!' })
    setIsDialogOpen(false)
    fetchProspects()
  }

  const onEditSubmit = async (values: CaptacaoFormValues) => {
    if (!editingProspect) return
    setIsSubmitting(true)

    const enderecoComposto =
      values.tipo_pessoa === 'PF'
        ? composeEndereco({
            logradouro: values.logradouro,
            numero: values.numero,
            complemento: values.complemento,
            bairro: values.bairro,
            cidade: values.cidade,
            estado: values.estado,
            cep: values.cep,
          })
        : undefined

    const { error } = await supabase
      .from('crm_prospects')
      .update({
        tipo_pessoa: values.tipo_pessoa,
        cpf: values.tipo_pessoa === 'PF' ? values.cpf || null : null,
        cnpj: values.tipo_pessoa === 'PJ' ? values.cnpj || null : null,
        razao_social: values.tipo_pessoa === 'PJ' ? values.razao_social || null : null,
        empresa: values.empresa,
        endereco: enderecoComposto || values.logradouro || editingProspect.endereco || null,
        contato_nome: values.contato_nome,
        telefone: values.telefone || null,
        email: values.email || null,
        classificacao: values.classificacao || 'Frio',
        observacoes: values.observacoes || null,
        nome_mae: values.tipo_pessoa === 'PF' ? values.nome_mae || null : null,
        nome_pai: values.tipo_pessoa === 'PF' ? values.nome_pai || null : null,
        data_nascimento: values.tipo_pessoa === 'PF' ? values.data_nascimento || null : null,
        ultima_interacao: new Date().toISOString(),
      })
      .eq('id', editingProspect.id)
    setIsSubmitting(false)
    if (error)
      return toast({
        title: 'Erro ao atualizar',
        description: error.message,
        variant: 'destructive',
      })
    toast({ title: 'Sucesso', description: 'Lead atualizado com sucesso!' })
    setEditingProspect(null)
    fetchProspects()
  }

  const handleDelete = async (id: string) => {
    if (!window.confirm('Tem certeza que deseja excluir este lead?')) return
    const { error } = await supabase.from('crm_prospects').delete().eq('id', id)
    if (error)
      return toast({ title: 'Erro ao excluir', description: error.message, variant: 'destructive' })
    toast({ title: 'Sucesso', description: 'Lead excluído com sucesso!' })
    fetchProspects()
  }

  const filtered = prospects.filter(
    (p) =>
      p.empresa.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.contato_nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (p.cpf || '').includes(searchTerm),
  )

  const getStatusColor = (s: string) => {
    if (s === 'Novo Lead') return 'bg-sky-100 text-sky-800 border-sky-200'
    if (s === 'Contato inicial') return 'bg-blue-100 text-blue-800 border-blue-200'
    if (s === 'Em negociação') return 'bg-orange-100 text-orange-800 border-orange-200'
    if (s === 'Cliente Efetivado') return 'bg-emerald-100 text-emerald-800 border-emerald-200'
    if (s === 'Perdido') return 'bg-red-100 text-red-800 border-red-200'
    return 'bg-slate-100 text-slate-800 border-slate-200'
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Captação de Leads (Pessoa Física)</h1>
          <p className="text-muted-foreground mt-1">
            Cadastre leads de Pessoa Física com busca automática por CPF.
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <Button className="gap-2" onClick={() => setIsDialogOpen(true)}>
            <Plus className="h-4 w-4" /> Novo Lead PF
          </Button>
          <DialogContent className="sm:max-w-[550px] max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Novo Lead (Pessoa Física)</DialogTitle>
              <DialogDescription>Digite o CPF para preenchimento automático.</DialogDescription>
            </DialogHeader>
            <CaptacaoForm onSubmit={onSubmit} isSubmitting={isSubmitting} defaultTipoPessoa="PF" />
          </DialogContent>
        </Dialog>
      </div>

      <div className="relative w-full sm:w-80">
        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Buscar por nome, CPF..."
          className="pl-9 h-9 bg-white shadow-sm border-slate-200"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      <Card className="border-slate-200/60 shadow-sm">
        <CardHeader className="pb-3 border-b border-slate-100">
          <CardTitle className="text-lg">Leads Pessoa Física</CardTitle>
          <CardDescription>Total: {filtered.length} lead(s)</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-slate-50/50">
              <TableRow>
                <TableHead className="w-[280px]">Nome</TableHead>
                <TableHead>CPF</TableHead>
                <TableHead>Contato</TableHead>
                <TableHead>Status</TableHead>
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
                    Nenhum lead encontrado.
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((p) => (
                  <TableRow key={p.id} className="hover:bg-slate-50/80 transition-colors">
                    <TableCell className="font-medium text-slate-900">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center shrink-0">
                          <User className="h-4 w-4 text-indigo-600" />
                        </div>
                        <div className="flex flex-col">
                          <span>{p.empresa}</span>
                          {p.data_nascimento && (
                            <span className="text-xs text-muted-foreground">
                              Nasc:{' '}
                              {new Date(p.data_nascimento + 'T12:00:00Z').toLocaleDateString(
                                'pt-BR',
                              )}
                            </span>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">{p.cpf || '-'}</TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="text-sm">{p.contato_nome}</span>
                        {p.telefone && (
                          <span className="text-xs text-muted-foreground">{p.telefone}</span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={cn(
                          'rounded-full text-xs font-semibold',
                          getStatusColor(p.status),
                        )}
                      >
                        {p.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-slate-400 hover:text-blue-600 hover:bg-blue-50"
                          onClick={() => setEditingProspect(p)}
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
        </CardContent>
      </Card>

      <Dialog open={!!editingProspect} onOpenChange={(open) => !open && setEditingProspect(null)}>
        <DialogContent className="sm:max-w-[550px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Editar Lead</DialogTitle>
            <DialogDescription>Atualize as informações do lead.</DialogDescription>
          </DialogHeader>
          {editingProspect && (
            <CaptacaoForm
              onSubmit={onEditSubmit}
              isSubmitting={isSubmitting}
              defaultTipoPessoa="PF"
              initialData={{
                tipo_pessoa: 'PF',
                cpf: editingProspect.cpf || '',
                empresa: editingProspect.empresa,
                logradouro: editingProspect.endereco || '',
                contato_nome: editingProspect.contato_nome,
                telefone: editingProspect.telefone || '',
                email: editingProspect.email || '',
                classificacao: editingProspect.classificacao || 'Frio',
                observacoes: editingProspect.observacoes || '',
                nome_mae: editingProspect.nome_mae || '',
                nome_pai: editingProspect.nome_pai || '',
                data_nascimento: editingProspect.data_nascimento || '',
              }}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
