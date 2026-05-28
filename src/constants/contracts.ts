export const PLANS = [
  { id: 'tms-50', name: 'TMS-50', limit: 'Até 50', maxDocs: '50', price: 399.0 },
  { id: 'tms-100', name: 'TMS-100', limit: 'à 100', maxDocs: '100', price: 657.0 },
  { id: 'tms-300', name: 'TMS-300', limit: 'à 300', maxDocs: '300', price: 877.0 },
  { id: 'tms-500', name: 'TMS-500', limit: 'à 500', maxDocs: '500', price: 1097.0 },
  { id: 'mts-1000', name: 'MTS-1000', limit: 'à 1000', maxDocs: '1000', price: 1427.0 },
  { id: 'tms-3000', name: 'TMS-3000', limit: 'à 3000', maxDocs: '3000', price: 1757.0 },
  { id: 'tms-5000', name: 'TMS-5000', limit: 'à 5000', maxDocs: '5000', price: 2087.0 },
  {
    id: 'tms-5000-plus',
    name: 'TMS-5000+',
    limit: 'Acima de 5000',
    maxDocs: '10000',
    price: 2487.0,
  },
]

export const IMPLEMENTATION_RATES = {
  presencial: 170.0,
  remoto: 130.0,
}

export const BASE_IMPLEMENTATION_PRICE = 0.0 // Deprecated, kept to avoid breaking other files
export const BASE_IMPLEMENTATION_HOURS = 10

export const DFE_TIERS = [
  {
    id: 'dfe-none',
    name: 'D.F.E. (Não contratar pacote D.F.E.)',
    limit: '0',
    maxDocs: '0',
    price: 0.0,
  },
  { id: 'dfe-150', name: 'Pacote 150 D.F.E.', limit: '150', maxDocs: '150', price: 60.0 },
  { id: 'dfe-300', name: 'Pacote 300 D.F.E.', limit: '300', maxDocs: '300', price: 110.0 },
  { id: 'dfe-500', name: 'Pacote 500 D.F.E.', limit: '500', maxDocs: '500', price: 160.0 },
  { id: 'dfe-1000', name: 'Pacote 1000 D.F.E.', limit: '1000', maxDocs: '1000', price: 260.0 },
  { id: 'dfe-1500', name: 'Pacote 1500 D.F.E.', limit: '1500', maxDocs: '1500', price: 360.0 },
]

export const MODULES = [
  { id: 'mod-admin', name: 'Administração', price: 0.0, implHours: 0, isBasic: true },
  { id: 'mod-basico', name: 'Básico', price: 0.0, implHours: 0, isBasic: true },
  { id: 'mod-carga', name: 'Carga', price: 0.0, implHours: 0, isBasic: true },
  { id: 'mod-comercial', name: 'Comercial', price: 0.0, implHours: 0, isBasic: true },
  { id: 'mod-faturamento', name: 'Faturamento', price: 0.0, implHours: 0, isBasic: true },
  { id: 'mod-financeiro', name: 'Financeiro', price: 0.0, implHours: 0, isBasic: true },
  { id: 'mod-edi', name: 'EDI', price: 250.0, implHours: 2 },
  { id: 'mod-ctrl-viagem', name: 'Controle de Viagem', price: 199.0, implHours: 3 },
  { id: 'mod-frota', name: 'Frota (até 10 placas)', price: 250.0, implHours: 16 },
  { id: 'mod-medicao', name: 'Medição', price: 350.0, implHours: 6 },
  { id: 'mod-fracionado', name: 'Fracionado', price: 350.0, implHours: 4 },
  { id: 'mod-transp', name: 'Bloco TCI e TCE (Transportes)', price: 350.0, implHours: 10 },
  { id: 'mod-fundo-prot', name: 'Fundo de proteção', price: 1201.0, implHours: 6 },
  { id: 'mod-calendario', name: 'Calendário', price: 165.0, implHours: 1 },
  { id: 'mod-painel', name: 'Painel de Informações', price: 165.0, implHours: 1 },
  { id: 'mod-fiscal', name: 'Fiscal', price: 199.0, implHours: 3 },
  { id: 'mod-dfe', name: 'DF-e', price: 165.0, implHours: 2 },
  { id: 'mod-powerbi', name: 'Power BI', price: 199.0, implHours: 0 },
  { id: 'mod-sltrip', name: 'SL-Trip', price: 299.0, implHours: 3 },
  { id: 'mod-sltrack', name: 'SL-Track', price: 299.0, implHours: 5 },
  { id: 'mod-homolog-banc', name: 'Homologação Bancaria', price: 200.0, implHours: 0 },
  { id: 'mod-ciot', name: 'CIOT', price: 250.0, implHours: 0 },
  {
    id: 'mod-torre-controle',
    name: 'Torre de Controle Logística',
    price: 299.0,
    implHours: 4,
    description:
      'Solução completa para monitoramento e gestão operacional da frota em tempo real, proporcionando maior visibilidade, controle e agilidade nas operações logísticas. Permite acompanhar viagens, ocorrências, desempenho dos veículos, custos operacionais e indicadores estratégicos em um único painel, auxiliando na tomada de decisão e na redução de falhas, atrasos e custos da operação.',
  },
]

export const PREDEFINED_TRAININGS = [
  { id: 'train-admin-basico-comercial', name: 'Administrativo, Básico e Comercial', price: 200.0 },
  { id: 'train-carga', name: 'Carga', price: 200.0 },
  { id: 'train-faturamento-financeiro', name: 'Faturamento e Financeiro', price: 200.0 },
  { id: 'train-fiscal-dfe', name: 'Fiscal e DFe', price: 100.0 },
  { id: 'train-frota-todos', name: 'Gestão de Frota (Todos)', price: 600.0 },
  { id: 'train-frota-compras', name: 'Gestão de Frota - Compras', price: 100.0 },
  { id: 'train-frota-estoque', name: 'Gestão de Frota - Estoque', price: 100.0 },
  { id: 'train-frota-abastecimento', name: 'Gestão de Frota - Abastecimento', price: 100.0 },
  { id: 'train-frota-pneu', name: 'Gestão de Frota - Pneu', price: 100.0 },
  { id: 'train-frota-manutencao', name: 'Gestão de Frota - Manutenção', price: 100.0 },
  { id: 'train-frota-vencimento', name: 'Gestão de Frota - Vencimento', price: 100.0 },
  { id: 'train-ctrl-viagem', name: 'Controle de Viagem', price: 100.0 },
  { id: 'train-gerador-relatorio', name: 'Gerador de Relatório', price: 0.0 },
  { id: 'train-sl-track', name: 'SL Track', price: 100.0 },
  { id: 'train-sl-trip', name: 'SL TRIP', price: 100.0 },
  { id: 'train-powerbi', name: 'Power BI', price: 200.0 },
  {
    id: 'train-encontro-duvidas',
    name: 'Encontro posterior para dúvidas (1 hora remoto)',
    price: 100.0,
  },
]
