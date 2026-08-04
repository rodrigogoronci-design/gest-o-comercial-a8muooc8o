export const CONSULTORIA_DEFAULT_TITULO = 'Consultoria de Estruturação Operacional e Regulatória'

export const CONSULTORIA_DEFAULT_TEXTO = `Prezados,

Conforme alinhado durante a reunião de kick-off, para darmos início às atividades da consultoria, solicitamos o preenchimento das informações abaixo e o envio da documentação relacionada.

Essas informações serão utilizadas para estruturar o projeto, definir os responsáveis, organizar o cronograma de trabalho e conduzir as análises previstas no escopo contratado.`

export const CONSULTORIA_DOC_CATEGORIES = [
  {
    category: 'Operação',
    items: [
      'Fluxo operacional atual',
      'Procedimentos internos relacionados ao transporte',
      'Organograma da operação',
      'Fluxograma do processo (caso exista)',
    ],
  },
  {
    category: 'Contratos',
    items: [
      'Contrato firmado com a Petrobras (ou cláusulas relacionadas à operação de transporte)',
      'Modelos de contratos utilizados com transportadoras subcontratadas',
      'Procedimentos operacionais exigidos pela Petrobras (caso existam)',
    ],
  },
  {
    category: 'Aspectos Regulatórios',
    items: [
      'Procedimentos relacionados ao Vale-Pedágio',
      'Procedimentos relacionados ao CIOT',
      'Procedimentos internos relacionados ao RNTRC',
      'Informações sobre seguros atualmente contratados',
      'Outros documentos regulatórios aplicáveis',
    ],
  },
  {
    category: 'Operação de Transporte',
    items: [
      'Modelo de composição do frete',
      'Critérios de medição',
      'Regras para adicionais operacionais',
      'Processo de contratação das transportadoras',
      'Relação das transportadoras atualmente utilizadas (se houver)',
    ],
  },
  {
    category: 'Documentação Complementar',
    items: ['Outros documentos que possam contribuir para o entendimento da operação'],
  },
]

export const CONSULTORIA_AREAS = [
  { key: 'operacao', label: 'Operação / Logística' },
  { key: 'juridico', label: 'Jurídico' },
  { key: 'fiscal', label: 'Fiscal / Tributário' },
  { key: 'compras', label: 'Compras / Contratos' },
  { key: 'financeiro', label: 'Financeiro' },
]

export function createInitialConsultoriaForm(): Record<string, any> {
  const form: Record<string, any> = {
    empresa_razao_social: '',
    empresa_nome_fantasia: '',
    empresa_inscricao_estadual: '',
    empresa_inscricao_municipal: '',
    empresa_endereco: '',
    legal_nome: '',
    legal_cargo: '',
    legal_cpf: '',
    legal_email: '',
    legal_telefone: '',
    focal_nome: '',
    focal_cargo: '',
    focal_departamento: '',
    focal_telefone: '',
    focal_email: '',
    op_volume_medio: '',
    op_tipo_carga: '',
    op_tipo_veiculo: '',
    op_modalidade: '',
    op_origens_destinos: '',
    op_fluxo_cte_mdfe: '',
    observacoes: '',
    documentacao: [] as string[],
  }
  CONSULTORIA_AREAS.forEach((area) => {
    form[`area_${area.key}_nome`] = ''
    form[`area_${area.key}_cargo`] = ''
    form[`area_${area.key}_email`] = ''
    form[`area_${area.key}_telefone`] = ''
  })
  return form
}
