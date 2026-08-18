import { supabase } from '@/lib/supabase/client'
import { getEtapasForTipo, addWeeks, type EtapaTemplate } from '@/lib/implantacao-config'
import { parseModulosToList } from '@/lib/modules-parser'
import {
  resolvePlanoFromCliente,
  getContractedModulesWithBasic,
  BASIC_MODULE_NAMES,
} from '@/lib/plan-modules'

/**
 * Resolve o plano a partir do registro do cliente (join planos_saude OU plano_id OU
 * modulos.plano_base) e monta o objeto `dados_parametrizacao` que repassa fielmente o
 * plano selecionado no cadastro do cliente para a implementação.
 *
 * Garante que o "módulo básico" esteja sempre presente em `modulos_copiados`.
 */
async function buildDadosParametrizacaoForCliente(
  clienteId: string,
): Promise<{ dados: Record<string, any>; modulosNovos: string[] }> {
  const { data: cliente } = await supabase
    .from('clientes')
    .select(
      'modulos, plano_id, quantidade_filiais, modo_implantacao, planos_saude(id, descricao, codigo, franquia_quantidade)',
    )
    .eq('id', clienteId)
    .single()

  // Resolve o plano a partir do join, plano_id ou modulos.plano_base
  const resolved = resolvePlanoFromCliente(cliente)

  let planoInfo: any = null
  if (cliente?.plano_id && !resolved.plano_descricao) {
    const { data: plano } = await supabase
      .from('planos_saude')
      .select('id, descricao, codigo, franquia_quantidade')
      .eq('id', cliente.plano_id)
      .maybeSingle()
    planoInfo = plano
  } else if (resolved.plano_id) {
    planoInfo = {
      id: resolved.plano_id,
      descricao: resolved.plano_descricao,
      codigo: resolved.plano_codigo,
    }
  }

  // Módulos contratados pelo cliente, SEMPRE incluindo o módulo básico do plano
  const contractedModules = getContractedModulesWithBasic(cliente)

  const dados: Record<string, any> = {
    plano_id: planoInfo?.id || resolved.plano_id || cliente?.plano_id || null,
    plano_descricao: planoInfo?.descricao || resolved.plano_descricao || null,
    plano_codigo: planoInfo?.codigo || resolved.plano_codigo || null,
    plan_id: resolved.planId || null,
    franquia_quantidade: planoInfo?.franquia_quantidade || cliente?.quantidade_filiais || null,
    modulos_copiados: contractedModules,
    modulos_adicionais: parseModulosToList(cliente?.modulos),
    modo_implantacao: cliente?.modo_implantacao || null,
    dados_replicados_em: new Date().toISOString(),
  }

  return { dados, modulosNovos: contractedModules }
}

/**
 * Gera etapas de "Treinamento: [Módulo]" para módulos contratados que ainda
 * não possuem uma etapa de treinamento correspondente no template base.
 *
 * As novas etapas são inseridas logo após as etapas de treinamento já existentes
 * (categoria "Ciclo de Treinamentos"), com ordem sequencial correta e status
 * "Não iniciada". A semana utilizada é a da última etapa de treinamento do
 * template, para que fiquem agrupadas no mesmo período.
 */
function appendMissingTreinamentoEtapas(
  template: EtapaTemplate[],
  modulosContratados: string[],
): EtapaTemplate[] {
  if (!modulosContratados || modulosContratados.length === 0) return template

  // Conjunto de títulos já presentes no template (comparação case-insensitive)
  const existingTitles = new Set(template.map((e) => e.titulo.trim().toLowerCase()))

  // Identifica as etapas de treinamento atuais para calcular ordem/semana base
  const treinamentoEtapas = template.filter((e) => e.categoria === 'Ciclo de Treinamentos')
  const lastTreinamento = treinamentoEtapas[treinamentoEtapas.length - 1] || null
  const baseOrdem = lastTreinamento ? lastTreinamento.ordem : 0
  const baseSemana = lastTreinamento ? lastTreinamento.semana : 1

  // Maior ordem do template inteiro (para continuar a numeração caso não haja
  // etapas de treinamento após as demais)
  const maxOrdem = template.reduce((max, e) => (e.ordem > max ? e.ordem : max), 0)

  const novas: EtapaTemplate[] = []
  modulosContratados.forEach((modulo) => {
    const titulo = `Treinamento: ${modulo}`
    if (existingTitles.has(titulo.toLowerCase())) return
    novas.push({
      titulo,
      categoria: 'Ciclo de Treinamentos',
      ordem: 0, // redefinido abaixo
      semana: baseSemana,
    })
  })

  if (novas.length === 0) return template

  // Reordena: insere as novas etapas logo após as etapas de treinamento existentes
  // e renumera TODAS as etapas em sequência para manter a consistência.
  const result: EtapaTemplate[] = []
  let inserted = false
  let ordem = 1
  for (const etapa of template) {
    result.push({ ...etapa, ordem: ordem++ })
    // Após a última etapa de treinamento existente, insere as novas
    if (!inserted && etapa.categoria === 'Ciclo de Treinamentos') {
      // Verifica se é a última de treinamento
      const isLastTreinamento = etapa === lastTreinamento
      if (isLastTreinamento) {
        for (const nova of novas) {
          result.push({ ...nova, ordem: ordem++ })
        }
        inserted = true
      }
    }
  }

  // Se não havia nenhuma etapa de treinamento no template, anexa ao final
  if (!inserted) {
    void baseOrdem
    void maxOrdem
    for (const nova of novas) {
      result.push({ ...nova, ordem: ordem++ })
    }
  }

  return result
}

export const getImplementacoes = async () => {
  const { data, error } = await supabase
    .from('implementacoes' as any)
    .select(
      '*, clientes(nome, data_assinatura), colaboradores(nome), implementacao_etapas(titulo, status, ordem, data_prevista)',
    )
    .order('created_at', { ascending: false })
  if (error) throw error
  return data
}

export const getImplementacao = async (id: string) => {
  const { data, error } = await supabase
    .from('implementacoes' as any)
    .select(
      '*, clientes(nome, cnpj, email, modulos, modo_implantacao, filiais_detalhes, quantidade_filiais, cobrar_filiais, rep_nome, rep_cpf, rep_rg, plano_id, planos_saude(id, descricao, codigo, franquia_quantidade)), colaboradores(nome), implementacao_etapas(*), crm_propostas(itens, quantidade_filiais, filiais_detalhes, cobrar_filiais, prospect_id), solicitacoes_servico(id, tipo, descricao, status)',
    )
    .eq('id', id)
    .single()
  if (error) {
    if (error.code === 'PGRST116') return null
    throw error
  }
  return data
}

/**
 * Correção para implementações JÁ EXISTENTES: verifica se todos os módulos
 * contratados (em `dados_parametrizacao.modulos_copiados` ou `modulos_novos`)
 * possuem uma etapa de "Treinamento: [Módulo]". Caso falte alguma, insere-a
 * automaticamente (categoria "Ciclo de Treinamentos", status "Não iniciada")
 * com ordem sequencial correta. Usa upsert para evitar duplicação.
 *
 * Retorna a lista de títulos das etapas que foram adicionadas (vazio se nenhuma).
 */
export const ensureTreinamentoEtapasForImpl = async (
  implementacaoId: string,
): Promise<string[]> => {
  // Carrega a implementação com suas etapas
  const { data: impl, error: implError } = await supabase
    .from('implementacoes' as any)
    .select('id, tipo, modulos_novos, dados_parametrizacao')
    .eq('id', implementacaoId)
    .maybeSingle()
  if (implError) throw implError
  if (!impl) return []

  // Apenas implementações do tipo "novo_cliente" possuem o ciclo de treinamentos
  if (impl.tipo && impl.tipo !== 'novo_cliente') return []

  const dados = (impl.dados_parametrizacao as Record<string, any>) || {}
  const modulosCopiados: string[] = Array.isArray(dados.modulos_copiados)
    ? dados.modulos_copiados
    : []
  const modulosNovos: string[] = Array.isArray(impl.modulos_novos) ? impl.modulos_novos : []
  const modulosContratados = Array.from(
    new Set([...modulosCopiados, ...modulosNovos].map((m) => String(m).trim()).filter(Boolean)),
  )
  if (modulosContratados.length === 0) return []

  // Carrega as etapas atuais
  const { data: etapas, error: etapasError } = await supabase
    .from('implementacao_etapas' as any)
    .select('id, titulo, ordem, categoria, status')
    .eq('implementacao_id', implementacaoId)
  if (etapasError) throw etapasError
  if (!etapas) return []

  const existingTitles = new Set(
    etapas.map((e: any) =>
      String(e.titulo || '')
        .trim()
        .toLowerCase(),
    ),
  )

  // Determina módulos sem etapa de treinamento correspondente
  const missing = modulosContratados.filter((modulo) => {
    const titulo = `Treinamento: ${modulo}`.toLowerCase()
    return !existingTitles.has(titulo)
  })
  if (missing.length === 0) return []

  // Calcula ordem/semana base a partir das etapas de treinamento existentes
  const treinamentoEtapas = etapas.filter(
    (e: any) => e.categoria === 'Ciclo de Treinamentos',
  ) as any[]
  const lastTreinamento = treinamentoEtapas[treinamentoEtapas.length - 1] || null
  const baseSemana = lastTreinamento ? 2 : 1 // semana padrão do ciclo
  const maxOrdem = etapas.reduce((max: number, e: any) => (e.ordem > max ? e.ordem : max), 0)

  // Etapas posteriores às de treinamento precisam ter a ordem deslocada para
  // abrir espaço para as novas (mantém ordem sequencial correta).
  const insertAfterOrdem = lastTreinamento ? lastTreinamento.ordem : maxOrdem
  const novasEtapas = missing.map((modulo, idx) => ({
    implementacao_id: implementacaoId,
    titulo: `Treinamento: ${modulo}`,
    categoria: 'Ciclo de Treinamentos',
    ordem: insertAfterOrdem + 1 + idx,
    status: 'Não iniciada',
    data_prevista: addWeeks(baseSemana),
    responsavel_id: null,
  }))

  // Desloca etapas com ordem > insertAfterOrdem para manter a sequência
  const toShift = etapas.filter((e: any) => e.ordem > insertAfterOrdem) as any[]
  if (toShift.length > 0) {
    for (const e of toShift) {
      const { error: shiftError } = await supabase
        .from('implementacao_etapas' as any)
        .update({ ordem: e.ordem + missing.length })
        .eq('id', e.id)
      if (shiftError) throw shiftError
    }
  }

  // Insere as novas etapas
  const { error: insertError } = await supabase
    .from('implementacao_etapas' as any)
    .insert(novasEtapas)
  if (insertError) throw insertError

  return novasEtapas.map((e) => e.titulo)
}

export const updateObservacoesGerais = async (implementacaoId: string, observacoes: string) => {
  const { data: current, error: fetchError } = await supabase
    .from('implementacoes' as any)
    .select('observacoes_gerais')
    .eq('id', implementacaoId)
    .single()
  if (fetchError) throw fetchError

  const existing = (current?.observacoes_gerais || '').trim()
  const now = new Date().toLocaleString('pt-BR')

  let combined: string
  if (existing) {
    combined = `${existing}\n\n--- ${now} ---\n${observacoes.trim()}`
  } else {
    combined = `--- ${now} ---\n${observacoes.trim()}`
  }

  const { data, error } = await supabase
    .from('implementacoes' as any)
    .update({ observacoes_gerais: combined })
    .eq('id', implementacaoId)
    .select()
    .single()
  if (error) throw error
  return data
}

export const getImplementacaoByCliente = async (clienteId: string) => {
  const { data, error } = await supabase
    .from('implementacoes' as any)
    .select('*, colaboradores(nome), implementacao_etapas(titulo, status, ordem, data_prevista)')
    .eq('cliente_id', clienteId)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()
  if (error) throw error
  return data
}

export const createImplementacao = async (params: {
  cliente_id: string | null
  cliente_nome?: string | null
  contrato_id?: string | null
  responsavel_id?: string | null
  tipo?: 'novo_cliente' | 'inclusao_modulo' | 'treinamento' | 'consultoria'
  solicitacao_id?: string | null
  modulos_novos?: string[]
  treinamento_motivo?: string | null
  treinamento_topicos?: string | null
  treinamento_data?: string | null
  consultoria_titulo?: string | null
  consultoria_texto?: string | null
}) => {
  const tipo = params.tipo || 'novo_cliente'

  let modulosNovos = params.modulos_novos || []
  let dadosParametrizacao: Record<string, any> = {}

  if (params.cliente_id) {
    try {
      const { dados, modulosNovos: resolvedModulos } = await buildDadosParametrizacaoForCliente(
        params.cliente_id,
      )
      dadosParametrizacao = dados
      // Repassa fielmente o plano do cliente: módulos básicos inclusos + adicionais.
      // Só sobrescreve se nada foi informado explicitamente.
      if (modulosNovos.length === 0 && resolvedModulos.length > 0) {
        modulosNovos = resolvedModulos
      }
    } catch {
      // Continue without replicated data
    }
  }

  const { data, error } = await supabase
    .from('implementacoes' as any)
    .insert({
      cliente_id: params.cliente_id,
      cliente_nome: params.cliente_nome || null,
      contrato_id: params.contrato_id || null,
      responsavel_id: params.responsavel_id || null,
      status: 'Em andamento',
      progresso: 0,
      tipo,
      solicitacao_id: params.solicitacao_id || null,
      modulos_novos: modulosNovos,
      treinamento_motivo: params.treinamento_motivo || null,
      treinamento_topicos: params.treinamento_topicos || null,
      treinamento_data: params.treinamento_data || null,
      consultoria_titulo: params.consultoria_titulo || null,
      consultoria_texto: params.consultoria_texto || null,
      dados_parametrizacao: dadosParametrizacao,
    })
    .select()
    .single()
  if (error) throw error

  const baseTemplate = getEtapasForTipo(tipo)
  const etapasTemplate =
    tipo === 'novo_cliente'
      ? appendMissingTreinamentoEtapas(baseTemplate, modulosNovos)
      : baseTemplate
  const etapas = etapasTemplate.map((e) => ({
    implementacao_id: data.id,
    titulo: e.titulo,
    categoria: e.categoria,
    ordem: e.ordem,
    status: 'Não iniciada',
    data_prevista: addWeeks(e.semana),
    responsavel_id: params.responsavel_id || null,
  }))

  const { error: etapasError } = await supabase.from('implementacao_etapas' as any).insert(etapas)
  if (etapasError) throw etapasError

  return data
}

async function recalcProgress(implementacaoId: string) {
  const { data: etapas } = await supabase
    .from('implementacao_etapas' as any)
    .select('status')
    .eq('implementacao_id', implementacaoId)
  if (!etapas) return
  const total = etapas.length
  const concluded = etapas.filter((e: any) => e.status === 'Concluída').length
  const progresso = total > 0 ? Math.round((concluded / total) * 100) : 0

  const { data: impl } = await supabase
    .from('implementacoes' as any)
    .select('status')
    .eq('id', implementacaoId)
    .single()

  if (impl?.status === 'Encerrado') return

  const preserveStatuses = ['consultoria_recebido', 'onboarding_recebido', 'onboarding_completed']
  const newStatus =
    progresso === 100
      ? 'Finalizada'
      : preserveStatuses.includes(impl?.status)
        ? impl.status
        : 'Em andamento'
  await supabase
    .from('implementacoes' as any)
    .update({ progresso, status: newStatus })
    .eq('id', implementacaoId)
}

export const updateEtapa = async (id: string, etapa: any) => {
  const { data, error } = await supabase
    .from('implementacao_etapas' as any)
    .update(etapa)
    .eq('id', id)
    .select()
    .single()
  if (error) throw error
  if (data?.implementacao_id) await recalcProgress(data.implementacao_id)
  return data
}

export const updateDadosParametrizacao = async (
  implementacaoId: string,
  dados: Record<string, any>,
) => {
  const { data, error } = await supabase
    .from('implementacoes' as any)
    .update({ dados_parametrizacao: dados })
    .eq('id', implementacaoId)
    .select()
    .single()
  if (error) throw error
  return data
}

export interface PlanoImplementacaoInput {
  plano_descricao?: string | null
  plano_codigo?: string | null
  plano_id?: string | null
  plan_id?: string | null
  franquia_quantidade?: number | null
  modo_implantacao?: string | null
  modulos_copiados?: string[] | null
  modulos_adicionais?: string[] | null
}

/**
 * Atualiza SOMENTE os campos do plano dentro de `dados_parametrizacao`,
 * preservando os demais campos já salvos. Garante que o "módulo básico"
 * esteja sempre presente em `modulos_copiados`.
 */
export const updatePlanoImplementacao = async (
  implementacaoId: string,
  input: PlanoImplementacaoInput,
) => {
  const { data: impl } = await supabase
    .from('implementacoes' as any)
    .select('dados_parametrizacao')
    .eq('id', implementacaoId)
    .maybeSingle()

  const current = (impl?.dados_parametrizacao as Record<string, any>) || {}

  // Garante que o módulo básico esteja sempre presente em modulos_copiados
  let modulosCopiados =
    input.modulos_copiados ??
    (Array.isArray(current.modulos_copiados) ? [...current.modulos_copiados] : [])
  const basicSet = new Set(BASIC_MODULE_NAMES.map((n) => n.toLowerCase()))
  const missingBasic = BASIC_MODULE_NAMES.filter(
    (n) => !modulosCopiados.some((m) => String(m).toLowerCase() === n.toLowerCase()),
  )
  if (missingBasic.length > 0) {
    modulosCopiados = [...missingBasic, ...modulosCopiados]
  }
  void basicSet

  const updated: Record<string, any> = {
    ...current,
    ...Object.fromEntries(Object.entries(input).filter(([, v]) => v !== undefined)),
    modulos_copiados: modulosCopiados,
    plano_atualizado_em: new Date().toISOString(),
  }

  // Se veio um plano_id novo, também normalizamos descricao/codigo a partir dele
  if (input.plano_id && input.plano_id !== current.plano_id) {
    try {
      const { data: plano } = await supabase
        .from('planos_saude')
        .select('id, descricao, codigo, franquia_quantidade')
        .eq('id', input.plano_id)
        .maybeSingle()
      if (plano) {
        updated.plano_id = plano.id
        if (!input.plano_descricao) updated.plano_descricao = plano.descricao
        if (!input.plano_codigo) updated.plano_codigo = plano.codigo
        if (input.franquia_quantidade === undefined || input.franquia_quantidade === null) {
          updated.franquia_quantidade = plano.franquia_quantidade ?? updated.franquia_quantidade
        }
      }
    } catch {
      /* ignore */
    }
  }

  return updateDadosParametrizacao(implementacaoId, updated)
}

export const updateImplementacao = async (
  id: string,
  data: { status?: string; responsavel_id?: string | null },
) => {
  const { data: result, error } = await supabase
    .from('implementacoes' as any)
    .update(data)
    .eq('id', id)
    .select()
    .single()
  if (error) throw error
  return result
}

export const updateClienteModulos = async (clienteId: string, modulos: string[]) => {
  const { data, error } = await supabase
    .from('clientes')
    .update({ modulos })
    .eq('id', clienteId)
    .select()
    .single()
  if (error) throw error
  return data
}

export const syncModulosToCliente = async (implementacaoId: string) => {
  const { data: impl, error: implError } = await supabase
    .from('implementacoes' as any)
    .select('modulos_novos, cliente_id')
    .eq('id', implementacaoId)
    .single()
  if (implError) throw implError
  if (!impl.cliente_id) throw new Error('Implementação sem cliente vinculado')

  const { data: cliente, error: clienteError } = await supabase
    .from('clientes')
    .select('modulos')
    .eq('id', impl.cliente_id)
    .single()
  if (clienteError) throw clienteError

  const currentModulos = parseModulosToList(cliente.modulos)
  const novosModulos = (impl.modulos_novos || []) as string[]
  const merged = Array.from(new Set([...currentModulos, ...novosModulos]))
  await updateClienteModulos(impl.cliente_id, merged)
  return merged
}

export const batchUpdateEtapas = async (
  updates: { id: string; data: any }[],
  implementacaoId: string,
) => {
  for (const { id, data } of updates) {
    const { error } = await supabase
      .from('implementacao_etapas' as any)
      .update(data)
      .eq('id', id)
    if (error) throw error
  }
  await recalcProgress(implementacaoId)
}

export const uploadRat = async (file: File, implementacaoId: string, etapaId: string) => {
  const ext = file.name.split('.').pop()
  const fileName = `${implementacaoId}/${etapaId}/${Date.now()}.${ext}`
  const { error } = await supabase.storage
    .from('implementacao-docs')
    .upload(fileName, file, { upsert: true })
  if (error) throw error
  const { data: publicUrlData } = supabase.storage.from('implementacao-docs').getPublicUrl(fileName)
  return publicUrlData.publicUrl
}

export const deleteImplementacao = async (id: string) => {
  const { data: arquivos } = await supabase
    .from('implementacao_arquivos' as any)
    .select('file_path')
    .eq('implementacao_id', id)
  if (arquivos && arquivos.length > 0) {
    const filePaths = arquivos.map((a: any) => a.file_path)
    await supabase.storage.from('implementation-docs').remove(filePaths)
  }
  const { error } = await supabase
    .from('implementacoes' as any)
    .delete()
    .eq('id', id)
  if (error) throw error
}

export const updateTreinamentoDetails = async (
  id: string,
  data: {
    treinamento_data: string | null
    treinamento_hora: string | null
    treinamento_motivo: string | null
    treinamento_topicos: string | null
  },
) => {
  const { data: result, error } = await supabase
    .from('implementacoes' as any)
    .update(data)
    .eq('id', id)
    .select()
    .single()
  if (error) throw error
  return result
}

export const getColaboradores = async () => {
  const { data, error } = await supabase
    .from('colaboradores')
    .select('id, nome')
    .eq('status', 'Ativo')
    .order('nome')
  if (error) throw error
  return data
}

export const getSolicitacoes = async () => {
  const { data, error } = await supabase
    .from('solicitacoes_servico' as any)
    .select('id, tipo, descricao, status, data_solicitacao, clientes(nome)')
    .order('created_at', { ascending: false })
    .limit(50)
  if (error) throw error
  return data
}

export const createImplementacaoFromAtendimento = async (params: {
  atendimento_id: string
  cliente_id: string
  tipo: 'novo_cliente' | 'inclusao_modulo' | 'treinamento' | 'consultoria'
  responsavel_id?: string | null
  modulos_novos?: string[]
  treinamento_motivo?: string | null
  treinamento_topicos?: string | null
  treinamento_data?: string | null
  consultoria_titulo?: string | null
  consultoria_texto?: string | null
}) => {
  let modulosNovos = params.modulos_novos || []
  let dadosParametrizacao: Record<string, any> = {}

  if (params.cliente_id) {
    try {
      const { dados, modulosNovos: resolvedModulos } = await buildDadosParametrizacaoForCliente(
        params.cliente_id,
      )
      dadosParametrizacao = dados
      // Repassa fielmente o plano do cliente: módulos básicos inclusos + adicionais.
      if (modulosNovos.length === 0 && resolvedModulos.length > 0) {
        modulosNovos = resolvedModulos
      }
    } catch {
      // Continue without replicated data
    }
  }

  const { data, error } = await supabase
    .from('implementacoes' as any)
    .insert({
      atendimento_id: params.atendimento_id,
      cliente_id: params.cliente_id,
      responsavel_id: params.responsavel_id || null,
      status: 'Em andamento',
      progresso: 0,
      tipo: params.tipo,
      modulos_novos: modulosNovos,
      dados_parametrizacao: dadosParametrizacao,
      treinamento_motivo: params.treinamento_motivo || null,
      treinamento_topicos: params.treinamento_topicos || null,
      treinamento_data: params.treinamento_data || null,
      consultoria_titulo: params.consultoria_titulo || null,
      consultoria_texto: params.consultoria_texto || null,
    })
    .select()
    .single()
  if (error) throw error

  const baseTemplate = getEtapasForTipo(params.tipo)
  const etapasTemplate =
    params.tipo === 'novo_cliente'
      ? appendMissingTreinamentoEtapas(baseTemplate, modulosNovos)
      : baseTemplate
  const etapas = etapasTemplate.map((e) => ({
    implementacao_id: data.id,
    titulo: e.titulo,
    categoria: e.categoria,
    ordem: e.ordem,
    status: 'Não iniciada',
    data_prevista: addWeeks(e.semana),
    responsavel_id: params.responsavel_id || null,
  }))

  const { error: etapasError } = await supabase.from('implementacao_etapas' as any).insert(etapas)
  if (etapasError) throw etapasError

  const { error: updateError } = await supabase
    .from('atendimentos_clientes')
    .update({ enviado_implantacao: true })
    .eq('id', params.atendimento_id)
  if (updateError) throw updateError

  return data
}
