import { supabase } from '@/lib/supabase/client'

export interface ClienteRecord {
  id: string
  nome: string
  cnpj: string
  email?: string | null
  telefone?: string | null
  modulos: string[]
  valor_total: number
  status: string
  created_at: string
}

export async function fetchClientes() {
  const { data, error } = await supabase
    .from('clientes' as any)
    .select('*')
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching clients:', error)
    return []
  }
  return data as ClienteRecord[]
}

export async function createCliente(payload: Omit<ClienteRecord, 'id' | 'created_at' | 'status'>) {
  const { data, error } = await supabase
    .from('clientes' as any)
    .insert([payload])
    .select()
    .single()

  if (error) {
    throw error
  }
  return data as ClienteRecord
}
