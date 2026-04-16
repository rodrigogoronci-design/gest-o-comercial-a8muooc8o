import React, { createContext, useContext, useState } from 'react'

export type Module = {
  id: string
  name: string
  price: number
  description: string
  color: string
}

export type Client = {
  id: string
  name: string
  cnpj: string
  modules: string[]
  totalValue: number
  createdAt: string
}

export type ProspectStatus = 'Contato Inicial' | 'Em Negociação' | 'Aguardando Feedback' | 'Fechado'

export type Prospect = {
  id: string
  name: string
  contactPerson: string
  lastContact: string
  status: ProspectStatus
}

type AppStore = {
  modules: Module[]
  clients: Client[]
  prospects: Prospect[]
  addClient: (client: Client) => void
  updateProspectStatus: (id: string, status: ProspectStatus) => void
}

const initialModules: Module[] = [
  {
    id: 'tms-50',
    name: 'TMS-50',
    price: 399.9,
    description: 'Limite de 50 CTes/mês',
    color: 'bg-indigo-100 text-indigo-800 border-indigo-200',
  },
  {
    id: 'tms-100',
    name: 'TMS-100',
    price: 499.9,
    description: 'Limite de 100 CTes/mês',
    color: 'bg-indigo-100 text-indigo-800 border-indigo-200',
  },
  {
    id: 'tms-250',
    name: 'TMS-250',
    price: 699.9,
    description: 'Limite de 250 CTes/mês',
    color: 'bg-indigo-100 text-indigo-800 border-indigo-200',
  },
  {
    id: 'tms-500',
    name: 'TMS-500',
    price: 999.9,
    description: 'Limite de 500 CTes/mês',
    color: 'bg-indigo-100 text-indigo-800 border-indigo-200',
  },
  {
    id: 'tms-1000',
    name: 'TMS-1000',
    price: 1499.9,
    description: 'Limite de 1000 CTes/mês',
    color: 'bg-indigo-100 text-indigo-800 border-indigo-200',
  },
  {
    id: 'tms-ilimitado',
    name: 'TMS-ILIMITADO',
    price: 2499.9,
    description: 'Emissão Ilimitada',
    color: 'bg-indigo-100 text-indigo-800 border-indigo-200',
  },
  {
    id: 'mod-adm',
    name: 'Administração',
    price: 50.0,
    description: 'Módulo',
    color: 'bg-slate-100 text-slate-800 border-slate-200',
  },
  {
    id: 'mod-basico',
    name: 'Básico',
    price: 0.0,
    description: 'Módulo',
    color: 'bg-slate-100 text-slate-800 border-slate-200',
  },
  {
    id: 'mod-carga',
    name: 'Carga',
    price: 80.0,
    description: 'Módulo',
    color: 'bg-slate-100 text-slate-800 border-slate-200',
  },
  {
    id: 'mod-comercial',
    name: 'Comercial',
    price: 120.0,
    description: 'Módulo',
    color: 'bg-slate-100 text-slate-800 border-slate-200',
  },
  {
    id: 'mod-estoque',
    name: 'Estoque',
    price: 150.0,
    description: 'Módulo',
    color: 'bg-slate-100 text-slate-800 border-slate-200',
  },
  {
    id: 'mod-fat',
    name: 'Faturamento',
    price: 90.0,
    description: 'Módulo',
    color: 'bg-slate-100 text-slate-800 border-slate-200',
  },
  {
    id: 'mod-fin',
    name: 'Financeiro',
    price: 110.0,
    description: 'Módulo',
    color: 'bg-slate-100 text-slate-800 border-slate-200',
  },
  {
    id: 'mod-fiscal',
    name: 'Fiscal',
    price: 140.0,
    description: 'Módulo',
    color: 'bg-slate-100 text-slate-800 border-slate-200',
  },
  {
    id: 'mod-frota',
    name: 'Frota',
    price: 160.0,
    description: 'Módulo',
    color: 'bg-slate-100 text-slate-800 border-slate-200',
  },
  {
    id: 'mod-int-banc',
    name: 'Integração Bancária',
    price: 70.0,
    description: 'Módulo',
    color: 'bg-slate-100 text-slate-800 border-slate-200',
  },
  {
    id: 'mod-mdfe',
    name: 'MDF-e',
    price: 100.0,
    description: 'Módulo',
    color: 'bg-slate-100 text-slate-800 border-slate-200',
  },
  {
    id: 'm1',
    name: 'Financeiro',
    price: 299.9,
    description: 'Controle de contas, fluxo de caixa e relatórios financeiros completos.',
    color: 'bg-blue-100 text-blue-800 border-blue-200',
  },
  {
    id: 'm2',
    name: 'Estoque',
    price: 199.9,
    description: 'Gestão de produtos, rastreamento de lotes e alertas de reposição.',
    color: 'bg-orange-100 text-orange-800 border-orange-200',
  },
  {
    id: 'm3',
    name: 'RH e Folha',
    price: 349.9,
    description: 'Administração de funcionários, ponto eletrônico e folha de pagamento.',
    color: 'bg-purple-100 text-purple-800 border-purple-200',
  },
  {
    id: 'm4',
    name: 'CRM Básico',
    price: 149.9,
    description: 'Gestão de contatos, funil de vendas simplificado e histórico.',
    color: 'bg-emerald-100 text-emerald-800 border-emerald-200',
  },
]

const initialClients: Client[] = [
  {
    id: 'c1',
    name: 'Tech Solutions Ltda',
    cnpj: '12.345.678/0001-90',
    modules: ['m1', 'm4'],
    totalValue: 449.8,
    createdAt: '2023-10-15T10:00:00Z',
  },
  {
    id: 'c2',
    name: 'Comercial Silva',
    cnpj: '98.765.432/0001-10',
    modules: ['m1', 'm2', 'm3'],
    totalValue: 849.7,
    createdAt: '2023-11-20T14:30:00Z',
  },
]

const initialProspects: Prospect[] = [
  {
    id: 'p1',
    name: 'Indústria Apex',
    contactPerson: 'Roberto Carlos',
    lastContact: '2024-02-10T09:15:00Z',
    status: 'Em Negociação',
  },
  {
    id: 'p2',
    name: 'Varejo Central',
    contactPerson: 'Mariana Souza',
    lastContact: '2024-02-18T16:45:00Z',
    status: 'Contato Inicial',
  },
  {
    id: 'p3',
    name: 'Logística Rápida',
    contactPerson: 'João Pedro',
    lastContact: '2024-02-15T11:00:00Z',
    status: 'Aguardando Feedback',
  },
]

const StoreContext = createContext<AppStore>({} as AppStore)

export function AppStoreProvider({ children }: { children: React.ReactNode }) {
  const [modules] = useState<Module[]>(initialModules)
  const [clients, setClients] = useState<Client[]>(initialClients)
  const [prospects, setProspects] = useState<Prospect[]>(initialProspects)

  const addClient = (client: Client) => {
    setClients((prev) => [client, ...prev])
  }

  const updateProspectStatus = (id: string, status: ProspectStatus) => {
    setProspects((prev) => prev.map((p) => (p.id === id ? { ...p, status } : p)))
  }

  const store: AppStore = {
    modules,
    clients,
    prospects,
    addClient,
    updateProspectStatus,
  }

  return React.createElement(StoreContext.Provider, { value: store }, children)
}

export default function useAppStore() {
  const context = useContext(StoreContext)
  if (!context) {
    throw new Error('useAppStore must be used within an AppStoreProvider')
  }
  return context
}
