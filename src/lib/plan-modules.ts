import { PLAN_MODULE_MAP, DEFAULT_BASIC_MODULE_IDS, MODULES } from '@/constants/contracts'

const TMS_30_FALLBACK_MODULE_IDS = ['mod-admin', 'mod-basico', 'mod-carga', 'mod-comercial']

export function getPlanDefaultModules(planId: string): string[] {
  if (planId === 'tms-30') {
    return PLAN_MODULE_MAP[planId] ?? TMS_30_FALLBACK_MODULE_IDS
  }
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
