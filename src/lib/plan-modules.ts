import { PLAN_MODULE_MAP, DEFAULT_BASIC_MODULE_IDS, MODULES, PLANS } from '@/constants/contracts'
import { parseModulosToList } from '@/lib/modules-parser'

const TMS_30_FALLBACK_MODULE_IDS = ['mod-admin', 'mod-basico', 'mod-carga', 'mod-comercial']

/**
 * Módulos básicos que estão inclusos em TODOS os planos (módulo básico).
 * Sempre aparecem no escopo contratado, mesmo que o cliente só tenha módulos adicionais.
 */
export const BASIC_MODULE_NAMES: string[] = MODULES.filter((m) => m.isBasic).map((m) => m.name)

/**
 * Módulos básicos inclusos para um plano específico (por id/código ERP).
 * Para TMS-30 retorna apenas 4; para os demais retorna o pacote padrão de 6.
 */
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

/**
 * Mapeia o código ERP (banco de dados) para o id canônico do plano usado no front.
 * Ex.: 'ERP-TMS-300' -> 'tms-300', 'ERP-MTS-1000' -> 'mts-1000'.
 */
export const ERP_CODE_TO_PLAN_ID: Record<string, string> = {
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
  FROTA_20: 'frota-20',
}

/**
 * Tenta resolver um id de plano a partir de um código ERP, descrição ou nome.
 */
export function resolvePlanIdFromText(raw: string | null | undefined): string | null {
  if (!raw) return null
  const trimmed = String(raw).trim()
  if (!trimmed) return null

  // Match direto por código ERP
  if (ERP_CODE_TO_PLAN_ID[trimmed]) return ERP_CODE_TO_PLAN_ID[trimmed]

  // Match por id do PLANS
  const byId = PLANS.find((p) => p.id.toLowerCase() === trimmed.toLowerCase())
  if (byId) return byId.id

  // Match por nome do PLANS
  const byName = PLANS.find((p) => p.name.toLowerCase() === trimmed.toLowerCase())
  if (byName) return byName.id

  // Match flexível: remove espaços/hífens e compara
  const normalized = trimmed.toLowerCase().replace(/\s+/g, '').replace(/[-_]/g, '')
  const found = PLANS.find((p) => {
    const pNorm = p.id.toLowerCase().replace(/[-_]/g, '')
    const pNameNorm = p.name.toLowerCase().replace(/\s+/g, '').replace(/[-_]/g, '')
    return pNorm === normalized || pNameNorm === normalized
  })
  if (found) return found.id

  // Tenta extrair do código ERP com variações de espaços
  const erpKey = Object.keys(ERP_CODE_TO_PLAN_ID).find(
    (k) => k.replace(/[-\s]/g, '').toLowerCase() === normalized.replace(/^erp/, 'ERP'),
  )
  if (erpKey) return ERP_CODE_TO_PLAN_ID[erpKey]

  return null
}

interface ResolvedPlano {
  plano_id: string | null
  plano_descricao: string | null
  plano_codigo: string | null
  planId: string | null // id canônico do front (ex.: 'tms-300')
}

/**
 * Resolve os dados do plano a partir do registro do cliente.
 * Considera, em ordem:
 *  1. cliente.planos_saude (join) — descrição/código do plano no banco
 *  2. cliente.plano_id (FK) + dados do plano buscados
 *  3. modulos.plano_base (nome/código legado, ex.: "TMS-300", "MTS-1000")
 *  4. modulos_contratados (array de strings)
 */
export function resolvePlanoFromCliente(
  cliente: any | null | undefined,
  planoInfo?: any | null,
): ResolvedPlano {
  if (!cliente) {
    return { plano_id: null, plano_descricao: null, plano_codigo: null, planId: null }
  }

  // 1. Join planos_saude
  const embedded = Array.isArray(cliente.planos_saude)
    ? cliente.planos_saude[0]
    : cliente.planos_saude
  if (embedded && (embedded.descricao || embedded.codigo)) {
    return {
      plano_id: embedded.id ?? cliente.plano_id ?? null,
      plano_descricao: embedded.descricao ?? null,
      plano_codigo: embedded.codigo ?? null,
      planId: resolvePlanIdFromText(embedded.codigo || embedded.descricao),
    }
  }

  // 2. planoInfo (buscado separadamente)
  if (planoInfo && (planoInfo.descricao || planoInfo.codigo)) {
    return {
      plano_id: planoInfo.id ?? cliente.plano_id ?? null,
      plano_descricao: planoInfo.descricao ?? null,
      plano_codigo: planoInfo.codigo ?? null,
      planId: resolvePlanIdFromText(planoInfo.codigo || planoInfo.descricao),
    }
  }

  // 3. modulos.plano_base
  const modulosRaw = cliente.modulos
  if (modulosRaw && typeof modulosRaw === 'object' && !Array.isArray(modulosRaw)) {
    const planoBase = (modulosRaw as any).plano_base
    if (planoBase && typeof planoBase === 'string' && planoBase.trim()) {
      const planId = resolvePlanIdFromText(planoBase)
      const plan = PLANS.find((p) => p.id === planId)
      return {
        plano_id: cliente.plano_id ?? null,
        plano_descricao: plan?.name ?? planoBase.trim(),
        plano_codigo: plan ? plan.id.toUpperCase() : planoBase.trim().toUpperCase(),
        planId,
      }
    }
  }

  return {
    plano_id: cliente.plano_id ?? null,
    plano_descricao: null,
    plano_codigo: null,
    planId: null,
  }
}

/**
 * Retorna a lista de módulos contratados pelo cliente, SEMPRE incluindo os módulos
 * básicos do plano (ou o pacote padrão de 6 quando não houver plano identificado).
 * Combina:
 *  - módulos básicos inclusos do plano
 *  - módulos adicionais do cliente (parseModulosToList)
 */
export function getContractedModulesWithBasic(cliente: any | null | undefined): string[] {
  if (!cliente) return BASIC_MODULE_NAMES

  const resolved = resolvePlanoFromCliente(cliente)
  const basicModuleIds = resolved.planId
    ? getPlanDefaultModules(resolved.planId)
    : DEFAULT_BASIC_MODULE_IDS
  const basicNames = basicModuleIds
    .map((id) => MODULES.find((m) => m.id === id)?.name)
    .filter(Boolean) as string[]

  const additional = parseModulosToList(cliente.modulos)

  // Remove dos adicionais os que já são básicos (evita duplicidade)
  const basicSet = new Set(basicNames.map((n) => n.toLowerCase()))
  const extraAdditional = additional.filter((m) => !basicSet.has(m.toLowerCase()))

  return [...basicNames, ...extraAdditional]
}
