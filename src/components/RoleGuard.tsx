import { Navigate, useLocation } from 'react-router-dom'
import { useUserRole } from '@/hooks/use-user-role'
import { isImplantacaoRole } from '@/lib/roles'

export function RoleGuard({ children }: { children: React.ReactNode }) {
  const { role, loading } = useUserRole()
  const location = useLocation()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">Carregando...</p>
      </div>
    )
  }

  if (isImplantacaoRole(role) && !location.pathname.startsWith('/implementacoes')) {
    return <Navigate to="/implementacoes" replace />
  }

  if (
    (location.pathname === '/utilizacao' || location.pathname.startsWith('/utilizacao/')) &&
    !['Admin', 'Gestor', 'Colaborador'].includes(role || '')
  ) {
    return <Navigate to="/" replace />
  }

  return <>{children}</>
}
