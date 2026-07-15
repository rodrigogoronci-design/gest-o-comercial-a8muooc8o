import { useState, useEffect } from 'react'
import { Badge } from '@/components/ui/badge'
import { formatCurrency } from '@/lib/formatters'
import { fetchFrotaPlan, PlanoErp } from '@/services/planos'

interface FrotaPlanInfoProps {
  className?: string
}

export function FrotaPlanInfo({ className }: FrotaPlanInfoProps) {
  const [plan, setPlan] = useState<PlanoErp | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadPlan = async () => {
      const data = await fetchFrotaPlan()
      if (data) setPlan(data)
      setLoading(false)
    }
    loadPlan()
  }, [])

  if (loading) return null

  const franquia = plan?.franquia_quantidade ?? 20
  const excedente = plan?.valor_excedente ?? 8

  return (
    <div className={className}>
      <div className="flex flex-wrap gap-2">
        <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
          Franquia: {franquia} placas incluídas
        </Badge>
        <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">
          Excedente: {formatCurrency(excedente)}/placa extra
        </Badge>
        <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200">
          Mensalidade: {formatCurrency(plan?.valor_titular ?? 320)}
        </Badge>
      </div>
    </div>
  )
}
