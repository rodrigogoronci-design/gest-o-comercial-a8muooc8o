import { supabase } from '@/lib/supabase/client'

export interface ClienteAdesao {
  id: string
  nome: string
  cnpj: string | null
  data_assinatura: string | null
  created_at: string
  status: string | null
  valor_mensalidade: number | null
  valor_total: number | null
  modo_implantacao: string | null
}

export interface ClienteAdesaoRelatorio extends ClienteAdesao {
  data_adesao: string
}

function resolveAdhesionDate(cliente: ClienteAdesao): string | null {
  if (cliente.data_assinatura) return cliente.data_assinatura
  if (cliente.created_at) return cliente.created_at.split('T')[0]
  return null
}

export const getClientesByAdesaoPeriodo = async (
  startDate: string,
  endDate: string,
): Promise<ClienteAdesaoRelatorio[]> => {
  const { data, error } = await supabase
    .from('clientes')
    .select(
      'id, nome, cnpj, data_assinatura, created_at, status, valor_mensalidade, valor_total, modo_implantacao',
    )
    .order('nome', { ascending: true })

  if (error) throw error

  return (data || [])
    .map((c: ClienteAdesao) => {
      const adhesionDate = resolveAdhesionDate(c)
      return { ...c, data_adesao: adhesionDate || '' }
    })
    .filter((c) => {
      if (!c.data_adesao) return false
      return c.data_adesao >= startDate && c.data_adesao <= endDate
    })
    .sort((a, b) => a.data_adesao.localeCompare(b.data_adesao))
}
