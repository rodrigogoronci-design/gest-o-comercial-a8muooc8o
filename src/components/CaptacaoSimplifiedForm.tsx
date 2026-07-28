import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { Building2, User, Phone, Package, Send, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { useToast } from '@/hooks/use-toast'
import { supabase } from '@/lib/supabase/client'

const MODULE_OPTIONS = [
  'CT-e',
  'MDF-e',
  'Financeiro',
  'Fiscal',
  'Frota',
  'Controle de Viagens',
  'BI',
  'EDI',
  'DF-e',
  'SL Track',
  'SL Trip',
  'Torre',
  'Patrimônio',
  'Comercial',
  'Outro',
]

const PRESENTATION_URL = 'https://lp-servicelogic-tms.vercel.app/'
const WHATSAPP_MESSAGE = `Olá! Segue o link da apresentação: ${PRESENTATION_URL}`

const formSchema = z.object({
  empresa: z.string().min(2, 'Nome da empresa é obrigatório'),
  contato_nome: z.string().min(2, 'Nome do contato é obrigatório'),
  telefone: z.string().min(10, 'Telefone inválido'),
})

type FormValues = z.infer<typeof formSchema>

function normalizePhone(phone: string): string {
  const digits = phone.replace(/\D/g, '')
  if (digits.length >= 12 && digits.startsWith('55')) return digits
  return '55' + digits
}

export function CaptacaoSimplifiedForm() {
  const [selectedModules, setSelectedModules] = useState<string[]>([])
  const [outroValue, setOutroValue] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { toast } = useToast()

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      empresa: '',
      contato_nome: '',
      telefone: '',
    },
  })

  const toggleModule = (mod: string) => {
    setSelectedModules((prev) =>
      prev.includes(mod) ? prev.filter((m) => m !== mod) : [...prev, mod],
    )
  }

  const onSubmit = async (values: FormValues) => {
    if (selectedModules.length === 0) {
      toast({
        title: 'Módulos obrigatórios',
        description: 'Selecione ao menos um módulo apresentado.',
        variant: 'destructive',
      })
      return
    }

    const modulosParaSalvar = selectedModules.map((m) =>
      m === 'Outro' && outroValue.trim() ? outroValue.trim() : m,
    )

    const telefoneNormalizado = normalizePhone(values.telefone)

    setIsSubmitting(true)
    try {
      const { error } = await supabase.from('crm_prospects').insert({
        empresa: values.empresa,
        contato_nome: values.contato_nome,
        telefone: telefoneNormalizado,
        modulos_contratados: modulosParaSalvar,
        status: 'Novo Lead',
        tipo_pessoa: 'PJ',
      })

      if (error) throw error

      toast({
        title: 'Contato salvo!',
        description: 'Redirecionando para o WhatsApp...',
      })

      const whatsappUrl = `https://wa.me/${telefoneNormalizado}?text=${encodeURIComponent(WHATSAPP_MESSAGE)}`
      window.open(whatsappUrl, '_blank')

      form.reset()
      setSelectedModules([])
      setOutroValue('')
    } catch (err: any) {
      toast({
        title: 'Erro ao salvar contato',
        description: err.message || 'Tente novamente.',
        variant: 'destructive',
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <Card className="border-slate-200/60 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Building2 className="h-5 w-5 text-indigo-600" />
              Empresa
            </CardTitle>
            <CardDescription>Informações da empresa visitada</CardDescription>
          </CardHeader>
          <CardContent>
            <FormField
              control={form.control}
              name="empresa"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nome da Empresa *</FormLabel>
                  <FormControl>
                    <Input placeholder="Ex: Transportadora Alpha" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        <Card className="border-slate-200/60 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <User className="h-5 w-5 text-indigo-600" />
              Contato
            </CardTitle>
            <CardDescription>Dados da pessoa de contato</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <FormField
              control={form.control}
              name="contato_nome"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nome do Contato *</FormLabel>
                  <FormControl>
                    <Input placeholder="Ex: Carlos Silva" {...field} />
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
                  <FormLabel>Telefone / WhatsApp *</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Phone className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                      <Input className="pl-9" placeholder="(11) 99999-9999" {...field} />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        <Card className="border-slate-200/60 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Package className="h-5 w-5 text-indigo-600" />
              Módulos Apresentados
            </CardTitle>
            <CardDescription>Selecione os módulos apresentados na visita</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {MODULE_OPTIONS.map((mod) => (
                <div key={mod} className="flex items-center space-x-2">
                  <Checkbox
                    id={`mod-${mod}`}
                    checked={selectedModules.includes(mod)}
                    onCheckedChange={() => toggleModule(mod)}
                  />
                  <Label htmlFor={`mod-${mod}`} className="text-sm cursor-pointer">
                    {mod}
                  </Label>
                </div>
              ))}
            </div>

            {selectedModules.includes('Outro') && (
              <div className="mt-3 animate-fade-in">
                <Label htmlFor="outro-modulo" className="text-sm">
                  Especifique o módulo
                </Label>
                <Input
                  id="outro-modulo"
                  placeholder="Nome do módulo personalizado"
                  value={outroValue}
                  onChange={(e) => setOutroValue(e.target.value)}
                  className="mt-1"
                />
              </div>
            )}
          </CardContent>
        </Card>

        <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
          <Button
            type="submit"
            size="lg"
            className="w-full sm:w-auto gap-2"
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <Send className="h-5 w-5" />
            )}
            Salvar Contato
          </Button>
          <p className="text-sm text-muted-foreground text-center sm:text-left">
            Após salvar, o WhatsApp será aberto com o link da apresentação.
          </p>
        </div>
      </form>
    </Form>
  )
}
