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
    name: 'TMS 50',
    price: 400.0,
    description: 'De 0 à 50',
    color: 'bg-indigo-100 text-indigo-800 border-indigo-200',
  },
  {
    id: 'tms-100',
    name: 'TMS 100',
    price: 657.0,
    description: 'De 0 à 100',
    color: 'bg-indigo-100 text-indigo-800 border-indigo-200',
  },
  {
    id: 'tms-300',
    name: 'TMS 300',
    price: 877.0,
    description: 'De 101 à 300',
    color: 'bg-indigo-100 text-indigo-800 border-indigo-200',
  },
  {
    id: 'mod-edi',
    name: 'EDI',
    price: 250.0,
    description: 'Integração de dados',
    color: 'bg-slate-100 text-slate-800 border-slate-200',
  },
  {
    id: 'mod-ctrl-viagem',
    name: 'Controle de Viagem',
    price: 199.0,
    description: 'Gestão de viagens',
    color: 'bg-slate-100 text-slate-800 border-slate-200',
  },
]

const initialClients: Client[] = [
  {
    id: 'c1',
    name: 'Tech Solutions Ltda',
    cnpj: '12.345.678/0001-90',
    modules: ['tms-100', 'mod-edi'],
    totalValue: 907.0,
    createdAt: '2023-10-15T10:00:00Z',
  },
  {
    id: 'c2',
    name: 'Comercial Silva',
    cnpj: '98.765.432/0001-10',
    modules: ['tms-50', 'mod-ctrl-viagem'],
    totalValue: 599.0,
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
