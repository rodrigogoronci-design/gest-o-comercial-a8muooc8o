import { useForm } from 'react-hook-form'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Checkbox } from '@/components/ui/checkbox'
import { Switch } from '@/components/ui/switch'
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
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'
import { useToast } from '@/hooks/use-toast'
import { supabase } from '@/lib/supabase/client'
import { diagnosticoSections, FieldDef } from '@/config/diagnostico-fields'

export function CrmDiagnosticoForm({
  prospectId,
  initialData,
  onSave,
}: {
  prospectId: string
  initialData?: any
  onSave: () => void
}) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { toast } = useToast()

  const form = useForm({
    defaultValues: initialData || {},
  })

  const generateTags = (values: any) => {
    const tags: string[] = []
    if (values.usa_planilhas) tags.push('Potencial Automação')
    if (values.dificuldade_principal === 'Financeiro') tags.push('Potencial Financeiro')
    if (values.frota_propria && Number(values.qtd_veiculos) > 10) tags.push('Potencial Frota')
    if (values.areas_melhoria?.includes('BI / Relatórios')) tags.push('Potencial BI')
    if (values.faturamento_atual === 'Manual') tags.push('Potencial Faturamento')
    return tags
  }

  const onSubmit = async (values: any) => {
    setIsSubmitting(true)
    const tags = generateTags(values)

    const { error } = await supabase
      .from('crm_prospects')
      .update({ diagnostico: values, tags })
      .eq('id', prospectId)

    setIsSubmitting(false)
    if (error) {
      toast({ title: 'Erro ao salvar', description: error.message, variant: 'destructive' })
      return
    }

    toast({ title: 'Sucesso', description: 'Diagnóstico salvo com sucesso!' })
    onSave()
  }

  const renderField = (fieldDef: FieldDef) => {
    return (
      <FormField
        key={fieldDef.name}
        control={form.control}
        name={fieldDef.name}
        render={({ field }) => {
          if (fieldDef.type === 'switch') {
            return (
              <FormItem className="flex flex-row items-center justify-between rounded-lg border border-slate-200 p-3 shadow-sm bg-white">
                <div className="space-y-0.5">
                  <FormLabel>{fieldDef.label}</FormLabel>
                </div>
                <FormControl>
                  <Switch checked={!!field.value} onCheckedChange={field.onChange} />
                </FormControl>
              </FormItem>
            )
          }

          if (fieldDef.type === 'checkboxGroup') {
            return (
              <FormItem className="col-span-full border border-slate-200 p-4 rounded-lg bg-white shadow-sm">
                <div className="mb-3">
                  <FormLabel className="text-base font-semibold">{fieldDef.label}</FormLabel>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {fieldDef.options?.map((opt) => (
                    <FormItem key={opt} className="flex flex-row items-start space-x-3 space-y-0">
                      <FormControl>
                        <Checkbox
                          checked={(field.value || []).includes(opt)}
                          onCheckedChange={(checked) => {
                            const current = field.value || []
                            const updated = checked
                              ? [...current, opt]
                              : current.filter((v: string) => v !== opt)
                            field.onChange(updated)
                          }}
                        />
                      </FormControl>
                      <FormLabel className="font-normal cursor-pointer leading-tight">
                        {opt}
                      </FormLabel>
                    </FormItem>
                  ))}
                </div>
              </FormItem>
            )
          }

          return (
            <FormItem className={fieldDef.type === 'textarea' ? 'col-span-full' : ''}>
              <FormLabel>{fieldDef.label}</FormLabel>
              <FormControl>
                {fieldDef.type === 'select' ? (
                  <Select onValueChange={field.onChange} value={field.value || ''}>
                    <SelectTrigger className="bg-white">
                      <SelectValue placeholder="Selecione..." />
                    </SelectTrigger>
                    <SelectContent>
                      {fieldDef.options?.map((o) => (
                        <SelectItem key={o} value={o}>
                          {o}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : fieldDef.type === 'textarea' ? (
                  <Textarea {...field} className="bg-white resize-none" value={field.value || ''} />
                ) : (
                  <Input
                    type={fieldDef.type}
                    {...field}
                    className="bg-white"
                    value={field.value || ''}
                  />
                )}
              </FormControl>
              <FormMessage />
            </FormItem>
          )
        }}
      />
    )
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <Accordion type="multiple" className="w-full space-y-2" defaultValue={['gerais']}>
          {diagnosticoSections.map((section) => (
            <AccordionItem
              key={section.id}
              value={section.id}
              className="border border-slate-200 rounded-lg overflow-hidden shadow-sm bg-white"
            >
              <AccordionTrigger className="text-base font-semibold px-4 py-3 hover:no-underline hover:bg-slate-50 transition-colors">
                {section.title}
              </AccordionTrigger>
              <AccordionContent className="p-4 bg-slate-50/50 border-t border-slate-100">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {section.fields.map((f) => renderField(f))}
                </div>
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
        <div className="flex justify-end pt-2 pb-6">
          <Button
            type="submit"
            disabled={isSubmitting}
            size="lg"
            className="w-full sm:w-auto shadow-sm"
          >
            {isSubmitting ? 'Salvando...' : 'Salvar Diagnóstico'}
          </Button>
        </div>
      </form>
    </Form>
  )
}
