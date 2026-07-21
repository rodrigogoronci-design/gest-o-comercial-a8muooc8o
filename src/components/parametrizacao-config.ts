import { Building2, FileCheck, Settings, Palette, User, Users } from 'lucide-react'

export type FieldType = 'text' | 'password' | 'file' | 'radio' | 'toggle' | 'select'

export interface FieldDef {
  key: string
  label: string
  type: FieldType
  options?: string[]
}

export interface SectionDef {
  title: string
  icon: any
  toggleKey?: string
  fields: FieldDef[]
}

export const SECTIONS: SectionDef[] = [
  {
    title: 'Empresa (Matriz)',
    icon: Building2,
    fields: [
      { key: 'matriz_cartao_cnpj_url', label: 'Cartão CNPJ', type: 'file' },
      { key: 'matriz_contrato_social_url', label: 'Contrato Social', type: 'file' },
      { key: 'matriz_regime_tributario', label: 'Regime Tributário', type: 'text' },
    ],
  },
  {
    title: 'Filial',
    icon: Building2,
    toggleKey: 'filial_enabled',
    fields: [
      { key: 'filial_cartao_cnpj_url', label: 'Cartão CNPJ', type: 'file' },
      { key: 'filial_rntrc_url', label: 'RNTRC', type: 'file' },
      { key: 'filial_incidencia_tributaria', label: 'Incidência Tributária', type: 'text' },
      { key: 'filial_contador_nome', label: 'Nome do Contador', type: 'text' },
      { key: 'filial_contador_crc', label: 'CRC', type: 'text' },
      { key: 'filial_contador_cnpj', label: 'CNPJ do Contador', type: 'text' },
      {
        key: 'filial_nfse_simples_nacional',
        label: 'Optante pelo Simples Nacional (NFS-e)',
        type: 'select',
        options: ['Sim', 'Não'],
      },
      { key: 'filial_inscricao_estadual', label: 'Inscrição Estadual', type: 'text' },
    ],
  },
  {
    title: 'Certificado Digital / SEFAZ',
    icon: FileCheck,
    fields: [
      { key: 'certificado_arquivo_url', label: 'Certificado Digital', type: 'file' },
      { key: 'certificado_senha', label: 'Senha do Certificado', type: 'password' },
      {
        key: 'certificado_habilitada_sefaz',
        label: 'Habilitada na SEFAZ para emissão de documentos fiscais',
        type: 'toggle',
      },
    ],
  },
  {
    title: 'Perfil Operacional',
    icon: Settings,
    fields: [
      { key: 'perfil_transportadora', label: 'Transportadora', type: 'radio' },
      { key: 'perfil_agenciadora', label: 'Agenciadora', type: 'radio' },
      { key: 'perfil_regiao_localizacao', label: 'Região de Localização', type: 'text' },
      { key: 'perfil_regiao_atuacao', label: 'Região de Atuação', type: 'text' },
      { key: 'perfil_segmento', label: 'Segmento a ser Transportado', type: 'text' },
    ],
  },
  {
    title: 'Identidade Visual',
    icon: Palette,
    fields: [{ key: 'identidade_logomarca_url', label: 'Logomarca da Empresa', type: 'file' }],
  },
  {
    title: 'Responsável Legal',
    icon: User,
    fields: [
      { key: 'responsavel_nome', label: 'Nome do Responsável Legal', type: 'text' },
      { key: 'responsavel_cnh_url', label: 'Cópia da CNH', type: 'file' },
      { key: 'responsavel_telefone', label: 'Telefone para Contato', type: 'text' },
    ],
  },
  {
    title: 'Ponto Focal do Projeto',
    icon: Users,
    fields: [
      { key: 'focal_nome', label: 'Nome', type: 'text' },
      { key: 'focal_email', label: 'E-mail', type: 'text' },
      { key: 'focal_telefone', label: 'Telefone', type: 'text' },
    ],
  },
  {
    title: 'Responsável Operacional',
    icon: Users,
    fields: [
      { key: 'operacional_nome', label: 'Nome', type: 'text' },
      { key: 'operacional_email', label: 'E-mail', type: 'text' },
      { key: 'operacional_telefone', label: 'Telefone', type: 'text' },
    ],
  },
  {
    title: 'Responsável Financeiro',
    icon: Users,
    fields: [
      { key: 'financeiro_nome', label: 'Nome', type: 'text' },
      { key: 'financeiro_email', label: 'E-mail', type: 'text' },
      { key: 'financeiro_telefone', label: 'Telefone', type: 'text' },
    ],
  },
]
