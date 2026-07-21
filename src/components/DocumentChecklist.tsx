import { useState } from 'react'
import { CheckCircle2, Circle, FileCheck } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { DOCUMENT_REQUIREMENTS, TOTAL_REQUIRED_DOCS } from '@/lib/document-requirements'
import { updateDadosParametrizacao } from '@/services/implementacoes'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

interface DocumentChecklistProps {
  implementacaoId: string
  dados: Record<string, any>
  onDadosChange: (dados: Record<string, any>) => void
}

export function DocumentChecklist({
  implementacaoId,
  dados,
  onDadosChange,
}: DocumentChecklistProps) {
  const [savingKey, setSavingKey] = useState<string | null>(null)

  const checklistKey = (key: string) => `doc_check_${key}`
  const isChecked = (key: string) => !!dados[checklistKey(key)]
  const receivedCount = DOCUMENT_REQUIREMENTS.reduce(
    (acc, c) => acc + c.items.filter((i) => isChecked(i.key)).length,
    0,
  )

  const handleToggle = async (key: string, checked: boolean) => {
    const newDados = { ...dados, [checklistKey(key)]: checked }
    onDadosChange(newDados)
    setSavingKey(key)
    try {
      await updateDadosParametrizacao(implementacaoId, newDados)
    } catch (err: any) {
      toast.error('Erro ao atualizar checklist: ' + (err.message || ''))
      onDadosChange(dados)
    } finally {
      setSavingKey(null)
    }
  }

  return (
    <Card>
      <CardContent className="p-4 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wider flex items-center gap-2">
            <FileCheck className="h-4 w-4 text-indigo-600" />
            Documentos Pendentes
          </h3>
          <Badge
            variant="secondary"
            className={cn(
              'text-xs',
              receivedCount === TOTAL_REQUIRED_DOCS
                ? 'bg-emerald-50 text-emerald-700'
                : 'bg-amber-50 text-amber-700',
            )}
          >
            {receivedCount}/{TOTAL_REQUIRED_DOCS} recebidos
          </Badge>
        </div>
        {DOCUMENT_REQUIREMENTS.map((cat) => (
          <div key={cat.category} className="space-y-1.5">
            <p className="text-xs font-semibold text-slate-500 uppercase">{cat.category}</p>
            {cat.items.map((item) => {
              const checked = isChecked(item.key)
              return (
                <div key={item.key} className="flex items-center justify-between py-1">
                  <div className="flex items-center gap-2">
                    {checked ? (
                      <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                    ) : (
                      <Circle className="h-4 w-4 text-slate-300" />
                    )}
                    <Label className="text-sm cursor-pointer" htmlFor={`check-${item.key}`}>
                      {item.label}
                    </Label>
                  </div>
                  <Switch
                    id={`check-${item.key}`}
                    checked={checked}
                    onCheckedChange={(v) => handleToggle(item.key, v)}
                    disabled={savingKey === item.key}
                  />
                </div>
              )
            })}
          </div>
        ))}
      </CardContent>
    </Card>
  )
}
