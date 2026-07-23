import { useState, useEffect, useRef } from 'react'
import { Save, Loader2 } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { SECTIONS, type FieldDef } from '@/components/parametrizacao-config'
import { TagsInput } from '@/components/TagsInput'
import { updateDadosParametrizacao } from '@/services/implementacoes'
import { toast } from 'sonner'

export function ParametrizacaoSection({
  implementacaoId,
  dados,
  clienteData,
}: {
  implementacaoId: string
  dados: any
  clienteData?: any
}) {
  const [formData, setFormData] = useState<Record<string, any>>({})
  const [saving, setSaving] = useState(false)
  const prevDadosRef = useRef('')

  useEffect(() => {
    const dadosStr = JSON.stringify(dados || {})
    if (dadosStr !== prevDadosRef.current) {
      prevDadosRef.current = dadosStr
      setFormData(dados || {})
    }
  }, [dados])

  const set = (key: string, val: any) => setFormData((prev) => ({ ...prev, [key]: val }))

  const handleSave = async () => {
    setSaving(true)
    try {
      await updateDadosParametrizacao(implementacaoId, formData)
      toast.success('Parametrização salva com sucesso!')
    } catch (err: any) {
      toast.error('Erro ao salvar parametrização: ' + (err.message || ''))
    } finally {
      setSaving(false)
    }
  }

  const renderField = (field: FieldDef) => {
    const val = formData[field.key]
    switch (field.type) {
      case 'text':
        return <Input value={val || ''} onChange={(e) => set(field.key, e.target.value)} />
      case 'password':
        return (
          <Input
            type="password"
            value={val || ''}
            onChange={(e) => set(field.key, e.target.value)}
          />
        )
      case 'radio':
        return (
          <RadioGroup
            value={val || ''}
            onValueChange={(v) => set(field.key, v)}
            className="flex gap-4"
          >
            <div className="flex items-center gap-1.5">
              <RadioGroupItem value="Sim" id={`${field.key}-sim`} />
              <Label htmlFor={`${field.key}-sim`} className="text-xs cursor-pointer">
                Sim
              </Label>
            </div>
            <div className="flex items-center gap-1.5">
              <RadioGroupItem value="Não" id={`${field.key}-nao`} />
              <Label htmlFor={`${field.key}-nao`} className="text-xs cursor-pointer">
                Não
              </Label>
            </div>
          </RadioGroup>
        )
      case 'toggle':
        return <Switch checked={!!val} onCheckedChange={(v) => set(field.key, v)} />
      case 'select':
        return (
          <Select value={val || ''} onValueChange={(v) => set(field.key, v)}>
            <SelectTrigger>
              <SelectValue placeholder="Selecione..." />
            </SelectTrigger>
            <SelectContent>
              {field.options?.map((o) => (
                <SelectItem key={o} value={o}>
                  {o}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )
      case 'tags':
        return (
          <TagsInput
            value={Array.isArray(val) ? val : []}
            onChange={(v) => set(field.key, v)}
            placeholder="Adicionar módulo..."
          />
        )
      case 'readonly': {
        const clientVal = clienteData?.[field.clientField || field.key]
        return (
          <Input
            value={clientVal || ''}
            readOnly
            className="bg-slate-50 text-slate-600 cursor-not-allowed"
          />
        )
      }
    }
  }

  return (
    <div className="space-y-3">
      {SECTIONS.map((section) => {
        const Icon = section.icon
        const isEnabled = section.toggleKey ? formData[section.toggleKey] : true
        return (
          <Card key={section.title}>
            <CardContent className="p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Icon className="h-4 w-4 text-slate-500" />
                  <h4 className="text-sm font-semibold text-slate-700">{section.title}</h4>
                </div>
                {section.toggleKey && (
                  <div className="flex items-center gap-2">
                    <Label className="text-xs text-slate-500">Habilitar</Label>
                    <Switch
                      checked={!!formData[section.toggleKey]}
                      onCheckedChange={(v) => set(section.toggleKey, v)}
                    />
                  </div>
                )}
              </div>
              {isEnabled && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {section.fields.map((field) => (
                    <div key={field.key} className="space-y-1">
                      <Label className="text-xs font-medium">{field.label}</Label>
                      {renderField(field)}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        )
      })}
      <Button
        onClick={handleSave}
        disabled={saving}
        className="w-full bg-indigo-600 hover:bg-indigo-700"
      >
        {saving ? (
          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
        ) : (
          <Save className="h-4 w-4 mr-2" />
        )}
        Salvar Parametrização
      </Button>
    </div>
  )
}
