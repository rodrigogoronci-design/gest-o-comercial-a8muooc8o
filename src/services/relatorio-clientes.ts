import { supabase } from '@/lib/supabase/client'

export interface ClienteRelatorio {
  id: string
  nome: string
  cnpj: string
  valor_total: number | null
  vencimento_mensal: number | null
  endereco: string | null
  status: string | null
  plano_descricao: string | null
}

export interface ClienteRelatorioDetalhado {
  id: string
  nome: string
  cnpj: string
  email: string | null
  telefone: string | null
  endereco: string | null
  valor_total: number | null
  valor_implantacao: number | null
  valor_anual: number | null
  vencimento_mensal: number | null
  data_assinatura: string | null
  status: string | null
  modulos: any[] | null
  plano_id: string | null
  plano_descricao: string | null
  plano_codigo: string | null
  com_coparticipacao: boolean | null
  rep_nome: string | null
  rep_cpf: string | null
  quantidade_filiais: number | null
  modo_implantacao: string | null
  filiais_detalhes: any[] | null
}

export const getClientesRelatorio = async (): Promise<ClienteRelatorio[]> => {
  const { data, error } = await supabase
    .from('clientes')
    .select(`
      id,
      nome,
      cnpj,
      valor_total,
      vencimento_mensal,
      endereco,
      status,
      planos_saude(descricao)
    `)
    .order('nome', { ascending: true })

  if (error) throw error

  return (data || []).map((c: any) => ({
    id: c.id,
    nome: c.nome,
    cnpj: c.cnpj,
    valor_total: c.valor_total,
    vencimento_mensal: c.vencimento_mensal,
    endereco: c.endereco,
    status: c.status,
    plano_descricao: c.planos_saude?.descricao ?? null,
  }))
}

export const getClientesParaRelatorioIndividual = async (): Promise<
  { id: string; nome: string }[]
> => {
  const { data, error } = await supabase
    .from('clientes')
    .select('id, nome')
    .order('nome', { ascending: true })

  if (error) throw error
  return data || []
}

export const getClienteRelatorioDetalhado = async (
  clienteId: string,
): Promise<ClienteRelatorioDetalhado | null> => {
  const { data, error } = await supabase
    .from('clientes')
    .select(`
      id,
      nome,
      cnpj,
      email,
      telefone,
      endereco,
      valor_total,
      valor_implantacao,
      valor_anual,
      vencimento_mensal,
      data_assinatura,
      status,
      modulos,
      plano_id,
      rep_nome,
      rep_cpf,
      quantidade_filiais,
      modo_implantacao,
      filiais_detalhes,
      planos_saude(descricao, codigo, com_coparticipacao)
    `)
    .eq('id', clienteId)
    .single()

  if (error) throw error
  if (!data) return null

  return {
    id: data.id,
    nome: data.nome,
    cnpj: data.cnpj,
    email: data.email,
    telefone: data.telefone,
    endereco: data.endereco,
    valor_total: data.valor_total,
    valor_implantacao: data.valor_implantacao,
    valor_anual: data.valor_anual,
    vencimento_mensal: data.vencimento_mensal,
    data_assinatura: data.data_assinatura,
    status: data.status,
    modulos: data.modulos,
    plano_id: data.plano_id,
    plano_descricao: (data.planos_saude as any)?.descricao ?? null,
    plano_codigo: (data.planos_saude as any)?.codigo ?? null,
    com_coparticipacao: (data.planos_saude as any)?.com_coparticipacao ?? null,
    rep_nome: data.rep_nome,
    rep_cpf: data.rep_cpf,
    quantidade_filiais: data.quantidade_filiais,
    modo_implantacao: data.modo_implantacao,
    filiais_detalhes: data.filiais_detalhes,
  }
}
