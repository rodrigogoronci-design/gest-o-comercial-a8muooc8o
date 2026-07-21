export interface DocumentRequirementItem {
  key: string
  label: string
  hint?: string
}

export interface DocumentRequirementCategory {
  category: string
  items: DocumentRequirementItem[]
}

export const DOCUMENT_REQUIREMENTS: DocumentRequirementCategory[] = [
  {
    category: 'Empresa (Matriz)',
    items: [
      { key: 'matriz_cartao_cnpj', label: 'Cartão CNPJ' },
      { key: 'matriz_contrato_social', label: 'Contrato Social' },
      { key: 'matriz_regime_tributario', label: 'Regime Tributário' },
    ],
  },
  {
    category: 'Filial',
    items: [
      { key: 'filial_cartao_cnpj', label: 'Cartão CNPJ' },
      { key: 'filial_rntrc', label: 'RNTRC' },
      { key: 'filial_incidencia_tributaria', label: 'Incidência Tributária' },
      { key: 'filial_dados_contador', label: 'Dados do Contador' },
      { key: 'filial_inscricao_estadual', label: 'Inscrição Estadual' },
    ],
  },
  {
    category: 'Certificado Digital',
    items: [
      { key: 'certificado_arquivo', label: 'Certificado (.pfx/outro)' },
      { key: 'certificado_senha', label: 'Senha' },
    ],
  },
  {
    category: 'Identidade Visual',
    items: [{ key: 'identidade_logomarca', label: 'Logomarca' }],
  },
  {
    category: 'Responsável Legal',
    items: [{ key: 'responsavel_cnh', label: 'CNH do Responsável' }],
  },
]

export const TOTAL_REQUIRED_DOCS = DOCUMENT_REQUIREMENTS.reduce((acc, c) => acc + c.items.length, 0)
