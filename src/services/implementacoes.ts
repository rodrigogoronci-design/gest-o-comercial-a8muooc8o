import { supabase } from '@/lib/supabase/client'

const STANDARD_ETAPAS = [
  { titulo: 'Handover Comercial', categoria: 'Pré-Implantação', ordem: 1, semana: 0 },
  { titulo: 'Kick-off', categoria: 'Pré-Implantação', ordem: 2, semana: 0 },
  { titulo: 'Parametrização do Sistema', categoria: 'Implantação Inicial', ordem: 3, semana: 0 },
  { titulo: 'Treinamento: Administração', categoria: 'Ciclo de Treinamentos', ordem: 4, semana: 1 },
  { titulo: 'Treinamento: Comercial', categoria: 'Ciclo de Treinamentos', ordem: 5, semana: 1 },
  { titulo: 'Treinamento: Faturamento', categoria: 'Ciclo de Treinamentos', ordem: 6, semana: 2 },
  { titulo: 'Treinamento: Financeiro', categoria: 'Ciclo de Treinamentos', ordem: 7, semana: 2 },
  { titulo: 'Treinamento: Carga', categoria: 'Ciclo de Treinamentos', ordem: 8, semana: 2 },
  {
    titulo: 'Operação Assistida: Semana 1',
    categoria: 'Implantação Operacional',
    ordem: 9,
    semana: 3,
  },
  {
    titulo: 'Operação Assistida: Semana 2',
    categoria: 'Implantação Operacional',
    ordem: 10,
    semana: 4,
  },
  {
    titulo: 'Operação Assistida: Semana 3',
    categoria: 'Implantação Operacional',
    ordem: 11,
    semana: 5,
  },
  {
    titulo: 'Operação Assistida: Semana 4',
    categoria: 'Implantação Operacional',
    ordem: 12,
    semana: 6,
  },
  { titulo: 'Termo de Encerramento', categoria: 'Encerramento', ordem: 13, semana: 7 },
  { titulo: 'Transição para Suporte', categoria: 'Encerramento', ordem: 14, semana: 7 },
]

function addWeeks(weeks: number): string {
  const d = new Date()
  d.setDate(d.getDate() + weeks * 7)
  return d.toISOString().split('T')[0]
}

export const getImplementacoes = async () => {
  const { data, error } = await supabase
    .from('implementacoes' as any)
    .select(
      '*, clientes(nome), colaboradores(nome), implementacao_etapas(titulo, status, ordem, data_prevista)',
    )
    .order('created_at', { ascending: false })
  if (error) throw error
  return data
}

export const getImplementacao = async (id: string) => {
  const { data, error } = await supabase
    .from('implementacoes' as any)
    .select(
      '*, clientes(nome, cnpj, modulos, modo_implantacao, filiais_detalhes, quantidade_filiais, cobrar_filiais, planos_saude(descricao, codigo)), colaboradores(nome), implementacao_etapas(*), crm_propostas(itens, quantidade_filiais, filiais_detalhes, cobrar_filiais)',
    )
    .eq('id', id)
    .single()
  if (error) {
    if (error.code === 'PGRST116') return null
    throw error
  }
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
  cliente_id: string
  contrato_id?: string | null
  responsavel_id?: string | null
}) => {
  const { data, error } = await supabase
    .from('implementacoes' as any)
    .insert({
      cliente_id: params.cliente_id,
      contrato_id: params.contrato_id || null,
      responsavel_id: params.responsavel_id || null,
      status: 'Em andamento',
      progresso: 0,
    })
    .select()
    .single()
  if (error) throw error

  const etapas = STANDARD_ETAPAS.map((e) => ({
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
  const status = progresso === 100 ? 'Finalizada' : 'Em andamento'
  await supabase
    .from('implementacoes' as any)
    .update({ progresso, status })
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
  if (data?.implementacao_id) {
    await recalcProgress(data.implementacao_id)
  }
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

export const getColaboradores = async () => {
  const { data, error } = await supabase
    .from('colaboradores')
    .select('id, nome')
    .eq('status', 'Ativo')
    .order('nome')
  if (error) throw error
  return data
}
