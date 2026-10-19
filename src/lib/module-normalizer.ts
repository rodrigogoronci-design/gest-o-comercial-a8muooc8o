/**
 * Motor de Normalização e Detecção Robusta de Módulos Contratados
 *
 * Garante que variações de grafia, maiúsculas/minúsculas, acentuação,
 * sufixos de pacotes/filiais ou aditivos não impeçam a identificação correta
 * dos módulos que o cliente já possui contratados.
 */

import { DEFAULT_BASIC_MODULE_IDS, MODULES, PLAN_MODULE_MAP } from '@/constants/contracts'
import { parseModulosToList } from '@/lib/modules-parser'

export interface CanonicalModuleDef {
  id: string
  canonicalName: string
  aliases: string[]
  campaignPriority?: number
  campaignQuestion?: string
}

/**
 * Catálogo canônico de módulos com todas as variações conhecidas do sistema
 */
export const CANONICAL_MODULES: CanonicalModuleDef[] = [
  {
    id: 'dfe',
    canonicalName: 'DF-e',
    aliases: [
      'df-e',
      'dfe',
      'd.f.e.',
      'd.f.e',
      'franquia df-e',
      'franquia dfe',
      'pacote df-e',
      'pacote dfe',
      'pacote 150 d.f.e.',
      'pacote 300 d.f.e.',
      'pacote 500 d.f.e.',
      'pacote 1000 d.f.e.',
      'pacote 1500 d.f.e.',
      'ativacao de df-e',
      'emissao df-e',
      'inclusao do df-e',
      'inclusao de df-e',
      'mod-dfe',
      'train-dfe',
    ],
    campaignPriority: 1,
    campaignQuestion: 'Como vocês recebem e baixam os XML e documentos fiscais atualmente?',
  },
  {
    id: 'sltrip',
    canonicalName: 'SL-Trip',
    aliases: [
      'sl-trip',
      'sl trip',
      'sltrip',
      'trip',
      'mod-sltrip',
      'train-sl-trip',
      'train-sltrip',
    ],
    campaignPriority: 2,
    campaignQuestion: 'Como os motoristas enviam as despesas e comprovantes das viagens?',
  },
  {
    id: 'bi',
    canonicalName: 'BI',
    aliases: [
      'bi',
      'b.i.',
      'bi web',
      'bi-web',
      'power bi',
      'powerbi',
      'power-bi',
      'b.i. web',
      'mod-powerbi',
      'train-powerbi',
    ],
    campaignPriority: 3,
    campaignQuestion: 'Como a gestão acompanha hoje os custos e indicadores da frota?',
  },
  {
    id: 'ctrl-viagem',
    canonicalName: 'Controle de Viagem',
    aliases: [
      'controle de viagem',
      'controle de viagens',
      'controle viagem',
      'controle viagens',
      'ctrl viagem',
      'ctrl-viagem',
      'mod-ctrl-viagem',
      'train-ctrl-viagem',
    ],
    campaignPriority: 4,
    campaignQuestion: 'Como vocês controlam adiantamentos, despesas e acertos dos motoristas?',
  },
  {
    id: 'frota',
    canonicalName: 'Frota',
    aliases: [
      'frota',
      'frota (ate 10 placas)',
      'frota (até 10 placas)',
      'frota – ate 20 placas',
      'frota – até 20 placas',
      'frota - ate 20 placas',
      'frota - até 20 placas',
      'frota 20',
      'gestao de frota',
      'gestão de frota',
      'mod-frota',
      'mod-frota-20',
      'frota_20',
      'train-frota',
    ],
    campaignPriority: 5,
    campaignQuestion:
      'Vocês possuem frota própria? Como controlam manutenção, abastecimento e pneus?',
  },
  {
    id: 'edi',
    canonicalName: 'EDI',
    aliases: ['edi', 'e.d.i.', 'mod-edi'],
  },
  {
    id: 'torre-controle',
    canonicalName: 'Torre de Controle',
    aliases: [
      'torre de controle',
      'torre de controle logistica',
      'torre de controle logística',
      'mod-torre-controle',
    ],
  },
  {
    id: 'sltrack',
    canonicalName: 'SL-Track',
    aliases: ['sl-track', 'sl track', 'sltrack', 'mod-sltrack', 'train-sl-track'],
  },
  {
    id: 'medicao',
    canonicalName: 'Medição',
    aliases: ['medicao', 'medição', 'mod-medicao'],
  },
  {
    id: 'fracionado',
    canonicalName: 'Fracionado',
    aliases: ['fracionado', 'mod-fracionado'],
  },
  {
    id: 'fiscal',
    canonicalName: 'Fiscal',
    aliases: ['fiscal', 'mod-fiscal', 'train-fiscal'],
  },
  {
    id: 'patrimonio',
    canonicalName: 'Patrimônio',
    aliases: ['patrimonio', 'patrimônio', 'mod-patrimonio'],
  },
  {
    id: 'ciot',
    canonicalName: 'CIOT',
    aliases: ['ciot', 'c.i.o.t.', 'mod-ciot'],
  },
  {
    id: 'transporte',
    canonicalName: 'Transporte (Bloco TCI/TCE)',
    aliases: [
      'bloco tci e tce (transportes)',
      'transporte (bloco/tce/tci)',
      'transporte (bloco tci/tce)',
      'transporte bloco tci/tce',
      'mod-transp',
    ],
  },
  {
    id: 'fundo-prot',
    canonicalName: 'Fundo de proteção',
    aliases: ['fundo de protecao', 'fundo de proteção', 'mod-fundo-prot'],
  },
  {
    id: 'calendario',
    canonicalName: 'Calendário',
    aliases: ['calendario', 'calendário', 'mod-calendario'],
  },
  {
    id: 'painel',
    canonicalName: 'Painel de Informações',
    aliases: ['painel de informacoes', 'painel de informações', 'painel de controle', 'mod-painel'],
  },
  {
    id: 'homolog-banc',
    canonicalName: 'Homologação Bancária',
    aliases: [
      'homologacao bancaria',
      'homologação bancaria',
      'homologação bancária',
      'mod-homolog-banc',
    ],
  },
  {
    id: 'admin',
    canonicalName: 'Administração',
    aliases: ['administracao', 'administração', 'mod-admin'],
  },
  {
    id: 'basico',
    canonicalName: 'Básico',
    aliases: ['basico', 'básico', 'mod-basico'],
  },
  {
    id: 'carga',
    canonicalName: 'Carga',
    aliases: ['carga', 'mod-carga', 'train-carga'],
  },
  {
    id: 'comercial',
    canonicalName: 'Comercial',
    aliases: ['comercial', 'mod-comercial'],
  },
  {
    id: 'faturamento',
    canonicalName: 'Faturamento',
    aliases: ['faturamento', 'mod-faturamento'],
  },
  {
    id: 'financeiro',
    canonicalName: 'Financeiro',
    aliases: ['financeiro', 'mod-financeiro'],
  },
]

/**
 * Normaliza qualquer texto removendo acentos, pontuação, múltiplos espaços e convertendo para minúsculas.
 */
export function sanitizeText(text: string | null | undefined): string {
  if (!text) return ''
  return String(text)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .toLowerCase()
    .replace(/[–—]/g, '-')
    .replace(/\s+/g, ' ')
}

/**
 * Normaliza para comparação removendo caracteres não-alfanuméricos (útil para siglas e hifens)
 */
export function cleanAlphanumeric(text: string | null | undefined): string {
  return sanitizeText(text).replace(/[^a-z0-9]/g, '')
}

/**
 * Mapeia um nome bruto para o módulo canônico correspondente, se houver
 */
export function identifyCanonicalModule(
  rawName: string | null | undefined,
): CanonicalModuleDef | null {
  if (!rawName) return null
  const sanitized = sanitizeText(rawName)
  const alpha = cleanAlphanumeric(rawName)
  if (!sanitized) return null

  // 1. Match direto por ID canônico ou nome canônico sanitizado
  for (const def of CANONICAL_MODULES) {
    if (def.id === sanitized || sanitizeText(def.canonicalName) === sanitized) {
      return def
    }
  }

  // 2. Match especial para DF-e (extremamente crítico para a evidência do bug)
  // Qualquer entrada contendo 'dfe', 'df-e', 'd.f.e' ou 'franquia dfe'
  if (
    alpha === 'dfe' ||
    sanitized === 'df-e' ||
    sanitized.startsWith('df-e') ||
    sanitized.startsWith('dfe ') ||
    sanitized.includes('pacote dfe') ||
    sanitized.includes('pacote df-e') ||
    sanitized.includes('franquia dfe') ||
    sanitized.includes('franquia df-e') ||
    sanitized.includes('inclusao do df-e') ||
    sanitized.includes('ativacao de df-e') ||
    (sanitized.includes('df-e') && sanitized.includes('filial')) ||
    (sanitized.includes('dfe') && sanitized.includes('filial'))
  ) {
    return CANONICAL_MODULES.find((m) => m.id === 'dfe')!
  }

  // 3. Match especial para Frota
  if (
    sanitized.startsWith('frota') ||
    sanitized.includes('gestao de frota') ||
    alpha.startsWith('frota')
  ) {
    return CANONICAL_MODULES.find((m) => m.id === 'frota')!
  }

  // 4. Match especial para BI
  if (
    sanitized === 'bi' ||
    sanitized === 'b.i.' ||
    sanitized === 'bi web' ||
    sanitized === 'power bi' ||
    sanitized === 'powerbi' ||
    alpha === 'bi' ||
    alpha === 'biweb' ||
    alpha === 'powerbi'
  ) {
    return CANONICAL_MODULES.find((m) => m.id === 'bi')!
  }

  // 5. Match especial para Controle de Viagem
  if (
    sanitized.includes('controle de viagem') ||
    sanitized.includes('controle de viagens') ||
    sanitized.includes('controle viagem') ||
    sanitized.includes('controle viagens')
  ) {
    return CANONICAL_MODULES.find((m) => m.id === 'ctrl-viagem')!
  }

  // 6. Match especial para SL-Trip
  if (alpha === 'sltrip' || sanitized.includes('sl trip') || sanitized.includes('sl-trip')) {
    return CANONICAL_MODULES.find((m) => m.id === 'sltrip')!
  }

  // 7. Match especial para SL-Track
  if (alpha === 'sltrack' || sanitized.includes('sl track') || sanitized.includes('sl-track')) {
    return CANONICAL_MODULES.find((m) => m.id === 'sltrack')!
  }

  // 8. Match especial para Torre de Controle
  if (sanitized.startsWith('torre de controle')) {
    return CANONICAL_MODULES.find((m) => m.id === 'torre-controle')!
  }

  // 9. Match por lista de aliases
  for (const def of CANONICAL_MODULES) {
    for (const alias of def.aliases) {
      const aliasSanitized = sanitizeText(alias)
      const aliasAlpha = cleanAlphanumeric(alias)
      if (sanitized === aliasSanitized || alpha === aliasAlpha) {
        return def
      }
    }
  }

  return null
}

/**
 * Retorna se duas strings representam o mesmo módulo, de forma robusta
 */
export function isSameModule(moduleA: string, moduleB: string): boolean {
  if (!moduleA || !moduleB) return false
  const defA = identifyCanonicalModule(moduleA)
  const defB = identifyCanonicalModule(moduleB)

  if (defA && defB) {
    return defA.id === defB.id
  }

  const sA = sanitizeText(moduleA)
  const sB = sanitizeText(moduleB)
  if (sA === sB) return true

  const aA = cleanAlphanumeric(moduleA)
  const aB = cleanAlphanumeric(moduleB)
  return aA.length > 0 && aA === aB
}

/**
 * Extrai a lista completa e atual de módulos contratados de um cliente a partir de TODAS as fontes:
 *  1. cliente.modulos (adicionais, listas, objetos booleanos)
 *  2. Módulos básicos do plano contratado
 *  3. cliente.filiais_detalhes (DF-e incluso em filiais)
 *  4. histórico de aditivos de contratos (opcional se fornecido)
 */
export function extractAllContractedModules(
  cliente: any | null | undefined,
  historicosDoCliente?: any[] | null,
): { canonicalIds: Set<string>; displayNames: string[] } {
  const canonicalIds = new Set<string>()
  const displayNamesSet = new Set<string>()

  if (!cliente) {
    return { canonicalIds, displayNames: [] }
  }

  const addModule = (rawName: string | null | undefined) => {
    if (!rawName || typeof rawName !== 'string') return
    const trimmed = rawName.trim()
    if (!trimmed) return

    const canonical = identifyCanonicalModule(trimmed)
    if (canonical) {
      canonicalIds.add(canonical.id)
      displayNamesSet.add(canonical.canonicalName)
    } else {
      displayNamesSet.add(trimmed)
    }
  }

  // 1. Módulos básicos padrão por tipo de plano
  const planId = cliente.plano_id || cliente.planId
  const baseModuleIds =
    planId && PLAN_MODULE_MAP[planId] ? PLAN_MODULE_MAP[planId] : DEFAULT_BASIC_MODULE_IDS
  for (const bId of baseModuleIds) {
    const modObj = MODULES.find((m) => m.id === bId)
    if (modObj) addModule(modObj.name)
  }

  // 2. cliente.modulos (parseModulosToList)
  const rawList = parseModulosToList(cliente.modulos)
  for (const m of rawList) {
    addModule(m)
  }

  // 3. Inspeção direta do JSON cliente.modulos para capturar filiais e aditivos sem perdas
  if (cliente.modulos && typeof cliente.modulos === 'object') {
    const modObj = cliente.modulos
    if (Array.isArray(modObj.adicionais)) {
      for (const item of modObj.adicionais) {
        if (typeof item === 'string') addModule(item)
        else if (item && typeof item === 'object') {
          addModule(item.name || item.nome || item.descricao)
        }
      }
    }
  }

  // 4. Filiais com DF-e incluso em filiais_detalhes
  const filiais = Array.isArray(cliente.filiais_detalhes) ? cliente.filiais_detalhes : []
  for (const filial of filiais) {
    if (filial && typeof filial === 'object') {
      if (filial.dfe_incluso === true || Number(filial.valor_dfe) > 0) {
        addModule('DF-e')
      }
    }
  }

  // 5. Histórico de aditivos (se fornecido)
  if (Array.isArray(historicosDoCliente)) {
    for (const h of historicosDoCliente) {
      if (h.modulos) {
        const histList = parseModulosToList(h.modulos)
        for (const hm of histList) addModule(hm)
      }
      if (h.observacoes && typeof h.observacoes === 'string') {
        const obs = h.observacoes.toLowerCase()
        if (obs.includes('df-e: sim') || obs.includes('dfe: sim')) {
          addModule('DF-e')
        }
      }
    }
  }

  // 6. Verificação de tags ou diagnóstico se contiverem módulo já ativo
  if (cliente.diagnostico && typeof cliente.diagnostico === 'object') {
    // Caso haja registro explícito de módulos já utilizados
    const diag = cliente.diagnostico
    if (Array.isArray(diag.modulos_ativos)) {
      for (const dm of diag.modulos_ativos) addModule(dm)
    }
  }

  return {
    canonicalIds,
    displayNames: Array.from(displayNamesSet),
  }
}

/**
 * Verifica se o cliente POSSUI um determinado módulo canônico ou nome
 */
export function clientHasModule(
  clienteOrModules: any | null | undefined,
  targetModule: string,
  historicos?: any[] | null,
): boolean {
  if (!clienteOrModules || !targetModule) return false

  const targetDef = identifyCanonicalModule(targetModule)
  const targetId = targetDef ? targetDef.id : cleanAlphanumeric(targetModule)

  // Caso tenha sido passado o cliente completo
  if (
    typeof clienteOrModules === 'object' &&
    ('modulos' in clienteOrModules || 'filiais_detalhes' in clienteOrModules)
  ) {
    const { canonicalIds, displayNames } = extractAllContractedModules(clienteOrModules, historicos)
    if (targetDef && canonicalIds.has(targetDef.id)) return true
    return displayNames.some((d) => isSameModule(d, targetModule))
  }

  // Caso tenha sido passada uma lista de módulos (strings ou objetos)
  const list = Array.isArray(clienteOrModules)
    ? clienteOrModules
    : parseModulosToList(clienteOrModules)

  for (const m of list) {
    const mName = typeof m === 'string' ? m : m?.name || m?.nome || ''
    if (isSameModule(mName, targetModule)) return true
    const mDef = identifyCanonicalModule(mName)
    if (mDef && targetDef && mDef.id === targetDef.id) return true
    if (targetId && cleanAlphanumeric(mName) === targetId) return true
  }

  return false
}

export interface UpsellClienteLinha {
  ordem: number
  prioridade: number
  clienteId: string
  clienteNome: string
  cnpj: string
  contatoNome: string
  whatsapp: string
  planoDescricao: string
  mensalidade: number
  dataAssinatura: string
  modulosAtuais: string[]
  ofertaInicial: string
  outrasOportunidades: string[]
  perguntaDiagnostico: string
  statusCliente: string
  diasDesdeAssinatura?: number
}

export interface CampanhaUpsellResumo {
  ordem: number
  campanha: string
  clientesElegiveis: number
  objetivoContato: string
  perguntaDiagnostico: string
}

/**
 * As 6 campanhas padrão de upsell da Service Logic na ordem estrita de abordagem
 */
export const UPSELL_CAMPAIGNS: CampanhaUpsellResumo[] = [
  {
    ordem: 1,
    campanha: 'DF-e',
    clientesElegiveis: 0,
    objetivoContato: 'Como vocês recebem e baixam os XML e documentos fiscais atualmente?',
    perguntaDiagnostico: 'Perguntar como recebem e baixam XML e documentos fiscais atualmente.',
  },
  {
    ordem: 2,
    campanha: 'SL-Trip',
    clientesElegiveis: 0,
    objetivoContato: 'Como os motoristas enviam as despesas e comprovantes das viagens?',
    perguntaDiagnostico: 'Perguntar como os motoristas enviam despesas e comprovantes de viagens.',
  },
  {
    ordem: 3,
    campanha: 'BI',
    clientesElegiveis: 0,
    objetivoContato: 'Como a gestão acompanha hoje os custos e indicadores da frota?',
    perguntaDiagnostico: 'Perguntar como a gestão acompanha indicadores de faturamento e custos.',
  },
  {
    ordem: 4,
    campanha: 'Controle de Viagem',
    clientesElegiveis: 0,
    objetivoContato: 'Como vocês controlam adiantamentos, despesas e acertos dos motoristas?',
    perguntaDiagnostico:
      'Perguntar como controlam adiantamentos, despesas e acertos de motoristas.',
  },
  {
    ordem: 5,
    campanha: 'Frota',
    clientesElegiveis: 0,
    objetivoContato:
      'Vocês possuem frota própria? Como controlam manutenção, abastecimento e pneus?',
    perguntaDiagnostico:
      'Perguntar se possuem frota própria e como controlam pneus, manutenção e combustível.',
  },
  {
    ordem: 6,
    campanha: 'Clientes antigos',
    clientesElegiveis: 0,
    objetivoContato: 'O sistema está atendendo bem? Existe alguma rotina ainda feita fora dele?',
    perguntaDiagnostico:
      'O sistema está atendendo bem? Existe alguma rotina ainda feita fora dele?',
  },
]

/**
 * Gera a Fila Comercial de Upsell por Cliente e as Campanhas por Módulo.
 *
 * REGRA CENTRAL DE FIDEDIGNIDADE:
 * Se um cliente JÁ POSSUI o módulo X (como DF-e, BI, Frota, etc.),
 * ele NUNCA pode ser elegível para o módulo X, nem como Oferta Inicial
 * nem na Campanha daquele módulo.
 */
export function buildUpsellQueue(
  clientes: any[],
  historicosPorCliente?: Map<string, any[]> | null,
): {
  filaComercial: UpsellClienteLinha[]
  campanhasResumo: CampanhaUpsellResumo[]
  campanhasPorModulo: Array<{
    ordem: number
    campanha: string
    cliente: string
    cnpj: string
    plano: string
    mensalidade: number
    perguntaDiagnostico: string
  }>
} {
  const campanhasResumo = UPSELL_CAMPAIGNS.map((c) => ({ ...c, clientesElegiveis: 0 }))
  const campanhasPorModulo: Array<{
    ordem: number
    campanha: string
    cliente: string
    cnpj: string
    plano: string
    mensalidade: number
    perguntaDiagnostico: string
  }> = []

  const filaComercial: UpsellClienteLinha[] = []

  const produtosUpsellPrioritarios = [
    { id: 'dfe', nome: 'DF-e', prioridade: 1, pergunta: UPSELL_CAMPAIGNS[0].perguntaDiagnostico },
    {
      id: 'sltrip',
      nome: 'SL-Trip',
      prioridade: 2,
      pergunta: UPSELL_CAMPAIGNS[1].perguntaDiagnostico,
    },
    { id: 'bi', nome: 'BI', prioridade: 3, pergunta: UPSELL_CAMPAIGNS[2].perguntaDiagnostico },
    {
      id: 'ctrl-viagem',
      nome: 'Controle de Viagem',
      prioridade: 4,
      pergunta: UPSELL_CAMPAIGNS[3].perguntaDiagnostico,
    },
    {
      id: 'frota',
      nome: 'Frota',
      prioridade: 5,
      pergunta: UPSELL_CAMPAIGNS[4].perguntaDiagnostico,
    },
  ]

  // Outros módulos complementares elegíveis como outras oportunidades
  const outrosModulos = ['EDI', 'Torre de Controle', 'SL-Track', 'Medição', 'Fracionado']

  // Processa cada cliente
  clientes.forEach((cliente) => {
    // Clientes inativos ou cancelados são ignorados na fila de upsell comercial
    const statusLower = (cliente.status || '').toLowerCase().trim()
    if (statusLower === 'inativo' || statusLower === 'cancelado') {
      return
    }

    const clientHistoricos = historicosPorCliente?.get(cliente.id) || null
    const { canonicalIds, displayNames } = extractAllContractedModules(cliente, clientHistoricos)

    // Identificar quais módulos prioritários o cliente NÃO possui
    const produtosFaltantes = produtosUpsellPrioritarios.filter((p) => !canonicalIds.has(p.id))

    // Preenche as Campanhas por Módulo (Sheet 3) para cada produto que o cliente NÃO tem
    produtosFaltantes.forEach((p) => {
      campanhasPorModulo.push({
        ordem: p.prioridade,
        campanha: p.nome,
        cliente: cliente.nome || 'Cliente sem nome',
        cnpj: cliente.cnpj || '',
        plano: cliente.plano_descricao || 'TMS',
        mensalidade: Number(cliente.valor_total) || 0,
        perguntaDiagnostico: p.pergunta,
      })
      const campRes = campanhasResumo.find((c) => c.ordem === p.prioridade)
      if (campRes) campRes.clientesElegiveis++
    })

    // Campanha 6: Clientes antigos
    // Clientes que já têm todos os 5 produtos principais OU têm contrato há mais de 12 meses
    let isClienteAntigoElegivel = false
    let diasAssinatura = 0
    if (cliente.data_assinatura) {
      const dt = new Date(cliente.data_assinatura)
      if (!isNaN(dt.getTime())) {
        diasAssinatura = Math.floor((Date.now() - dt.getTime()) / (1000 * 60 * 60 * 24))
      }
    }

    if (produtosFaltantes.length === 0 || diasAssinatura > 365) {
      isClienteAntigoElegivel = true
      campanhasPorModulo.push({
        ordem: 6,
        campanha: 'Clientes antigos',
        cliente: cliente.nome || 'Cliente sem nome',
        cnpj: cliente.cnpj || '',
        plano: cliente.plano_descricao || 'TMS',
        mensalidade: Number(cliente.valor_total) || 0,
        perguntaDiagnostico: UPSELL_CAMPAIGNS[5].perguntaDiagnostico,
      })
      const camp6 = campanhasResumo.find((c) => c.ordem === 6)
      if (camp6) camp6.clientesElegiveis++
    }

    // Determinar Oferta Inicial e Outras Oportunidades para a Fila Comercial Única (Sheet 2)
    let ofertaInicial = 'Clientes antigos'
    let prioridade = 6
    let perguntaDiagnostico = UPSELL_CAMPAIGNS[5].perguntaDiagnostico
    const outrasOportunidades: string[] = []

    if (produtosFaltantes.length > 0) {
      // O primeiro produto faltante na ordem estrita de prioridade (DF-e > SL-Trip > BI > Controle de Viagem > Frota)
      const primeiro = produtosFaltantes[0]
      ofertaInicial = primeiro.nome
      prioridade = primeiro.prioridade
      perguntaDiagnostico = primeiro.pergunta

      // As outras oportunidades são os demais produtos prioritários faltantes
      for (let i = 1; i < produtosFaltantes.length; i++) {
        outrasOportunidades.push(produtosFaltantes[i].nome)
      }
    }

    // Adiciona módulos extras que o cliente também não possui
    for (const outro of outrosModulos) {
      const def = identifyCanonicalModule(outro)
      if (
        def &&
        !canonicalIds.has(def.id) &&
        !outrasOportunidades.includes(outro) &&
        ofertaInicial !== outro
      ) {
        outrasOportunidades.push(outro)
      }
    }

    filaComercial.push({
      ordem: 0, // Será numerada após a ordenação
      prioridade,
      clienteId: cliente.id,
      clienteNome: cliente.nome || 'Cliente sem nome',
      cnpj: cliente.cnpj || '',
      contatoNome: cliente.rep_nome || '',
      whatsapp: cliente.telefone || '',
      planoDescricao: cliente.plano_descricao || 'Não informado',
      mensalidade: Number(cliente.valor_total) || 0,
      dataAssinatura: cliente.data_assinatura || '',
      modulosAtuais: displayNames,
      ofertaInicial,
      outrasOportunidades,
      perguntaDiagnostico,
      statusCliente: cliente.status || 'Ativo',
      diasDesdeAssinatura: diasAssinatura,
    })
  })

  // Ordenar a Fila Comercial por:
  // 1. Prioridade (1 a 6)
  // 2. Data de Assinatura mais antiga
  // 3. Nome do Cliente
  filaComercial.sort((a, b) => {
    if (a.prioridade !== b.prioridade) {
      return a.prioridade - b.prioridade
    }
    if (a.dataAssinatura && b.dataAssinatura) {
      return a.dataAssinatura.localeCompare(b.dataAssinatura)
    }
    return a.clienteNome.localeCompare(b.clienteNome)
  })

  // Atribuir número de ordem contínuo 1..N
  filaComercial.forEach((linha, idx) => {
    linha.ordem = idx + 1
  })

  // Ordenar campanhas por módulo por ordem e nome
  campanhasPorModulo.sort((a, b) => {
    if (a.ordem !== b.ordem) return a.ordem - b.ordem
    return a.cliente.localeCompare(b.cliente)
  })

  return {
    filaComercial,
    campanhasResumo,
    campanhasPorModulo,
  }
}
