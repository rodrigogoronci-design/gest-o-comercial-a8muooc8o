export type FieldDef = {
  name: string
  label: string
  type: 'text' | 'number' | 'date' | 'select' | 'switch' | 'checkboxGroup' | 'textarea'
  options?: string[]
}

export type SectionDef = {
  id: string
  title: string
  fields: FieldDef[]
}

export const diagnosticoSections: SectionDef[] = [
  {
    id: 'gerais',
    title: '1. Informações Gerais',
    fields: [
      { name: 'resp_preenchimento', label: 'Responsável pelo preenchimento', type: 'text' },
      { name: 'data_contato', label: 'Data do contato', type: 'date' },
      { name: 'resp_empresa', label: 'Responsável da empresa', type: 'text' },
      { name: 'cargo', label: 'Cargo', type: 'text' },
    ],
  },
  {
    id: 'estrutura',
    title: '2. Estrutura da Empresa',
    fields: [
      { name: 'qtd_filiais', label: 'Quantidade de filiais', type: 'number' },
      { name: 'qtd_usuarios', label: 'Quantidade de usuários do sistema', type: 'number' },
      { name: 'qtd_emissoes', label: 'Quantidade média de emissões/mês', type: 'number' },
      {
        name: 'regime_tributario',
        label: 'Regime tributário',
        type: 'select',
        options: ['Simples Nacional', 'Lucro Presumido', 'Lucro Real', 'Outro'],
      },
      { name: 'estados_atuacao', label: 'Estados de atuação', type: 'text' },
      {
        name: 'fase_empresa',
        label: 'Fase da empresa',
        type: 'select',
        options: ['Inicial', 'Estruturando', 'Crescimento', 'Operação madura'],
      },
      {
        name: 'sensibilidade_preco_est',
        label: 'Sensibilidade a preço',
        type: 'select',
        options: ['Baixa', 'Média', 'Alta'],
      },
    ],
  },
  {
    id: 'logistica',
    title: '3. Operação Logística',
    fields: [
      { name: 'frota_propria', label: 'Frota própria', type: 'switch' },
      { name: 'qtd_veiculos', label: 'Quantidade de veículos próprios', type: 'number' },
      { name: 'possui_agregados', label: 'Possui agregados/terceiros', type: 'switch' },
      { name: 'qtd_agregados', label: 'Quantidade de agregados', type: 'number' },
      {
        name: 'tipo_operacao',
        label: 'Tipo de operação',
        type: 'select',
        options: ['Lotação', 'Fracionado', 'Redespacho'],
      },
      { name: 'possui_armazem', label: 'Possui armazém', type: 'switch' },
    ],
  },
  {
    id: 'cenario',
    title: '4. Cenário Atual',
    fields: [
      { name: 'usa_outro_sistema', label: 'Utiliza outro sistema atualmente', type: 'switch' },
      { name: 'qual_sistema', label: 'Qual sistema utiliza', type: 'text' },
      { name: 'usa_planilhas', label: 'Utiliza planilhas em algum processo', type: 'switch' },
      { name: 'processos_manuais', label: 'Possui processos manuais', type: 'switch' },
      { name: 'integracao_bancaria', label: 'Possui integração bancária', type: 'switch' },
      {
        name: 'faturamento_atual',
        label: 'Como é realizado o faturamento atualmente',
        type: 'select',
        options: ['Manual', 'Automático', 'Parcial'],
      },
    ],
  },
  {
    id: 'controle',
    title: '5. Controle Operacional',
    fields: [
      {
        name: 'controle_viagens',
        label: 'Como realiza o controle de viagens',
        type: 'select',
        options: ['Planilha', 'Sistema', 'Manual', 'Não possui'],
      },
      {
        name: 'controle_manutencao',
        label: 'Como controla manutenção da frota',
        type: 'select',
        options: ['Planilha', 'Sistema', 'Manual', 'Não controla'],
      },
      {
        name: 'controle_financeiro',
        label: 'Como realiza controle financeiro',
        type: 'select',
        options: ['Planilha', 'Sistema', 'Manual', 'Contador'],
      },
    ],
  },
  {
    id: 'dores',
    title: '6. Dores e Gargalos',
    fields: [
      {
        name: 'dificuldade_principal',
        label: 'Principal dificuldade operacional',
        type: 'select',
        options: [
          'Emissão de documentos',
          'Financeiro',
          'Controle operacional',
          'Fiscal',
          'Relatórios',
          'Falta de automação',
          'Retrabalho',
          'Controle de frota',
          'Controle de viagens',
          'Gestão financeira',
        ],
      },
      {
        name: 'processo_retrabalho',
        label: 'Processo que gera muito retrabalho',
        type: 'textarea',
      },
      { name: 'area_sem_controle', label: 'Área sem controle hoje', type: 'textarea' },
      {
        name: 'setor_dificuldade',
        label: 'Setor com maior dificuldade atualmente',
        type: 'select',
        options: ['Operacional', 'Financeiro', 'Fiscal', 'Comercial', 'Gestão', 'Frota'],
      },
    ],
  },
  {
    id: 'melhorias',
    title: '7. Interesse em Melhorias',
    fields: [
      {
        name: 'interesse_automatizar',
        label: 'Possui interesse em automatizar processos',
        type: 'switch',
      },
      {
        name: 'areas_melhoria',
        label: 'Áreas com interesse em melhoria',
        type: 'checkboxGroup',
        options: [
          'Financeiro',
          'Fiscal',
          'BI / Relatórios',
          'Frota',
          'Controle de Viagens',
          'DF-e',
          'Automação operacional',
          'Faturamento',
        ],
      },
    ],
  },
  {
    id: 'oportunidade',
    title: '8. Oportunidade Comercial',
    fields: [
      {
        name: 'potencial_upsell',
        label: 'Potencial de upsell',
        type: 'select',
        options: ['Baixo', 'Médio', 'Alto'],
      },
      {
        name: 'modulo_potencial',
        label: 'Módulo com maior potencial',
        type: 'select',
        options: [
          'Fiscal',
          'DF-e',
          'BI',
          'Frota',
          'Controle de Viagem',
          'Financeiro',
          'Calendário',
          'Painel de Informações',
        ],
      },
      {
        name: 'momento_oportunidade',
        label: 'Momento da oportunidade',
        type: 'select',
        options: ['Imediato', 'Curto prazo', 'Médio prazo', 'Futuro'],
      },
      { name: 'obs_comerciais', label: 'Observações comerciais', type: 'textarea' },
    ],
  },
  {
    id: 'classificacao',
    title: '9. Classificação do Cliente',
    fields: [
      {
        name: 'perfil_cliente',
        label: 'Perfil do cliente',
        type: 'select',
        options: ['Conservador', 'Econômico', 'Crescimento', 'Estruturado'],
      },
      {
        name: 'sensibilidade_preco_class',
        label: 'Sensibilidade a preço',
        type: 'select',
        options: ['Baixa', 'Média', 'Alta'],
      },
      {
        name: 'nivel_maturidade',
        label: 'Nível de maturidade operacional',
        type: 'select',
        options: ['Inicial', 'Estruturando', 'Crescimento', 'Maduro'],
      },
    ],
  },
  {
    id: 'followup',
    title: '10. Follow-up',
    fields: [
      { name: 'proximo_contato', label: 'Próximo contato', type: 'date' },
      { name: 'resp_acompanhamento', label: 'Responsável pelo acompanhamento', type: 'text' },
      { name: 'necessario_retorno', label: 'Necessário retorno comercial', type: 'switch' },
      { name: 'criar_oportunidade', label: 'Criar oportunidade futura', type: 'switch' },
    ],
  },
]
