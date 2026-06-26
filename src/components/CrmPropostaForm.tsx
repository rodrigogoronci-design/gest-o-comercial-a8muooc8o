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
import { formatCNPJ } from '@/lib/formatters'

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
})

export type PropostaFormValues = z.infer<typeof propostaFormSchema>

export function CrmPropostaForm({
  onSubmit,
  isSubmitting,
  initialData,
}: {
  onSubmit: (v: PropostaFormValues, file: File | null) => void
  isSubmitting?: boolean
  initialData?: Partial<PropostaFormValues>
}) {
  const [file, setFile] = useState<File | null>(null)

  const form = useForm<PropostaFormValues>({
    resolver: zodResolver(propostaFormSchema),
    defaultValues: {
      valor_implantacao: initialData?.valor_implantacao || 0,
      valor_mensalidade: initialData?.valor_mensalidade || 0,
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
    },
  })

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'filiais_detalhes',
  })

  const watchQuantidade = form.watch('quantidade_filiais')

  // Sync array of fields based on the number input
  useEffect(() => {
    const currentLength = fields.length
    if (watchQuantidade > currentLength) {
      for (let i = currentLength; i < watchQuantidade; i++) {
        append({ nome: `Filial ${i + 1}`, cnpj: '' })
      }
    } else if (watchQuantidade < currentLength && watchQuantidade >= 0) {
      for (let i = currentLength - 1; i >= watchQuantidade; i--) {
        remove(i)
      }
    }
  }, [watchQuantidade, append, remove, fields.length])

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
          {form.watch('tipo_cobranca') === 'mensal' ? (
            <FormField
              control={form.control}
              name="valor_mensalidade"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Valor Mensalidade (R$)</FormLabel>
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
          <h3 className="font-semibold text-sm mb-4">Filiais Adicionais</h3>

          <div className="grid grid-cols-2 gap-4 mb-4">
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
                      onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="cobrar_filiais"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm bg-white">
                  <div className="space-y-0.5">
                    <FormLabel>Cobrar por Filiais</FormLabel>
                    <div className="text-[11px] text-muted-foreground">
                      Aplicar custos no total do contrato
                    </div>
                  </div>
                  <FormControl>
                    <Switch checked={field.value} onCheckedChange={field.onChange} />
                  </FormControl>
                </FormItem>
              )}
            />
          </div>

          <div className="space-y-3">
            {fields.map((field, index) => (
              <div
                key={field.id}
                className="grid grid-cols-2 gap-4 p-3 bg-slate-50 rounded-md border"
              >
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
                            const formatted = formatCNPJ(e.target.value)
                            cnpjField.onChange(formatted)
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
        </div>

        <div className="pt-4 flex justify-end">
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Salvando...' : 'Salvar Proposta'}
          </Button>
        </div>
      </form>
    </Form>
  )
}
