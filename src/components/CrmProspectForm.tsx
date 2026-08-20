import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { cn } from '@/lib/utils'
import { CrmProspectPropostasTab } from './CrmProspectPropostasTab'
import { CrmDiagnosticoForm } from './CrmDiagnosticoForm'
import { CrmHistorico } from './CrmHistorico'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { Loader2, UploadCloud, User, Building2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { useToast } from '@/hooks/use-toast'
import { supabase } from '@/lib/supabase/client'
import { fetchCnpjData } from '@/services/cnpj'

export const prospectFormSchema = z.object({
  tipo_pessoa: z.string().default('PJ'),
  cnpj: z.string().optional(),
  cpf: z.string().optional(),
  empresa: z.string().min(2, 'Obrigatório'),
  razao_social: z.string().optional(),
  endereco: z.string().optional(),
  contato_nome: z.string().min(2, 'Obrigatório'),
  telefone: z.string().optional(),
  email: z.string().email('E-mail inválido').optional().or(z.literal('')),
  status: z.string().min(1, 'Obrigatório'),
  classificacao: z.string().optional(),
  data_followup: z.string().optional(),
  data_assinatura: z.string().optional(),
  nome_mae: z.string().optional(),
  nome_pai: z.string().optional(),
  data_nascimento: z.string().optional(),
  plano_apresentado: z.string().optional(),
  plano_contratado: z.string().optional(),
  modulos_contratados: z.string().optional(),
  quantidade_uso: z.number().optional(),
  observacoes_comerciais: z.string().optional(),
  responsavel_comercial: z.string().optional(),
  contrato_assinado: z.boolean().optional(),
  proposta_url: z.string().optional(),
  documentos_adesao: z.any().optional(),
  ata_primeiro_atendimento: z.string().optional(),
})

export type ProspectFormValues = z.infer<typeof prospectFormSchema>

const PROSPECT_STATUSES = [
  'Lead',
  'Proposta Enviada',
  'Aguardando Documentação',
  'Contrato',
  'Contrato Assinado',
  'Implantação',
  'Cliente Ativo',
  'Novo Lead',
  'Contato inicial',
  'Em negociação',
  'Enviado para Implantação',
  'Cliente Efetivado',
  'Perdido',
]

const formatCnpj = (v: string) =>
  v
    .replace(/\D/g, '')
    .replace(
      /^(\d{2})(\d{3})?(\d{3})?(\d{4})?(\d{2})?/,
      (_m, p1, p2, p3, p4, p5) =>
        `${p1}${p2 ? `.${p2}` : ''}${p3 ? `.${p3}` : ''}${p4 ? `/${p4}` : ''}${p5 ? `-${p5}` : ''}`,
    )

export function CrmProspectForm({
  onSubmit,
  isSubmitting,
  initialData,
  defaultTipoPessoa = 'PJ',
  onPropostaChange,
  hideInternalTabs = false,
}: {
  onSubmit: (v: ProspectFormValues) => void
  isSubmitting?: boolean
  initialData?: Partial<ProspectFormValues> & {
    id?: string
    plano_id?: string | null
    proposta_url?: string | null
    contrato_assinado_url?: string | null
    modulos_contratados?: any
    documentos_adesao?: any[]
    razao_social?: string | null
    ata_primeiro_atendimento?: string | null
  }
  defaultTipoPessoa?: 'PJ' | 'PF'
  onPropostaChange?: () => void
  hideInternalTabs?: boolean
}) {
  const [isLoading, setIsLoading] = useState(false)
  const [activeTab, setActiveTab] = useState<'dados' | 'diagnostico' | 'historico' | 'propostas'>(
    'dados',
  )
  const { toast } = useToast()

  const form = useForm<ProspectFormValues>({
    resolver: zodResolver(prospectFormSchema) as any,
    defaultValues: initialData || {
      tipo_pessoa: defaultTipoPessoa,
      cnpj: '',
      cpf: '',
      empresa: '',
      razao_social: '',
      endereco: '',
      contato_nome: '',
      telefone: '',
      email: '',
      status: 'Lead',
      classificacao: 'Frio',
      data_followup: '',
      data_assinatura: '',
      nome_mae: '',
      nome_pai: '',
      data_nascimento: '',
      plano_apresentado: '',
      plano_contratado: '',
      modulos_contratados: '',
      quantidade_uso: undefined,
      observacoes_comerciais: '',
      responsavel_comercial: '',
      contrato_assinado: false,
      proposta_url: '',
      documentos_adesao: [],
      ata_primeiro_atendimento: '',
    },
  })

  const tipoPessoa = form.watch('tipo_pessoa') || defaultTipoPessoa
  const prospectId = initialData?.id

  useEffect(() => {
    if (initialData) {
      form.reset({
        tipo_pessoa: initialData.tipo_pessoa || defaultTipoPessoa,
        cnpj: initialData.cnpj || '',
        cpf: initialData.cpf || '',
        empresa: initialData.empresa || '',
        razao_social: initialData.razao_social || '',
        endereco: initialData.endereco || '',
        contato_nome: initialData.contato_nome || '',
        telefone: initialData.telefone || '',
        email: initialData.email || '',
        status: initialData.status || 'Lead',
        classificacao: initialData.classificacao || 'Frio',
        data_followup: initialData.data_followup || '',
        data_assinatura: initialData.data_assinatura || '',
        nome_mae: initialData.nome_mae || '',
        nome_pai: initialData.nome_pai || '',
        data_nascimento: initialData.data_nascimento || '',
        plano_apresentado: initialData.plano_apresentado || '',
        plano_contratado: initialData.plano_contratado || '',
        modulos_contratados: Array.isArray(initialData.modulos_contratados)
          ? initialData.modulos_contratados.join(', ')
          : (initialData.modulos_contratados as string) || '',
        quantidade_uso: initialData.quantidade_uso ?? undefined,
        observacoes_comerciais: initialData.observacoes_comerciais || '',
        responsavel_comercial: initialData.responsavel_comercial || '',
        contrato_assinado: initialData.contrato_assinado || false,
        proposta_url: (initialData.proposta_url as string) || '',
        documentos_adesao: Array.isArray(initialData.documentos_adesao)
          ? initialData.documentos_adesao
          : [],
        ata_primeiro_atendimento: initialData.ata_primeiro_atendimento || '',
      })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [prospectId, defaultTipoPessoa])

  const handleCnpjChange = async (val: string) => {
    const formatted = formatCnpj(val)
    form.setValue('cnpj', formatted)
    const clean = formatted.replace(/\D/g, '')
    if (clean.length !== 14) return
    setIsLoading(true)
    try {
      const { data: cliente } = await supabase
        .from('clientes')
        .select('*')
        .eq('cnpj', formatted)
        .maybeSingle()
      if (cliente) {
        toast({
          title: 'Cliente Encontrado',
          description: 'Preenchendo dados do cliente existente na base.',
        })
        if (!form.getValues('empresa')) form.setValue('empresa', cliente.nome)
        if (!form.getValues('endereco')) form.setValue('endereco', cliente.endereco || '')
        if (!form.getValues('telefone')) form.setValue('telefone', cliente.telefone || '')
        if (!form.getValues('email')) form.setValue('email', cliente.email || '')
        if (!form.getValues('contato_nome'))
          form.setValue('contato_nome', cliente.rep_nome || 'Responsável')
        return
      }
      const { data: cnpjData, error: cnpjError } = await fetchCnpjData(clean)
      if (cnpjData) {
        if (cnpjData.nome && !form.getValues('empresa')) form.setValue('empresa', cnpjData.nome)
        if (cnpjData.endereco && !form.getValues('endereco'))
          form.setValue('endereco', cnpjData.endereco)
        if (cnpjData.telefone && !form.getValues('telefone'))
          form.setValue('telefone', cnpjData.telefone)
        if (cnpjData.email && !form.getValues('email')) form.setValue('email', cnpjData.email)
        if (!form.getValues('contato_nome')) form.setValue('contato_nome', 'Responsável')
        toast({
          title: 'Dados preenchidos',
          description: 'Razão Social obtida via Receita Federal.',
        })
      } else if (cnpjError) {
        toast({ title: 'Consulta CNPJ', description: cnpjError, variant: 'destructive' })
      }
    } catch {
      toast({ title: 'Erro na consulta', variant: 'destructive' })
    } finally {
      setIsLoading(false)
    }
  }

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setIsLoading(true)
    try {
      const formData = new FormData()
      formData.append('file', file)
      const {
        data: { session },
      } = await supabase.auth.getSession()
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/parse-receipt-pdf`,
        {
          method: 'POST',
          headers: { Authorization: `Bearer ${session?.access_token}` },
          body: formData,
        },
      )
      const result = await response.json()
      if (!response.ok) throw new Error(result.error || 'Falha ao processar arquivo')
      const cnpjMatch = result.text?.match(/\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2}/)
      if (cnpjMatch) {
        toast({
          title: 'CNPJ Identificado',
          description: `Consultando dados para o CNPJ ${cnpjMatch[0]}...`,
        })
        form.setValue('tipo_pessoa', 'PJ')
        form.setValue('cnpj', cnpjMatch[0])
        await handleCnpjChange(cnpjMatch[0])
      } else {
        toast({
          title: 'Nenhum CNPJ',
          description: 'Não foi possível identificar CNPJ no arquivo.',
          variant: 'destructive',
        })
      }
    } catch (error: any) {
      toast({ title: 'Erro', description: error.message, variant: 'destructive' })
    } finally {
      setIsLoading(false)
      e.target.value = ''
    }
  }

  return (
    <div className="w-full">
      {!hideInternalTabs && (
        <div className="flex space-x-1 p-1 bg-slate-100 rounded-lg mb-4 overflow-x-auto">
          {(['dados', 'diagnostico', 'historico', 'propostas'] as const)
            .filter((tab) => initialData?.id || tab === 'dados' || tab === 'propostas')
            .map((tab) => (
              <button
                key={tab}
                type="button"
                onClick={() => setActiveTab(tab)}
                className={cn(
                  'flex-1 text-sm font-medium py-1.5 px-3 rounded-md transition-all whitespace-nowrap capitalize',
                  activeTab === tab
                    ? 'bg-white shadow-sm text-slate-900'
                    : 'text-slate-600 hover:text-slate-900',
                )}
              >
                {tab === 'dados'
                  ? 'Dados Básicos'
                  : tab === 'diagnostico'
                    ? 'Diagnóstico'
                    : tab === 'historico'
                      ? 'Histórico'
                      : 'Propostas'}
              </button>
            ))}
        </div>
      )}

      {activeTab === 'dados' ? (
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit((values) => {
              const transformed = {
                ...values,
                modulos_contratados:
                  typeof values.modulos_contratados === 'string'
                    ? values.modulos_contratados
                        .split(',')
                        .map((m: string) => m.trim())
                        .filter(Boolean)
                    : values.modulos_contratados || [],
                documentos_adesao: Array.isArray(values.documentos_adesao)
                  ? values.documentos_adesao
                  : [],
                proposta_url: values.proposta_url || null,
              }
              onSubmit(transformed as any)
            })}
            className="space-y-3 py-2"
          >
            {!initialData && (
              <div className="flex justify-between items-center mb-2 bg-slate-50 p-3 rounded-xl border border-slate-200/80 shadow-sm">
                <div className="text-sm text-slate-600">
                  <span className="font-semibold block text-slate-800">
                    Preenchimento Automático
                  </span>
                  Importe o Cartão CNPJ em PDF para preencher os dados.
                </div>
                <div>
                  <Input
                    type="file"
                    accept="application/pdf"
                    className="hidden"
                    id="doc-upload"
                    onChange={handleFileUpload}
                    disabled={isLoading || isSubmitting}
                  />
                  <Label
                    htmlFor="doc-upload"
                    className="flex items-center gap-2 cursor-pointer bg-white hover:bg-slate-100 text-slate-700 px-3 py-2 rounded-md text-sm font-medium transition-colors border shadow-sm"
                  >
                    {isLoading ? (
                      <Loader2 className="h-4 w-4 animate-spin text-indigo-600" />
                    ) : (
                      <UploadCloud className="h-4 w-4 text-indigo-600" />
                    )}
                    Importar PDF
                  </Label>
                </div>
              </div>
            )}

            <FormField
              control={form.control}
              name="tipo_pessoa"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tipo de Pessoa</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value || defaultTipoPessoa}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="PJ">
                        <span className="flex items-center gap-2">
                          <Building2 className="h-4 w-4" /> Pessoa Jurídica
                        </span>
                      </SelectItem>
                      <SelectItem value="PF">
                        <span className="flex items-center gap-2">
                          <User className="h-4 w-4" /> Pessoa Física
                        </span>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-3">
              <FormField
                control={form.control}
                name="cnpj"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>CNPJ</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Input
                          placeholder="00.000.000/0001-00"
                          maxLength={18}
                          {...field}
                          onChange={(e) => {
                            field.onChange(e)
                            handleCnpjChange(e.target.value)
                          }}
                        />
                        {isLoading && (
                          <Loader2 className="absolute right-2 top-2.5 h-4 w-4 animate-spin text-muted-foreground" />
                        )}
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="empresa"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{tipoPessoa === 'PF' ? 'Nome Completo *' : 'Empresa *'}</FormLabel>
                    <FormControl>
                      <Input
                        placeholder={tipoPessoa === 'PF' ? 'Nome completo' : 'Nome fantasia'}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="razao_social"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Razão Social</FormLabel>
                  <FormControl>
                    <Input placeholder="Razão social oficial" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="endereco"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Endereço</FormLabel>
                  <FormControl>
                    <Input placeholder="Rua, Número, Cidade, Estado" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-3">
              <FormField
                control={form.control}
                name="contato_nome"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      {tipoPessoa === 'PF' ? 'Nome para Contato *' : 'Responsável *'}
                    </FormLabel>
                    <FormControl>
                      <Input placeholder="Nome" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="telefone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Telefone</FormLabel>
                    <FormControl>
                      <Input placeholder="(00) 00000-0000" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>E-mail</FormLabel>
                  <FormControl>
                    <Input placeholder="email@empresa.com" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Status *</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {!PROSPECT_STATUSES.includes(field.value) && (
                          <SelectItem value={field.value} className="hidden">
                            {field.value}
                          </SelectItem>
                        )}
                        {PROSPECT_STATUSES.map((s) => (
                          <SelectItem key={s} value={s}>
                            {s}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="classificacao"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Classificação</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value || 'Frio'}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="Frio">Frio</SelectItem>
                        <SelectItem value="Morno">Morno</SelectItem>
                        <SelectItem value="Quente">Quente</SelectItem>
                        <SelectItem value="Muito Quente">Muito Quente</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="data_followup"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Data Follow-up</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="ata_primeiro_atendimento"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Ata do Primeiro Atendimento</FormLabel>
                  <FormControl>
                    <Textarea
                      className="resize-none min-h-[160px]"
                      placeholder="Cole aqui a ata do primeiro atendimento: detalhes da conversa, pontos de negociação, necessidades do cliente, etc."
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="pt-4 mt-2 border-t border-slate-200/80 flex justify-end">
              <Button type="submit" disabled={isSubmitting || isLoading}>
                {isSubmitting ? 'Salvando...' : 'Salvar Contato'}
              </Button>
            </div>
          </form>
        </Form>
      ) : activeTab === 'diagnostico' && initialData?.id ? (
        <CrmDiagnosticoForm
          prospectId={initialData.id}
          initialPlanoId={initialData.plano_id}
          initialPropostaUrl={initialData.proposta_url}
          initialContratoUrl={initialData.contrato_assinado_url}
          onSave={() => {}}
        />
      ) : activeTab === 'historico' && initialData?.id ? (
        <CrmHistorico prospectId={initialData.id} />
      ) : activeTab === 'propostas' ? (
        <CrmProspectPropostasTab
          prospectId={initialData?.id}
          prospectName={initialData?.empresa || ''}
          propostaUrl={form.watch('proposta_url') || null}
          onPropostaChange={onPropostaChange}
          onUrlChange={(url) => form.setValue('proposta_url', url || '')}
        />
      ) : null}
    </div>
  )
}
