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
