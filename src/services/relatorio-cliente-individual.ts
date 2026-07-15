import { supabase } from '@/lib/supabase/client'

export interface ClienteDetalhado {
  id: string
  nome: string
  cnpj: string
  modulos: any[] | null
  valor_total: number | null
  vencimento_mensal: number | null
  plano_descricao: string | null
  plano_codigo: string | null
  com_coparticipacao: boolean | null
}

export const getClientesParaRelatorioIndividual = async (): Promise<ClienteDetalhado[]> => {
  const { data, error } = await supabase
    .from('clientes')
    .select(`
      id,
      nome,
      cnpj,
      modulos,
      valor_total,
      vencimento_mensal,
      planos_saude(descricao, codigo, com_coparticipacao)
    `)
    .order('nome', { ascending: true })

  if (error) throw error

  return (data || []).map((c: any) => ({
    id: c.id,
    nome: c.nome,
    cnpj: c.cnpj,
    modulos: c.modulos,
    valor_total: c.valor_total,
    vencimento_mensal: c.vencimento_mensal,
    plano_descricao: c.planos_saude?.descricao ?? null,
    plano_codigo: c.planos_saude?.codigo ?? null,
    com_coparticipacao: c.planos_saude?.com_coparticipacao ?? null,
  }))
}
