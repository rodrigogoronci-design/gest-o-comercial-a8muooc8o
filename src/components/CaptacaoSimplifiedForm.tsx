import { useRef, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Loader2, Save, AlertCircle, Copy, ExternalLink, RefreshCw } from 'lucide-react'
import { supabase } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import { useToast } from '@/hooks/use-toast'
import { MODULES } from '@/constants/contracts'
import { fetchCnpjData } from '@/services/cnpj'
import { formatCNPJ } from '@/lib/cpf-utils'
import {
  WHATSAPP_PRESENTATION_LINK,
  cleansePhoneNumber,
  isValidBrazilianPhone,
  buildWhatsAppUrl,
  buildProspectOutreachMessage,
} from '@/lib/whatsapp-utils'

const captacaoSchema = z.object({
  empresa: z.string().min(1, 'Nome da empresa é obrigatório'),
  cnpj: z.string().optional(),
  contato_nome: z.string().min(1, 'Nome do contato é obrigatório'),
  telefone: z.string().min(1, 'Telefone é obrigatório'),
  email: z.string().email('E-mail inválido').optional().or(z.literal('')),
  outro: z.string().optional(),
  observacoes: z.string().optional(),
})

type CaptacaoFormValues = z.infer<typeof captacaoSchema>

export function CaptacaoSimplifiedForm() {
  const { toast } = useToast()
  const [saving, setSaving] = useState(false)
  const [whatsappError, setWhatsappError] = useState<string | null>(null)
  const [selectedModules, setSelectedModules] = useState<string[]>([])
  const [moduleError, setModuleError] = useState<string | null>(null)
  const [cnpjLoading, setCnpjLoading] = useState(false)
  // Mensagem de aproximação editável. Acompanha o nome da empresa preenchido,
  // mas pode ser livremente ajustada pela Aline antes do envio.
  const [outreachMessage, setOutreachMessage] = useState<string>(() =>
    buildProspectOutreachMessage(''),
  )
  // Marca quando a Aline editou a mensagem manualmente — para não sobrescrever
  // enquanto ela digita, apenas ao clicar em "regerar".
  const [outreachEdited, setOutreachEdited] = useState(false)

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    getValues,
    formState: { errors },
  } = useForm<CaptacaoFormValues>({
    resolver: zodResolver(captacaoSchema),
    defaultValues: {
      empresa: '',
      cnpj: '',
      contato_nome: '',
      telefone: '',
      email: '',
      outro: '',
      observacoes: '',
    },
  })

  const empresaValue = watch('empresa') || ''

  // Atualiza a mensagem automaticamente conforme a empresa é preenchida,
  // respeitando edições manuais feitas pela Aline.
  const syncOutreachFromFields = (empresa: string) => {
    if (outreachEdited) return
    setOutreachMessage(buildProspectOutreachMessage(empresa))
  }

  // Evita disparar a consulta CNPJ mais de uma vez para o mesmo número
  // (ex.: ao reformatar o campo enquanto o usuário digita).
  const lastLookedUpCnpj = useRef<string>('')

  // Consulta automática via BrasilAPI quando o CNPJ atinge 14 dígitos.
  // Preenche "Nome da Empresa" (razão social) sem bloquear o preenchimento
  // manual em caso de falha.
  const handleCnpjChange = async (rawValue: string) => {
    const formatted = formatCNPJ(rawValue)
    setValue('cnpj', formatted, { shouldValidate: false })

    const digits = formatted.replace(/\D/g, '')
    if (digits.length !== 14) return
    if (lastLookedUpCnpj.current === digits) return
    lastLookedUpCnpj.current = digits

    setCnpjLoading(true)
    try {
      const { data, error } = await fetchCnpjData(digits)
      if (error || !data) {
        toast({
          title: 'Consulta CNPJ indisponível',
          description: error || 'Preencha os dados manualmente.',
          variant: 'destructive',
        })
        return
      }

      // Razão social → Nome da Empresa (preenche apenas se vazio, para não
      // sobrescrever algo que a Aline já tenha digitado).
      if (data.nome && !getValues('empresa')) {
        setValue('empresa', data.nome, { shouldValidate: true })
        syncOutreachFromFields(data.nome)
        toast({
          title: 'Dados preenchidos',
          description: 'Razão social obtida via BrasilAPI.',
        })
      } else {
        toast({
          title: 'CNPJ consultado',
          description: data.nome
            ? `Razão social encontrada: ${data.nome}. O nome da empresa já estava preenchido.`
            : 'CNPJ consultado, mas nenhum nome retornado.',
        })
      }
    } catch {
      toast({
        title: 'Consulta CNPJ indisponível',
        description: 'Preencha os dados manualmente.',
        variant: 'destructive',
      })
    } finally {
      setCnpjLoading(false)
    }
  }

  const toggleModule = (moduleId: string) => {
    setSelectedModules((prev) =>
      prev.includes(moduleId) ? prev.filter((id) => id !== moduleId) : [...prev, moduleId],
    )
    setModuleError(null)
  }

  const handleCopyMessage = async () => {
    try {
      await navigator.clipboard.writeText(outreachMessage)
      toast({
        title: 'Mensagem copiada',
        description: 'Cole no WhatsApp ou onde preferir.',
      })
    } catch {
      toast({
        title: 'Não foi possível copiar',
        description: 'Selecione e copie manualmente o texto abaixo.',
        variant: 'destructive',
      })
    }
  }

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(WHATSAPP_PRESENTATION_LINK)
      toast({ title: 'Link copiado' })
    } catch {
      toast({
        title: 'Não foi possível copiar o link',
        variant: 'destructive',
      })
    }
  }

  const handleRegenerateMessage = () => {
    setOutreachMessage(buildProspectOutreachMessage(empresaValue))
    setOutreachEdited(false)
    toast({
      title: 'Mensagem atualizada',
      description: `Empresa: ${empresaValue.trim() || '(nome da empresa)'}.`,
    })
  }

  const onSubmit = async (values: CaptacaoFormValues) => {
    setWhatsappError(null)

    if (selectedModules.length === 0) {
      setModuleError('Selecione pelo menos um módulo de interesse')
      toast({
        title: 'Módulo obrigatório',
        description: 'Selecione pelo menos um módulo de interesse.',
        variant: 'destructive',
      })
      return
    }

    setSaving(true)

    try {
      const { error } = await supabase.from('crm_prospects').insert({
        empresa: values.empresa,
        cnpj: values.cnpj?.replace(/\D/g, '') || null,
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

      if (error) throw error

      toast({
        title: 'Contato salvo com sucesso!',
        description: 'O lead foi registrado no CRM.',
      })

      const phoneDigits = cleansePhoneNumber(values.telefone)

      if (!isValidBrazilianPhone(values.telefone)) {
        setWhatsappError('Número de telefone inválido. O WhatsApp não será aberto.')
        toast({
          title: 'WhatsApp não aberto',
          description:
            'Número de telefone inválido. O WhatsApp não será aberto. Você ainda pode copiar a mensagem e o link abaixo.',
          variant: 'destructive',
        })
        setSaving(false)
        reset()
        lastLookedUpCnpj.current = ''
        setSelectedModules([])
        setOutreachMessage(buildProspectOutreachMessage(''))
        setOutreachEdited(false)
        return
      }

      // Envia a mensagem de aproximação editada + link da apresentação.
      const fullMessage = `${outreachMessage}

🔗 Apresentação Service Logic: ${WHATSAPP_PRESENTATION_LINK}`

      const whatsappUrl = buildWhatsAppUrl(phoneDigits, fullMessage)
      if (whatsappUrl) {
        window.location.href = whatsappUrl
      }

      setSaving(false)
      reset()
      lastLookedUpCnpj.current = ''
      setSelectedModules([])
      setOutreachMessage(buildProspectOutreachMessage(''))
      setOutreachEdited(false)
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
          <Input
            id="empresa"
            placeholder="Nome da empresa"
            {...register('empresa', {
              onChange: (e) => syncOutreachFromFields(e.target.value),
            })}
          />
          {errors.empresa && <p className="text-sm text-destructive">{errors.empresa.message}</p>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="cnpj">CNPJ</Label>
          <div className="relative">
            <Input
              id="cnpj"
              inputMode="numeric"
              placeholder="00.000.000/0000-00"
              maxLength={18}
              value={watch('cnpj') || ''}
              onChange={(e) => handleCnpjChange(e.target.value)}
            />
            {cnpjLoading && (
              <Loader2 className="absolute right-2 top-2.5 h-4 w-4 animate-spin text-muted-foreground" />
            )}
          </div>
          <p className="text-xs text-muted-foreground">
            Informe o CNPJ para preencher automaticamente os dados da empresa.
          </p>
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
        <Label>
          Módulos de Interesse <span className="text-destructive">*</span>
        </Label>
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
        {moduleError && <p className="text-sm text-destructive">{moduleError}</p>}
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
            lastLookedUpCnpj.current = ''
            setCnpjLoading(false)
            setSelectedModules([])
            setWhatsappError(null)
            setModuleError(null)
            setOutreachMessage(buildProspectOutreachMessage(''))
            setOutreachEdited(false)
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

      {/* Mensagem de aproximação + link da apresentação, prontos para copiar/editar */}
      <div className="space-y-3 rounded-lg border border-slate-200 bg-slate-50 p-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h3 className="text-sm font-semibold text-slate-800">Mensagem para o prospect</h3>
            <p className="text-xs text-muted-foreground">
              Pronta para copiar/editar antes do envio. O nome da empresa é preenchido
              automaticamente.
            </p>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-8 gap-1.5 text-slate-600"
            onClick={handleRegenerateMessage}
            title="Regerar a mensagem a partir do nome da empresa atual"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            Regenerar
          </Button>
        </div>

        <Textarea
          value={outreachMessage}
          onChange={(e) => {
            setOutreachMessage(e.target.value)
            setOutreachEdited(true)
          }}
          rows={10}
          className="bg-white text-sm leading-relaxed"
        />

        <div className="flex flex-wrap items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="gap-1.5"
            onClick={handleCopyMessage}
          >
            <Copy className="h-3.5 w-3.5" />
            Copiar mensagem
          </Button>
        </div>

        {/* Link da apresentação — continua funcionando como antes */}
        <div className="space-y-2 border-t border-slate-200 pt-3">
          <div className="flex items-center justify-between gap-2">
            <Label className="text-sm font-semibold text-slate-700">Link da apresentação</Label>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-8 gap-1.5 text-slate-600"
              onClick={handleCopyLink}
            >
              <Copy className="h-3.5 w-3.5" />
              Copiar link
            </Button>
          </div>
          <a
            href={WHATSAPP_PRESENTATION_LINK}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-sm text-indigo-600 hover:text-indigo-800 hover:underline break-all"
          >
            {WHATSAPP_PRESENTATION_LINK}
            <ExternalLink className="h-3.5 w-3.5 flex-shrink-0" />
          </a>
        </div>
      </div>
    </form>
  )
}
