import { useState, useEffect } from 'react'
import { HeartPulse } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { formatCurrency } from '@/lib/formatters'
import { supabase } from '@/lib/supabase/client'

type PlanoSaude = {
  id: string
  descricao: string
  codigo: string
  valor_titular: number | null
  valor_dependente: number | null
  com_coparticipacao: boolean | null
  padrao: boolean | null
}

type PlanGroup = {
  label: string
  filter: (p: PlanoSaude) => boolean
}

const PLAN_GROUPS: PlanGroup[] = [
  { label: 'Planos Padrão', filter: (p) => !!p.padrao },
  { label: 'Sem Coparticipação', filter: (p) => !p.padrao && !p.com_coparticipacao },
  { label: 'Com Coparticipação', filter: (p) => !p.padrao && !!p.com_coparticipacao },
]

export function PlanosSaudeSection() {
  const [planos, setPlanos] = useState<PlanoSaude[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchPlanos = async () => {
      const { data, error } = await supabase
        .from('planos_saude')
        .select(
          'id, descricao, codigo, valor_titular, valor_dependente, com_coparticipacao, padrao',
        )
        .order('padrao', { ascending: false })
        .order('com_coparticipacao', { ascending: true })
        .order('descricao', { ascending: true })
      if (!error && data) setPlanos(data as PlanoSaude[])
      setLoading(false)
    }
    fetchPlanos()
  }, [])

  if (loading || planos.length === 0) return null

  return (
    <div className="space-y-6 pt-6">
      <div className="flex items-center gap-2">
        <HeartPulse className="h-6 w-6 text-rose-600" />
        <h2 className="text-2xl font-semibold tracking-tight">Planos de Saúde</h2>
      </div>
      {PLAN_GROUPS.map((group) => {
        const items = planos.filter(group.filter)
        if (items.length === 0) return null
        return (
          <div key={group.label} className="space-y-3">
            <h3 className="text-sm font-semibold text-slate-600 uppercase tracking-wider">
              {group.label}
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {items.map((plano) => (
                <Card
                  key={plano.id}
                  className="relative overflow-hidden flex flex-col border-slate-200/60 shadow-sm hover:shadow-md transition-shadow group"
                >
                  <div className="absolute top-0 inset-x-0 h-1.5 bg-rose-500"></div>
                  <CardHeader className="pb-4">
                    <Badge
                      variant="secondary"
                      className="bg-rose-100 text-rose-800 hover:bg-rose-100 shadow-none w-fit"
                    >
                      {plano.com_coparticipacao ? 'Com Coparticipação' : 'Sem Coparticipação'}
                    </Badge>
                    <CardTitle className="text-lg mt-2 group-hover:text-rose-600 transition-colors">
                      {plano.descricao}
                    </CardTitle>
                    {plano.codigo && (
                      <CardDescription className="text-xs">Código: {plano.codigo}</CardDescription>
                    )}
                  </CardHeader>
                  <CardContent className="flex-grow">
                    <div className="mb-2">
                      <span className="text-2xl font-bold text-slate-900">
                        {formatCurrency(plano.valor_titular || 0)}
                      </span>
                      <span className="text-sm text-slate-500 font-medium">/mês</span>
                    </div>
                    {plano.valor_dependente != null && plano.valor_dependente > 0 && (
                      <p className="text-xs text-slate-500">
                        Dependente: {formatCurrency(plano.valor_dependente)}/mês
                      </p>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )
      })}
    </div>
  )
}
