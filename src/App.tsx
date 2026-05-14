import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { Toaster } from '@/components/ui/toaster'
import { Toaster as Sonner } from '@/components/ui/sonner'
import { TooltipProvider } from '@/components/ui/tooltip'
import { AppStoreProvider } from '@/stores/main'
import { AuthProvider, useAuth } from '@/hooks/use-auth'
import { Navigate } from 'react-router-dom'

import Layout from './components/Layout'
import LoginPage from './pages/LoginPage'
import ColaboradoresPage from './pages/ColaboradoresPage'

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, loading } = useAuth()

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Carregando...</div>
  }

  if (!user) {
    return <Navigate to="/login" replace />
  }

  return <>{children}</>
}
import Index from './pages/Index'
import CRMPage from './pages/CRMPage'
import ClientsPage from './pages/ClientsPage'
import ActivitiesPage from './pages/ActivitiesPage'
import PlansPage from './pages/PlansPage'
import ContractGeneratorPage from './pages/ContractGeneratorPage'
import ReceiptsPage from './pages/ReceiptsPage'
import ReportsPage from './pages/ReportsPage'
import AgendaPage from './pages/AgendaPage'
import NotFound from './pages/NotFound'

const App = () => (
  <AuthProvider>
    <AppStoreProvider>
      <BrowserRouter future={{ v7_startTransition: false, v7_relativeSplatPath: false }}>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route
              element={
                <ProtectedRoute>
                  <Layout />
                </ProtectedRoute>
              }
            >
              <Route path="/" element={<Index />} />
              <Route path="/colaboradores" element={<ColaboradoresPage />} />
              <Route path="/crm" element={<CRMPage />} />
              <Route path="/clientes" element={<ClientsPage />} />
              <Route path="/atividades" element={<ActivitiesPage />} />
              <Route path="/planos" element={<PlansPage />} />
              <Route path="/contratos" element={<ContractGeneratorPage />} />
              <Route path="/recebimentos" element={<ReceiptsPage />} />
              <Route path="/relatorios" element={<ReportsPage />} />
              <Route path="/agenda" element={<AgendaPage />} />
            </Route>
            <Route path="*" element={<NotFound />} />
          </Routes>
        </TooltipProvider>
      </BrowserRouter>
    </AppStoreProvider>
  </AuthProvider>
)

export default App
