// Tipos do Módulo de Utilização Service Logic (Fase 1 - Importação e Conferência)

export interface SLImportacao {
  id: string
  arquivo_nome: string
  hash_arquivo: string
  competencia: string // AAAA-MM
  total_linhas: number
  linhas_validas: number
  linhas_novas: number
  linhas_identicas: number
  linhas_diferentes: number
  cnpjs_vinculados: number
  cnpjs_nao_localizados: number
  cnpjs_multiplos: number
  status: 'concluida' | 'substituida' | 'cancelada'
  usuario_id?: string | null
  created_at: string
  observacao?: string | null
}

export interface SLUtilizacaoMensal {
  id?: string
  importacao_id?: string
  cnpj: string
  razao_social: string
  cliente_id?: string | null
  filial_id?: string | null
  base?: string | null
  contratado: number
  total_emitido: number
  saldo: number
  valor_por_doc: number
  valor_cobranca: number
  cte: number
  cte_cancelado: number
  nfe: number
  nfe_cancelado: number
  nfse: number
  nfse_cancelado: number
  competencia: string
  vigente?: boolean
  divergencia_formula: boolean
  created_at?: string
  updated_at?: string
}

export interface SLHistoricoRevisao {
  id: string
  importacao_id_antiga: string
  importacao_id_nova: string
  utilizacao_id_antigo?: string | null
  utilizacao_id_novo?: string | null
  user_id?: string | null
  dados_anteriores: Record<string, any>
  dados_novos: Record<string, any>
  motivo: string
  created_at: string
}

export interface SLParsedRow {
  rowIndex: number
  cnpjRaw: string
  cnpjNormalized: string
  razaoSocial: string
  base: string
  contratado: number
  totalEmitido: number
  saldo: number
  valorPorDoc: number
  valorCobranca: number
  valorCobrancaEsperado: number
  divergenciaCobranca: boolean
  contratadoZerado: boolean
  cte: number
  cteCancelado: number
  nfe: number
  nfeCancelado: number
  nfse: number
  nfseCancelado: number
  divergenciaFormula: boolean
  somaDocsCalculada: number
  isValid: boolean
  validationErrors: string[]
  // Match com clientes existentes
  clienteId: string | null
  clienteNome: string | null
  isMultiplo: boolean
  // Comparação com competência anterior (se já existia)
  statusComparacao: 'novo' | 'identico' | 'diferente'
  registroAnterior?: SLUtilizacaoMensal | null
  diferencas?: string[]
}

export interface SLBaseAnalysis {
  baseName: string
  totalLinhas: number
  cnpjs: string[]
  contratados: number[]
  hasContratadoZerado: boolean
  hasContratadosIguais: boolean
  hasContratadosDiferentes: boolean
  isSingleBranch: boolean
  isMultipleBranches: boolean
  isInconsistencyAlert: boolean
  inconsistencyMessage?: string
}

export interface SLPreImportAnalysis {
  fileName: string
  fileHash: string
  competenciaSugerida: string
  competenciaConfirmada: string
  totalLinhas: number
  linhasValidas: number
  linhasInvalidas: number
  linhasNovas: number
  linhasIdenticas: number
  linhasDiferentes: number
  cnpjsVinculados: number
  cnpjsNaoLocalizados: number
  cnpjsMultiplos: number
  linhasComDivergenciaFormula: number
  linhasComDivergenciaCobranca: number
  linhasComContratadoZerado: number
  hashJaExiste: boolean
  importacaoExistentePorHash?: SLImportacao | null
  competenciaJaExiste: boolean
  importacaoExistentePorCompetencia?: SLImportacao | null
  rows: SLParsedRow[]
  baseAnalysis: SLBaseAnalysis[]
  columnMappingFound: Record<string, string>
  missingRequiredColumns: string[]
}
