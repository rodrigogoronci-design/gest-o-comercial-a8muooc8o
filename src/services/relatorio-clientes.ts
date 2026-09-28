import { supabase } from '@/lib/supabase/client'

export interface ClienteRelatorio {
  id: string
  nome: string
  cnpj: string
  modulos: any[] | null
  valor_total: number | null
  vencimento_mensal: number | null
  endereco: string | null
  status: string | null
  plano_descricao: string | null
  plano_codigo: string | null
  data_assinatura: string | null
  cnpj_duplicado_count?: number
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
      modulos,
      valor_total,
      vencimento_mensal,
      endereco,
      status,
      plano_id,
      data_assinatura,
      planos_saude(descricao, codigo)
    `)
    .order('nome', { ascending: true })

  if (error) throw error

  // Contar duplicidade de CNPJ
  const cnpjCountMap = new Map<string, number>()
  for (const c of data || []) {
    const rawCnpj = c.cnpj ? String(c.cnpj).replace(/\D/g, '') : ''
    if (rawCnpj) {
      cnpjCountMap.set(rawCnpj, (cnpjCountMap.get(rawCnpj) || 0) + 1)
    }
  }

  return (data || []).map((c: any) => {
    const rawCnpj = c.cnpj ? String(c.cnpj).replace(/\D/g, '') : ''
    const dupCount = rawCnpj ? cnpjCountMap.get(rawCnpj) || 1 : 1
    const planoBase = resolvePlanoBaseCliente(c)

    return {
      id: c.id,
      nome: c.nome,
      cnpj: c.cnpj,
      modulos: c.modulos,
      valor_total: c.valor_total != null ? Number(c.valor_total) : 0,
      vencimento_mensal: c.vencimento_mensal,
      endereco: c.endereco,
      status: c.status,
      plano_descricao: planoBase,
      plano_codigo: c.planos_saude?.codigo ?? null,
      data_assinatura: c.data_assinatura ?? null,
      cnpj_duplicado_count: dupCount > 1 ? dupCount : undefined,
    }
  })
}

export interface ContratoRelatorioGeral {
  id: string
  cliente_id: string
  cliente_nome: string
  cliente_cnpj: string | null
  cliente_status: string | null
  tipo: string | null
  data_solicitacao: string | null
  plano: string | null
  modulos: any
  valor_total: number
  status: string | null
  observacoes: string | null
  tem_historico: boolean
  cnpj_duplicado_count?: number
}

export function normalizePlanName(raw: string | null | undefined): string {
  if (!raw) return ''
  // Normaliza trim, maiúsculas, remove hífens e múltiplos espaços para agrupamento equivalente
  // "TMS 100" ≡ "TMS-100" -> "TMS100"
  return raw
    .trim()
    .toUpperCase()
    .replace(/[\s\-_]+/g, '')
}

export function resolvePlanoCliente(cliente: any): string {
  if (!cliente) return 'Não informado'

  // 1. Fonte primária: clientes.modulos->>'plano_base' (exatamente como gravado no cadastro)
  const modulosRaw = cliente.modulos
  if (modulosRaw && typeof modulosRaw === 'object' && !Array.isArray(modulosRaw)) {
    const pb = (modulosRaw as any).plano_base
    if (pb && typeof pb === 'string' && pb.trim()) {
      return pb.trim()
    }
  }

  // 2. Fallback: descricao do plano via plano_id (join planos_saude)
  const embedded = Array.isArray(cliente.planos_saude)
    ? cliente.planos_saude[0]
    : cliente.planos_saude
  if (
    embedded &&
    embedded.descricao &&
    typeof embedded.descricao === 'string' &&
    embedded.descricao.trim()
  ) {
    return embedded.descricao.trim()
  }
  if (
    embedded &&
    embedded.codigo &&
    typeof embedded.codigo === 'string' &&
    embedded.codigo.trim()
  ) {
    return embedded.codigo.trim()
  }

  // 3. Fallback se ambos vazios: "Não informado"
  return 'Não informado'
}

function resolvePlanoBaseCliente(cliente: any): string {
  return resolvePlanoCliente(cliente)
}

export const getRelatorioGeralContratos = async (): Promise<ContratoRelatorioGeral[]> => {
  // 1. Buscar todos os clientes (fonte mestre)
  const { data: clientesData, error: clientesError } = await supabase
    .from('clientes')
    .select(`
      id,
      nome,
      cnpj,
      status,
      valor_total,
      data_assinatura,
      created_at,
      modulos,
      plano_id,
      planos_saude(descricao, codigo)
    `)
    .order('nome', { ascending: true })

  if (clientesError) throw clientesError

  // 2. Buscar todo o histórico de contratos
  const { data: historicosData, error: histError } = await supabase
    .from('historico_contratos')
    .select(`
      id,
      cliente_id,
      tipo,
      data_solicitacao,
      plano,
      modulos,
      valor_total,
      status,
      observacoes,
      created_at
    `)
    .order('created_at', { ascending: false })

  if (histError) throw histError

  // Mapear históricos por cliente_id (preservando ordem descendente de created_at)
  const histByCliente = new Map<string, any[]>()
  for (const h of historicosData || []) {
    if (!h.cliente_id) continue
    const arr = histByCliente.get(h.cliente_id) || []
    arr.push(h)
    histByCliente.set(h.cliente_id, arr)
  }

  // Contar ocorrências por CNPJ limpo para identificar duplicidades
  const cnpjCountMap = new Map<string, number>()
  for (const c of clientesData || []) {
    const rawCnpj = c.cnpj ? String(c.cnpj).replace(/\D/g, '') : ''
    if (rawCnpj) {
      cnpjCountMap.set(rawCnpj, (cnpjCountMap.get(rawCnpj) || 0) + 1)
    }
  }

  const result: ContratoRelatorioGeral[] = []

  for (const cliente of clientesData || []) {
    const rawCnpj = cliente.cnpj ? String(cliente.cnpj).replace(/\D/g, '') : ''
    const dupCount = rawCnpj ? cnpjCountMap.get(rawCnpj) || 1 : 1

    const clientHistoricos = histByCliente.get(cliente.id)

    if (clientHistoricos && clientHistoricos.length > 0) {
      // Cliente possui 1 ou mais registros de contrato no histórico
      for (const h of clientHistoricos) {
        // Mensalidade continua do cadastro (valor_total) como regra de fallback ou valor específico
        // Requisito 7: Mensalidade continua do cadastro (valor_total) em reais
        const valorMensalidade =
          cliente.valor_total != null
            ? Number(cliente.valor_total)
            : h.valor_total != null
              ? Number(h.valor_total)
              : 0

        // A fonte primária do plano para o relatório de contratos é o plano do cadastro do cliente
        // (espelho da lista de clientes), ou fallback histórico se h.plano existir e cadastro for "Não informado"
        const planoCadastro = resolvePlanoBaseCliente(cliente)
        const planoResolved =
          planoCadastro !== 'Não informado'
            ? planoCadastro
            : h.plano && typeof h.plano === 'string' && h.plano.trim()
              ? h.plano.trim()
              : 'Não informado'
        const modulosResolved = h.modulos || cliente.modulos

        result.push({
          id: h.id,
          cliente_id: cliente.id,
          cliente_nome: cliente.nome || 'Cliente não identificado',
          cliente_cnpj: cliente.cnpj || null,
          cliente_status: cliente.status || null,
          tipo: h.tipo || 'Contrato',
          data_solicitacao: h.data_solicitacao || cliente.data_assinatura || null,
          plano: planoResolved,
          modulos: modulosResolved,
          valor_total: valorMensalidade,
          status: h.status || cliente.status || 'Ativo',
          observacoes: h.observacoes || null,
          tem_historico: true,
          cnpj_duplicado_count: dupCount > 1 ? dupCount : undefined,
        })
      }
    } else {
      // Cliente SEM registro no histórico:
      // Exibir a linha normalmente com os dados do cadastro (plano_base de modulos->>'plano_base',
      // módulos adicionais, mensalidade valor_total, status) e nos campos de contrato mostrar
      // explicitamente "Sem registro no histórico" — NUNCA omitir o cliente nem inventar contrato.
      const valorMensalidade = cliente.valor_total != null ? Number(cliente.valor_total) : 0
      const planoBase = resolvePlanoBaseCliente(cliente)

      result.push({
        id: `cliente-${cliente.id}`,
        cliente_id: cliente.id,
        cliente_nome: cliente.nome || 'Cliente não identificado',
        cliente_cnpj: cliente.cnpj || null,
        cliente_status: cliente.status || null,
        tipo: null, // UI exibirá "Sem registro no histórico"
        data_solicitacao: cliente.data_assinatura || null,
        plano: planoBase,
        modulos: cliente.modulos,
        valor_total: valorMensalidade,
        status: null, // UI exibirá "Sem registro no histórico" para contrato
        observacoes: null,
        tem_historico: false,
        cnpj_duplicado_count: dupCount > 1 ? dupCount : undefined,
      })
    }
  }

  return result
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
    modulos: data.modulos as any,
    plano_id: data.plano_id,
    plano_descricao: (data.planos_saude as any)?.descricao ?? null,
    plano_codigo: (data.planos_saude as any)?.codigo ?? null,
    com_coparticipacao: (data.planos_saude as any)?.com_coparticipacao ?? null,
    quantidade_filiais: data.quantidade_filiais,
    modo_implantacao: data.modo_implantacao,
    filiais_detalhes: data.filiais_detalhes as any,
  }
}
