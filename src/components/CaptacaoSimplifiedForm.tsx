import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Loader2, Save, AlertCircle } from 'lucide-react'
import { supabase } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import { useToast } from '@/hooks/use-toast'
import { MODULES } from '@/constants/contracts'
import {
  WHATSAPP_PRESENTATION_MESSAGE,
  cleansePhoneNumber,
  isValidBrazilianPhone,
  buildWhatsAppUrl,
} from '@/lib/whatsapp-utils'

const captacaoSchema = z.object({
  empresa: z.string().min(1, 'Nome da empresa é obrigatório'),
  contato_nome: z.string().min(1, 'Nome do contato é obrigatório'),
  telefone: z.string().min(1, 'Telefone é obrigatório'),
  email: z.string().email('E-mail inválido').optional().or(z.literal('')),
  modulos: z.array(z.string()).default([]),
  outro: z.string().optional().default(''),
  observacoes: z.string().optional().default(''),
})

type CaptacaoFormValues = z.infer<typeof captacaoSchema>

export function CaptacaoSimplifiedForm() {
  const { toast } = useToast()
  const [saving, setSaving] = useState(false)
  const [whatsappError, setWhatsappError] = useState<string | null>(null)
  const [selectedModules, setSelectedModules] = useState<string[]>([])

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CaptacaoFormValues>({
    resolver: zodResolver(captacaoSchema),
    defaultValues: {
      empresa: '',
      contato_nome: '',
      telefone: '',
      email: '',
      modulos: [],
      outro: '',
      observacoes: '',
    },
  })

  const toggleModule = (moduleId: string) => {
    setSelectedModules((prev) =>
      prev.includes(moduleId) ? prev.filter((id) => id !== moduleId) : [...prev, moduleId],
    )
  }

  const onSubmit = async (values: CaptacaoFormValues) => {
    setSaving(true)
    setWhatsappError(null)

    try {
      const { data, error } = await supabase
        .from('crm_prospects')
        .insert({
          empresa: values.empresa,
          contato_nome: values.contato_nome,
          telefone: values.telefone,
          email: values.email || null,
          status: 'Novo Lead',
          modulos_contratados: selectedModules.length > 0 ? selectedModules : null,
          observacoes: values.outro
            ? `Outro: ${values.outro}${values.observacoes ? ` | ${values.observacoes}` : ''}`
            : values.observacoes || null,
          classificacao: 'Frio',
          tipo_pessoa: 'PJ',
        })
        .select()
        .single()

      if (error) throw error

      toast({
        title: 'Contato salvo com sucesso!',
        description: 'O lead foi registrado no CRM.',
      })

      const phoneDigits = cleansePhoneNumber(values.telefone)

      if (!isValidBrazilianPhone(values.telefone)) {
        setWhatsappError(
          'Número de WhatsApp inválido ou não informado. O lead foi salvo, mas não foi possível abrir o WhatsApp.',
        )
        setSaving(false)
        reset()
        setSelectedModules([])
        return
      }

      const whatsappUrl = buildWhatsAppUrl(values.telefone, WHATSAPP_PRESENTATION_MESSAGE)
      if (whatsappUrl) {
        window.open(whatsappUrl, '_blank')
      }

      setSaving(false)
      reset()
      setSelectedModules([])
    } catch (err: any) {
      toast({
        title: 'Erro ao salvar contato',
        description: err.message || 'Ocorreu um erro inesperado.',
        variant: 'destructive',
      })
      setSaving(false)
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="empresa">
            Empresa <span className="text-destructive">*</span>
          </Label>
          <Input id="empresa" placeholder="Nome da empresa" {...register('empresa')} />
          {errors.empresa && <p className="text-sm text-destructive">{errors.empresa.message}</p>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="contato_nome">
            Nome do Contato <span className="text-destructive">*</span>
          </Label>
          <Input id="contato_nome" placeholder="Nome do contato" {...register('contato_nome')} />
          {errors.contato_nome && (
            <p className="text-sm text-destructive">{errors.contato_nome.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="telefone">
            Telefone / WhatsApp <span className="text-destructive">*</span>
          </Label>
          <Input id="telefone" placeholder="(11) 99999-9999" {...register('telefone')} />
          {errors.telefone && <p className="text-sm text-destructive">{errors.telefone.message}</p>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="email">E-mail</Label>
          <Input id="email" type="email" placeholder="contato@empresa.com" {...register('email')} />
          {errors.email && <p className="text-sm text-destructive">{errors.email.message}</p>}
        </div>
      </div>

      <div className="space-y-3">
        <Label>Módulos de Interesse</Label>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {MODULES.map((module: any) => (
            <div key={module.id} className="flex items-center space-x-2">
              <Checkbox
                id={`module-${module.id}`}
                checked={selectedModules.includes(module.id)}
                onCheckedChange={() => toggleModule(module.id)}
              />
              <Label htmlFor={`module-${module.id}`} className="text-sm font-normal cursor-pointer">
                {module.name || module.label || module.id}
              </Label>
            </div>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="outro">Outro (especifique)</Label>
        <Input
          id="outro"
          placeholder="Descreva outro módulo ou necessidade"
          {...register('outro')}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="observacoes">Observações</Label>
        <Textarea
          id="observacoes"
          placeholder="Anotações sobre o contato..."
          rows={3}
          {...register('observacoes')}
        />
      </div>

      {whatsappError && (
        <div className="flex items-start gap-2 rounded-lg border border-amber-300 bg-amber-50 p-3">
          <AlertCircle className="h-5 w-5 flex-shrink-0 text-amber-600 mt-0.5" />
          <p className="text-sm text-amber-700">{whatsappError}</p>
        </div>
      )}

      <div className="flex justify-end gap-3">
        <Button
          type="button"
          variant="outline"
          onClick={() => {
            reset()
            setSelectedModules([])
            setWhatsappError(null)
          }}
          disabled={saving}
        >
          Limpar
        </Button>
        <Button type="submit" disabled={saving} className="gap-2">
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          Salvar Contato
        </Button>
      </div>

      <p className="text-xs text-muted-foreground">
        Ao salvar, o WhatsApp será aberto automaticamente com a mensagem de apresentação para envio
        ao contato.
      </p>
    </form>
  )
}
