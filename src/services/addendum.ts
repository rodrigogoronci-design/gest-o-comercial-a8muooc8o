import { supabase } from '@/lib/supabase/client'
import { updateCliente } from '@/services/clientes'
import { createHistorico } from '@/services/historico_contratos'
import { updateSolicitacao } from '@/services/solicitacoes_servico'
import {
  calculateBranchAddendum,
  generateBranchesDescription,
  validateCNPJ,
} from '@/lib/branch-calculations'

export interface BranchAddendumInput {
  clienteId: string
  currentMonthlyValue: number
  branches: Array<{ id: string; cnpj: string; nome: string; isentar?: boolean }>
  cobrarFiliais: boolean
  solicitacaoId?: string | null
  observacoes?: string
  prazosConcedidos?: string
}

export async function generateBranchAddendum(input: BranchAddendumInput) {
  const {
    clienteId,
    currentMonthlyValue,
    branches,
    cobrarFiliais,
    solicitacaoId,
    observacoes,
    prazosConcedidos,
  } = input

  const invalidCnpjs = branches.filter((b) => b.cnpj && !validateCNPJ(b.cnpj))
  if (invalidCnpjs.length > 0) {
    throw new Error(`CNPJ inválido para a filial: ${invalidCnpjs[0].nome || invalidCnpjs[0].cnpj}`)
  }

  const { additionalValue, newValue } = calculateBranchAddendum(
    currentMonthlyValue,
    branches.length,
    cobrarFiliais,
  )

  const { data: cliente, error: fetchError } = await supabase
    .from('clientes')
    .select('filiais_detalhes, quantidade_filiais, valor_anual')
    .eq('id', clienteId)
    .single()
  if (fetchError) throw fetchError

  const existingFiliais = Array.isArray(cliente?.filiais_detalhes) ? cliente.filiais_detalhes : []
  const newFiliaisDetalhes = [
    ...existingFiliais,
    ...branches.map((b) => ({
      cnpj: b.cnpj,
      nome: b.nome,
      isentar: b.isentar || false,
    })),
  ]

  await updateCliente(clienteId, {
    filiais_detalhes: newFiliaisDetalhes,
    quantidade_filiais: newFiliaisDetalhes.length,
    valor_total: newValue,
  })

  const itemDescription = generateBranchesDescription(branches)

  await createHistorico({
    cliente_id: clienteId,
    tipo: 'Aditivo de Filial',
    data_solicitacao: new Date().toISOString().split('T')[0],
    modulos: {
      filiais_detalhes: branches.map((b) => ({
        cnpj: b.cnpj,
        nome: b.nome,
        isentar: b.isentar || false,
      })),
    },
    valor_adicional: additionalValue,
    valor_total: newValue,
    valor_anual: cliente?.valor_anual || 0,
    observacoes: observacoes || itemDescription,
    status: 'Enviada',
    prazos_concedidos: prazosConcedidos || null,
    solicitacao_id: solicitacaoId || null,
  })

  if (solicitacaoId) {
    await updateSolicitacao(solicitacaoId, {
      status: 'Processada',
      valor: additionalValue,
    })
  }

  return {
    additionalValue,
    newValue,
    filiaisDetalhes: newFiliaisDetalhes,
    itemDescription,
  }
}
