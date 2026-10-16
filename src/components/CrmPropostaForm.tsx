import { useEffect, useState } from 'react'
import { useForm, useFieldArray } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { formatCNPJ, formatCurrency } from '@/lib/formatters'
import { calculateSla } from '@/lib/sla-calculations'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { UpsellModuleSelector, type UpsellModule } from './UpsellModuleSelector'

const filialSchema = z.object({
  nome: z.string().optional(),
  cnpj: z.string().min(14, 'CNPJ inválido'),
})

export const propostaFormSchema = z.object({
  valor_implantacao: z.number().min(0),
  valor_mensalidade: z.number().min(0),
  valor_anual: z.number().min(0).default(0),
  tipo_cobranca: z.enum(['mensal', 'anual']).default('mensal'),
  desconto_mensalidade: z.number().min(0).default(0),
  tipo_desconto: z.enum(['valor', 'percentual']).default('valor'),
  isencao_periodo: z.number().min(0).default(0),
  quantidade_filiais: z.number().min(0).default(0),
  cobrar_filiais: z.boolean().default(false),
  filiais_detalhes: z.array(filialSchema).default([]),
  aos_cuidados_de: z.string().optional(),
  itens: z.any().optional(),
  // SLA Diferenciado
  sla_ativo: z.boolean().default(false),
  percentual_sla: z.number().min(0).default(0),
  valor_sla: z.number().min(0).default(0),
  descricao_sla: z.string().optional().default(''),
})

export type PropostaFormValues = z.infer<typeof propostaFormSchema>

export function CrmPropostaForm({
  onSubmit,
  isSubmitting,
  initialData,
  currentMonthlyFee,
  availableModules,
}: {
  onSubmit: (v: PropostaFormValues, file: File | null) => void
  isSubmitting?: boolean
  initialData?: Partial<PropostaFormValues>
  currentMonthlyFee?: number | null
  availableModules?: UpsellModule[]
}) {
  const [file, setFile] = useState<File | null>(null)
  const [selectedModuleIds, setSelectedModuleIds] = useState<string[]>([])

  const form = useForm<PropostaFormValues>({
    resolver: zodResolver(propostaFormSchema) as any,
    defaultValues: {
      valor_implantacao: initialData?.valor_implantacao || 0,
      valor_mensalidade: initialData?.valor_mensalidade || currentMonthlyFee || 0,
      valor_anual: initialData?.valor_anual || 0,
      tipo_cobranca: initialData?.tipo_cobranca || 'mensal',
      desconto_mensalidade: initialData?.desconto_mensalidade || 0,
      tipo_desconto: initialData?.tipo_desconto || 'valor',
      isencao_periodo: initialData?.isencao_periodo || 0,
      quantidade_filiais: initialData?.quantidade_filiais || 0,
      cobrar_filiais: initialData?.cobrar_filiais || false,
      filiais_detalhes: initialData?.filiais_detalhes || [],
      aos_cuidados_de: initialData?.aos_cuidados_de || '',
      itens: initialData?.itens || [],
      sla_ativo: initialData?.sla_ativo || false,
      percentual_sla: initialData?.percentual_sla || 0,
      valor_sla: initialData?.valor_sla || 0,
      descricao_sla: initialData?.descricao_sla || '',
    },
  })

  // Controle de SLA Diferenciado
  const slaAtivoWatch = form.watch('sla_ativo')
  const percentualSlaWatch = form.watch('percentual_sla')
  const tipoCobrancaWatch = form.watch('tipo_cobranca')
  const tipoDescontoWatch = form.watch('tipo_desconto')
  const descontoMensalidadeWatch = form.watch('desconto_mensalidade')

  // Base de cálculo recorrente pura para o SLA no CRM
  const [baseMensalRecorrente, setBaseMensalRecorrente] = useState<number>(() => {
    return initialData?.valor_mensalidade || currentMonthlyFee || 0
  })

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'filiais_detalhes',
  })

  const cobrarFiliais = form.watch('cobrar_filiais')

  useEffect(() => {
    if (cobrarFiliais && fields.length === 0) {
      append({ nome: '', cnpj: '' })
      form.setValue('quantidade_filiais', 1)
    }
  }, [cobrarFiliais])

  useEffect(() => {
    if (availableModules && availableModules.length > 0) {
      const selected = availableModules.filter((m) => selectedModuleIds.includes(m.id))
      form.setValue('itens', selected)
      if (currentMonthlyFee != null) {
        const additional = selected.reduce((sum, m) => sum + m.valor, 0)
        setBaseMensalRecorrente(currentMonthlyFee + additional)
      }
    }
  }, [selectedModuleIds, availableModules, currentMonthlyFee])

  // Recalcular valor adicional de SLA e total mensal
  const slaCalc = calculateSla({
    subtotalRecorrente: baseMensalRecorrente,
    percentualSla: percentualSlaWatch || 0,
    slaAtivo: Boolean(slaAtivoWatch),
  })

  useEffect(() => {
    form.setValue('valor_sla', slaCalc.valorSla)
  }, [slaCalc.valorSla, form])

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit((v) => onSubmit(v, file))} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <FormField
            control={form.control}
            name="valor_implantacao"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Valor Implantação (R$)</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    step="0.01"
                    {...field}
                    onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="tipo_cobranca"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Ciclo de Pagamento</FormLabel>
                <FormControl>
                  <select
                    className="flex h-9 w-full items-center justify-between rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
                    {...field}
                  >
                    <option value="mensal">Mensal</option>
                    <option value="anual">Anual</option>
                  </select>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          {tipoCobrancaWatch === 'mensal' ? (
            <FormField
              control={form.control}
              name="valor_mensalidade"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Subtotal Mensalidade (R$)</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      step="0.01"
                      value={baseMensalRecorrente}
                      onChange={(e) => {
                        const val = parseFloat(e.target.value) || 0
                        setBaseMensalRecorrente(val)
                        field.onChange(val)
                      }}
                      readOnly={!!availableModules?.length}
                      className={availableModules?.length ? 'bg-slate-50 cursor-not-allowed' : ''}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          ) : (
            <FormField
              control={form.control}
              name="valor_anual"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Valor Anual (R$)</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      step="0.01"
                      {...field}
                      onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          )}

          <div className="space-y-2">
            <FormLabel>Desconto Recorrente</FormLabel>
            <div className="flex items-center gap-2">
              <FormField
                control={form.control}
                name="tipo_desconto"
                render={({ field }) => (
                  <FormItem className="w-24">
                    <FormControl>
                      <select
                        className="flex h-9 w-full items-center justify-between rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                        {...field}
                      >
                        <option value="valor">R$</option>
                        <option value="percentual">%</option>
                      </select>
                    </FormControl>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="desconto_mensalidade"
                render={({ field }) => (
                  <FormItem className="flex-1">
                    <FormControl>
                      <Input
                        type="number"
                        step="0.01"
                        {...field}
                        onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
            </div>
            <FormMessage />
          </div>
        </div>

        {/* Seção SLA Diferenciado no formulário CRM */}
        <div className="border border-indigo-100 bg-indigo-50/40 p-4 rounded-lg space-y-3">
          <div className="flex items-center justify-between">
            <FormLabel className="text-sm font-bold text-indigo-900 flex items-center gap-2">
              <span className="w-2 h-4 bg-indigo-600 rounded-full" />
              SLA Diferenciado
            </FormLabel>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="crm-sla-ativo"
                checked={slaAtivoWatch}
                onCheckedChange={(c) => {
                  const ativo = Boolean(c)
                  form.setValue('sla_ativo', ativo)
                  if (!ativo) {
                    form.setValue('percentual_sla', 0)
                    form.setValue('valor_sla', 0)
                    form.setValue('descricao_sla', '')
                  }
                }}
              />
              <Label
                htmlFor="crm-sla-ativo"
                className="text-xs cursor-pointer font-medium text-slate-700"
              >
                Ativar SLA Diferenciado
              </Label>
            </div>
          </div>

          {slaAtivoWatch && (
            <div className="space-y-4 pt-2">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="percentual_sla"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs font-semibold text-slate-700">
                        Percentual de acréscimo (%)
                      </FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min="0"
                          step="0.01"
                          placeholder="0,00"
                          value={field.value || ''}
                          onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                          className="bg-white border-slate-300"
                        />
                      </FormControl>
                      <span className="text-[11px] text-slate-500">
                        Incide sobre subtotal recorrente ({formatCurrency(baseMensalRecorrente)})
                      </span>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-slate-700">
                    Valor adicional do SLA (R$)
                  </Label>
                  <Input
                    type="text"
                    readOnly
                    disabled
                    value={formatCurrency(slaCalc.valorSla)}
                    className="bg-slate-100 font-bold text-indigo-700 cursor-not-allowed border-slate-300"
                  />
                  <span className="text-[11px] text-slate-500">Calculado automaticamente</span>
                </div>
              </div>

              <FormField
                control={form.control}
                name="descricao_sla"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs font-semibold text-slate-700">
                      Descrição do SLA
                    </FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Descreva as condições específicas negociadas do SLA diferenciado..."
                        {...field}
                        className="bg-white border-slate-300"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          )}

          {/* Resumo Financeiro no rodapé da seção */}
          <div className="mt-3 pt-3 border-t border-indigo-100 text-xs space-y-1 text-slate-700">
            <div className="flex justify-between">
              <span>Subtotal mensal dos produtos e serviços:</span>
              <span className="font-semibold">{formatCurrency(baseMensalRecorrente)}</span>
            </div>
            {descontoMensalidadeWatch > 0 && (
              <div className="flex justify-between text-emerald-600">
                <span>
                  Desconto (
                  {tipoDescontoWatch === 'percentual'
                    ? `${descontoMensalidadeWatch}%`
                    : formatCurrency(descontoMensalidadeWatch)}
                  ):
                </span>
                <span className="font-semibold">
                  -{' '}
                  {formatCurrency(
                    tipoDescontoWatch === 'percentual'
                      ? (baseMensalRecorrente * descontoMensalidadeWatch) / 100
                      : descontoMensalidadeWatch,
                  )}
                </span>
              </div>
            )}
            {slaAtivoWatch && (
              <>
                <div className="flex justify-between text-indigo-700">
                  <span>SLA diferenciado — percentual aplicado:</span>
                  <span className="font-semibold">
                    {(percentualSlaWatch || 0).toLocaleString('pt-BR', {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                    %
                  </span>
                </div>
                <div className="flex justify-between text-indigo-700">
                  <span>Valor adicional mensal do SLA:</span>
                  <span className="font-semibold">+ {formatCurrency(slaCalc.valorSla)}</span>
                </div>
              </>
            )}
            <div className="flex justify-between pt-2 border-t border-indigo-200 font-bold text-indigo-900 text-sm">
              <span>{slaAtivoWatch ? 'Total mensal final com SLA:' : 'Total mensal final:'}</span>
              <span>
                {formatCurrency(
                  Math.max(
                    0,
                    baseMensalRecorrente -
                      (tipoDescontoWatch === 'percentual'
                        ? (baseMensalRecorrente * (descontoMensalidadeWatch || 0)) / 100
                        : descontoMensalidadeWatch || 0) +
                      (slaAtivoWatch ? slaCalc.valorSla : 0),
                  ),
                )}
              </span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="isencao_periodo"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Período de Isenção (Meses)</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    min="0"
                    {...field}
                    onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="aos_cuidados_de"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Aos Cuidados De</FormLabel>
                <FormControl>
                  <Input placeholder="Nome do responsável" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="space-y-2">
          <FormLabel>Documento da Proposta (PDF)</FormLabel>
          <Input type="file" accept=".pdf" onChange={(e) => setFile(e.target.files?.[0] || null)} />
        </div>

        <div className="border-t pt-4 mt-4">
          <div className="grid grid-cols-2 gap-4 mb-4">
            <FormField
              control={form.control}
              name="cobrar_filiais"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm bg-white">
                  <div className="space-y-0.5">
                    <FormLabel className="text-sm font-bold text-slate-700">
                      Cobrar por Filial
                    </FormLabel>
                    <div className="text-[11px] text-muted-foreground">
                      Aplicar custos no total do contrato
                    </div>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={(c) => {
                        field.onChange(c)
                        if (!c) {
                          form.setValue('quantidade_filiais', 0)
                          form.setValue('filiais_detalhes', [])
                        }
                      }}
                    />
                  </FormControl>
                </FormItem>
              )}
            />

            {form.watch('cobrar_filiais') && (
              <FormField
                control={form.control}
                name="quantidade_filiais"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Quantidade de Filiais</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min="0"
                        {...field}
                        value={fields.length}
                        readOnly
                        className="bg-slate-50 cursor-not-allowed"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}
          </div>

          {form.watch('cobrar_filiais') && (
            <div className="space-y-3 bg-slate-50 border p-4 rounded-lg">
              <div className="flex items-center justify-between">
                <FormLabel className="text-sm font-bold text-slate-700">
                  Inclusão de Filiais
                </FormLabel>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    append({ nome: '', cnpj: '' })
                    form.setValue('quantidade_filiais', fields.length + 1)
                  }}
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    className="mr-2 h-4 w-4"
                  >
                    <path d="M5 12h14" />
                    <path d="M12 5v14" />
                  </svg>
                  Adicionar Filial
                </Button>
              </div>
              {fields.map((field, index) => (
                <div
                  key={field.id}
                  className="relative grid grid-cols-2 gap-4 p-3 bg-slate-50 rounded-md border mt-2"
                >
                  <Button
                    type="button"
                    variant="destructive"
                    size="sm"
                    className="absolute -top-3 -right-3 h-6 px-2 text-[10px] rounded-full z-10"
                    onClick={() => {
                      remove(index)
                      form.setValue('quantidade_filiais', Math.max(0, fields.length - 1))
                    }}
                  >
                    Remover
                  </Button>
                  <FormField
                    control={form.control}
                    name={`filiais_detalhes.${index}.nome`}
                    render={({ field: nameField }) => (
                      <FormItem>
                        <FormLabel>Nome da Filial {index + 1}</FormLabel>
                        <FormControl>
                          <Input placeholder="Nome da Filial" {...nameField} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name={`filiais_detalhes.${index}.cnpj`}
                    render={({ field: cnpjField }) => (
                      <FormItem>
                        <FormLabel>CNPJ da Filial {index + 1}</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="00.000.000/0000-00"
                            {...cnpjField}
                            onChange={(e) => {
                              const raw = e.target.value.replace(/\D/g, '')
                              const formatted = raw.length <= 14 ? formatCNPJ(raw) : e.target.value
                              cnpjField.onChange(formatted)

                              if (raw.length === 14) {
                                fetch(`https://brasilapi.com.br/api/cnpj/v1/${raw}`)
                                  .then((res) => res.json())
                                  .then((data) => {
                                    if (
                                      data.razao_social &&
                                      !form.getValues(`filiais_detalhes.${index}.nome`)
                                    ) {
                                      form.setValue(
                                        `filiais_detalhes.${index}.nome`,
                                        data.razao_social,
                                      )
                                    }
                                  })
                                  .catch(() => {})
                              }
                            }}
                            maxLength={18}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              ))}
            </div>
          )}
        </div>

        {availableModules && availableModules.length > 0 && (
          <div className="border-t pt-4 mt-4">
            <UpsellModuleSelector
              availableModules={availableModules}
              selectedModuleIds={selectedModuleIds}
              onToggleModule={(id) =>
                setSelectedModuleIds((prev) =>
                  prev.includes(id) ? prev.filter((m) => m !== id) : [...prev, id],
                )
              }
              currentMonthlyFee={currentMonthlyFee ?? null}
            />
          </div>
        )}

        <div className="pt-4 flex justify-end">
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Salvando...' : 'Salvar Proposta'}
          </Button>
        </div>
      </form>
    </Form>
  )
}
