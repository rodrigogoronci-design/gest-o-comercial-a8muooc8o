import { MODULES } from '@/constants/contracts'

export type SolicitacaoTipo =
  | 'Treinamento'
  | 'Inclusão de Modulo'
  | 'Suporte'
  | 'Inclusão de Filial'

export const SOLICITACAO_OPTIONS: { value: SolicitacaoTipo; label: string }[] = [
  { value: 'Treinamento', label: 'Treinamento' },
  { value: 'Inclusão de Modulo', label: 'Inclusão de Modulo' },
  { value: 'Inclusão de Filial', label: 'Inclusão de Filial' },
  { value: 'Suporte', label: 'Suporte' },
]

export interface FilialSolicitacaoData {
  nome?: string
  cnpj?: string
  dfe_incluso?: boolean
  valor_mensalidade?: number | string
  valor_dfe?: number | string
}

export function getModuleNames(): string[] {
  return MODULES.map((m) => m.name)
}

export function formatSolicitacao(
  tipo: SolicitacaoTipo,
  modulo: string | null,
  filialData?: FilialSolicitacaoData | null,
): string {
  if (tipo === 'Inclusão de Filial') {
    if (!filialData) return 'Inclusão de Filial'
    const nome = filialData.nome || ''
    const cnpj = filialData.cnpj || ''
    const valorMensalidade =
      typeof filialData.valor_mensalidade === 'number'
        ? filialData.valor_mensalidade.toFixed(2).replace('.', ',')
        : filialData.valor_mensalidade || '0,00'

    const dfeIncluso = !!filialData.dfe_incluso
    const dfeText = dfeIncluso
      ? `Sim (R$ ${
          typeof filialData.valor_dfe === 'number'
            ? filialData.valor_dfe.toFixed(2).replace('.', ',')
            : filialData.valor_dfe || '0,00'
        })`
      : 'Não'

    return `Inclusão de Filial - Nome: ${nome}, CNPJ: ${cnpj}, Mensalidade: ${valorMensalidade}, DF-e: ${dfeText}`
  }

  if (tipo === 'Suporte' || !modulo) return tipo
  return `${tipo} - Módulo: ${modulo}`
}

export function parseSolicitacao(solicitacao: string): {
  tipo: SolicitacaoTipo | null
  modulo: string | null
} {
  if (!solicitacao) return { tipo: null, modulo: null }
  if (solicitacao === 'Suporte') return { tipo: 'Suporte', modulo: null }
  if (solicitacao === 'Inclusão de Filial' || solicitacao.startsWith('Inclusão de Filial')) {
    return { tipo: 'Inclusão de Filial', modulo: null }
  }

  const treinoMatch = solicitacao.match(/^Treinamento - Módulo: (.+)$/)
  if (treinoMatch) return { tipo: 'Treinamento', modulo: treinoMatch[1] }

  const inclusaoMatch = solicitacao.match(/^Inclusão de Modulo - Módulo: (.+)$/)
  if (inclusaoMatch) return { tipo: 'Inclusão de Modulo', modulo: inclusaoMatch[1] }

  return { tipo: null, modulo: null }
}

export function mapTipoToImplantacaoTipo(tipo: SolicitacaoTipo): string {
  if (tipo === 'Treinamento') return 'treinamento'
  if (tipo === 'Inclusão de Modulo') return 'inclusao_modulo'
  if (tipo === 'Inclusão de Filial') return 'inclusao_filial'
  return 'novo_cliente'
}

export function generateExecutionTitle(
  tipo: string,
  treinamentoMotivo: string | null,
  modulosNovos: string[] | null,
): string {
  if (tipo === 'treinamento') {
    if (treinamentoMotivo) {
      const parsed = parseSolicitacao(treinamentoMotivo)
      if (parsed.modulo) return `Execução do treinamento módulo ${parsed.modulo}`
    }
    return 'Execução do Treinamento'
  }
  if (tipo === 'inclusao_modulo') {
    const modulos = modulosNovos || []
    if (modulos.length > 0) return `Inclusão de módulo ${modulos.join(', ')}`
    return 'Inclusão de Módulo'
  }
  return 'Execução'
}
