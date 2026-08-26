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
 * Gera dinamicamente a lista de etapas de "Treinamento: [Módulo]" a partir dos
 * módulos contratados do plano. Cada módulo contratado vira UMA etapa, sem
 * depender de template fixo — assim o Ciclo de Treinamentos reflete
 * EXATAMENTE os módulos do plano (TMS-30 gera 4 etapas, outros planos geram
 * 6, e planos com adicionais geram mais).
 *
 * As etapas são criadas com ordem 0 (a ordem definitiva é recalculada depois,
 * ao serem inseridas no template na posição correta) e semana 1.
 *
 * Retorna apenas as etapas de treinamento — o restante do template
 * (Parametrização, Operação Assistida, Encerramento, etc.) permanece inalterado.
 */
export function generateTreinamentoEtapas(modulosContratados: string[]): EtapaTemplate[] {
  if (!modulosContratados || modulosContratados.length === 0) return []

  // Remove duplicadas (case-insensitive) e valores vazios, preservando a ordem.
  const seen = new Set<string>()
  const unicos: string[] = []
  for (const modulo of modulosContratados) {
    const trimmed = String(modulo).trim()
    if (!trimmed) continue
    const key = trimmed.toLowerCase()
    if (seen.has(key)) continue
    seen.add(key)
    unicos.push(trimmed)
  }

  return unicos.map((modulo) => ({
    titulo: `Treinamento: ${modulo}`,
    categoria: 'Ciclo de Treinamentos',
    ordem: 0, // recalculada ao montar o template final
    semana: 1,
  }))
}

/**
 * Monta o template final de um "Novo Cliente" inserindo as etapas de
 * treinamento geradas dinamicamente APÓS a etapa "Parametrização do Sistema"
 * e ANTES da primeira "Operação Assistida". Depois renumera todas as ordens
 * de forma sequencial (1, 2, 3, ...).
 *
 * Garante que o Ciclo de Treinamentos reflita exatamente os módulos
 * contratados — nada de template fixo, nada de sobras.
 */
function buildNovoClienteTemplate(modulosContratados: string[]): EtapaTemplate[] {
  const baseTemplate = getEtapasForTipo('novo_cliente')
  const treinamentoEtapas = generateTreinamentoEtapas(modulosContratados)

  const result: EtapaTemplate[] = []
  let ordem = 1
  let inserted = false
  for (const etapa of baseTemplate) {
    // Insere as etapas de treinamento logo após "Parametrização do Sistema"
    // e antes da primeira "Operação Assistida".
    if (
      !inserted &&
      etapa.categoria === 'Implantação Operacional' &&
      etapa.titulo.toLowerCase().startsWith('operação assistida')
    ) {
      for (const t of treinamentoEtapas) {
        result.push({ ...t, ordem: ordem++ })
      }
      inserted = true
    }
    result.push({ ...etapa, ordem: ordem++ })
  }

  // Fallback: se o template não tiver "Operação Assistida", insere no final
  if (!inserted) {
    for (const t of treinamentoEtapas) {
      result.push({ ...t, ordem: ordem++ })
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
 * Correção para implementações JÁ EXISTENTES: sincroniza o Ciclo de
 * Treinamentos com os módulos contratados do plano.
 *
 *  1. REMOVE etapas de "Treinamento: [Módulo]" cujo módulo NÃO consta mais
 *     nos módulos contratados (ex.: "Treinamento: Financeiro" em um plano
 *     TMS-30 que não tem Financeiro).
 *  2. ADICIONA etapas de "Treinamento: [Módulo]" para módulos contratados
 *     que ainda não possuem etapa correspondente.
 *  3. Renumerar TODAS as ordens sequencialmente (1, 2, 3, ...) ao final,
 *     mantendo a posição do Ciclo de Treinamentos (após "Parametrização do
 *     Sistema" e antes da primeira "Operação Assistida").
 *
 * Retorna a lista de títulos das etapas que foram adicionadas (vazio se
 * nenhuma) — útil para exibir toast ao usuário. Remoções ocorrem
 * silenciosamente.
 *
 * Apenas implementações `novo_cliente` possuem Ciclo de Treinamentos.
 */
export const ensureTreinamentoEtapasForImpl = async (
  implementacaoId: string,
): Promise<string[]> => {
  // Carrega a implementação com suas etapas
  const { data: rawImpl, error: implError } = await (supabase.from('implementacoes') as any)
    .select('id, tipo, cliente_id, modulos_novos, dados_parametrizacao')
    .eq('id', implementacaoId)
    .maybeSingle()
  if (implError) throw implError
  if (!rawImpl) return []

  const impl = rawImpl as any

  // Apenas implementações do tipo "novo_cliente" possuem o ciclo de treinamentos
  if (impl.tipo && impl.tipo !== 'novo_cliente') return []

  const dados = (impl.dados_parametrizacao as Record<string, any>) || {}
  const modulosCopiados: string[] = Array.isArray(dados.modulos_copiados)
    ? dados.modulos_copiados
    : []
  const modulosNovos: string[] = Array.isArray(impl.modulos_novos) ? impl.modulos_novos : []
  let modulosContratados = Array.from(
    new Set([...modulosCopiados, ...modulosNovos].map((m) => String(m).trim()).filter(Boolean)),
  )

  // ---- FALLBACK: implementações antigas podem não ter `modulos_copiados` nem
  // `modulos_novos` preenchidos (campo `dados_parametrizacao` criado antes da
  // correção do ciclo de treinamentos). Quando ambos estão vazios, buscamos os
  // módulos contratados diretamente do cadastro do cliente (tabela `clientes`),
  // que conhece o plano (plano_id / modulos.plano_base) e os módulos
  // adicionais. Isso garante que TODA implementação antiga — não só TSA e BSG —
  // tenha seu Ciclo de Treinamentos regenerado a partir dos módulos reais.
  if (modulosContratados.length === 0 && impl.cliente_id) {
    const { data: cliente, error: clienteError } = await supabase
      .from('clientes')
      .select(
        'modulos, plano_id, quantidade_filiais, modo_implantacao, planos_saude(id, descricao, codigo, franquia_quantidade)',
      )
      .eq('id', impl.cliente_id)
      .maybeSingle()
    if (clienteError) throw clienteError
    if (cliente) {
      modulosContratados = getContractedModulesWithBasic(cliente)

      // Persiste os módulos resolvidos em `dados_parametrizacao.modulos_copiados`
      // para que a correção fique gravada e próximas execuções sejam diretas
      // (não dependem mais do fallback). Não sobrescreve outros campos.
      if (modulosContratados.length > 0) {
        const dadosAtualizados = {
          ...dados,
          modulos_copiados: modulosContratados,
          modulos_adicionais: parseModulosToList(cliente.modulos),
          dados_replicados_em: dados.dados_replicados_em || new Date().toISOString(),
        }
        const { error: updError } = await (supabase.from('implementacoes') as any)
          .update({ dados_parametrizacao: dadosAtualizados })
          .eq('id', implementacaoId)
        if (updError) throw updError
      }
    }
  }

  // Carrega as etapas atuais
  const { data: etapas, error: etapasError } = await supabase
    .from('implementacao_etapas' as any)
    .select('id, titulo, ordem, categoria, status, data_prevista, responsavel_id')
    .eq('implementacao_id', implementacaoId)
    .order('ordem', { ascending: true })
  if (etapasError) throw etapasError
  if (!etapas || etapas.length === 0) return []

  // ---- 1. Remoção de etapas de treinamento que não correspondem a módulos ----
  const contratadosLower = new Set(
    modulosContratados.map((m) => `Treinamento: ${m}`.trim().toLowerCase()),
  )
  const toRemove = etapas.filter((e: any) => {
    if (e.categoria !== 'Ciclo de Treinamentos') return false
    return !contratadosLower.has(
      String(e.titulo || '')
        .trim()
        .toLowerCase(),
    )
  }) as any[]

  if (toRemove.length > 0) {
    const removeIds = toRemove.map((e) => e.id)
    const { error: delError } = await supabase
      .from('implementacao_etapas' as any)
      .delete()
      .in('id', removeIds)
    if (delError) throw delError
    // Atualiza a lista local de etapas removendo as deletadas
    const removedIds = new Set(removeIds)
    for (let i = etapas.length - 1; i >= 0; i--) {
      if (removedIds.has((etapas[i] as any).id)) etapas.splice(i, 1)
    }
  }

  // Se não há módulos contratados (plano vazio), não há o que adicionar —
  // apenas renumera o que restou.
  if (modulosContratados.length === 0) {
    await renumberEtapas(implementacaoId, etapas)
    return []
  }

  // ---- 2. Adição de etapas de treinamento faltantes ----
  const existingTitles = new Set(
    etapas.map((e: any) =>
      String(e.titulo || '')
        .trim()
        .toLowerCase(),
    ),
  )
  const missing = modulosContratados.filter((modulo) => {
    const titulo = `Treinamento: ${modulo}`.toLowerCase()
    return !existingTitles.has(titulo)
  })

  if (missing.length === 0) {
    // Nada a adicionar — só garante renumeração se houve remoções
    if (toRemove.length > 0) await renumberEtapas(implementacaoId, etapas)
    return []
  }

  // Encontra a posição de inserção: após a última etapa antes da primeira
  // "Operação Assistida" (idealmente após "Parametrização do Sistema"). Usa
  // a ordem da primeira etapa de "Implantação Operacional" como referência.
  const firstOperacionalIdx = etapas.findIndex(
    (e: any) =>
      e.categoria === 'Implantação Operacional' &&
      String(e.titulo || '')
        .toLowerCase()
        .startsWith('operação assistida'),
  )
  //Índice onde inserir as novas etapas (antes da Operação Assistida)
  const insertIdx = firstOperacionalIdx === -1 ? etapas.length : firstOperacionalIdx

  const novasEtapasPayload = missing.map((modulo) => ({
    implementacao_id: implementacaoId,
    titulo: `Treinamento: ${modulo}`,
    categoria: 'Ciclo de Treinamentos',
    ordem: 0, // renumerado abaixo
    status: 'Não iniciada',
    data_prevista: addWeeks(1),
    responsavel_id: null,
  }))

  const { data: insertedRows, error: insertError } = await supabase
    .from('implementacao_etapas' as any)
    .insert(novasEtapasPayload)
    .select()
  if (insertError) throw insertError

  const novasEtapas = (insertedRows || []).map((row: any) => ({
    ...row,
    // Garante campos esperados pela renumeração
    id: row.id,
    ordem: 0,
  }))

  // Insere localmente (com ids reais) para renumeração
  etapas.splice(insertIdx, 0, ...novasEtapas)

  // ---- 3. Renumerar TODAS as ordens sequencialmente ----
  await renumberEtapas(implementacaoId, etapas)

  return novasEtapas.map((e) => e.titulo)
}

/**
 * Renumerar todas as etapas de uma implementação de forma sequencial (1, 2,
 * 3, ...), respeitando a ordem atual do array recebido.
 */
async function renumberEtapas(implementacaoId: string, etapas: any[]): Promise<void> {
  let ordem = 1
  for (const e of etapas) {
    if (e.ordem === ordem) {
      ordem++
      continue
    }
    const { error } = await supabase
      .from('implementacao_etapas' as any)
      .update({ ordem })
      .eq('id', e.id)
    if (error) throw error
    e.ordem = ordem
    ordem++
  }
  void implementacaoId
}

export const updateObservacoesGerais = async (implementacaoId: string, observacoes: string) => {
  const { data: current, error: fetchError } = await (supabase.from('implementacoes') as any)
    .select('observacoes_gerais')
    .eq('id', implementacaoId)
    .single()
  if (fetchError) throw fetchError

  const existing = ((current as any)?.observacoes_gerais || '').trim()
  const now = new Date().toLocaleString('pt-BR')

  let combined: string
  if (existing) {
    combined = `${existing}\n\n--- ${now} ---\n${observacoes.trim()}`
  } else {
    combined = `--- ${now} ---\n${observacoes.trim()}`
  }

  const { data, error } = await (supabase.from('implementacoes') as any)
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

  const etapasTemplate =
    tipo === 'novo_cliente' ? buildNovoClienteTemplate(modulosNovos) : getEtapasForTipo(tipo)
  const etapas = etapasTemplate.map((e) => ({
    implementacao_id: (data as any).id,
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

  const { data: impl } = await (supabase.from('implementacoes') as any)
    .select('status')
    .eq('id', implementacaoId)
    .single()

  if ((impl as any)?.status === 'Encerrado') return

  const preserveStatuses = ['consultoria_recebido', 'onboarding_recebido', 'onboarding_completed']
  const newStatus =
    progresso === 100
      ? 'Finalizada'
      : preserveStatuses.includes((impl as any)?.status)
        ? (impl as any).status
        : 'Em andamento'
  await (supabase.from('implementacoes') as any)
    .update({ progresso, status: newStatus })
    .eq('id', implementacaoId)
}

export const updateEtapa = async (id: string, etapa: any) => {
  const { data, error } = await (supabase.from('implementacao_etapas') as any)
    .update(etapa)
    .eq('id', id)
    .select()
    .single()
  if (error) throw error
  if ((data as any)?.implementacao_id) await recalcProgress((data as any).implementacao_id)
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
  const { data: impl } = await (supabase.from('implementacoes') as any)
    .select('dados_parametrizacao')
    .eq('id', implementacaoId)
    .maybeSingle()

  const current = ((impl as any)?.dados_parametrizacao as Record<string, any>) || {}

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
  data: {
    status?: string
    responsavel_id?: string | null
    handover_comercial?: string | null
    handover_atualizado_em?: string | null
    handover_atualizado_por?: string | null
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
  const { data: impl, error: implError } = await (supabase.from('implementacoes') as any)
    .select('modulos_novos, cliente_id')
    .eq('id', implementacaoId)
    .single()
  if (implError) throw implError
  const implTyped = impl as any
  if (!implTyped.cliente_id) throw new Error('Implementação sem cliente vinculado')

  const { data: cliente, error: clienteError } = await supabase
    .from('clientes')
    .select('modulos')
    .eq('id', implTyped.cliente_id)
    .single()
  if (clienteError) throw clienteError

  const currentModulos = parseModulosToList(cliente.modulos)
  const novosModulos = (implTyped.modulos_novos || []) as string[]
  const merged = Array.from(new Set([...currentModulos, ...novosModulos]))
  await updateClienteModulos(implTyped.cliente_id, merged)
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

export const uploadRatUnificado = async (file: File, implementacaoId: string) => {
  const ext = file.name.split('.').pop()
  const fileName = `${implementacaoId}/rat_unificado/${Date.now()}.${ext}`
  const { error } = await supabase.storage
    .from('implementacao-docs')
    .upload(fileName, file, { upsert: true })
  if (error) throw error
  const { data: publicUrlData } = supabase.storage.from('implementacao-docs').getPublicUrl(fileName)
  return publicUrlData.publicUrl
}

export const updateRatUnificado = async (implementacaoId: string, url: string | null) => {
  const { data, error } = await supabase
    .from('implementacoes' as any)
    .update({ rat_unificado_url: url })
    .eq('id', implementacaoId)
    .select()
    .single()
  if (error) throw error
  return data
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

  const etapasTemplate =
    params.tipo === 'novo_cliente'
      ? buildNovoClienteTemplate(modulosNovos)
      : getEtapasForTipo(params.tipo)
  const etapas = etapasTemplate.map((e) => ({
    implementacao_id: (data as any).id,
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
