import { Link, useLocation } from 'react-router-dom'
import logoUrl from '@/assets/logomarca-service-ea011.png'
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@/components/ui/sidebar'
import {
  LayoutDashboard,
  Users,
  Briefcase,
  Tags,
  FileSignature,
  ListTodo,
  CircleDollarSign,
  PieChart,
  CalendarDays,
  UserCog,
  LogOut,
} from 'lucide-react'
import { useAuth } from '@/hooks/use-auth'

const navigation = [
  { name: 'Dashboard', href: '/', icon: LayoutDashboard },
  { name: 'CRM / Prospecção', href: '/crm', icon: Users },
  { name: 'Base de Clientes', href: '/clientes', icon: Briefcase },
  { name: 'Agenda', href: '/agenda', icon: CalendarDays },
  { name: 'Diário de Atividades', href: '/atividades', icon: ListTodo },
  { name: 'Planos e Preços', href: '/planos', icon: Tags },
  { name: 'Gerador de Contratos', href: '/contratos', icon: FileSignature },
  { name: 'Acompanhamento de Recebimentos', href: '/recebimentos', icon: CircleDollarSign },
  { name: 'Relatórios', href: '/relatorios', icon: PieChart },
  { name: 'Colaboradores', href: '/colaboradores', icon: UserCog },
]

export function AppSidebar() {
  const location = useLocation()
  const { signOut } = useAuth()

  return (
    <Sidebar
      variant="sidebar"
      className="border-r border-sidebar-border bg-sidebar flex flex-col h-full"
    >
      <SidebarHeader className="p-4 border-b border-sidebar-border/50">
        <div className="flex items-center justify-center px-2 py-2">
          <img src={logoUrl} alt="Service Logic" className="h-10 object-contain" />
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className="text-xs font-medium text-sidebar-foreground/50 uppercase tracking-wider mb-2 mt-4">
            Menu Principal
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navigation.map((item) => {
                const isActive = location.pathname === item.href
                return (
                  <SidebarMenuItem key={item.name}>
                    <SidebarMenuButton asChild isActive={isActive} tooltip={item.name}>
                      <Link
                        to={item.href}
                        className="flex items-center gap-3 transition-all duration-200"
                      >
                        <item.icon className="size-4" />
                        <span className="font-medium">{item.name}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                )
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup className="mt-auto border-t border-sidebar-border/50">
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton onClick={() => signOut()} tooltip="Sair do Sistema">
                  <div className="flex items-center gap-3 transition-all duration-200 text-red-500 hover:text-red-600">
                    <LogOut className="size-4" />
                    <span className="font-medium">Sair do Sistema</span>
                  </div>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  )
}
