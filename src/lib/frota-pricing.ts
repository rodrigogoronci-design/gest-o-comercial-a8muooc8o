import { MODULES } from '@/constants/contracts'

export interface FrotaPricingConfig {
  basePrice: number
  franquia: number
  excedente: number
}

export function getFrotaModuleConfig(): FrotaPricingConfig {
  const frotaModule = MODULES.find((m) => m.id === 'mod-frota-20')
  return {
    basePrice: frotaModule?.price ?? 320,
    franquia: (frotaModule as any)?.franquia_quantidade ?? 20,
    excedente: (frotaModule as any)?.valor_excedente ?? 8,
  }
}

export function calculateFrotaMonthlyPrice(numPlates: number): number {
  const config = getFrotaModuleConfig()
  if (numPlates <= config.franquia) return config.basePrice
  return config.basePrice + (numPlates - config.franquia) * config.excedente
}

export function calculateFrotaExtraPlatesCost(numPlates: number): number {
  const config = getFrotaModuleConfig()
  if (numPlates <= config.franquia) return 0
  return (numPlates - config.franquia) * config.excedente
}
