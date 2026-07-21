import { PLAN_MODULE_MAP, DEFAULT_BASIC_MODULE_IDS, MODULES } from '@/constants/contracts'

export function getPlanDefaultModules(planId: string): string[] {
  return PLAN_MODULE_MAP[planId] ?? DEFAULT_BASIC_MODULE_IDS
}

export function getPlanIncludedModuleNames(planId: string): string {
  if (!planId || planId === 'none') {
    return DEFAULT_BASIC_MODULE_IDS.map((id) => MODULES.find((m) => m.id === id)?.name ?? '')
      .filter(Boolean)
      .join(', ')
  }
  const moduleIds = getPlanDefaultModules(planId)
  return moduleIds
    .map((id) => MODULES.find((m) => m.id === id)?.name ?? '')
    .filter(Boolean)
    .join(', ')
}

export function isModuleIncludedInPlan(moduleId: string, planId: string): boolean {
  return getPlanDefaultModules(planId).includes(moduleId)
}
