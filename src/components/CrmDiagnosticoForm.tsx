import { useState, useEffect } from 'react'
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
import { CrmDocumentUpload } from '@/components/CrmDocumentUpload'

interface PlanItem {
  id: string
  codigo: string
  descricao: string
  preco: number
}

const FALLBACK_PLANS: PlanItem[] = [
  { id: 'none', codigo: 'ERP-NONE', descricao: 'Nenhum (Somente Módulos / Upsell)', preco: 0 },
  { id: 'erp-50', codigo: 'ERP-TMS-50', descricao: 'TMS-50', preco: 399 },
  { id: 'erp-100', codigo: 'ERP-TMS-100', descricao: 'TMS-100', preco: 657 },
  { id: 'erp-200', codigo: 'ERP-TMS-200', descricao: 'TMS-200', preco: 585 },
  { id: 'erp-300', codigo: 'ERP-TMS-300', descricao: 'TMS-300', preco: 877 },
  { id: 'erp-500', codigo: 'ERP-TMS-500', descricao: 'TMS-500', preco: 1097 },
  { id: 'erp-1000', codigo: 'ERP-MTS-1000', descricao: 'MTS-1000', preco: 1427 },
  { id: 'erp-3000', codigo: 'ERP-TMS-3000', descricao: 'TMS-3000', preco: 1757 },
  { id: 'erp-5000', codigo: 'ERP-TMS-5000', descricao: 'TMS-5000', preco: 2087 },
  { id: 'erp-5000p', codigo: 'ERP-TMS-5000-PLUS', descricao: 'TMS-5000+', preco: 2487 },
]

const FALLBACK_MODULES: PlanItem[] = [
  { id: 'mod-edi', codigo: 'MOD-EDI', descricao: 'EDI', preco: 250 },
  { id: 'mod-ctrl-viagem', codigo: 'MOD-CTRL-VIAGEM', descricao: 'Controle de Viagem', preco: 199 },
  { id: 'mod-frota', codigo: 'MOD-FROTA-10', descricao: 'Frota (até 10 placas)', preco: 250 },
  { id: 'mod-medicao', codigo: 'MOD-MEDICAO', descricao: 'Medição', preco: 350 },
  { id: 'mod-fracionado', codigo: 'MOD-FRACIONADO', descricao: 'Fracionado', preco: 350 },
  {
    id: 'mod-tci-tce',
    codigo: 'MOD-TCI-TCE',
    descricao: 'Bloco TCI e TCE (Transportes)',
    preco: 350,
  },
  { id: 'mod-fundo-prot', codigo: 'MOD-FUNDO-PROT', descricao: 'Fundo de proteção', preco: 1201 },
  { id: 'mod-calendario', codigo: 'MOD-CALENDARIO', descricao: 'Calendário', preco: 165 },
  { id: 'mod-painel', codigo: 'MOD-PAINEL', descricao: 'Painel de Informações', preco: 165 },
  { id: 'mod-fiscal', codigo: 'MOD-FISCAL', descricao: 'Fiscal', preco: 199 },
  { id: 'mod-dfe', codigo: 'MOD-DFE', descricao: 'DF-e', preco: 165 },
  { id: 'mod-power-bi', codigo: 'MOD-POWER-BI', descricao: 'Power BI', preco: 199 },
  { id: 'mod-sl-trip', codigo: 'MOD-SL-TRIP', descricao: 'SL-Trip', preco: 299 },
  { id: 'mod-sl-track', codigo: 'MOD-SL-TRACK', descricao: 'SL-Track', preco: 299 },
  { id: 'mod-homol-banc', codigo: 'MOD-HOMOL-BANC', descricao: 'Homologação Bancaria', preco: 200 },
  { id: 'mod-ciot', codigo: 'MOD-CIOT', descricao: 'CIOT', preco: 250 },
  {
    id: 'mod-torre-ctrl',
    codigo: 'MOD-TORRE-CTRL',
    descricao: 'Torre de Controle Logística',
    preco: 299,
  },
]

interface PlanoSelecionado {
  id: string
  nome: string
  valor_original: number
  valor_negociado: number
}

interface ModuloAdicional {
  id: string
  nome: string
  valor_original: number
  valor_negociado: number
  selecionado: boolean
}

export interface CrmDiagnosticoFormProps {
  prospectId: string
  initialPlanoId?: string | null
  initialPropostaUrl?: string | null
  initialContratoUrl?: string | null
  onSave?: () => void
}

export function CrmDiagnosticoForm({
  prospectId,
  initialPlanoId,
  initialPropostaUrl,
  initialContratoUrl,
  onSave,
}: CrmDiagnosticoFormProps) {
  const [isSaving, setIsSaving] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const { toast } = useToast()

  const [plans, setPlans] = useState<PlanItem[]>(FALLBACK_PLANS)
  const [modules, setModules] = useState<PlanItem[]>(FALLBACK_MODULES)
  const [planoSelecionado, setPlanoSelecionado] = useState<PlanoSelecionado | null>(null)
  const [modulosSelecionados, setModulosSelecionados] = useState<Record<string, ModuloAdicional>>(
    {},
  )
  const [observacoes, setObservacoes] = useState('')
  const [valorImplantacao, setValorImplantacao] = useState(0)
  const [propostaUrl, setPropostaUrl] = useState<string | null>(null)
  const [contratoUrl, setContratoUrl] = useState<string | null>(null)

  useEffect(() => {
    const loadData = async () => {
      try {
        const { data: planData } = await supabase
          .from('planos_saude')
          .select('id, codigo, descricao, valor_titular')
          .or('codigo.like.ERP-%,codigo.like.MOD-%')

        let activePlans = FALLBACK_PLANS
        let activeModules = FALLBACK_MODULES

        if (planData && planData.length > 0) {
          const fetchedPlans = planData
            .filter((d) => d.codigo.startsWith('ERP-'))
            .map((d) => ({
              id: d.id,
              codigo: d.codigo,
              descricao: d.descricao,
              preco: d.valor_titular || 0,
            }))
          const fetchedMods = planData
            .filter((d) => d.codigo.startsWith('MOD-'))
            .map((d) => ({
              id: d.id,
              codigo: d.codigo,
              descricao: d.descricao,
              preco: d.valor_titular || 0,
            }))

          if (fetchedPlans.length > 0) {
            const none = fetchedPlans.find((p) => p.codigo === 'ERP-NONE')
            const rest = fetchedPlans
              .filter((p) => p.codigo !== 'ERP-NONE')
              .sort((a, b) => a.preco - b.preco)
            activePlans = none ? [none, ...rest] : rest
            setPlans(activePlans)
          }
          if (fetchedMods.length > 0) {
            activeModules = fetchedMods
            setModules(activeModules)
          }
        }

        const { data: prospect } = await supabase
          .from('crm_prospects')
          .select('diagnostico, plano_id, proposta_url, contrato_assinado_url')
          .eq('id', prospectId)
          .single()

        if (prospect?.diagnostico) {
          const diag = prospect.diagnostico as any
          if (diag.plano_selecionado) {
            setPlanoSelecionado(diag.plano_selecionado)
          } else if (prospect.plano_id || initialPlanoId) {
            const pid = prospect.plano_id || initialPlanoId
            const plan = activePlans.find((p) => p.id === pid)
            if (plan) {
              setPlanoSelecionado({
                id: plan.id,
                nome: plan.descricao,
                valor_original: plan.preco,
                valor_negociado: plan.preco,
              })
            }
          }
          if (Array.isArray(diag.modulos_adicionais)) {
            const modMap: Record<string, ModuloAdicional> = {}
            diag.modulos_adicionais.forEach((m: ModuloAdicional) => {
              if (m.selecionado) modMap[m.id] = m
            })
            setModulosSelecionados(modMap)
          }
          if (diag.observacoes) setObservacoes(diag.observacoes)
          if (diag.valor_implantacao !== undefined) setValorImplantacao(diag.valor_implantacao)
        } else if (initialPlanoId) {
          const plan = activePlans.find((p) => p.id === initialPlanoId)
          if (plan) {
            setPlanoSelecionado({
              id: plan.id,
              nome: plan.descricao,
              valor_original: plan.preco,
              valor_negociado: plan.preco,
            })
          }
        }

        if (prospect?.proposta_url) setPropostaUrl(prospect.proposta_url)
        else if (initialPropostaUrl) setPropostaUrl(initialPropostaUrl)

        if (prospect?.contrato_assinado_url) setContratoUrl(prospect.contrato_assinado_url)
        else if (initialContratoUrl) setContratoUrl(initialContratoUrl)
      } catch (err) {
        console.error('Error loading data:', err)
      } finally {
        setIsLoading(false)
      }
    }
    loadData()
  }, [prospectId, initialPlanoId])

  const totalValue =
    (planoSelecionado?.valor_negociado || 0) +
    Object.values(modulosSelecionados).reduce((acc, m) => acc + (m.valor_negociado || 0), 0)

  const handlePlanChange = (planId: string) => {
    const plan = plans.find((p) => p.id === planId)
    if (!plan) return
    setPlanoSelecionado({
      id: plan.id,
      nome: plan.descricao,
      valor_original: plan.preco,
      valor_negociado: plan.preco,
    })
  }

  const handleModuleToggle = (mod: PlanItem, checked: boolean) => {
    if (checked) {
      setModulosSelecionados((prev) => ({
        ...prev,
        [mod.id]: {
          id: mod.id,
          nome: mod.descricao,
          valor_original: mod.preco,
          valor_negociado: mod.preco,
          selecionado: true,
        },
      }))
    } else {
      setModulosSelecionados((prev) => {
        const updated = { ...prev }
        delete updated[mod.id]
        return updated
      })
    }
  }

  const handlePlanoNegociadoChange = (value: number) => {
    setPlanoSelecionado((prev) => (prev ? { ...prev, valor_negociado: value } : null))
  }

  const handleModuloNegociadoChange = (modId: string, value: number) => {
    setModulosSelecionados((prev) => ({
      ...prev,
      [modId]: { ...prev[modId], valor_negociado: value },
    }))
  }

  const handlePropostaUrlChange = async (url: string | null) => {
    setPropostaUrl(url)
    await supabase.from('crm_prospects').update({ proposta_url: url }).eq('id', prospectId)
    onSave?.()
  }

  const handleContratoUrlChange = async (url: string | null) => {
    setContratoUrl(url)
    await supabase.from('crm_prospects').update({ contrato_assinado_url: url }).eq('id', prospectId)
    onSave?.()
  }

  const onSubmit = async () => {
    setIsSaving(true)
    try {
      const diagnostico = {
        plano_selecionado: planoSelecionado,
        modulos_adicionais: Object.values(modulosSelecionados),
        valor_total_mensal: totalValue,
        valor_implantacao: valorImplantacao,
        observacoes,
      }

      const planoId =
        planoSelecionado && planoSelecionado.id !== 'none' ? planoSelecionado.id : null

      const { error } = await supabase
        .from('crm_prospects')
        .update({
          diagnostico,
          plano_id: planoId,
          proposta_url: propostaUrl,
          contrato_assinado_url: contratoUrl,
        })
        .eq('id', prospectId)

      if (error) throw error

      toast({ title: 'Diagnóstico salvo com sucesso!' })
      onSave?.()
    } catch (error: any) {
      toast({ title: 'Erro ao salvar diagnóstico. Tente novamente.', variant: 'destructive' })
    } finally {
      setIsSaving(false)
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
    <form
      onSubmit={(e) => {
        e.preventDefault()
        onSubmit()
      }}
      className="space-y-6"
    >
      <Card>
        <CardHeader className="pb-4">
          <CardTitle>Configuração Comercial</CardTitle>
          <CardDescription>
            Defina o plano e módulos de interesse para gerar propostas personalizadas para este
            lead.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <div className="flex flex-col gap-4 md:flex-row md:items-start">
              <div className="flex-1 space-y-2">
                <Label>Plano de Franquia</Label>
                <Select value={planoSelecionado?.id || ''} onValueChange={handlePlanChange}>
                  <SelectTrigger className="bg-background">
                    <SelectValue placeholder="Selecione um plano" />
                  </SelectTrigger>
                  <SelectContent>
                    {plans.map((p) => (
                      <SelectItem key={p.id} value={p.id}>
                        {p.descricao} {p.preco > 0 ? `- ${formatCurrency(p.preco)}` : ''}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {planoSelecionado && planoSelecionado.id !== 'none' && (
                <div className="w-full md:w-48 space-y-2 animate-in fade-in zoom-in duration-300">
                  <Label className="text-primary font-medium">Valor do Plano (Negociado)</Label>
                  <Input
                    type="number"
                    min="0"
                    step="0.01"
                    value={planoSelecionado.valor_negociado}
                    onChange={(e) => handlePlanoNegociadoChange(Number(e.target.value))}
                    className="border-primary/50 focus-visible:ring-primary"
                  />
                </div>
              )}
            </div>
          </div>

          <div className="space-y-3 pt-4 border-t">
            <Label className="text-base">Módulos Adicionais</Label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {modules.map((mod) => {
                const isChecked = !!modulosSelecionados[mod.id]
                return (
                  <div
                    key={mod.id}
                    className={cn(
                      'border rounded-lg p-3 transition-colors duration-200',
                      isChecked ? 'bg-primary/5 border-primary/30' : 'bg-card hover:bg-accent/50',
                    )}
                  >
                    <div className="flex items-start space-x-3">
                      <Checkbox
                        id={`mod-${mod.id}`}
                        checked={isChecked}
                        onCheckedChange={(c) => handleModuleToggle(mod, c as boolean)}
                        className="mt-1"
                      />
                      <div className="flex-1 space-y-1">
                        <Label
                          htmlFor={`mod-${mod.id}`}
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
                              value={modulosSelecionados[mod.id]?.valor_negociado ?? mod.preco}
                              onChange={(e) =>
                                handleModuloNegociadoChange(mod.id, Number(e.target.value))
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
              value={observacoes}
              onChange={(e) => setObservacoes(e.target.value)}
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
                {formatCurrency(planoSelecionado?.valor_negociado || 0)}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">
                Módulos ({Object.keys(modulosSelecionados).length})
              </span>
              <span className="font-medium">
                {formatCurrency(
                  Object.values(modulosSelecionados).reduce(
                    (acc, m) => acc + (m.valor_negociado || 0),
                    0,
                  ),
                )}
              </span>
            </div>
            <div className="space-y-1">
              <span className="text-sm text-muted-foreground">Valor Implantação (R$)</span>
              <Input
                type="number"
                min="0"
                step="0.01"
                value={valorImplantacao}
                onChange={(e) => setValorImplantacao(Number(e.target.value))}
                className="h-8 text-sm"
              />
            </div>
            <div className="pt-4 border-t border-primary/10 flex justify-between items-center">
              <span className="font-semibold text-primary">Valor Total Mensal</span>
              <span className="text-xl font-bold text-primary">{formatCurrency(totalValue)}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="pb-4">
          <CardTitle>Documentos Finais</CardTitle>
          <CardDescription>
            Faça o upload da proposta aprovada e do contrato assinado para finalizar a negociação.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <CrmDocumentUpload
              prospectId={prospectId}
              label="Proposta Aprovada"
              currentUrl={propostaUrl}
              onUrlChange={handlePropostaUrlChange}
            />
            <CrmDocumentUpload
              prospectId={prospectId}
              label="Contrato Assinado"
              currentUrl={contratoUrl}
              onUrlChange={handleContratoUrlChange}
              required
            />
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end gap-3">
        <Button type="submit" disabled={isSaving}>
          {isSaving ? (
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          ) : (
            <Save className="w-4 h-4 mr-2" />
          )}
          Salvar
        </Button>
      </div>
    </form>
  )
}
