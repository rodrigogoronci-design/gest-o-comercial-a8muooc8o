export const PLANS = [
  { id: 'tms-50', name: 'TMS 50', limit: 'De 0 à 50', maxDocs: '50', price: 400.0 },
  { id: 'tms-100', name: 'TMS 100', limit: 'De 0 à 100', maxDocs: '100', price: 657.0 },
  { id: 'tms-300', name: 'TMS 300', limit: 'De 101 à 300', maxDocs: '300', price: 877.0 },
  { id: 'tms-500', name: 'TMS 500', limit: 'De 301 à 500', maxDocs: '500', price: 1097.0 },
  { id: 'tms-1000', name: 'TMS 1000', limit: 'De 501 à 1000', maxDocs: '1000', price: 1427.0 },
  { id: 'tms-3000', name: 'TMS 3000', limit: 'De 1000 à 3000', maxDocs: '3000', price: 1757.0 },
  { id: 'tms-5000', name: 'TMS 5000', limit: '3001 de 5000', maxDocs: '5000', price: 2087.0 },
  {
    id: 'tms-5000-plus',
    name: 'TMS 5000+',
    limit: 'Acima de 5000',
    maxDocs: '10000',
    price: 2487.0,
  },
  {
    id: 'tms-10000-plus',
    name: 'TMS 10000+',
    limit: 'Acima de 10000',
    maxDocs: 'ilimitado',
    price: 3200.0,
  },
]

export const IMPLEMENTATION_RATES = {
  presencial: 170.0,
  remoto: 130.0,
}

export const BASE_IMPLEMENTATION_HOURS = 10

export const MODULES = [
  { id: 'mod-edi', name: 'EDI', price: 250.0, implHours: 2 },
  { id: 'mod-ctrl-viagem', name: 'Controle de Viagem', price: 199.0, implHours: 3 },
  { id: 'mod-frota', name: 'Frota (até 10 placas)*', price: 250.0, implHours: 16 },
  { id: 'mod-medicao', name: 'Medição', price: 350.0, implHours: 6 },
  { id: 'mod-fracionado', name: 'Fracionado', price: 350.0, implHours: 4 },
  { id: 'mod-transp', name: 'Transporte (Bloco/TCE/TCI)', price: 350.0, implHours: 10 },
  { id: 'mod-fundo-prot', name: 'Fundo de proteção', price: 1201.0, implHours: 6 },
  { id: 'mod-fiscal', name: 'Fiscal', price: 199.0, implHours: 3 },
  { id: 'mod-calendario', name: 'Calendário', price: 165.0, implHours: 1 },
  { id: 'mod-painel', name: 'Painel de Informações', price: 165.0, implHours: 1 },
  {
    id: 'mod-dfe',
    name: 'DF-e',
    price: 165.0,
    implHours: 0,
    fixedImplPrice: { remoto: 260.0, presencial: 340.0 },
  },
  { id: 'mod-powerbi', name: 'Power BI', price: 199.0, implHours: 0 },
  { id: 'mod-sltrip', name: 'SL-Trip', price: 299.0, implHours: 3 },
  { id: 'mod-patrimonio', name: 'Patrimonio', price: 0.0, implHours: 6 },
  { id: 'mod-sltrack', name: 'SL-Track', price: 0.0, implHours: 5 },
  { id: 'mod-homolog-banc', name: 'Homologação Bancaria', price: 200.0, implHours: 0 },
]
