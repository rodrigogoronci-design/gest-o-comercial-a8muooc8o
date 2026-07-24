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

export const ADESAO_CHECKLIST: DocumentRequirementCategory[] = [
  {
    category: 'EMPRESA (Matriz)',
    items: [
      { key: 'emp_cartao_cnpj', label: 'Cartão CNPJ' },
      { key: 'emp_contrato_social', label: 'Contrato Social' },
      { key: 'emp_regime_tributario', label: 'Regime Tributário' },
    ],
  },
  {
    category: 'FILIAL (se houver)',
    items: [
      { key: 'fil_cartao_cnpj', label: 'Cartão CNPJ' },
      { key: 'fil_rntrc', label: 'RNTRC' },
      { key: 'fil_incidencia_tributaria', label: 'Incidência Tributária' },
      { key: 'fil_contador_crc_cnpj', label: 'Nome do contador, CRC e CNPJ' },
      {
        key: 'fil_regime_nfse',
        label: 'Regime tributário da NFS-e (informar se é ou não optante pelo Simples Nacional)',
      },
      { key: 'fil_inscricao_estadual', label: 'Inscrição Estadual' },
    ],
  },
  {
    category: 'CERTIFICADO DIGITAL / SEFAZ',
    items: [
      { key: 'cert_digital', label: 'Certificado digital (usuário e senha)' },
      {
        key: 'cert_sefaz',
        label: 'Empresa habilitada na SEFAZ para emissão de documentos fiscais',
      },
    ],
  },
  {
    category: 'PERFIL OPERACIONAL',
    items: [
      { key: 'op_transportadora', label: 'Transportadora: Sim / Não' },
      { key: 'op_agenciadora', label: 'Agenciadora: Sim / Não' },
      { key: 'op_regiao_localizacao', label: 'Região de localização' },
      { key: 'op_regiao_atuacao', label: 'Região de atuação' },
      { key: 'op_segmento', label: 'Segmento transportado' },
    ],
  },
  {
    category: 'IDENTIDADE VISUAL',
    items: [{ key: 'id_logomarca', label: 'Logomarca da empresa' }],
  },
  {
    category: 'RESPONSÁVEL LEGAL',
    items: [
      { key: 'rl_nome', label: 'Nome do responsável legal' },
      { key: 'rl_cnh', label: 'Cópia da CNH' },
      { key: 'rl_telefone', label: 'Telefone para contato' },
    ],
  },
  {
    category: 'Ponto Focal do Projeto',
    items: [
      { key: 'pf_nome', label: 'Nome' },
      { key: 'pf_email', label: 'E-mail' },
      { key: 'pf_telefone', label: 'Telefone' },
    ],
  },
  {
    category: 'Responsável Operacional',
    items: [
      { key: 'ro_nome', label: 'Nome' },
      { key: 'ro_email', label: 'E-mail' },
      { key: 'ro_telefone', label: 'Telefone' },
    ],
  },
  {
    category: 'Responsável Financeiro',
    items: [
      { key: 'rf_nome', label: 'Nome' },
      { key: 'rf_email', label: 'E-mail' },
      { key: 'rf_telefone', label: 'Telefone' },
    ],
  },
]

export function generateAdesaoWhatsappMessage(clientName: string): string {
  const lines: string[] = []
  lines.push(`Olá${clientName ? `, ${clientName}` : ''}!`)
  lines.push('')
  lines.push(
    'Recebemos sua aceitação da proposta. Para darmos continuidade à adesão, precisamos que nos envie a seguinte documentação:',
  )
  lines.push('')
  for (const cat of ADESAO_CHECKLIST) {
    lines.push(`*${cat.category}*`)
    cat.items.forEach((item, i) => {
      lines.push(`${i + 1}. ${item.label}`)
    })
    lines.push('')
  }
  lines.push('Você pode enviar os arquivos por aqui mesmo ou fazer o upload diretamente no portal.')
  lines.push('Qualquer dúvida, estamos à disposição!')
  return lines.join('\n')
}
