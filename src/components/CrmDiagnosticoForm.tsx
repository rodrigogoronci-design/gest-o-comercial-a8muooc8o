import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { supabase } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import { useToast } from '@/hooks/use-toast'
import { formatCurrency } from '@/lib/formatters'
import { Loader2, Save } from 'lucide-react'
import { cn } from '@/lib/utils'

const FALLBACK_PLANS = [
  { codigo: 'ERP-NONE', descricao: 'Nenhum (Somente Módulos / Upsell)', preco: 0 },
  { codigo: 'ERP-TMS-50', descricao: 'TMS-50', preco: 399 },
  { codigo: 'ERP-TMS-100', descricao: 'TMS-100', preco: 657 },
  { codigo: 'ERP-TMS-200', descricao: 'TMS-200', preco: 585 },
  { codigo: 'ERP-TMS-300', descricao: 'TMS-300', preco: 877 },
  { codigo: 'ERP-TMS-500', descricao: 'TMS-500', preco: 1097 },
  { codigo: 'ERP-MTS-1000', descricao: 'MTS-1000', preco: 1427 },
  { codigo: 'ERP-TMS-3000', descricao: 'TMS-3000', preco: 1757 },
  { codigo: 'ERP-TMS-5000', descricao: 'TMS-5000', preco: 2087 },
  { codigo: 'ERP-TMS-5000-PLUS', descricao: 'TMS-5000+', preco: 2487 },
]

const FALLBACK_MODULES = [
  { codigo: 'MOD-EDI', descricao: 'EDI', preco: 250 },
  { codigo: 'MOD-CTRL-VIAGEM', descricao: 'Controle de Viagem', preco: 199 },
  { codigo: 'MOD-FROTA-10', descricao: 'Frota (até 10 placas)', preco: 250 },
  { codigo: 'MOD-MEDICAO', descricao: 'Medição', preco: 350 },
  { codigo: 'MOD-FRACIONADO', descricao: 'Fracionado', preco: 350 },
  { codigo: 'MOD-TCI-TCE', descricao: 'Bloco TCI e TCE (Transportes)', preco: 350 },
  { codigo: 'MOD-FUNDO-PROT', descricao: 'Fundo de proteção', preco: 1201 },
  { codigo: 'MOD-CALENDARIO', descricao: 'Calendário', preco: 165 },
  { codigo: 'MOD-PAINEL', descricao: 'Painel de Informações', preco: 165 },
  { codigo: 'MOD-FISCAL', descricao: 'Fiscal', preco: 199 },
  { codigo: 'MOD-DFE', descricao: 'DF-e', preco: 165 },
  { codigo: 'MOD-POWER-BI', descricao: 'Power BI', preco: 199 },
  { codigo: 'MOD-SL-TRIP', descricao: 'SL-Trip', preco: 299 },
  { codigo: 'MOD-SL-TRACK', descricao: 'SL-Track', preco: 299 },
  { codigo: 'MOD-HOMOL-BANC', descricao: 'Homologação Bancaria', preco: 200 },
  { codigo: 'MOD-CIOT', descricao: 'CIOT', preco: 250 },
  { codigo: 'MOD-TORRE-CTRL', descricao: 'Torre de Controle Logística', preco: 299 },
]

export interface CrmDiagnosticoFormProps {
  prospect: any
  onSuccess?: () => void
  onCancel?: () => void
}

export function CrmDiagnosticoForm({ prospect, onSuccess, onCancel }: CrmDiagnosticoFormProps) {
  const [isSaving, setIsSaving] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const { toast } = useToast()

  const [plans, setPlans] = useState(FALLBACK_PLANS)
  const [modules, setModules] = useState(FALLBACK_MODULES)

  const form = useForm({
    defaultValues: {
      planoSelecionado: prospect?.diagnostico?.planoSelecionado || null,
      modulosSelecionados: prospect?.diagnostico?.modulosSelecionados || {},
      observacoes: prospect?.diagnostico?.observacoes || '',
    },
  })

  useEffect(() => {
    const loadConfig = async () => {
      try {
        const { data, error } = await supabase
          .from('planos_saude')
          .select('codigo, descricao, valor_titular')
          .or(`codigo.like.ERP-%,codigo.like.MOD-%`)

        if (data && data.length > 0) {
          const fetchedPlans = data
            .filter((d) => d.codigo.startsWith('ERP-'))
            .map((d) => ({ codigo: d.codigo, descricao: d.descricao, preco: d.valor_titular }))
          const fetchedMods = data
            .filter((d) => d.codigo.startsWith('MOD-'))
            .map((d) => ({ codigo: d.codigo, descricao: d.descricao, preco: d.valor_titular }))

          if (fetchedPlans.length > 0) {
            const none = fetchedPlans.find((p) => p.codigo === 'ERP-NONE')
            const rest = fetchedPlans
              .filter((p) => p.codigo !== 'ERP-NONE')
              .sort((a, b) => a.preco - b.preco)
            setPlans(none ? [none, ...rest] : rest)
          }
          if (fetchedMods.length > 0) {
            setModules(fetchedMods)
          }
        }
      } catch (err) {
        console.error('Error loading plans:', err)
      } finally {
        setIsLoading(false)
      }
    }
    loadConfig()
  }, [])

  const onSubmit = async (values: any) => {
    setIsSaving(true)
    try {
      const currentDiagnostico = prospect.diagnostico || {}
      const updatedDiagnostico = {
        ...currentDiagnostico,
        ...values,
      }

      const { error } = await supabase
        .from('crm_prospects')
        .update({ diagnostico: updatedDiagnostico })
        .eq('id', prospect.id)

      if (error) throw error

      toast({ title: 'Condições comerciais salvas com sucesso!' })
      onSuccess?.()
    } catch (error: any) {
      toast({ title: 'Erro ao salvar', description: error.message, variant: 'destructive' })
    } finally {
      setIsSaving(false)
    }
  }

  const selectedPlan = form.watch('planoSelecionado')
  const selectedModules = form.watch('modulosSelecionados') || {}

  const totalValue =
    (selectedPlan?.precoNegociado || 0) +
    Object.values(selectedModules).reduce(
      (acc: number, mod: any) => acc + (mod?.precoNegociado || 0),
      0,
    )

  const handlePlanChange = (val: string) => {
    if (val === 'ERP-NONE') {
      form.setValue('planoSelecionado', {
        codigo: 'ERP-NONE',
        descricao: 'Nenhum (Somente Módulos / Upsell)',
        precoPadrao: 0,
        precoNegociado: 0,
      })
      return
    }
    const plan = plans.find((p) => p.codigo === val)
    if (plan) {
      form.setValue('planoSelecionado', {
        codigo: plan.codigo,
        descricao: plan.descricao,
        precoPadrao: plan.preco,
        precoNegociado: plan.preco,
      })
    }
  }

  const handleModuleToggle = (mod: any, checked: boolean) => {
    const current = form.getValues('modulosSelecionados') || {}
    if (checked) {
      form.setValue('modulosSelecionados', {
        ...current,
        [mod.codigo]: {
          codigo: mod.codigo,
          descricao: mod.descricao,
          precoPadrao: mod.preco,
          precoNegociado: mod.preco,
        },
      })
    } else {
      const updated = { ...current }
      delete updated[mod.codigo]
      form.setValue('modulosSelecionados', updated)
    }
  }

  if (isLoading) {
    return (
      <div className="flex justify-center p-8">
        <Loader2 className="animate-spin h-8 w-8 text-primary" />
      </div>
    )
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
      <Card>
        <CardHeader className="pb-4">
          <CardTitle>Configuração Comercial</CardTitle>
          <CardDescription>
            Defina o plano e módulos de interesse para gerar propostas personalizadas para este
            lead.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* PLANO */}
          <div className="space-y-4">
            <div className="flex flex-col gap-4 md:flex-row md:items-start">
              <div className="flex-1 space-y-2">
                <Label>Plano de Franquia</Label>
                <Select value={selectedPlan?.codigo || ''} onValueChange={handlePlanChange}>
                  <SelectTrigger className="bg-background">
                    <SelectValue placeholder="Selecione um plano" />
                  </SelectTrigger>
                  <SelectContent>
                    {plans.map((p) => (
                      <SelectItem key={p.codigo} value={p.codigo}>
                        {p.descricao} {p.preco > 0 ? `- ${formatCurrency(p.preco)}` : ''}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {selectedPlan && selectedPlan.codigo !== 'ERP-NONE' && (
                <div className="w-full md:w-48 space-y-2 animate-in fade-in zoom-in duration-300">
                  <Label className="text-primary font-medium">Valor do Plano (Negociado)</Label>
                  <Input
                    type="number"
                    min="0"
                    step="0.01"
                    value={selectedPlan.precoNegociado}
                    onChange={(e) =>
                      form.setValue('planoSelecionado.precoNegociado', Number(e.target.value))
                    }
                    className="border-primary/50 focus-visible:ring-primary"
                  />
                </div>
              )}
            </div>
          </div>

          {/* MODULES */}
          <div className="space-y-3 pt-4 border-t">
            <Label className="text-base">Módulos Adicionais</Label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {modules.map((mod) => {
                const isChecked = !!selectedModules[mod.codigo]
                return (
                  <div
                    key={mod.codigo}
                    className={cn(
                      'border rounded-lg p-3 transition-colors duration-200',
                      isChecked ? 'bg-primary/5 border-primary/30' : 'bg-card hover:bg-accent/50',
                    )}
                  >
                    <div className="flex items-start space-x-3">
                      <Checkbox
                        id={`mod-${mod.codigo}`}
                        checked={isChecked}
                        onCheckedChange={(c) => handleModuleToggle(mod, c as boolean)}
                        className="mt-1"
                      />
                      <div className="flex-1 space-y-1">
                        <Label
                          htmlFor={`mod-${mod.codigo}`}
                          className="font-medium cursor-pointer leading-snug block"
                        >
                          {mod.descricao} -{' '}
                          <span className="text-muted-foreground font-normal">
                            {formatCurrency(mod.preco)}
                          </span>
                        </Label>

                        {isChecked && (
                          <div className="mt-3 flex items-center gap-2 animate-in slide-in-from-top-1">
                            <Label className="text-xs text-muted-foreground whitespace-nowrap">
                              Valor Negociado:
                            </Label>
                            <Input
                              type="number"
                              min="0"
                              step="0.01"
                              value={selectedModules[mod.codigo]?.precoNegociado ?? mod.preco}
                              onChange={(e) =>
                                form.setValue(
                                  `modulosSelecionados.${mod.codigo}.precoNegociado`,
                                  Number(e.target.value),
                                )
                              }
                              className="h-8 w-32 text-sm"
                            />
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle className="text-lg">Observações do Diagnóstico</CardTitle>
          </CardHeader>
          <CardContent>
            <Textarea
              placeholder="Adicione informações adicionais sobre as necessidades operacionais e comerciais do cliente..."
              className="min-h-[120px]"
              {...form.register('observacoes')}
            />
          </CardContent>
        </Card>

        <Card className="bg-primary/5 border-primary/20">
          <CardHeader>
            <CardTitle className="text-lg text-primary">Resumo da Proposta</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Plano</span>
              <span className="font-medium">
                {formatCurrency(selectedPlan?.precoNegociado || 0)}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">
                Módulos ({Object.keys(selectedModules).length})
              </span>
              <span className="font-medium">
                {formatCurrency(
                  Object.values(selectedModules).reduce(
                    (acc: number, m: any) => acc + (m?.precoNegociado || 0),
                    0,
                  ),
                )}
              </span>
            </div>
            <div className="pt-4 border-t border-primary/10 flex justify-between items-center">
              <span className="font-semibold text-primary">Total Mensal</span>
              <span className="text-xl font-bold text-primary">{formatCurrency(totalValue)}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="flex justify-end gap-3">
        {onCancel && (
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancelar
          </Button>
        )}
        <Button type="submit" disabled={isSaving}>
          {isSaving ? (
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          ) : (
            <Save className="w-4 h-4 mr-2" />
          )}
          Salvar Condições
        </Button>
      </div>
    </form>
  )
}
