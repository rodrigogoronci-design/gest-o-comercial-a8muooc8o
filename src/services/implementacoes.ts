import { supabase } from '@/lib/supabase/client'
import { getEtapasForTipo, addWeeks } from '@/lib/implantacao-config'
import { parseModulosToList } from '@/lib/modules-parser'

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
      '*, clientes(nome, cnpj, email, modulos, modo_implantacao, filiais_detalhes, quantidade_filiais, cobrar_filiais, rep_nome, rep_cpf, rep_rg, plano_id, planos_saude(descricao, codigo, franquia_quantidade)), colaboradores(nome), implementacao_etapas(*), crm_propostas(itens, quantidade_filiais, filiais_detalhes, cobrar_filiais, prospect_id), solicitacoes_servico(id, tipo, descricao, status)',
    )
    .eq('id', id)
    .single()
  if (error) {
    if (error.code === 'PGRST116') return null
    throw error
  }
  return data
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
      const { data: cliente } = await supabase
        .from('clientes')
        .select('modulos, plano_id, quantidade_filiais')
        .eq('id', params.cliente_id)
        .single()

      let planoInfo: any = null
      if (cliente?.plano_id) {
        const { data: plano } = await supabase
          .from('planos_saude')
          .select('descricao, codigo, franquia_quantidade')
          .eq('id', cliente.plano_id)
          .single()
        planoInfo = plano
      }

      const clientModules = parseModulosToList(cliente?.modulos)
      if (modulosNovos.length === 0 && clientModules.length > 0) {
        modulosNovos = clientModules
      }

      dadosParametrizacao = {
        plano_descricao: planoInfo?.descricao || null,
        plano_codigo: planoInfo?.codigo || null,
        franquia_quantidade: planoInfo?.franquia_quantidade || cliente?.quantidade_filiais || null,
        modulos_copiados: modulosNovos,
        dados_replicados_em: new Date().toISOString(),
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

  const etapasTemplate = getEtapasForTipo(tipo)
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
  const { data, error } = await supabase
    .from('implementacoes' as any)
    .insert({
      atendimento_id: params.atendimento_id,
      cliente_id: params.cliente_id,
      responsavel_id: params.responsavel_id || null,
      status: 'Em andamento',
      progresso: 0,
      tipo: params.tipo,
      modulos_novos: params.modulos_novos || [],
      treinamento_motivo: params.treinamento_motivo || null,
      treinamento_topicos: params.treinamento_topicos || null,
      treinamento_data: params.treinamento_data || null,
      consultoria_titulo: params.consultoria_titulo || null,
      consultoria_texto: params.consultoria_texto || null,
    })
    .select()
    .single()
  if (error) throw error

  const etapasTemplate = getEtapasForTipo(params.tipo)
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
