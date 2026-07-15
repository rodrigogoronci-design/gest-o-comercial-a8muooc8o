import { supabase } from '@/lib/supabase/client'

export interface PlanoErp {
  id: string
  codigo: string
  descricao: string
  valor_titular: number | null
  valor_dependente: number | null
  com_coparticipacao: boolean | null
  padrao: boolean | null
  franquia_quantidade: number | null
  valor_excedente: number | null
  tipo: string | null
}

export async function fetchPlanosErp(): Promise<PlanoErp[]> {
  const { data, error } = await supabase
    .from('planos_saude')
    .select(
      'id, codigo, descricao, valor_titular, valor_dependente, com_coparticipacao, padrao, franquia_quantidade, valor_excedente, tipo',
    )
    .or('codigo.like.FROTA_%,codigo.like.ERP-%,codigo.like.MOD-%')
    .order('valor_titular', { ascending: true })

  if (error) throw error
  return (data || []) as PlanoErp[]
}

export async function fetchPlanoByCodigo(codigo: string): Promise<PlanoErp | null> {
  const { data, error } = await supabase
    .from('planos_saude')
    .select(
      'id, codigo, descricao, valor_titular, valor_dependente, com_coparticipacao, padrao, franquia_quantidade, valor_excedente, tipo',
    )
    .eq('codigo', codigo)
    .maybeSingle()

  if (error) return null
  return data as PlanoErp | null
}

export async function fetchFrotaPlan(): Promise<PlanoErp | null> {
  return fetchPlanoByCodigo('FROTA_20')
}

export async function fetchModulosAdicionais(): Promise<PlanoErp[]> {
  const { data, error } = await supabase
    .from('planos_saude')
    .select(
      'id, codigo, descricao, valor_titular, valor_dependente, com_coparticipacao, padrao, franquia_quantidade, valor_excedente, tipo',
    )
    .eq('tipo', 'modulo')
    .order('descricao', { ascending: true })

  if (error) throw error
  return (data || []) as PlanoErp[]
}

export function calculateFrotaPrice(
  basePrice: number,
  franquia: number,
  excedente: number,
  numPlates: number,
): number {
  if (numPlates <= franquia) return basePrice
  return basePrice + (numPlates - franquia) * excedente
}
