import { supabase } from '@/lib/supabase/client'

export interface AgendaImplantacaoItem {
  id: string
  implementacao_id: string
  cliente_nome: string
  etapa_titulo: string
  data: string
  hora: string | null
  status: string
  tipo: string
  source: 'etapa_prevista' | 'etapa_realizada' | 'treinamento'
}

export const getAgendaImplantacoes = async (): Promise<AgendaImplantacaoItem[]> => {
  const { data, error } = await supabase
    .from('implementacoes')
    .select(
      'id, tipo, cliente_nome, clientes(nome), treinamento_data, treinamento_hora, implementacao_etapas(id, titulo, status, data_prevista, data_realizada, hora_prevista, hora_realizada)',
    )
    .order('created_at', { ascending: false })

  if (error) throw error

  const items: AgendaImplantacaoItem[] = []

  for (const impl of data || []) {
    const clienteNome = impl.clientes?.nome || impl.cliente_nome || 'N/A'
    const tipo = impl.tipo || 'novo_cliente'

    for (const etapa of impl.implementacao_etapas || []) {
      if (etapa.data_prevista) {
        items.push({
          id: `${etapa.id}-prevista`,
          implementacao_id: impl.id,
          cliente_nome: clienteNome,
          etapa_titulo: etapa.titulo,
          data: etapa.data_prevista,
          hora: etapa.hora_prevista || null,
          status: etapa.status || 'Não iniciada',
          tipo,
          source: 'etapa_prevista',
        })
      }
      if (etapa.data_realizada) {
        items.push({
          id: `${etapa.id}-realizada`,
          implementacao_id: impl.id,
          cliente_nome: clienteNome,
          etapa_titulo: etapa.titulo,
          data: etapa.data_realizada,
          hora: etapa.hora_realizada || null,
          status: 'Concluída',
          tipo,
          source: 'etapa_realizada',
        })
      }
    }

    if (impl.treinamento_data) {
      items.push({
        id: `${impl.id}-treinamento`,
        implementacao_id: impl.id,
        cliente_nome: clienteNome,
        etapa_titulo: 'Treinamento',
        data: impl.treinamento_data,
        hora: impl.treinamento_hora || null,
        status: 'Agendada',
        tipo,
        source: 'treinamento',
      })
    }
  }

  return items
}
