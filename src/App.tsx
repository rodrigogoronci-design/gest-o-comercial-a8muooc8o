import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { Toaster } from '@/components/ui/toaster'
import { Toaster as Sonner } from '@/components/ui/sonner'
import { TooltipProvider } from '@/components/ui/tooltip'
import { AppStoreProvider } from '@/stores/main'
import { AuthProvider } from '@/hooks/use-auth'

import Layout from './components/Layout'
import Index from './pages/Index'
import CRMPage from './pages/CRMPage'
import ClientsPage from './pages/ClientsPage'
import ActivitiesPage from './pages/ActivitiesPage'
import PlansPage from './pages/PlansPage'
import ContractGeneratorPage from './pages/ContractGeneratorPage'
import ReceiptsPage from './pages/ReceiptsPage'
import ReportsPage from './pages/ReportsPage'
import NotFound from './pages/NotFound'

const App = () => (
  <AuthProvider>
    <AppStoreProvider>
      <BrowserRouter future={{ v7_startTransition: false, v7_relativeSplatPath: false }}>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <Routes>
            <Route element={<Layout />}>
              <Route path="/" element={<Index />} />
              <Route path="/crm" element={<CRMPage />} />
              <Route path="/clientes" element={<ClientsPage />} />
              <Route path="/atividades" element={<ActivitiesPage />} />
              <Route path="/planos" element={<PlansPage />} />
              <Route path="/contratos" element={<ContractGeneratorPage />} />
              <Route path="/recebimentos" element={<ReceiptsPage />} />
              <Route path="/relatorios" element={<ReportsPage />} />
            </Route>
            <Route path="*" element={<NotFound />} />
          </Routes>
        </TooltipProvider>
      </BrowserRouter>
    </AppStoreProvider>
  </AuthProvider>
)

export default App
