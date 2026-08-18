export interface EtapaTemplate {
  titulo: string
  categoria: string
  ordem: number
  semana: number
}

export const ETAPAS_NOVO_CLIENTE: EtapaTemplate[] = [
  { titulo: 'Handover Comercial', categoria: 'Pré-Implantação', ordem: 1, semana: 0 },
  { titulo: 'Kick-off', categoria: 'Pré-Implantação', ordem: 2, semana: 0 },
  { titulo: 'Parametrização do Sistema', categoria: 'Implantação Inicial', ordem: 3, semana: 0 },
  // As etapas de "Ciclo de Treinamentos" NÃO fazem parte do template fixo:
  // são geradas dinamicamente a partir dos módulos contratados do plano
  // (ver `generateTreinamentoEtapas` em src/services/implementacoes.ts).
  {
    titulo: 'Operação Assistida: Semana 1',
    categoria: 'Implantação Operacional',
    ordem: 4,
    semana: 3,
  },
  {
    titulo: 'Operação Assistida: Semana 2',
    categoria: 'Implantação Operacional',
    ordem: 5,
    semana: 4,
  },
  {
    titulo: 'Operação Assistida: Semana 3',
    categoria: 'Implantação Operacional',
    ordem: 6,
    semana: 5,
  },
  {
    titulo: 'Operação Assistida: Semana 4',
    categoria: 'Implantação Operacional',
    ordem: 7,
    semana: 6,
  },
  { titulo: 'Termo de Encerramento', categoria: 'Encerramento', ordem: 8, semana: 7 },
  { titulo: 'Transição para Suporte', categoria: 'Encerramento', ordem: 9, semana: 7 },
]

export const ETAPAS_INCLUSAO_MODULO: EtapaTemplate[] = [
  { titulo: 'Análise de Requisitos', categoria: 'Análise', ordem: 1, semana: 0 },
  { titulo: 'Configuração do Módulo', categoria: 'Configuração', ordem: 2, semana: 1 },
  { titulo: 'Testes Internos', categoria: 'Validação', ordem: 3, semana: 2 },
  { titulo: 'Treinamento do Módulo', categoria: 'Treinamento', ordem: 4, semana: 2 },
  { titulo: 'Testes com Cliente', categoria: 'Validação', ordem: 5, semana: 3 },
  { titulo: 'Go-Live', categoria: 'Encerramento', ordem: 6, semana: 3 },
  { titulo: 'Termo de Encerramento', categoria: 'Encerramento', ordem: 7, semana: 4 },
]

export const ETAPAS_TREINAMENTO: EtapaTemplate[] = [
  { titulo: 'Levantamento de Necessidades', categoria: 'Preparação', ordem: 1, semana: 0 },
  { titulo: 'Preparação de Material', categoria: 'Preparação', ordem: 2, semana: 1 },
  { titulo: 'Agendamento com Cliente', categoria: 'Agendamento', ordem: 3, semana: 1 },
  { titulo: 'Execução do Treinamento', categoria: 'Execução', ordem: 4, semana: 2 },
  { titulo: 'Avaliação do Treinamento', categoria: 'Encerramento', ordem: 5, semana: 2 },
  { titulo: 'Termo de Encerramento', categoria: 'Encerramento', ordem: 6, semana: 3 },
]

export const ETAPAS_CONSULTORIA: EtapaTemplate[] = [
  { titulo: 'Handover Comercial', categoria: 'Pré-Consultoria', ordem: 1, semana: 0 },
  { titulo: 'Kick-off', categoria: 'Pré-Consultoria', ordem: 2, semana: 0 },
  { titulo: 'Envio do Formulário de Início', categoria: 'Pré-Consultoria', ordem: 3, semana: 0 },
  { titulo: 'Recebimento das Informações', categoria: 'Análise', ordem: 4, semana: 1 },
  { titulo: 'Análise Documental', categoria: 'Análise', ordem: 5, semana: 2 },
  { titulo: 'Diagnóstico Operacional', categoria: 'Análise', ordem: 6, semana: 3 },
  { titulo: 'Elaboração de Recomendações', categoria: 'Execução', ordem: 7, semana: 4 },
  { titulo: 'Apresentação de Resultados', categoria: 'Execução', ordem: 8, semana: 5 },
  { titulo: 'Entrega de Documentação', categoria: 'Encerramento', ordem: 9, semana: 6 },
  { titulo: 'Termo de Encerramento', categoria: 'Encerramento', ordem: 10, semana: 6 },
]

export const TIPO_CONFIG: Record<string, { label: string; color: string }> = {
  novo_cliente: { label: 'Novo Cliente', color: 'bg-blue-50 text-blue-700 border-blue-200' },
  inclusao_modulo: {
    label: 'Inclusão de Módulo',
    color: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  },
  treinamento: { label: 'Treinamento', color: 'bg-violet-50 text-violet-700 border-violet-200' },
  consultoria: { label: 'Consultoria', color: 'bg-amber-50 text-amber-700 border-amber-200' },
}

export function getEtapasForTipo(tipo: string): EtapaTemplate[] {
  switch (tipo) {
    case 'inclusao_modulo':
      return ETAPAS_INCLUSAO_MODULO
    case 'treinamento':
      return ETAPAS_TREINAMENTO
    case 'consultoria':
      return ETAPAS_CONSULTORIA
    default:
      return ETAPAS_NOVO_CLIENTE
  }
}

export function addWeeks(weeks: number): string {
  const d = new Date()
  d.setDate(d.getDate() + weeks * 7)
  return d.toISOString().split('T')[0]
}
