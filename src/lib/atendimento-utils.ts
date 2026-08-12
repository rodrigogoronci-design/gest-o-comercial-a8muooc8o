import { MODULES } from '@/constants/contracts'

export type SolicitacaoTipo = 'Treinamento' | 'Inclusão de Modulo' | 'Suporte'

export const SOLICITACAO_OPTIONS: { value: SolicitacaoTipo; label: string }[] = [
  { value: 'Treinamento', label: 'Treinamento' },
  { value: 'Inclusão de Modulo', label: 'Inclusão de Modulo' },
  { value: 'Suporte', label: 'Suporte' },
]

export function getModuleNames(): string[] {
  return MODULES.map((m) => m.name)
}

export function formatSolicitacao(tipo: SolicitacaoTipo, modulo: string | null): string {
  if (tipo === 'Suporte' || !modulo) return tipo
  return `${tipo} - Módulo: ${modulo}`
}

export function parseSolicitacao(solicitacao: string): {
  tipo: SolicitacaoTipo | null
  modulo: string | null
} {
  if (!solicitacao) return { tipo: null, modulo: null }
  if (solicitacao === 'Suporte') return { tipo: 'Suporte', modulo: null }

  const treinoMatch = solicitacao.match(/^Treinamento - Módulo: (.+)$/)
  if (treinoMatch) return { tipo: 'Treinamento', modulo: treinoMatch[1] }

  const inclusaoMatch = solicitacao.match(/^Inclusão de Modulo - Módulo: (.+)$/)
  if (inclusaoMatch) return { tipo: 'Inclusão de Modulo', modulo: inclusaoMatch[1] }

  return { tipo: null, modulo: null }
}

export function mapTipoToImplantacaoTipo(tipo: SolicitacaoTipo): string {
  if (tipo === 'Treinamento') return 'treinamento'
  if (tipo === 'Inclusão de Modulo') return 'inclusao_modulo'
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
