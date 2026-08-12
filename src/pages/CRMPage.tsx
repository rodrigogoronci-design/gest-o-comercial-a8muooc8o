import { useState, useEffect, useMemo } from 'react'
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
  Stethoscope,
  History,
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
import { CrmProspectPropostasTab } from '@/components/CrmProspectPropostasTab'
import { TableActionsMenu } from '@/components/TableActionsMenu'
import { SectionNav, type SectionNavItem } from '@/components/section-nav'
import { CollapsibleSection } from '@/components/collapsible-section'

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
  data_assinatura?: string | null
  cliente_id?: string | null
  plano_id?: string | null
  contrato_assinado_url?: string | null
  tipo_pessoa?: string | null
  cpf?: string | null
  nome_mae?: string | null
  nome_pai?: string | null
  data_nascimento?: string | null
  plano_apresentado?: string | null
  plano_contratado?: string | null
  modulos_contratados?: any[] | null
  quantidade_uso?: number | null
  observacoes_comerciais?: string | null
  responsavel_comercial?: string | null
  contrato_assinado?: boolean | null
  documentos_adesao?: any[] | null
  razao_social?: string | null
  ata_primeiro_atendimento?: string | null
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
  const [sendingEmailData, setSendingEmailData] = useState<{
    prospect: CrmProspect
    proposal: any | null
  } | null>(null)
  const [sendingEmail, setSendingEmail] = useState(false)
  const { toast } = useToast()
  const { user } = useAuth()

  const toggleExpand = (id: string) => {
    setExpandedRows((prev) => ({ ...prev, [id]: !prev[id] }))
  }

  const handleUpdatePropostaInline = async (id: string, updates: any) => {
    try {
      const { error } = await supabase.from('crm_propostas').update(updates).eq('id', id)
      if (error) throw error
      setAllProposals((prev) =>
        prev.map((prop) => (prop.id === id ? { ...prop, ...updates } : prop)),
      )
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
    const props = allProposals.filter((prop) => prop.prospect_id === p.id)
    const latestProp = props.length > 0 ? props[0] : null

    setSendingEmailData({ prospect: p, proposal: latestProp })
  }

  const handleConfirmSendProposal = async () => {
    if (!sendingEmailData) return
    const { prospect, proposal } = sendingEmailData
    setSendingEmail(true)

    const senderName = user?.user_metadata?.name || 'Comercial'

    const { error } = await supabase.functions.invoke('send-crm-proposal', {
      body: {
        to: prospect.email,
        companyName: prospect.empresa,
        contactName: prospect.contato_nome,
        senderName: senderName,
        proposalId: proposal?.id,
        proposalUrl: proposal?.documento_url || prospect.proposta_url,
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
          prospect_id: prospect.id,
          tipo_contato: 'E-mail',
          resumo: 'Envio de Proposta',
          detalhes: 'Proposta comercial enviada por e-mail com sucesso.',
        },
      ])

      if (proposal?.id) {
        await supabase
          .from('crm_propostas')
          .update({
            status_negociacao: 'Enviada',
            data_envio: new Date().toISOString(),
          })
          .eq('id', proposal.id)
      }

      setSendingEmailData(null)
      fetchProspects()
    }
  }

  const handleEfetivarCliente = async (p: CrmProspect) => {
    const hasDocs = p.documentos_adesao && p.documentos_adesao.length > 0
    if (hasDocs) {
      const confirmed = window.confirm(
        'Os documentos de adesão serão transferidos para o novo cliente. Deseja continuar?',
      )
      if (!confirmed) return
    }
    if (!p.contrato_assinado_url) {
      return toast({
        title: 'Contrato assinado obrigatório',
        description:
          'Faça o upload do contrato assinado na aba Diagnóstico antes de efetivar o cliente.',
        variant: 'destructive',
      })
    }

    if (p.cliente_id) {
      setIsSubmitting(true)
      const diagExisting = (p.diagnostico as any) || {}
      const modulosExisting = Array.isArray(diagExisting.modulos_adicionais)
        ? diagExisting.modulos_adicionais
            .filter((m: any) => m.selecionado)
            .map((m: any) => ({ id: m.id, nome: m.nome, valor: m.valor_negociado }))
        : []
      await supabase
        .from('clientes')
        .update({
          nome: p.empresa,
          email: p.email,
          telefone: p.telefone,
          endereco: p.endereco,
          diagnostico: p.diagnostico,
          tags: p.tags,
          contrato_url: p.contrato_assinado_url,
          valor_implantacao: diagExisting.valor_implantacao || 0,
          valor_total: diagExisting.valor_total || diagExisting.valor_total_mensal || 0,
          desconto_mensalidade: diagExisting.desconto_mensalidade || 0,
          tipo_desconto: diagExisting.tipo_desconto || 'valor',
          modulos: modulosExisting,
          plano_id: p.plano_id || null,
          documentos_urls: [...(p.documentos_adesao || [])],
        })
        .eq('id', p.cliente_id)
      await supabase
        .from('crm_prospects')
        .update({
          status: 'Cliente Efetivado',
          ultima_interacao: new Date().toISOString(),
          data_assinatura: new Date().toISOString().split('T')[0],
          cliente_id: p.cliente_id,
        })
        .eq('id', p.id)
      await supabase
        .from('crm_propostas')
        .update({ cliente_id: p.cliente_id })
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
        description: 'Prospecto marcado como cliente efetivado!',
      })
      fetchProspects()
      return
    }

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

    const diag = (p.diagnostico as any) || {}
    const modulosFromDiag = Array.isArray(diag.modulos_adicionais)
      ? diag.modulos_adicionais
          .filter((m: any) => m.selecionado)
          .map((m: any) => ({ id: m.id, nome: m.nome, valor: m.valor_negociado }))
      : []

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
          contrato_url: p.contrato_assinado_url,
          documentos_urls: p.proposta_url ? [p.proposta_url] : [],
          valor_implantacao: diag.valor_implantacao || 0,
          valor_total: diag.valor_total || diag.valor_total_mensal || 0,
          desconto_mensalidade: diag.desconto_mensalidade || 0,
          tipo_desconto: diag.tipo_desconto || 'valor',
          modulos: modulosFromDiag,
          plano_id: p.plano_id || null,
          documentos_urls: [...(p.documentos_adesao || [])],
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
      .update({
        status: 'Cliente Efetivado',
        ultima_interacao: new Date().toISOString(),
        data_assinatura: new Date().toISOString().split('T')[0],
        cliente_id: newClient.id,
      })
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
      .select(
        'id, prospect_id, data_proposta, valor_mensalidade, valor_implantacao, status_negociacao, data_envio, documento_url',
      )
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
        cpf: values.cpf || null,
        tipo_pessoa: values.tipo_pessoa || 'PJ',
        empresa: values.empresa,
        endereco: values.endereco || null,
        contato_nome: values.contato_nome,
        telefone: values.telefone || null,
        email: values.email || null,
        status: values.status,
        classificacao: values.classificacao || 'Frio',
        data_followup: values.data_followup || null,
        observacoes: values.observacoes || null,
        data_assinatura: values.data_assinatura || null,
        nome_mae: values.nome_mae || null,
        nome_pai: values.nome_pai || null,
        data_nascimento: values.data_nascimento || null,
        plano_apresentado: values.plano_apresentado || null,
        plano_contratado: values.plano_contratado || null,
        modulos_contratados: values.modulos_contratados || [],
        quantidade_uso: values.quantidade_uso ?? null,
        observacoes_comerciais: values.observacoes_comerciais || null,
        responsavel_comercial: values.responsavel_comercial || null,
        contrato_assinado: values.contrato_assinado ?? false,
        proposta_url: values.proposta_url || null,
        documentos_adesao: values.documentos_adesao || [],
        razao_social: values.razao_social || null,
        ata_primeiro_atendimento: values.ata_primeiro_atendimento || null,
      },
    ])
    setIsSubmitting(false)
    if (error)
      return toast({ title: 'Erro ao salvar', description: error.message, variant: 'destructive' })
    const docCount = Array.isArray(values.documentos_adesao) ? values.documentos_adesao.length : 0
    const hasProp = !!values.proposta_url
    toast({
      title: 'Sucesso',
      description:
        docCount > 0 || hasProp
          ? `Contato salvo! ${docCount} documento(s) de adesão${hasProp ? ' e proposta anexada' : ''}.`
          : 'Contato adicionado com sucesso!',
    })
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
        cpf: values.cpf || null,
        tipo_pessoa: values.tipo_pessoa || 'PJ',
        empresa: values.empresa,
        endereco: values.endereco || null,
        contato_nome: values.contato_nome,
        telefone: values.telefone || null,
        email: values.email || null,
        status: values.status,
        classificacao: values.classificacao || 'Frio',
        data_followup: values.data_followup || null,
        observacoes: values.observacoes || null,
        data_assinatura: values.data_assinatura || null,
        nome_mae: values.nome_mae || null,
        nome_pai: values.nome_pai || null,
        data_nascimento: values.data_nascimento || null,
        plano_apresentado: values.plano_apresentado || null,
        plano_contratado: values.plano_contratado || null,
        modulos_contratados: values.modulos_contratados || [],
        quantidade_uso: values.quantidade_uso ?? null,
        observacoes_comerciais: values.observacoes_comerciais || null,
        responsavel_comercial: values.responsavel_comercial || null,
        contrato_assinado: values.contrato_assinado ?? false,
        proposta_url: values.proposta_url || null,
        documentos_adesao: values.documentos_adesao || [],
        razao_social: values.razao_social || null,
        ata_primeiro_atendimento: values.ata_primeiro_atendimento || null,
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
    const editDocCount = Array.isArray(values.documentos_adesao)
      ? values.documentos_adesao.length
      : 0
    const editHasProp = !!values.proposta_url
    toast({
      title: 'Sucesso',
      description:
        editDocCount > 0 || editHasProp
          ? `Contato atualizado! ${editDocCount} documento(s) preservado(s)${editHasProp ? ' e proposta anexada' : ''}.`
          : 'Contato atualizado com sucesso!',
    })
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
    const { data, error } = await supabase
      .from('crm_prospects')
      .update({ status: newStatus, ultima_interacao: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single()
    if (error) return toast({ title: 'Erro', description: error.message, variant: 'destructive' })

    await supabase.from('crm_historico_interacoes').insert([
      {
        prospect_id: id,
        tipo_contato: 'Sistema',
        resumo: `Mudança de Fase: ${newStatus}`,
        detalhes: `Lead movido da fase "${oldStatus}" para "${newStatus}".`,
      },
    ])

    if (newStatus === 'Enviado para Implantação') {
      if (data?.cliente_id) {
        toast({
          title: 'Cliente ativado com sucesso!',
          description: (
            <div className="flex flex-col gap-1 mt-1">
              <span>Prospect registrado como cliente no sistema.</span>
              <Link to="/clientes" className="text-indigo-600 underline font-medium">
                Ver Cliente
              </Link>
            </div>
          ),
        })
      } else {
        toast({
          title: 'Status atualizado',
          description: 'Cadastre o CNPJ do prospect para ativar o cliente automaticamente.',
        })
      }
    }

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
    if (s === 'Enviado para Implantação')
      return 'bg-teal-100 text-teal-800 hover:bg-teal-200 border-teal-200'
    if (s === 'Contrato assinado')
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
      !['Enviado para Implantação', 'Cliente Efetivado', 'Perdido'].includes(p.status),
  )

  const editingInitialData = useMemo(() => {
    if (!editingProspect) return undefined
    return {
      id: editingProspect.id,
      cnpj: editingProspect.cnpj || '',
      cpf: editingProspect.cpf || '',
      tipo_pessoa: editingProspect.tipo_pessoa || 'PJ',
      empresa: editingProspect.empresa,
      endereco: editingProspect.endereco || '',
      contato_nome: editingProspect.contato_nome,
      telefone: editingProspect.telefone || '',
      email: editingProspect.email || '',
      status: editingProspect.status,
      classificacao: editingProspect.classificacao || 'Frio',
      data_followup: editingProspect.data_followup || '',
      observacoes: editingProspect.observacoes || '',
      data_assinatura: editingProspect.data_assinatura || '',
      nome_mae: editingProspect.nome_mae || '',
      nome_pai: editingProspect.nome_pai || '',
      data_nascimento: editingProspect.data_nascimento || '',
      plano_apresentado: editingProspect.plano_apresentado || '',
      plano_contratado: editingProspect.plano_contratado || '',
      modulos_contratados: editingProspect.modulos_contratados || [],
      quantidade_uso: editingProspect.quantidade_uso ?? undefined,
      observacoes_comerciais: editingProspect.observacoes_comerciais || '',
      responsavel_comercial: editingProspect.responsavel_comercial || '',
      contrato_assinado: editingProspect.contrato_assinado ?? false,
      proposta_url: editingProspect.proposta_url || null,
      plano_id: editingProspect.plano_id || null,
      contrato_assinado_url: editingProspect.contrato_assinado_url || null,
      documentos_adesao: editingProspect.documentos_adesao || [],
      razao_social: editingProspect.razao_social || '',
      ata_primeiro_atendimento: editingProspect.ata_primeiro_atendimento || '',
    }
  }, [editingProspect])

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
          <DialogContent className="sm:max-w-[550px] rounded-xl border-slate-200/80 shadow-[0_4px_24px_rgba(0,0,0,0.06)]">
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
          <CardContent className="p-0 table-scroll-wrapper">
            <Table>
              <TableHeader className="bg-slate-50/50">
                <TableRow>
                  <TableHead className="w-[280px]">Empresa</TableHead>
                  <TableHead>Contato</TableHead>
                  <TableHead>Follow-up</TableHead>
                  <TableHead>Classificação</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right sticky-actions-right bg-slate-50/50">
                    Ações
                  </TableHead>
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
                    const props = allProposals.filter((prop) => prop.prospect_id === p.id)
                    const hasProps = props.length > 0
                    const isExpanded = expandedRows[p.id]

                    return (
                      <React.Fragment key={p.id}>
                        <TableRow className="hover:bg-slate-50/80 transition-colors">
                          <TableCell className="font-medium text-slate-900">
                            <div className="flex items-start gap-2">
                              {hasProps ? (
                                <button
                                  onClick={() => toggleExpand(p.id)}
                                  className="mt-0.5 text-slate-400 hover:text-indigo-600 transition-colors"
                                >
                                  {isExpanded ? (
                                    <ChevronDown className="h-4 w-4" />
                                  ) : (
                                    <ChevronRight className="h-4 w-4" />
                                  )}
                                </button>
                              ) : (
                                <div className="w-4" />
                              )}
                              <div className="flex flex-col">
                                <span>{p.empresa}</span>
                                {p.cnpj && (
                                  <span className="text-xs text-muted-foreground mt-0.5">
                                    {p.cnpj}
                                  </span>
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
                                    ![
                                      'Enviado para Implantação',
                                      'Cliente Efetivado',
                                      'Perdido',
                                    ].includes(p.status)
                                    ? 'text-red-600'
                                    : p.data_followup === today &&
                                        ![
                                          'Enviado para Implantação',
                                          'Cliente Efetivado',
                                          'Perdido',
                                        ].includes(p.status)
                                      ? 'text-amber-600'
                                      : 'text-muted-foreground',
                                )}
                              >
                                <CalendarClock className="h-3.5 w-3.5" />
                                {new Date(p.data_followup + 'T12:00:00Z').toLocaleDateString(
                                  'pt-BR',
                                )}
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
                            {p.data_assinatura && (
                              <div
                                className="text-[10px] text-emerald-600 font-medium mt-0.5"
                                title="Data da Assinatura do Contrato"
                              >
                                Assinatura: {formatDate(p.data_assinatura)}
                              </div>
                            )}
                          </TableCell>
                          <TableCell>
                            <Select
                              defaultValue={p.classificacao || 'Frio'}
                              onValueChange={(val) =>
                                updateClassificacao(p.id, val, p.classificacao)
                              }
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
                                  'Enviado para Implantação',
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
                                <SelectItem value="Enviado para Implantação">
                                  Enviado para Implantação
                                </SelectItem>
                                <SelectItem value="Cliente Efetivado">Cliente Efetivado</SelectItem>
                                <SelectItem value="Perdido">Perdido</SelectItem>
                              </SelectContent>
                            </Select>
                          </TableCell>
                          <TableCell className="text-right sticky-actions-right bg-white">
                            <div className="flex items-center justify-end gap-1">
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
                              <TableActionsMenu
                                items={[
                                  ...(p.status !== 'Cliente Efetivado'
                                    ? [
                                        {
                                          icon: UserCheck,
                                          label: 'Efetivar Cliente',
                                          onClick: () => handleEfetivarCliente(p),
                                          disabled: isSubmitting,
                                        },
                                      ]
                                    : []),
                                  {
                                    icon: FileSignature,
                                    label: 'Gerar Contrato',
                                    to: `/contratos?prospect=${encodeURIComponent(p.empresa)}&cnpj=${p.cnpj ? p.cnpj.replace(/\D/g, '') : ''}`,
                                  },
                                  {
                                    icon: FileText,
                                    label: 'Gerar Proposta',
                                    to: `/contratos?tab=cotacao&prospectId=${p.id}&prospect=${encodeURIComponent(p.empresa)}&contato=${encodeURIComponent(p.contato_nome)}`,
                                  },
                                  {
                                    icon: Mail,
                                    label: 'Enviar Proposta',
                                    onClick: () => handleSendProposalClick(p),
                                  },
                                  {
                                    icon: Trash2,
                                    label: 'Excluir',
                                    onClick: () => handleDelete(p.id),
                                    variant: 'destructive' as const,
                                  },
                                ]}
                              />
                            </div>
                          </TableCell>
                        </TableRow>
                        {isExpanded && (
                          <TableRow className="bg-slate-50/50 hover:bg-slate-50/50">
                            <TableCell colSpan={6} className="p-0">
                              <div className="py-3 px-10 border-b border-slate-100 bg-indigo-50/30">
                                <h4 className="text-xs font-semibold text-slate-600 uppercase mb-3 tracking-wider flex items-center gap-1.5">
                                  <FileText className="w-3.5 h-3.5" /> Propostas Geradas
                                </h4>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                                  {props.map((prop) => (
                                    <div
                                      key={prop.id}
                                      className="bg-white p-3 rounded-lg border border-slate-200 shadow-sm flex flex-col gap-2"
                                    >
                                      <div className="flex justify-between items-center pb-2 border-b border-slate-100">
                                        <span className="text-sm font-medium text-slate-800">
                                          Data:{' '}
                                          {new Date(
                                            prop.data_proposta + 'T12:00:00Z',
                                          ).toLocaleDateString('pt-BR')}
                                        </span>
                                        <span className="text-xs font-semibold text-indigo-600">
                                          {prop.valor_mensalidade?.toLocaleString('pt-BR', {
                                            style: 'currency',
                                            currency: 'BRL',
                                          })}{' '}
                                          /mês
                                        </span>
                                      </div>
                                      <div className="grid grid-cols-2 gap-3 mt-1">
                                        <div className="space-y-1">
                                          <span className="text-[10px] uppercase text-slate-500 font-medium">
                                            Status
                                          </span>
                                          <Select
                                            value={prop.status_negociacao || 'Gerada'}
                                            onValueChange={(val) =>
                                              handleUpdatePropostaInline(prop.id, {
                                                status_negociacao: val,
                                              })
                                            }
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
                                          <span className="text-[10px] uppercase text-slate-500 font-medium">
                                            Envio
                                          </span>
                                          <Input
                                            type="date"
                                            className="h-7 text-xs bg-slate-50 px-2"
                                            value={
                                              prop.data_envio ? prop.data_envio.split('T')[0] : ''
                                            }
                                            onChange={(e) => {
                                              const val = e.target.value
                                              handleUpdatePropostaInline(prop.id, {
                                                data_envio: val
                                                  ? new Date(val + 'T12:00:00Z').toISOString()
                                                  : null,
                                              })
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
                    )
                  })
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      <Dialog open={!!editingProspect} onOpenChange={(open) => !open && setEditingProspect(null)}>
        <DialogContent className="sm:max-w-[800px] h-[90vh] md:h-[85vh] flex flex-col p-0 gap-0 rounded-xl border-slate-200/80 shadow-[0_4px_24px_rgba(0,0,0,0.06)]">
          <DialogHeader className="p-6 pb-4 shrink-0 border-b border-slate-200/80">
            <DialogTitle>Detalhes do Prospecto</DialogTitle>
            <DialogDescription>
              Atualize informações, preencha o diagnóstico e acompanhe o histórico.
            </DialogDescription>
            {editingProspect?.cliente_id && (
              <Button variant="outline" size="sm" asChild className="mt-2 w-fit">
                <Link to="/clientes">
                  <UserCheck className="h-3.5 w-3.5 mr-1.5" /> Ver Perfil do Cliente
                </Link>
              </Button>
            )}
          </DialogHeader>
          <div className="flex-1 overflow-y-auto p-6 pt-4 bg-slate-50/30 rounded-b-xl">
            <SectionNav
              items={[
                {
                  id: 'prospect-dados',
                  label: 'Dados Básicos',
                  icon: <FileText className="h-3.5 w-3.5" />,
                },
                {
                  id: 'prospect-diagnostico',
                  label: 'Diagnóstico',
                  icon: <Stethoscope className="h-3.5 w-3.5" />,
                },
                {
                  id: 'prospect-historico',
                  label: 'Histórico',
                  icon: <History className="h-3.5 w-3.5" />,
                },
                {
                  id: 'prospect-propostas',
                  label: 'Propostas',
                  icon: <FileSignature className="h-3.5 w-3.5" />,
                },
              ]}
            />
            <div className="space-y-3 mt-4">
              <CollapsibleSection
                id="prospect-dados"
                title="Dados Básicos"
                icon={<FileText className="h-4 w-4 text-indigo-600" />}
                defaultOpen
              >
                {editingProspect && (
                  <CrmProspectForm
                    onSubmit={onEditSubmit}
                    isSubmitting={isSubmitting}
                    onPropostaChange={fetchProspects}
                    initialData={editingInitialData}
                    hideInternalTabs
                  />
                )}
              </CollapsibleSection>

              <CollapsibleSection
                id="prospect-diagnostico"
                title="Diagnóstico"
                icon={<Stethoscope className="h-4 w-4 text-indigo-600" />}
              >
                {editingProspect && (
                  <CrmDiagnosticoForm
                    key={editingProspect.id}
                    prospectId={editingProspect.id}
                    initialPlanoId={editingProspect.plano_id}
                    initialPropostaUrl={editingProspect.proposta_url}
                    initialContratoUrl={editingProspect.contrato_assinado_url}
                    isEfetivado={editingProspect.status === 'Cliente Efetivado'}
                    onEfetivar={async () => {
                      if (!editingProspect) return
                      const { data: latest } = await supabase
                        .from('crm_prospects')
                        .select('*')
                        .eq('id', editingProspect.id)
                        .single()
                      if (latest) {
                        await handleEfetivarCliente(latest as CrmProspect)
                        setEditingProspect(null)
                      }
                    }}
                    onSave={() => {
                      fetchProspects()
                    }}
                  />
                )}
              </CollapsibleSection>

              <CollapsibleSection
                id="prospect-historico"
                title="Histórico de Interações"
                icon={<History className="h-4 w-4 text-indigo-600" />}
              >
                {editingProspect && <CrmHistorico prospectId={editingProspect.id} />}
              </CollapsibleSection>

              <CollapsibleSection
                id="prospect-propostas"
                title="Propostas"
                icon={<FileSignature className="h-4 w-4 text-indigo-600" />}
              >
                {editingProspect && (
                  <CrmProspectPropostasTab
                    prospectId={editingProspect.id}
                    prospectName={editingProspect.empresa}
                    propostaUrl={editingProspect.proposta_url || null}
                    onPropostaChange={fetchProspects}
                    onUrlChange={(url) => {
                      setEditingProspect((prev) => (prev ? { ...prev, proposta_url: url } : prev))
                    }}
                  />
                )}
              </CollapsibleSection>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={!!sendingEmailData} onOpenChange={(open) => !open && setSendingEmailData(null)}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Enviar Proposta por E-mail</DialogTitle>
            <DialogDescription>
              Revise a mensagem padrão antes de enviar para{' '}
              <strong>{sendingEmailData?.prospect.empresa}</strong>.
            </DialogDescription>
          </DialogHeader>

          {sendingEmailData && (
            <div className="space-y-4 py-4">
              <div className="flex flex-col gap-1.5">
                <span className="text-sm font-medium text-slate-700">Destinatário:</span>
                <Input
                  value={sendingEmailData.prospect.email || ''}
                  readOnly
                  className="bg-slate-50"
                />
              </div>

              {!(
                sendingEmailData.proposal?.documento_url || sendingEmailData.prospect.proposta_url
              ) ? (
                <Alert className="bg-amber-50 border-amber-200 text-amber-800">
                  <AlertTitle className="text-sm font-semibold">Atenção!</AlertTitle>
                  <AlertDescription className="text-xs">
                    Este prospecto ainda não possui uma proposta (PDF ou Link) vinculada. O e-mail
                    será enviado sem o link do anexo.
                  </AlertDescription>
                </Alert>
              ) : (
                <Alert className="bg-emerald-50 border-emerald-200 text-emerald-800">
                  <AlertTitle className="text-sm font-semibold">Documento Anexado</AlertTitle>
                  <AlertDescription className="text-xs flex items-center gap-1">
                    <FileText className="h-3.5 w-3.5" />O PDF da proposta será anexado
                    automaticamente ao e-mail.
                  </AlertDescription>
                </Alert>
              )}

              <div className="flex flex-col gap-1.5">
                <span className="text-sm font-medium text-slate-700">
                  Pré-visualização do e-mail:
                </span>
                <div className="border border-slate-200 rounded-md p-4 bg-slate-50 text-sm whitespace-pre-wrap font-sans text-slate-800 h-64 overflow-y-auto">
                  <strong>Assunto:</strong> Proposta Comercial – {sendingEmailData.prospect.empresa}
                  {'\n'}
                  <hr className="my-2 border-slate-200" />
                  Olá, {sendingEmailData.prospect.contato_nome}
                  {'\n\n'}
                  Conforme nossa conversa, encaminho em anexo a proposta comercial da Service Logic,
                  elaborada de acordo com as necessidades apresentadas pela{' '}
                  {sendingEmailData.prospect.empresa}
                  {'\n\n'}
                  Nossa solução foi desenvolvida para proporcionar mais controle, agilidade e
                  segurança na gestão da transportadora, integrando os processos operacionais,
                  financeiros, fiscais e logísticos em uma única plataforma.{'\n\n'}
                  Na proposta você encontrará todos os detalhes da solução, os módulos contemplados,
                  valores e as condições comerciais. Caso tenha qualquer dúvida ou deseje analisar
                  algum ponto em conjunto, estarei à disposição para apresentar a proposta e
                  esclarecer todas as informações necessárias.{'\n\n'}
                  Após a aprovação, seguiremos com as próximas etapas, que incluem a assinatura
                  eletrônica do contrato, envio da documentação, parametrização do sistema,
                  treinamentos e acompanhamento da implantação até o início da operação.{'\n\n'}
                  Agradeço pela oportunidade e fico no aguardo do seu retorno.{'\n\n'}
                  Atenciosamente,{'\n'}
                  {user?.user_metadata?.name || 'Comercial'}
                </div>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setSendingEmailData(null)}
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
