import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
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
import { supabase } from '@/lib/supabase/client'
import { fetchCnpjData } from '@/services/cnpj'
import { formatCNPJ, formatCPF, isValidCNPJ, isValidCPF, composeEndereco } from '@/lib/cpf-utils'
import { useToast } from '@/hooks/use-toast'

const pjSchema = z.object({
  tipo_pessoa: z.literal('PJ'),
  empresa: z.string().min(2, 'Obrigatório'),
  razao_social: z.string().optional(),
  cnpj: z.string().optional(),
  contato_nome: z.string().min(2, 'Obrigatório'),
  email: z.string().email('E-mail inválido').optional().or(z.literal('')),
  telefone: z.string().optional(),
  logradouro: z.string().optional(),
  numero: z.string().optional(),
  complemento: z.string().optional(),
  bairro: z.string().optional(),
  cidade: z.string().optional(),
  estado: z.string().optional(),
  cep: z.string().optional(),
  classificacao: z.string().optional(),
  observacoes: z.string().optional(),
})

const pfSchema = z.object({
  tipo_pessoa: z.literal('PF'),
  empresa: z.string().optional(),
  contato_nome: z.string().min(2, 'Obrigatório'),
  cpf: z.string().optional(),
  nome_mae: z.string().optional(),
  nome_pai: z.string().optional(),
  data_nascimento: z.string().optional(),
  email: z.string().email('E-mail inválido').optional().or(z.literal('')),
  telefone: z.string().optional(),
  logradouro: z.string().optional(),
  numero: z.string().optional(),
  complemento: z.string().optional(),
  bairro: z.string().optional(),
  cidade: z.string().optional(),
  estado: z.string().optional(),
  cep: z.string().optional(),
  classificacao: z.string().optional(),
  observacoes: z.string().optional(),
})

const formSchema = z.discriminatedUnion('tipo_pessoa', [pjSchema, pfSchema])

export type CaptacaoFormValues = z.infer<typeof formSchema>

const defaultPJ: CaptacaoFormValues = {
  tipo_pessoa: 'PJ',
  empresa: '',
  razao_social: '',
  cnpj: '',
  contato_nome: '',
  email: '',
  telefone: '',
  logradouro: '',
  numero: '',
  complemento: '',
  bairro: '',
  cidade: '',
  estado: '',
  cep: '',
  classificacao: 'Frio',
  observacoes: '',
}

const defaultPF: CaptacaoFormValues = {
  tipo_pessoa: 'PF',
  empresa: '',
  contato_nome: '',
  cpf: '',
  nome_mae: '',
  nome_pai: '',
  data_nascimento: '',
  email: '',
  telefone: '',
  logradouro: '',
  numero: '',
  complemento: '',
  bairro: '',
  cidade: '',
  estado: '',
  cep: '',
  classificacao: 'Frio',
  observacoes: '',
}

export function CaptacaoForm({
  onSubmit,
  isSubmitting,
}: {
  onSubmit: (v: CaptacaoFormValues) => void
  isSubmitting?: boolean
}) {
  const [tipoPessoa, setTipoPessoa] = useState<'PJ' | 'PF'>('PJ')
  const [isLoadingCnpj, setIsLoadingCnpj] = useState(false)
  const { toast } = useToast()

  const form = useForm<CaptacaoFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: defaultPJ,
  })

  useEffect(() => {
    if (tipoPessoa === 'PJ') {
      form.reset(defaultPJ)
    } else {
      form.reset(defaultPF)
    }
  }, [tipoPessoa, form])

  const handleCnpjBlur = async (val: string) => {
    const cleaned = val.replace(/\D/g, '')
    if (cleaned.length !== 14) return
    if (!isValidCNPJ(val)) {
      toast({ title: 'CNPJ inválido', variant: 'destructive' })
      return
    }
    setIsLoadingCnpj(true)
    try {
      const { data: existing } = await supabase
        .from('crm_prospects')
        .select('id')
        .eq('cnpj', val)
        .maybeSingle()
      if (existing) {
        toast({
          title: 'CNPJ já cadastrado',
          description: 'Já existe um prospect com este CNPJ.',
          variant: 'destructive',
        })
        return
      }

      const { data: cliente } = await supabase
        .from('clientes')
        .select('*')
        .eq('cnpj', val)
        .maybeSingle()
      if (cliente) {
        if (!form.getValues('empresa')) form.setValue('empresa', cliente.nome)
        if (!form.getValues('email')) form.setValue('email', cliente.email || '')
        if (!form.getValues('telefone')) form.setValue('telefone', cliente.telefone || '')
        return
      }

      const { data: cnpjData } = await fetchCnpjData(cleaned)
      if (cnpjData) {
        if (cnpjData.nome) form.setValue('empresa', cnpjData.nome)
        if (cnpjData.endereco) form.setValue('logradouro', cnpjData.endereco)
        if (cnpjData.telefone) form.setValue('telefone', cnpjData.telefone)
        if (cnpjData.email) form.setValue('email', cnpjData.email)
        toast({ title: 'Dados preenchidos', description: 'Dados obtidos via Receita Federal.' })
      }
    } catch {
      toast({ title: 'Erro na consulta CNPJ', variant: 'destructive' })
    } finally {
      setIsLoadingCnpj(false)
    }
  }

  const handleFormSubmit = (values: CaptacaoFormValues) => {
    if (values.tipo_pessoa === 'PJ' && values.cnpj && !isValidCNPJ(values.cnpj)) {
      toast({ title: 'CNPJ inválido', variant: 'destructive' })
      return
    }
    if (values.tipo_pessoa === 'PF' && values.cpf && !isValidCPF(values.cpf)) {
      toast({ title: 'CPF inválido', variant: 'destructive' })
      return
    }
    onSubmit(values)
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

      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleFormSubmit)} className="space-y-3">
          {tipoPessoa === 'PJ' ? (
            <>
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
                            value={field.value || ''}
                            onChange={(e) => {
                              field.onChange(formatCNPJ(e.target.value))
                            }}
                            onBlur={(e) => handleCnpjBlur(e.target.value)}
                          />
                          {isLoadingCnpj && (
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
                      <FormLabel>Nome Fantasia *</FormLabel>
                      <FormControl>
                        <Input placeholder="Nome Fantasia" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <FormField
                  control={form.control}
                  name="razao_social"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Razão Social</FormLabel>
                      <FormControl>
                        <Input placeholder="Razão Social" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="contato_nome"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Responsável *</FormLabel>
                      <FormControl>
                        <Input placeholder="Nome do responsável" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </>
          ) : (
            <>
              <div className="grid grid-cols-2 gap-3">
                <FormField
                  control={form.control}
                  name="contato_nome"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nome Completo *</FormLabel>
                      <FormControl>
                        <Input placeholder="Nome completo" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="cpf"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>CPF</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="000.000.000-00"
                          maxLength={14}
                          value={field.value || ''}
                          onChange={(e) => field.onChange(formatCPF(e.target.value))}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <FormField
                  control={form.control}
                  name="nome_mae"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nome da Mãe</FormLabel>
                      <FormControl>
                        <Input placeholder="Nome da mãe" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="nome_pai"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nome do Pai</FormLabel>
                      <FormControl>
                        <Input placeholder="Nome do pai" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <FormField
                control={form.control}
                name="data_nascimento"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Data de Nascimento</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </>
          )}

          <div className="grid grid-cols-2 gap-3">
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>E-mail</FormLabel>
                  <FormControl>
                    <Input placeholder="email@exemplo.com" {...field} />
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

          <div className="border-t border-slate-100 pt-3">
            <Label className="text-sm font-semibold text-slate-700">Endereço</Label>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <FormField
              control={form.control}
              name="cep"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>CEP</FormLabel>
                  <FormControl>
                    <Input placeholder="00000-000" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="logradouro"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Rua / Logradouro</FormLabel>
                  <FormControl>
                    <Input placeholder="Rua / Logradouro" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
          <div className="grid grid-cols-3 gap-3">
            <FormField
              control={form.control}
              name="numero"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Número</FormLabel>
                  <FormControl>
                    <Input placeholder="Nº" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="complemento"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Complemento</FormLabel>
                  <FormControl>
                    <Input placeholder="Complemento" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="bairro"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Bairro</FormLabel>
                  <FormControl>
                    <Input placeholder="Bairro" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <FormField
              control={form.control}
              name="cidade"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Cidade</FormLabel>
                  <FormControl>
                    <Input placeholder="Cidade" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="estado"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Estado</FormLabel>
                  <FormControl>
                    <Input placeholder="UF" maxLength={2} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
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
              name="observacoes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Observações</FormLabel>
                  <FormControl>
                    <Input placeholder="Observações" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <div className="pt-2 flex justify-end">
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Salvando...' : 'Salvar Captação'}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  )
}
