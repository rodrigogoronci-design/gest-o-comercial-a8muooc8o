import { useColaboradorProfile } from '@/hooks/use-colaborador-profile'
import { isImplantacaoRole, isFinancialRestricted } from '@/lib/roles'

export function useUserRole() {
  const { profile, loading } = useColaboradorProfile()
  const role = profile?.role ?? null

  return {
    role,
    isImplantacao: isImplantacaoRole(role),
    isFinancialRestricted: isFinancialRestricted(role),
    loading,
  }
}
