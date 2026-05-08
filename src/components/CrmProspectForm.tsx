import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { Loader2, UploadCloud } from 'lucide-react'
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

export const prospectFormSchema = z.object({
  cnpj: z.string().optional(),
  empresa: z.string().min(2, 'Obrigatório'),
  endereco: z.string().optional(),
  contato_nome: z.string().min(2, 'Obrigatório'),
  telefone: z.string().optional(),
  email: z.string().email('E-mail inválido').optional().or(z.literal('')),
  status: z.string().min(1, 'Obrigatório'),
  data_followup: z.string().optional(),
  observacoes: z.string().optional(),
})

export type ProspectFormValues = z.infer<typeof prospectFormSchema>

export function CrmProspectForm({
  onSubmit,
  isSubmitting,
  initialData,
}: {
  onSubmit: (v: ProspectFormValues) => void
  isSubmitting?: boolean
  initialData?: Partial<ProspectFormValues>
}) {
  const [isLoading, setIsLoading] = useState(false)
  const { toast } = useToast()
  const form = useForm<ProspectFormValues>({
    resolver: zodResolver(prospectFormSchema),
    defaultValues: initialData || {
      cnpj: '',
      empresa: '',
      endereco: '',
      contato_nome: '',
      telefone: '',
      email: '',
      status: 'Contato Inicial',
      data_followup: '',
      observacoes: '',
    },
  })

  useEffect(() => {
    if (initialData) {
      form.reset({
        cnpj: initialData.cnpj || '',
        empresa: initialData.empresa || '',
        endereco: initialData.endereco || '',
        contato_nome: initialData.contato_nome || '',
        telefone: initialData.telefone || '',
        email: initialData.email || '',
        status: initialData.status || 'Contato Inicial',
        data_followup: initialData.data_followup || '',
        observacoes: initialData.observacoes || '',
      })
    }
  }, [initialData, form])

  const formatCnpj = (v: string) =>
    v
      .replace(/\D/g, '')
      .replace(
        /^(\d{2})(\d{3})?(\d{3})?(\d{4})?(\d{2})?/,
        (m, p1, p2, p3, p4, p5) =>
          `${p1}${p2 ? `.${p2}` : ''}${p3 ? `.${p3}` : ''}${p4 ? `/${p4}` : ''}${p5 ? `-${p5}` : ''}`,
      )

  const handleCnpjChange = async (val: string) => {
    const formatted = formatCnpj(val)
    form.setValue('cnpj', formatted)
    const clean = formatted.replace(/\D/g, '')

    if (clean.length === 14) {
      setIsLoading(true)
      try {
        const res = await fetch(`https://brasilapi.com.br/api/cnpj/v1/${clean}`)
        if (res.ok) {
          const d = await res.json()
          if (d.razao_social && !form.getValues('empresa')) form.setValue('empresa', d.razao_social)
          const addr = [d.logradouro, d.numero, d.bairro, d.municipio, d.uf]
            .filter(Boolean)
            .join(', ')
          if (addr && !form.getValues('endereco')) form.setValue('endereco', addr)
          if (d.ddd_telefone_1 && !form.getValues('telefone'))
            form.setValue('telefone', d.ddd_telefone_1)

          if (!form.getValues('contato_nome')) {
            form.setValue('contato_nome', d.nome_fantasia || 'Responsável')
          }

          toast({ title: 'Dados preenchidos', description: 'CNPJ consultado com sucesso.' })
        }
      } catch {
        toast({ title: 'Erro na consulta', variant: 'destructive' })
      } finally {
        setIsLoading(false)
      }
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
          headers: {
            Authorization: `Bearer ${session?.access_token}`,
          },
          body: formData,
        },
      )

      const result = await response.json()
      if (!response.ok) throw new Error(result.error || 'Falha ao processar arquivo')

      const text = result.text
      const cnpjMatch = text.match(/\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2}/)

      if (cnpjMatch) {
        const cnpj = cnpjMatch[0]
        toast({
          title: 'CNPJ Identificado',
          description: `Consultando dados para o CNPJ ${cnpj}...`,
        })
        form.setValue('cnpj', cnpj)
        await handleCnpjChange(cnpj)
      } else {
        toast({
          title: 'Nenhum CNPJ',
          description: 'Não foi possível identificar o CNPJ no arquivo PDF.',
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
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-3 py-2">
        {!initialData && (
          <div className="flex justify-between items-center mb-2 bg-slate-50 p-3 rounded-lg border border-slate-100">
            <div className="text-sm text-slate-600">
              <span className="font-semibold block text-slate-800">Preenchimento Automático</span>
              Importe o Cartão CNPJ em PDF para preencher os dados.
            </div>
            <div>
              <Input
                type="file"
                accept="application/pdf"
                className="hidden"
                id="cnpj-upload"
                onChange={handleFileUpload}
                disabled={isLoading || isSubmitting}
              />
              <Label
                htmlFor="cnpj-upload"
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
                <FormLabel>Empresa *</FormLabel>
                <FormControl>
                  <Input placeholder="Razão Social" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <FormField
            control={form.control}
            name="contato_nome"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Responsável *</FormLabel>
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
        <div className="grid grid-cols-2 gap-3">
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
          <FormField
            control={form.control}
            name="endereco"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Endereço</FormLabel>
                <FormControl>
                  <Input placeholder="Rua, Número, Cidade" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        <div className="grid grid-cols-2 gap-3">
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
                    <SelectItem value="Contato Inicial">Contato Inicial</SelectItem>
                    <SelectItem value="Em Negociação">Em Negociação</SelectItem>
                    <SelectItem value="Aguardando Feedback">Aguardando Feedback</SelectItem>
                    <SelectItem value="Fechado">Fechado</SelectItem>
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
          name="observacoes"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Observações</FormLabel>
              <FormControl>
                <Textarea
                  className="resize-none min-h-[100px]"
                  placeholder="Adicione notas ou histórico de follow-ups aqui..."
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="pt-2 flex justify-end">
          <Button type="submit" disabled={isSubmitting || isLoading}>
            {isSubmitting ? 'Salvando...' : 'Salvar Contato'}
          </Button>
        </div>
      </form>
    </Form>
  )
}
