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
