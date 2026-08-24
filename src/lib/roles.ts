export const ROLE_IMPLANTACAO = 'Implantação'
export const ROLE_ADMIN = 'Admin'
export const ROLE_GESTOR = 'Gestor'
export const ROLE_COLABORADOR = 'Colaborador'

export const ROLE_OPTIONS = [
  { value: 'Colaborador', label: 'Colaborador' },
  { value: 'Admin', label: 'Administrador' },
  { value: 'Gestor', label: 'Gestor' },
  { value: 'Implantação', label: 'Implantação' },
]

const FINANCIAL_RESTRICTED_ROLES: string[] = [ROLE_IMPLANTACAO]

const ALLOWED_NAV_ITEMS_FOR_IMPLANTACAO: string[] = ['/implementacoes']

const ALLOWED_ROUTES_FOR_IMPLANTACAO: string[] = ['/implementacoes']

export function isFinancialRestricted(role: string | null | undefined): boolean {
  if (!role) return false
  return FINANCIAL_RESTRICTED_ROLES.includes(role)
}

export function isImplantacaoRole(role: string | null | undefined): boolean {
  return role === ROLE_IMPLANTACAO
}

export function isUtilizacaoAllowed(role: string | null | undefined): boolean {
  if (!role) return false
  return [ROLE_ADMIN, ROLE_GESTOR, ROLE_COLABORADOR].includes(role)
}

export function shouldShowNavItem(href: string, role: string | null | undefined): boolean {
  if (href === '/utilizacao') {
    return isUtilizacaoAllowed(role)
  }
  if (!isImplantacaoRole(role)) return true
  return ALLOWED_NAV_ITEMS_FOR_IMPLANTACAO.includes(href)
}

export function isRouteAllowedForRole(pathname: string, role: string | null | undefined): boolean {
  if (pathname === '/utilizacao' || pathname.startsWith('/utilizacao/')) {
    return isUtilizacaoAllowed(role)
  }
  if (!isImplantacaoRole(role)) return true
  return ALLOWED_ROUTES_FOR_IMPLANTACAO.some(
    (route) => pathname === route || pathname.startsWith(route + '/'),
  )
}

export function redactValue(value: any): string {
  return 'Acesso Restrito'
}
