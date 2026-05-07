import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
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
}: {
  onSubmit: (v: ProspectFormValues) => void
  isSubmitting?: boolean
}) {
  const [isLoading, setIsLoading] = useState(false)
  const { toast } = useToast()
  const form = useForm<ProspectFormValues>({
    resolver: zodResolver(prospectFormSchema),
    defaultValues: {
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
          toast({ title: 'Dados preenchidos', description: 'CNPJ consultado com sucesso.' })
        }
      } catch {
        toast({ title: 'Erro na consulta', variant: 'destructive' })
      } finally {
        setIsLoading(false)
      }
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-3 py-2">
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
                <Textarea className="resize-none h-16" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="pt-2 flex justify-end">
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Salvando...' : 'Salvar Contato'}
          </Button>
        </div>
      </form>
    </Form>
  )
}
