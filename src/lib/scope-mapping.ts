import { parseModulosToList } from '@/lib/modules-parser'

export interface ImplementationScopeIndicator {
  planName: string | null
  planCode: string | null
  contractedModules: string[]
  totalStages: number
  relatedStagesCount: number
  completedRelatedStages: number
}

interface SafeItem {
  nome: string
  quantidade: string | number
}

export function parseItemsSafe(itens: any): SafeItem[] {
  if (!itens) return []
  let parsed = itens
  if (typeof itens === 'string') {
    try {
      parsed = JSON.parse(itens)
    } catch {
      return []
    }
  }
  if (!Array.isArray(parsed)) return []
  return parsed
    .map((item: any): SafeItem | null => {
      if (typeof item === 'string') return { nome: item.trim(), quantidade: 1 }
      if (typeof item === 'number') return { nome: String(item), quantidade: 1 }
      if (item && typeof item === 'object') {
        const nome = item.nome || item.name || item.descricao || item.titulo || item.label || 'Item'
        const quantidade = item.quantidade ?? item.qtd ?? item.qty ?? item.quant ?? 1
        return { nome: String(nome), quantidade }
      }
      return null
    })
    .filter((x): x is SafeItem => x !== null)
}

export function getContractedModules(cliente: any, proposta: any): string[] {
  const modulos = parseModulosToList(cliente?.modulos)
  const items = parseItemsSafe(proposta?.itens).map((i) => i.nome)
  return [...new Set([...modulos, ...items])]
}

export function isStageRelatedToModules(titulo: string, modules: string[]): boolean {
  const tituloLower = titulo.toLowerCase()
  return modules.some((mod) => {
    const modLower = mod.toLowerCase().trim()
    if (modLower.length < 3) return false
    return tituloLower.includes(modLower)
  })
}

export function getRelatedStagesForModule(modulo: string, etapas: any[]): any[] {
  const modLower = modulo.toLowerCase().trim()
  if (modLower.length < 3) return []
  return etapas.filter((e) => e.titulo?.toLowerCase().includes(modLower))
}

export function computeScopeIndicator(
  cliente: any,
  proposta: any,
  etapas: any[],
): ImplementationScopeIndicator {
  const planName = cliente?.planos_saude?.descricao || null
  const planCode = cliente?.planos_saude?.codigo || null
  const contractedModules = getContractedModules(cliente, proposta)
  const totalStages = etapas.length
  const relatedStages = etapas.filter((e) => isStageRelatedToModules(e.titulo, contractedModules))
  const completedRelatedStages = relatedStages.filter((e) => e.status === 'Concluída').length
  return {
    planName,
    planCode,
    contractedModules,
    totalStages,
    relatedStagesCount: relatedStages.length,
    completedRelatedStages,
  }
}
