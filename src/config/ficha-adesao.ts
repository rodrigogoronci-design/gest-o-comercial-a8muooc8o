export interface FichaCampoDef {
  key: string
  label: string
  type: 'text' | 'select' | 'boolean' | 'file' | 'password' | 'textarea'
  required?: boolean
  options?: { value: string; label: string }[]
  placeholder?: string
  helperText?: string
  isSensitive?: boolean
}

export interface FichaSecaoDef {
  id: string
  title: string
  description?: string
  isUploadSecao?: boolean
  campos: FichaCampoDef[]
}

/**
 * Ficha cadastral oficial "INFORMAÇÕES E DOCUMENTOS NECESSÁRIOS" Service Logic
 * 1. EMPRESA (Matriz): Cartão CNPJ (upload), Contrato Social (upload), Regime Tributário (campo + upload se anexo)
 * 2. FILIAL (se houver): indicador se possui filial; Cartão CNPJ (upload), RNTRC (campo+upload), Incidência Tributária (campo),
 *    Nome do contador, CRC e CNPJ (campos), Regime tributário da NFS-e (optante pelo Simples Nacional) (campo sim/não + texto), Inscrição Estadual (campo)
 * 3. CERTIFICADO DIGITAL / SEFAZ: upload certificado digital + usuário e senha (sensível, mascarado) + confirmação empresa habilitada SEFAZ (sim/não)
 * 4. PERFIL OPERACIONAL: Transportadora (Sim/Não), Agenciadora (Sim/Não), Região de localização, Região de atuação, Segmento a ser transportado
 * 5. IDENTIDADE VISUAL: Logomarca da empresa (upload)
 * 6. RESPONSÁVEL LEGAL: Nome, cópia CNH (upload), telefone
 * 7. CONTATOS (tabela da ficha):
 *    - Ponto Focal do Projeto: nome, e-mail, telefone
 *    - Responsável Operacional: nome, e-mail, telefone
 *    - Responsável Financeiro: nome, e-mail, telefone
 */

export const FICHA_OFICIAL_SECOES: FichaSecaoDef[] = [
  {
    id: 'matriz',
    title: 'EMPRESA (Matriz)',
    description: 'Documentos e enquadramento tributário da empresa matriz',
    campos: [
      {
        key: 'matriz_cartao_cnpj',
        label: 'Cartão CNPJ (Upload)',
        type: 'file',
        required: true,
        helperText:
          'Anexe o Cartão CNPJ atualizado emitido pela Receita Federal (PDF, JPG ou PNG).',
      },
      {
        key: 'matriz_contrato_social',
        label: 'Contrato Social (Upload)',
        type: 'file',
        required: true,
        helperText: 'Última alteração contratual consolidada ou contrato social de constituição.',
      },
      {
        key: 'matriz_regime_tributario',
        label: 'Regime Tributário',
        type: 'select',
        required: true,
        options: [
          { value: 'Simples Nacional', label: 'Simples Nacional' },
          { value: 'Lucro Presumido', label: 'Lucro Presumido' },
          { value: 'Lucro Real', label: 'Lucro Real' },
          { value: 'MEI', label: 'MEI' },
          { value: 'Outro', label: 'Outro' },
        ],
        placeholder: 'Selecione o regime tributário',
      },
      {
        key: 'matriz_comprovante_regime',
        label: 'Comprovante do Regime Tributário (Opcional se anexo)',
        type: 'file',
        required: false,
        helperText:
          'Comprovante de opção pelo Simples Nacional ou documento complementar se houver.',
      },
    ],
  },
  {
    id: 'filial',
    title: 'FILIAL (se houver)',
    description: 'Caso a empresa possua filiais operacionais integradas',
    campos: [
      {
        key: 'possui_filial',
        label: 'A empresa possui filial(is)?',
        type: 'boolean',
        required: true,
      },
      {
        key: 'filial_cartao_cnpj',
        label: 'Cartão CNPJ da Filial (Upload)',
        type: 'file',
        required: false,
        helperText: 'Anexe o Cartão CNPJ da filial (se aplicável).',
      },
      {
        key: 'filial_rntrc_numero',
        label: 'RNTRC (Número do Registro)',
        type: 'text',
        required: false,
        placeholder: 'Ex: 12345678',
      },
      {
        key: 'filial_rntrc_arquivo',
        label: 'Certificado RNTRC (Upload)',
        type: 'file',
        required: false,
        helperText: 'Cópia ou comprovante do RNTRC ANTT.',
      },
      {
        key: 'filial_incidencia_tributaria',
        label: 'Incidência Tributária',
        type: 'text',
        required: false,
        placeholder: 'Ex: Tributado no município, isento, etc.',
      },
      {
        key: 'filial_contador_nome',
        label: 'Nome do Contador',
        type: 'text',
        required: false,
        placeholder: 'Nome completo do contador ou escritório',
      },
      {
        key: 'filial_contador_crc',
        label: 'CRC do Contador',
        type: 'text',
        required: false,
        placeholder: 'Ex: CRC-ES 000000/O',
      },
      {
        key: 'filial_contador_cnpj',
        label: 'CNPJ do Escritório Contábil',
        type: 'text',
        required: false,
        placeholder: '00.000.000/0000-00',
      },
      {
        key: 'filial_optante_simples',
        label: 'Regime tributário da NFS-e: Optante pelo Simples Nacional?',
        type: 'boolean',
        required: false,
      },
      {
        key: 'filial_regime_nfse_detalhes',
        label: 'Detalhes do regime tributário da NFS-e',
        type: 'text',
        required: false,
        placeholder: 'Informações adicionais de alíquota / regime municipal da NFS-e',
      },
      {
        key: 'filial_inscricao_estadual',
        label: 'Inscrição Estadual',
        type: 'text',
        required: false,
        placeholder: 'Ex: 123.456.789.000 ou Isento',
      },
    ],
  },
  {
    id: 'certificado',
    title: 'CERTIFICADO DIGITAL / SEFAZ',
    description: 'Emissão fiscal e credenciamento na SEFAZ',
    campos: [
      {
        key: 'cert_arquivo',
        label: 'Certificado Digital A1 (.pfx ou .p12)',
        type: 'file',
        required: true,
        helperText:
          'Arquivo do Certificado Digital padrão ICP-Brasil (preferencialmente A1 em arquivo).',
      },
      {
        key: 'cert_usuario',
        label: 'Usuário do Certificado (se aplicável)',
        type: 'text',
        required: false,
        placeholder: 'Opcional (se houver usuário específico)',
      },
      {
        key: 'cert_senha',
        label: 'Senha do Certificado Digital',
        type: 'password',
        required: true,
        isSensitive: true,
        placeholder: 'Digite a senha do arquivo do certificado',
        helperText:
          'Aviso de Segurança: campo estritamente protegido e mascarado após gravação. Utilizado exclusivamente na parametrização inicial do emissor fiscal.',
      },
      {
        key: 'cert_sefaz_habilitada',
        label: 'Empresa habilitada na SEFAZ para emissão de documentos fiscais?',
        type: 'boolean',
        required: true,
        helperText:
          'Confirmação se a empresa já possui autorização ativa na SEFAZ do seu estado para emissão de CT-e / MDF-e / NF-e.',
      },
    ],
  },
  {
    id: 'perfil_operacional',
    title: 'PERFIL OPERACIONAL',
    description: 'Enquadramento das atividades e segmentos atendidos',
    campos: [
      {
        key: 'op_transportadora',
        label: 'Transportadora?',
        type: 'boolean',
        required: true,
      },
      {
        key: 'op_agenciadora',
        label: 'Agenciadora?',
        type: 'boolean',
        required: true,
      },
      {
        key: 'op_regiao_localizacao',
        label: 'Região de localização',
        type: 'text',
        required: true,
        placeholder: 'Ex: Grande Vitória / ES, Sul, Sudeste...',
      },
      {
        key: 'op_regiao_atuacao',
        label: 'Região de atuação',
        type: 'text',
        required: true,
        placeholder: 'Ex: Interestadual (ES, RJ, SP, MG, BA), Nacional...',
      },
      {
        key: 'op_segmento',
        label: 'Segmento a ser transportado',
        type: 'text',
        required: true,
        placeholder: 'Ex: Carga geral, químicos, perecíveis, siderurgia, contêiner...',
      },
    ],
  },
  {
    id: 'identidade_visual',
    title: 'IDENTIDADE VISUAL',
    description: 'Logomarca para personalização do sistema e dos documentos (DACTE, DAMDFE)',
    campos: [
      {
        key: 'id_logomarca',
        label: 'Logomarca da empresa (Upload)',
        type: 'file',
        required: true,
        helperText: 'Envie a imagem em alta resolução (PNG com fundo transparente ou JPG/PDF).',
      },
    ],
  },
  {
    id: 'responsavel_legal',
    title: 'RESPONSÁVEL LEGAL',
    description: 'Dados do sócio/administrador com poderes legais pela empresa',
    campos: [
      {
        key: 'rl_nome',
        label: 'Nome do responsável legal da empresa',
        type: 'text',
        required: true,
        placeholder: 'Nome completo',
      },
      {
        key: 'rl_cnh',
        label: 'Cópia da CNH do responsável (Upload)',
        type: 'file',
        required: true,
        helperText: 'Envie documento de identificação com foto e CPF legível (CNH ou RG).',
      },
      {
        key: 'rl_telefone',
        label: 'Telefone para contato',
        type: 'text',
        required: true,
        placeholder: '(00) 00000-0000',
      },
    ],
  },
  {
    id: 'contatos',
    title: 'CONTATOS DO PROJETO',
    description: 'Tabela de responsáveis diretos por área de interlocução',
    campos: [
      // Ponto Focal do Projeto
      {
        key: 'pf_nome',
        label: 'Ponto Focal do Projeto - Nome',
        type: 'text',
        required: true,
        placeholder: 'Nome do coordenador / ponto focal',
      },
      {
        key: 'pf_email',
        label: 'Ponto Focal do Projeto - E-mail',
        type: 'text',
        required: true,
        placeholder: 'email@empresa.com.br',
      },
      {
        key: 'pf_telefone',
        label: 'Ponto Focal do Projeto - Telefone',
        type: 'text',
        required: true,
        placeholder: '(00) 00000-0000',
      },
      // Responsável Operacional
      {
        key: 'ro_nome',
        label: 'Responsável Operacional - Nome',
        type: 'text',
        required: true,
        placeholder: 'Nome do responsável da operação',
      },
      {
        key: 'ro_email',
        label: 'Responsável Operacional - E-mail',
        type: 'text',
        required: true,
        placeholder: 'operacional@empresa.com.br',
      },
      {
        key: 'ro_telefone',
        label: 'Responsável Operacional - Telefone',
        type: 'text',
        required: true,
        placeholder: '(00) 00000-0000',
      },
      // Responsável Financeiro
      {
        key: 'rf_nome',
        label: 'Responsável Financeiro - Nome',
        type: 'text',
        required: true,
        placeholder: 'Nome do responsável do financeiro',
      },
      {
        key: 'rf_email',
        label: 'Responsável Financeiro - E-mail',
        type: 'text',
        required: true,
        placeholder: 'financeiro@empresa.com.br',
      },
      {
        key: 'rf_telefone',
        label: 'Responsável Financeiro - Telefone',
        type: 'text',
        required: true,
        placeholder: '(00) 00000-0000',
      },
    ],
  },
]

/**
 * Mapeamento dos uploads da ficha para os itens correspondentes na tabela documentacao_adesao
 */
export const UPLOAD_ITEM_MAPPING: Record<
  string,
  { categoria: string; item: string; label: string; obrigatorio: boolean }
> = {
  matriz_cartao_cnpj: {
    categoria: 'EMPRESA (Matriz)',
    item: 'Cartão CNPJ',
    label: 'Cartão CNPJ (Matriz)',
    obrigatorio: true,
  },
  matriz_contrato_social: {
    categoria: 'EMPRESA (Matriz)',
    item: 'Contrato Social',
    label: 'Contrato Social',
    obrigatorio: true,
  },
  matriz_comprovante_regime: {
    categoria: 'EMPRESA (Matriz)',
    item: 'Regime Tributário',
    label: 'Comprovante Regime Tributário',
    obrigatorio: false,
  },
  filial_cartao_cnpj: {
    categoria: 'FILIAL (se houver)',
    item: 'Cartão CNPJ',
    label: 'Cartão CNPJ (Filial)',
    obrigatorio: false,
  },
  filial_rntrc_arquivo: {
    categoria: 'FILIAL (se houver)',
    item: 'RNTRC',
    label: 'Certificado RNTRC',
    obrigatorio: false,
  },
  cert_arquivo: {
    categoria: 'CERTIFICADO DIGITAL / SEFAZ',
    item: 'Certificado digital (usuário e senha)',
    label: 'Certificado Digital A1',
    obrigatorio: true,
  },
  id_logomarca: {
    categoria: 'IDENTIDADE VISUAL',
    item: 'Logomarca da empresa',
    label: 'Logomarca da Empresa',
    obrigatorio: true,
  },
  rl_cnh: {
    categoria: 'RESPONSÁVEL LEGAL',
    item: 'Cópia da CNH',
    label: 'CNH do Responsável Legal',
    obrigatorio: true,
  },
}
