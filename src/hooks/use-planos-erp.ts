import { useState, useEffect } from 'react'
import { PLANS, PlanItem } from '@/constants/contracts'
import { fetchPlanosErp, PlanoErp } from '@/services/planos'

const CODE_TO_PLAN_ID: Record<string, string> = {
  FROTA_20: 'frota-20',
  'ERP-TMS-30': 'tms-30',
  'ERP-TMS-50': 'tms-50',
  'ERP-TMS-100': 'tms-100',
  'ERP-TMS-200': 'tms-200',
  'ERP-TMS-300': 'tms-300',
  'ERP-TMS-500': 'tms-500',
  'ERP-MTS-1000': 'mts-1000',
  'ERP-TMS-3000': 'tms-3000',
  'ERP-TMS-5000': 'tms-5000',
  'ERP-TMS-5000-PLUS': 'tms-5000-plus',
}

export function usePlanosErp() {
  const [plans, setPlans] = useState<PlanItem[]>(PLANS)
  const [dbPlans, setDbPlans] = useState<PlanoErp[]>([])
  const [loading, setLoading] = useState(true)
  const [frotaPlan, setFrotaPlan] = useState<PlanoErp | null>(null)

  useEffect(() => {
    const loadPlans = async () => {
      try {
        const fetched = await fetchPlanosErp()
        if (fetched.length > 0) {
          setDbPlans(fetched)
          const merged = PLANS.map((p) => {
            const dbPlan = fetched.find((dp) => CODE_TO_PLAN_ID[dp.codigo] === p.id)
            if (dbPlan) {
              return {
                ...p,
                price: dbPlan.valor_titular ?? p.price,
                franquia_quantidade: dbPlan.franquia_quantidade ?? p.franquia_quantidade,
                valor_excedente: dbPlan.valor_excedente ?? p.valor_excedente,
              }
            }
            return p
          })
          setPlans(merged)
          const frota = fetched.find((dp) => dp.codigo === 'FROTA_20')
          if (frota) setFrotaPlan(frota)
        }
      } catch (err) {
        console.error('Error fetching ERP plans:', err)
      } finally {
        setLoading(false)
      }
    }
    loadPlans()
  }, [])

  return { plans, dbPlans, loading, frotaPlan }
}
