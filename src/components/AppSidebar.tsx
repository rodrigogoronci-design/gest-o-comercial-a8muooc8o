import { useState, useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'
import {
  Rocket,
  Home,
  Users,
  Briefcase,
  Building2,
  ListTodo,
  CreditCard,
  FileText,
  Receipt,
  BarChart3,
  Calendar,
  Target,
} from 'lucide-react'
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarHeader,
  SidebarFooter,
} from '@/components/ui/sidebar'
import { useAuth } from '@/hooks/use-auth'
import { supabase } from '@/lib/supabase/client'
import { shouldShowNavItem } from '@/lib/roles'
import logo from '@/assets/logomarca-service-ea011.png'

const NAV_ITEMS = [
  { title: 'Dashboard', href: '/', icon: Home },
  { title: 'CRM', href: '/crm', icon: Briefcase },
  { title: 'Captação', href: '/crm/captacao', icon: Target },
  { title: 'Clientes', href: '/clientes', icon: Building2 },
  { title: 'Atividades', href: '/atividades', icon: ListTodo },
  { title: '🚀 Implantações', href: '/implementacoes', icon: Rocket },
  { title: 'Contratos', href: '/contratos', icon: FileText },
  { title: 'Recebimentos', href: '/recebimentos', icon: Receipt },
  { title: 'Planos', href: '/planos', icon: CreditCard },
  { title: 'Agenda', href: '/agenda', icon: Calendar },
  { title: 'Relatórios', href: '/relatorios', icon: BarChart3 },
  { title: 'Colaboradores', href: '/colaboradores', icon: Users },
]

export function AppSidebar() {
  const location = useLocation()
  const { user, signOut } = useAuth()
  const [colabName, setColabName] = useState('')
  const [colabRole, setColabRole] = useState<string | null>(null)

  useEffect(() => {
    if (user?.id) {
      supabase
        .from('colaboradores')
        .select('nome, role')
        .eq('user_id', user.id)
        .maybeSingle()
        .then(({ data }) => {
          setColabName(data?.nome || user.email || '')
          setColabRole(data?.role || null)
        })
    }
  }, [user])

  return (
    <Sidebar>
      <SidebarHeader className="border-b px-4 py-3">
        <Link to="/" className="flex items-center gap-2">
          <img src={logo} alt="Service" className="h-8 w-auto" />
        </Link>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Menu</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {NAV_ITEMS.filter((item) => shouldShowNavItem(item.href, colabRole)).map((item) => {
                const isActive =
                  location.pathname === item.href ||
                  (item.href !== '/' && location.pathname.startsWith(item.href))
                return (
                  <SidebarMenuItem key={item.href}>
                    <SidebarMenuButton asChild isActive={isActive}>
                      <Link to={item.href}>
                        <item.icon className="h-4 w-4" />
                        <span>{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                )
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter className="border-t p-3">
        <div className="flex items-center justify-between text-sm">
          <span className="font-medium truncate max-w-[140px]">{colabName}</span>
          <button
            onClick={() => signOut()}
            className="text-xs text-slate-500 hover:text-slate-900 transition-colors"
          >
            Sair
          </button>
        </div>
      </SidebarFooter>
    </Sidebar>
  )
}
